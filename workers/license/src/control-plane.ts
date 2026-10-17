/**
 * Deployments owned by the Papyrus control plane (papyrus.beaglabs.com). The control plane reaches these through the
 * `LicenseRpc` service binding; Papyrus calls the bootstrap exchange route. Spec:
 * docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md ("Contract between the three pieces").
 */
import { deploymentKeyHash, issueChatSession, newDeploymentKey } from './auth'
import { signCanonicalWithAzureKeyVault, signLicenseWithAzureKeyVault } from './azure-key-vault-signer'
import { first, getDb, rows } from './db'
import type { Bindings } from './env'
import type { SignedLicense } from './license'
import { ApiError, id, now, randomToken, readJsonObject, requireStr, sha256Hex, str } from './util'

type Row = Record<string, unknown>

export type DeploymentState = 'active' | 'suspended'
export type RegistrationState = 'pending' | 'registered'
export type CreateDeploymentInput = { accountId: string; hostname: string; provider: string; organization: string }
export type CreateDeploymentResult = { deploymentId: string; bootstrapToken: string; license: SignedLicense }
export type StatusPayload = { deploymentId: string; state: DeploymentState; issuedAt: string; expiresAt: string }
export type SignedStatus = { payload: StatusPayload; keyId: string; signature: string }
export type ChatSessionInput = { accountId: string; userId: string; email: string; name: string; deploymentId?: string; tenantId?: string }
/** Same shape as `POST /api/papyrus/session`. */
export type ChatSessionResult = { token: string; expiresAt: string; tenantId: string; user: { oid: string; name: string } }

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
    sql: 'SELECT id FROM papyrus_deployments WHERE id=? AND key_sha256=?',
    args: [deploymentId, await deploymentKeyHash(deploymentKey)],
  }))
  return Boolean(row)
}

