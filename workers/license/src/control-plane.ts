/**
 * Deployments owned by the Papyrus control plane (papyrus.beaglabs.com). The control plane reaches these through the
 * `LicenseRpc` service binding; Papyrus calls the bootstrap exchange route. Spec:
 * docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md ("Contract between the three pieces").
 */
import { deploymentKeyHash, newDeploymentKey } from './auth'
import { signCanonicalWithAzureKeyVault, signLicenseWithAzureKeyVault } from './azure-key-vault-signer'
import { first, getDb } from './db'
import type { Bindings } from './env'
import type { SignedLicense } from './license'
import { ApiError, id, now, randomToken, readJsonObject, requireStr, sha256Hex } from './util'

type Row = Record<string, unknown>

export type DeploymentState = 'active' | 'suspended'
export type RegistrationState = 'pending' | 'registered'
export type CreateDeploymentInput = { accountId: string; hostname: string; provider: string; organization: string }
export type CreateDeploymentResult = { deploymentId: string; bootstrapToken: string; license: SignedLicense }
export type StatusPayload = { deploymentId: string; state: DeploymentState; issuedAt: string; expiresAt: string }
export type SignedStatus = { payload: StatusPayload; keyId: string; signature: string }

/** Every licensable feature for the commercial profile (classification banners are a government add-on). */
export const CONTROL_PLANE_FEATURES = ['core', 'teams', 'email', 'security-connectors', 'action-executors', 'agent-peers']
const BOOTSTRAP_TTL_MS = 7 * 24 * 60 * 60 * 1000
const STATUS_TTL_MS = 7 * 24 * 60 * 60 * 1000
const HOSTNAME = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

