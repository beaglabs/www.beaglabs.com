/** Deployment registration (IMDS attested data) and Papyrus customer sessions. */
import { deploymentKeyHash, issueChatSession, newDeploymentKey, requireDeployment, verifyCustomerIdToken } from './auth'
import { verifyAttestedSignature, type VerifyAttestedOptions } from './azure-attested'
import { first, getDb, rows } from './db'
import type { Bindings } from './env'
import { createInboxItem } from './inbox'
import { ApiError, GUID_RE, background, id, isObject, now, readJsonObject, requireStr, str, type WaitUntil } from './util'

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

export async function handleBootstrap(request: Request, env: Bindings, ctx?: WaitUntil, attestation: AttestationOverrides = {}): Promise<Response> {
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
    background(ctx, 'deployment.registered inbox', createInboxItem(env, {
      kind: 'deployment.registered',
      title: 'New Papyrus deployment',
      body: [plan.name && `Plan ${plan.name}`, document.subscriptionId && `Subscription ${document.subscriptionId}`, origin].filter(Boolean).join(' · '),
    }, { audience: 'owners' }))
  }
  return Response.json({ deploymentId, deploymentKey }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}

export async function handlePapyrusSession(request: Request, env: Bindings, ctx?: WaitUntil): Promise<Response> {
  const deployment = await requireDeployment(env, request)
  const body = await readJsonObject(request, 32 * 1024)
  const idToken = requireStr(body.idToken, 'idToken', 16 * 1024)
  const user = await verifyCustomerIdToken(idToken, deployment.entraClientId)
  const db = getDb(env)
  const timestamp = now()

  let tenantId = deployment.tenantId
  if (tenantId && tenantId !== user.tid) throw new ApiError(403, 'tenant_mismatch', 'This deployment is bound to a different Entra tenant.')
  if (!tenantId) {
    await db.execute({ sql: 'UPDATE papyrus_deployments SET tenant_id=?, updated_at=? WHERE id=? AND tenant_id IS NULL', args: [user.tid, timestamp, deployment.deploymentId] })
    const bound = first<Row>(await db.execute({ sql: 'SELECT tenant_id, subscription_id FROM papyrus_deployments WHERE id=?', args: [deployment.deploymentId] }))
    tenantId = String(bound?.tenant_id ?? '')
    if (tenantId !== user.tid) throw new ApiError(403, 'tenant_mismatch', 'This deployment is bound to a different Entra tenant.')
    await upsertTenant(env, tenantId, timestamp)
    background(ctx, 'tenant.bound inbox', createInboxItem(env, {
      kind: 'tenant.bound',
      title: 'Deployment linked to an Entra tenant',
      body: `Tenant ${tenantId}${user.email ? ` (first user ${user.email})` : ''}`,
      tenantId,
    }, { audience: 'owners' }))
    background(ctx, 'subscription cross-check', crossCheckSubscription(env, tenantId, deployment.subscriptionId))
  } else {
    await upsertTenant(env, tenantId, timestamp)
  }
  await db.execute({
    sql: `INSERT INTO tenant_users (tenant_id, oid, name, email, first_seen_at, last_seen_at) VALUES (?,?,?,?,?,?)
          ON CONFLICT(tenant_id, oid) DO UPDATE SET name=excluded.name, email=COALESCE(excluded.email, tenant_users.email), last_seen_at=excluded.last_seen_at`,
    args: [tenantId, user.oid, user.name, user.email, timestamp, timestamp],
  })
  await db.execute({ sql: 'UPDATE papyrus_deployments SET last_seen_at=? WHERE id=?', args: [timestamp, deployment.deploymentId] })

  const session = await issueChatSession(env, { oid: user.oid, tid: tenantId, dep: deployment.deploymentId, name: user.name })
  return Response.json({ token: session.token, expiresAt: session.expiresAt, tenantId, user: { oid: user.oid, name: user.name } }, { headers: { 'Cache-Control': 'no-store' } })
}

async function upsertTenant(env: Bindings, tenantId: string, timestamp: string): Promise<void> {
  await getDb(env).execute({
    sql: `INSERT INTO tenants (tenant_id, first_seen_at, last_seen_at) VALUES (?,?,?)
          ON CONFLICT(tenant_id) DO UPDATE SET last_seen_at=excluded.last_seen_at`,
    args: [tenantId, timestamp, timestamp],
  })
}

/**
 * Heuristic cross-check against Partner Center usage rows: when a row mentions the
 * VM's Azure subscription and carries a CustomerId, it should be the bound tenant.
 */
export async function crossCheckSubscription(env: Bindings, tenantId: string, subscriptionId: string | null): Promise<boolean> {
  if (!subscriptionId) return true
  const matches = rows<{ customer_id: string | null }>(await getDb(env).execute({
    sql: `SELECT customer_id FROM marketplace_vm_customers
          WHERE lower(COALESCE(marketplace_subscription_id,'')) = lower(?) OR instr(lower(raw_json), lower(?)) > 0 LIMIT 50`,
    args: [subscriptionId, subscriptionId],
  }))
  const customerIds = matches.map((row) => row.customer_id?.toLowerCase()).filter((value): value is string => Boolean(value))
  if (!customerIds.length || customerIds.includes(tenantId.toLowerCase())) return true
  await createInboxItem(env, {
    kind: 'tenant.subscription_mismatch',
    title: 'Tenant does not match Marketplace records',
    body: `Subscription ${subscriptionId} is reported for customer ${customerIds[0]}, but the deployment bound to tenant ${tenantId}.`,
    tenantId,
  }, { audience: 'owners' })
  return false
}