export async function signStatus(env: Bindings, input: { deploymentId: string; state: DeploymentState }): Promise<SignedStatus> {
  const deploymentId = requireStr(input?.deploymentId, 'deploymentId', 128)
  if (input.state !== 'active' && input.state !== 'suspended') throw new ApiError(422, 'validation_error', "state must be 'active' or 'suspended'.")
  const issued = Date.now()
  const payload: StatusPayload = {
    deploymentId,
    state: input.state,
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

// ---------------------------------------------------------------------------
// Chat sessions for control-plane users (papyrus.beaglabs.com)

/** Chat scope for a control-plane account whose deployments have no Entra tenant yet. Shows in the admin app as its own customer. */
export const accountChatScope = (accountId: string) => `cp:${accountId.toLowerCase()}`

/**
 * Mints a customer chat session for a signed-in control-plane user. Once one of the account's deployments is bound to
 * an Entra tenant (a Papyrus user signed in), the session joins that tenant's team thread; until then it is scoped to
 * the account. The account's earlier conversations move into the tenant the first time it resolves.
 */
export async function chatSession(env: Bindings, input: ChatSessionInput): Promise<ChatSessionResult> {
  const accountId = requireStr(input?.accountId, 'accountId', 128)
  const userId = requireStr(input?.userId, 'userId', 128)
  const email = str(input.email, 320)
  const name = str(input.name, 256) ?? email ?? 'Papyrus user'
  const requestedDeployment = str(input.deploymentId, 128)
  const requestedTenant = str(input.tenantId, 64)?.toLowerCase() ?? null
  const db = getDb(env)
  const owned = rows<Row>(await db.execute({
    sql: `SELECT c.deployment_id, d.tenant_id FROM control_plane_deployments c JOIN papyrus_deployments d ON d.id = c.deployment_id
          WHERE c.account_id=? ORDER BY d.tenant_id IS NULL, c.created_at`,
    args: [accountId],
  }))
  const deployment = requestedDeployment ? owned.find((row) => row.deployment_id === requestedDeployment) : owned[0]
  if (requestedDeployment && !deployment) throw new ApiError(403, 'deployment_not_owned', 'This deployment belongs to another account.')
  const boundTenant = deployment?.tenant_id ? String(deployment.tenant_id) : null
  if (requestedTenant && requestedTenant !== boundTenant) throw new ApiError(403, 'tenant_mismatch', 'This account is not bound to that tenant.')

  const scope = accountChatScope(accountId)
  const tenantId = boundTenant ?? scope
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO tenants (tenant_id, first_seen_at, last_seen_at) VALUES (?,?,?)
          ON CONFLICT(tenant_id) DO UPDATE SET last_seen_at=excluded.last_seen_at`,
    args: [tenantId, timestamp, timestamp],
  })
  if (boundTenant) await adoptAccountConversations(env, scope, boundTenant)
  await db.execute({
    sql: `INSERT INTO tenant_users (tenant_id, oid, name, email, first_seen_at, last_seen_at) VALUES (?,?,?,?,?,?)
          ON CONFLICT(tenant_id, oid) DO UPDATE SET name=excluded.name, email=COALESCE(excluded.email, tenant_users.email), last_seen_at=excluded.last_seen_at`,
    args: [tenantId, userId, name, email, timestamp, timestamp],
  })
  const session = await issueChatSession(env, { oid: userId, tid: tenantId, dep: deployment ? String(deployment.deployment_id) : '', name })
  return { token: session.token, expiresAt: session.expiresAt, tenantId, user: { oid: userId, name } }
}

/** Moves an account's pre-tenant conversations into the tenant: private threads as they are, team messages appended to the tenant's team thread. */
async function adoptAccountConversations(env: Bindings, scope: string, tenantId: string): Promise<void> {
  const db = getDb(env)
  if (!first<Row>(await db.execute({ sql: 'SELECT 1 AS ok FROM tenants WHERE tenant_id=?', args: [scope] }))) return
  const oldTeam = first<Row>(await db.execute({ sql: "SELECT id FROM conversations WHERE tenant_id=? AND kind='team'", args: [scope] }))
  const target = first<Row>(await db.execute({ sql: "SELECT id FROM conversations WHERE tenant_id=? AND kind='team'", args: [tenantId] }))
  const statements: { sql: string; args: unknown[] }[] = []
  if (oldTeam && target) {
    const from = String(oldTeam.id)
    const to = String(target.id)
    const top = first<Row>(await db.execute({ sql: 'SELECT COALESCE(MAX(seq), 0) AS seq FROM messages WHERE conversation_id=?', args: [to] }))
    statements.push(
      { sql: 'UPDATE messages SET conversation_id=?, seq=seq+? WHERE conversation_id=?', args: [to, Number(top?.seq ?? 0), from] },
      { sql: 'UPDATE chat_attachments SET conversation_id=? WHERE conversation_id=?', args: [to, from] },
      { sql: 'UPDATE huddles SET conversation_id=? WHERE conversation_id=?', args: [to, from] },
      { sql: 'UPDATE inbox_items SET conversation_id=? WHERE conversation_id=?', args: [to, from] },
      { sql: 'DELETE FROM conversation_reads WHERE conversation_id=?', args: [from] },
      { sql: 'UPDATE conversations SET last_message_at=(SELECT MAX(created_at) FROM messages WHERE conversation_id=?) WHERE id=?', args: [to, to] },
      { sql: 'DELETE FROM conversations WHERE id=?', args: [from] },
    )
  }
  statements.push(
    { sql: 'UPDATE conversations SET tenant_id=? WHERE tenant_id=?', args: [tenantId, scope] },
    { sql: 'UPDATE inbox_items SET tenant_id=? WHERE tenant_id=?', args: [tenantId, scope] },
    { sql: 'UPDATE tenant_events SET tenant_id=? WHERE tenant_id=?', args: [tenantId, scope] },
    { sql: 'DELETE FROM tenant_users WHERE tenant_id=?', args: [scope] },
    { sql: 'DELETE FROM tenants WHERE tenant_id=?', args: [scope] },
  )
  await db.batch(statements)
}