export async function createDeployment(env: Bindings, input: CreateDeploymentInput): Promise<CreateDeploymentResult> {
  const accountId = requireStr(input?.accountId, 'accountId', 128)
  const provider = requireStr(input?.provider, 'provider', 64)
  const organization = requireStr(input?.organization, 'organization', 256)
  const hostname = requireStr(input?.hostname, 'hostname', 253).toLowerCase()
  if (!HOSTNAME.test(hostname)) throw new ApiError(422, 'validation_error', 'hostname must be a DNS hostname.')

  const deploymentId = id('dep')
  const bootstrapToken = `pbt_${randomToken(32)}`
  const timestamp = now()
  const license = await signLicenseWithAzureKeyVault(env, {
    scope: 'deployment',
    licenseId: id('lic'),
    licensee: organization,
    deploymentId,
    publicOrigin: `https://${hostname}`,
    profiles: ['commercial'],
    features: [...CONTROL_PLANE_FEATURES],
    issuedAt: timestamp,
    expiresAt: null,
  })
  // The real key is issued at exchange; until then the row holds the hash of a key nobody has.
  const placeholderKeyHash = await deploymentKeyHash(newDeploymentKey())
  await getDb(env).batch([
    {
      sql: `INSERT INTO papyrus_deployments (id, vm_id, papyrus_deployment_id, public_origin, key_sha256, key_issued_at, registered_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [deploymentId, `control-plane:${deploymentId}`, deploymentId, `https://${hostname}`, placeholderKeyHash, timestamp, timestamp, timestamp],
    },
    {
      sql: `INSERT INTO control_plane_deployments (deployment_id, account_id, hostname, provider, organization, bootstrap_sha256, bootstrap_expires_at, created_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [deploymentId, accountId, hostname, provider, organization, await sha256Hex(bootstrapToken),
        new Date(Date.parse(timestamp) + BOOTSTRAP_TTL_MS).toISOString(), timestamp],
    },
  ])
  return { deploymentId, bootstrapToken, license }
}

export async function verifyDeploymentKey(env: Bindings, deploymentId: string, deploymentKey: string): Promise<boolean> {
  if (typeof deploymentId !== 'string' || typeof deploymentKey !== 'string' || !/^pdk_[A-Za-z0-9_-]{20,128}$/.test(deploymentKey)) return false
  const row = first<Row>(await getDb(env).execute({
    sql: `SELECT id FROM papyrus_deployments WHERE id=? AND key_sha256=?
          AND NOT EXISTS (SELECT 1 FROM control_plane_revocations r WHERE r.deployment_id = papyrus_deployments.id)`,
    args: [deploymentId, await deploymentKeyHash(deploymentKey)],
  }))
  return Boolean(row)
}

async function isRevoked(env: Bindings, deploymentId: string): Promise<boolean> {
  return Boolean(first<Row>(await getDb(env).execute({ sql: 'SELECT deployment_id FROM control_plane_revocations WHERE deployment_id=?', args: [deploymentId] })))
}

/**
 * The customer deleted a control-plane deployment. From now on its status is signed `suspended` whatever the control
 * plane asks for, its deployment key stops verifying (the stored hash is also replaced with one of a key nobody has, so
 * analytics and Sentry auth fail too) and its bootstrap token can't be exchanged. Idempotent. Returns false for a
 * deployment the control plane doesn't own (e.g. a Marketplace install), which is left untouched.
 */
export async function revokeDeployment(env: Bindings, deploymentId: string): Promise<boolean> {
  const id = requireStr(deploymentId, 'deploymentId', 128)
  const db = getDb(env)
  if (!first<Row>(await db.execute({ sql: 'SELECT deployment_id FROM control_plane_deployments WHERE deployment_id=?', args: [id] }))) return false
  const timestamp = now()
  await db.batch([
    { sql: 'INSERT OR IGNORE INTO control_plane_revocations (deployment_id, revoked_at) VALUES (?,?)', args: [id, timestamp] },
    { sql: 'UPDATE papyrus_deployments SET key_sha256=?, updated_at=? WHERE id=?', args: [await deploymentKeyHash(newDeploymentKey()), timestamp, id] },
  ])
  return true
}

export async function signStatus(env: Bindings, input: { deploymentId: string; state: DeploymentState }): Promise<SignedStatus> {
  const deploymentId = requireStr(input?.deploymentId, 'deploymentId', 128)
  if (input.state !== 'active' && input.state !== 'suspended') throw new ApiError(422, 'validation_error', "state must be 'active' or 'suspended'.")
  const issued = Date.now()
  const payload: StatusPayload = {
    deploymentId,
    // A deleted deployment stays suspended whatever the caller asks for.
    state: (await isRevoked(env, deploymentId)) ? 'suspended' : input.state,
    issuedAt: new Date(issued).toISOString(),
    expiresAt: new Date(issued + STATUS_TTL_MS).toISOString(),
  }
  return { payload, ...await signCanonicalWithAzureKeyVault(env, payload) }
}

/** Marketplace (attested) rows are registered on insert; control-plane rows once their bootstrap token is exchanged. */
export async function registrationState(env: Bindings, deploymentId: string): Promise<RegistrationState> {
  const row = first<Row>(await getDb(env).execute({
    sql: `SELECT d.id, c.deployment_id AS cp_id, c.exchanged_at FROM papyrus_deployments d
          LEFT JOIN control_plane_deployments c ON c.deployment_id = d.id WHERE d.id=?`,
    args: [deploymentId],
  }))
  if (!row) return 'pending'
  return !row.cp_id || row.exchanged_at ? 'registered' : 'pending'
}

/** POST /api/provision/control-plane/exchange — one-time bootstrap token → deployment key. */
export async function handleControlPlaneExchange(request: Request, env: Bindings): Promise<Response> {
  const body = await readJsonObject(request, 8 * 1024)
  const deploymentId = requireStr(body.deploymentId, 'deploymentId', 128)
  const bootstrapToken = requireStr(body.bootstrapToken, 'bootstrapToken', 256)
  const tokenHash = await sha256Hex(bootstrapToken)
  const db = getDb(env)
  const timestamp = now()
  const deploymentKey = newDeploymentKey()
  // Key rotation and token consumption commit together, and only while the token is unused and unexpired.
  if (await isRevoked(env, deploymentId)) throw new ApiError(410, 'deployment_revoked', 'This deployment was deleted.')
  const usable = 'SELECT 1 FROM control_plane_deployments WHERE deployment_id=? AND bootstrap_sha256=? AND exchanged_at IS NULL AND bootstrap_expires_at > ?'
  const [, consumed] = await db.batch([
    {
      sql: `UPDATE papyrus_deployments SET key_sha256=?, key_issued_at=?, registered_at=?, last_seen_at=?, updated_at=? WHERE id=? AND EXISTS (${usable})`,
      args: [await deploymentKeyHash(deploymentKey), timestamp, timestamp, timestamp, timestamp, deploymentId, deploymentId, tokenHash, timestamp],
    },
    {
      sql: 'UPDATE control_plane_deployments SET exchanged_at=? WHERE deployment_id=? AND bootstrap_sha256=? AND exchanged_at IS NULL AND bootstrap_expires_at > ?',
      args: [timestamp, deploymentId, tokenHash, timestamp],
    },
  ])
  if (!consumed.rowsAffected) {
    const known = first<Row>(await db.execute({
      sql: 'SELECT exchanged_at FROM control_plane_deployments WHERE deployment_id=? AND bootstrap_sha256=?',
      args: [deploymentId, tokenHash],
    }))
    if (!known) throw new ApiError(404, 'bootstrap_not_found', 'Unknown deployment or bootstrap token.')
    throw new ApiError(410, known.exchanged_at ? 'bootstrap_used' : 'bootstrap_expired',
      known.exchanged_at ? 'This bootstrap token was already exchanged.' : 'This bootstrap token has expired.')
  }
  return Response.json({ deploymentId, deploymentKey }, { headers: { 'Cache-Control': 'no-store' } })
}
