/** Deployment registration (IMDS attested data). */
import { deploymentKeyHash, newDeploymentKey } from './auth'
import { verifyAttestedSignature, type VerifyAttestedOptions } from './azure-attested'
import { first, getDb } from './db'
import type { Bindings } from './env'
import { ApiError, GUID_RE, id, isObject, now, readJsonObject, requireStr, str } from './util'

type Row = Record<string, unknown>

/** Test seam: lets tests inject trusted roots / AIA fetch / clock for attestation. */
export type AttestationOverrides = Partial<Omit<VerifyAttestedOptions, 'expectedNonce'>>

function publicOrigin(value: unknown): string | null {
  if (value == null || value === '') return null
  const text = str(value, 512)
  if (!text) throw new ApiError(422, 'invalid_public_origin', 'publicOrigin must be a URL or null.')
  let parsed: URL
  try { parsed = new URL(text) } catch { throw new ApiError(422, 'invalid_public_origin', 'publicOrigin must be a URL or null.') }
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') throw new ApiError(422, 'invalid_public_origin', 'publicOrigin must use HTTPS.')
  return parsed.origin
}

export async function handleBootstrap(request: Request, env: Bindings, _ctx?: unknown, attestation: AttestationOverrides = {}): Promise<Response> {
  const body = await readJsonObject(request, 64 * 1024)
  const papyrusDeploymentId = requireStr(body.papyrusDeploymentId, 'papyrusDeploymentId', 128)
  const nonce = requireStr(body.nonce, 'nonce', 64)
  const attested = isObject(body.attested) ? body.attested : null
  if (!attested || attested.encoding !== 'pkcs7' || typeof attested.signature !== 'string') {
    throw new ApiError(422, 'validation_error', 'attested must be { encoding: "pkcs7", signature }.')
  }
  const origin = publicOrigin(body.publicOrigin)
  const version = str(body.version, 64)
  const entraClientId = body.entraClientId == null ? null : str(body.entraClientId, 64)
  if (entraClientId && !GUID_RE.test(entraClientId)) throw new ApiError(422, 'validation_error', 'entraClientId must be a GUID.')
  const region = str(body.region, 64)
  const vmSize = str(body.vmSize, 64)

  const { document } = await verifyAttestedSignature(attested.signature, { ...attestation, expectedNonce: nonce })
  const plan = document.plan ?? {}
  if (env.PAPYRUS_MARKETPLACE_PUBLISHER || env.PAPYRUS_MARKETPLACE_PRODUCT) {
    const publisherOk = !env.PAPYRUS_MARKETPLACE_PUBLISHER || plan.publisher?.toLowerCase() === env.PAPYRUS_MARKETPLACE_PUBLISHER.toLowerCase()
    const productOk = !env.PAPYRUS_MARKETPLACE_PRODUCT || plan.product?.toLowerCase() === env.PAPYRUS_MARKETPLACE_PRODUCT.toLowerCase()
    if (!publisherOk || !productOk) throw new ApiError(403, 'plan_not_allowed', 'This VM was not deployed from the Papyrus Azure Marketplace offer.')
  }

  const vmId = String(document.vmId).toLowerCase()
  const db = getDb(env)
  const timestamp = now()
  const nonceInsert = await db.execute({
    sql: 'INSERT INTO attested_nonces (vm_id, nonce, used_at) VALUES (?,?,?) ON CONFLICT(vm_id, nonce) DO NOTHING',
    args: [vmId, nonce, timestamp],
  })
  if (!nonceInsert.rowsAffected) throw new ApiError(409, 'nonce_reused', 'This attested document was already used; request a new one with a fresh nonce.')

  const deploymentKey = newDeploymentKey()
  const keyHash = await deploymentKeyHash(deploymentKey)
  const existing = first<Row>(await db.execute({ sql: 'SELECT id, tenant_id FROM papyrus_deployments WHERE vm_id=?', args: [vmId] }))
  let deploymentId: string
  if (existing) {
    deploymentId = String(existing.id)
    await db.execute({
      sql: `UPDATE papyrus_deployments SET papyrus_deployment_id=?, subscription_id=?, plan_publisher=?, plan_product=?, plan_name=?, sku=?,
              region=COALESCE(?, region), vm_size=COALESCE(?, vm_size), public_origin=?, version=COALESCE(?, version),
              entra_client_id=?, key_sha256=?, key_issued_at=?, last_seen_at=?, updated_at=? WHERE id=?`,
      args: [papyrusDeploymentId, document.subscriptionId ?? null, plan.publisher ?? null, plan.product ?? null, plan.name ?? null, document.sku ?? null,
        region, vmSize, origin, version, entraClientId, keyHash, timestamp, timestamp, timestamp, deploymentId],
    })
  } else {
    deploymentId = id('dep')
    await db.execute({
      sql: `INSERT INTO papyrus_deployments (id, vm_id, papyrus_deployment_id, subscription_id, plan_publisher, plan_product, plan_name, sku, region, vm_size,
              public_origin, version, entra_client_id, key_sha256, key_issued_at, registered_at, last_seen_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [deploymentId, vmId, papyrusDeploymentId, document.subscriptionId ?? null, plan.publisher ?? null, plan.product ?? null, plan.name ?? null,
        document.sku ?? null, region, vmSize, origin, version, entraClientId, keyHash, timestamp, timestamp, timestamp, timestamp],
    })
  }
  return Response.json({ deploymentId, deploymentKey }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
