import { first, getDb } from './db'
import type { Bindings } from './env'
import { checkTimes, decodeJwt, signHs256, verifyHs256, verifyRs256, type JwtClaims } from './jwt'
import { ApiError, GUID_RE, id, now, randomToken, sha256Hex } from './util'

export const DEFAULT_ADMIN_API_CLIENT_ID = '76fd8c28-6c8d-4b41-ae10-a99da42880a1'
export const OWNER_ROLE = 'Papyrus.System.Owner'
export const MANAGER_ROLE = 'Papyrus.Account.Manager'
export const CHAT_SESSION_TTL_SECONDS = 60 * 60

export type StaffRole = 'owner' | 'manager'

export type StaffActor = {
  kind: 'staff'
  role: StaffRole
  accountManagerId: string
  oid: string
  name: string
  email: string | null
}

export type CustomerActor = {
  kind: 'customer'
  oid: string
  tenantId: string
  deploymentId: string
  name: string
}

export type DeploymentActor = {
  kind: 'deployment'
  deploymentId: string
  tenantId: string | null
  entraClientId: string | null
  subscriptionId: string | null
}

export type ChatActor = StaffActor | CustomerActor

type Row = Record<string, unknown>

// ---------------------------------------------------------------------------
// Header parsing

export function authorizationParts(request: Request): { scheme: string; credentials: string } | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = /^(\S+)\s+(\S+)$/.exec(header.trim())
  return match ? { scheme: match[1].toLowerCase(), credentials: match[2] } : null
}

export function bearerToken(request: Request, allowQuery = false): string | null {
  const parts = authorizationParts(request)
  if (parts?.scheme === 'bearer') return parts.credentials
  if (allowQuery) return new URL(request.url).searchParams.get('token')
  return null
}

// ---------------------------------------------------------------------------
// Staff: Entra access token for the admin app API

export type StaffClaims = { oid: string; tid: string; name: string; email: string | null; role: StaffRole }

export function staffAudiences(env: Bindings): string[] {
  const clientId = env.ADMIN_API_CLIENT_ID || DEFAULT_ADMIN_API_CLIENT_ID
  return [`api://${clientId}`, clientId]
}

export function roleFromClaims(claims: JwtClaims): StaffRole | null {
  const roles = Array.isArray(claims.roles) ? claims.roles.filter((role): role is string => typeof role === 'string') : []
  if (roles.includes(OWNER_ROLE)) return 'owner'
  if (roles.includes(MANAGER_ROLE)) return 'manager'
  return null
}

/** Verifies an Entra access token from the Beag Labs tenant and maps its app role. */
export async function verifyStaffToken(env: Bindings, token: string, nowSeconds?: number): Promise<StaffClaims> {
  const tenantId = env.MICROSOFT_TENANT_ID
  if (!tenantId) throw new ApiError(503, 'staff_auth_not_configured', 'Staff sign-in is not configured.')
  const decoded = decodeJwt(token)
  await verifyRs256(decoded, `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
  const claims = decoded.claims
  if (claims.iss !== `https://login.microsoftonline.com/${tenantId}/v2.0`) throw new ApiError(401, 'invalid_token', 'Token issuer is not the Beag Labs tenant.')
  if (typeof claims.aud !== 'string' || !staffAudiences(env).includes(claims.aud)) throw new ApiError(401, 'invalid_audience', 'Token was issued for another application.')
  checkTimes(claims, nowSeconds)
  const oid = typeof claims.oid === 'string' ? claims.oid : null
  if (!oid) throw new ApiError(401, 'invalid_token', 'Token is missing the oid claim.')
  const role = roleFromClaims(claims)
  if (!role) throw new ApiError(403, 'forbidden_role', 'Your account has neither the Papyrus.System.Owner nor the Papyrus.Account.Manager role.')
  const email = [claims.preferred_username, claims.email, claims.upn].find((value): value is string => typeof value === 'string' && value.includes('@')) ?? null
  const name = typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : email ?? 'Beag Labs'
  return { oid, tid: tenantId, name, email, role }
}

/** Upserts the account_managers row keyed by oid and records the current role. */
export async function upsertStaff(env: Bindings, claims: StaffClaims): Promise<StaffActor> {
  const db = getDb(env)
  const timestamp = now()
  const existing = first<Row>(await db.execute({ sql: 'SELECT id, display_name, email FROM account_managers WHERE entra_oid=?', args: [claims.oid] }))
  let accountManagerId: string
  if (existing) {
    accountManagerId = String(existing.id)
    if (existing.display_name !== claims.name || (claims.email && existing.email !== claims.email)) {
      await db.execute({
        sql: 'UPDATE account_managers SET display_name=?, email=COALESCE(?, email), updated_at=? WHERE id=?',
        args: [claims.name, claims.email, timestamp, accountManagerId],
      })
    }
  } else {
    accountManagerId = id('am')
    await db.execute({
      sql: `INSERT INTO account_managers (id, entra_oid, entra_tenant_id, display_name, email, active, created_at, updated_at)
            VALUES (?,?,?,?,?,1,?,?) ON CONFLICT(entra_oid) DO NOTHING`,
      args: [accountManagerId, claims.oid, claims.tid, claims.name, claims.email, timestamp, timestamp],
    })
    const row = first<Row>(await db.execute({ sql: 'SELECT id FROM account_managers WHERE entra_oid=?', args: [claims.oid] }))
    accountManagerId = String(row?.id ?? accountManagerId)
  }
  await db.execute({
    sql: `INSERT INTO staff_roles (account_manager_id, role, updated_at) VALUES (?,?,?)
          ON CONFLICT(account_manager_id) DO UPDATE SET role=excluded.role, updated_at=excluded.updated_at
          WHERE staff_roles.role <> excluded.role`,
    args: [accountManagerId, claims.role, timestamp],
  })
  return { kind: 'staff', role: claims.role, accountManagerId, oid: claims.oid, name: claims.name, email: claims.email }
}

export async function authenticateStaffToken(env: Bindings, token: string): Promise<StaffActor> {
  return upsertStaff(env, await verifyStaffToken(env, token))
}

export async function requireStaff(env: Bindings, request: Request): Promise<StaffActor> {
  const token = bearerToken(request)
  if (!token) throw new ApiError(401, 'unauthorized', 'Sign in with your Beag Labs account.')
  return authenticateStaffToken(env, token)
}

export function requireOwner(actor: StaffActor): void {
  if (actor.role !== 'owner') throw new ApiError(403, 'owner_required', 'This action requires the Papyrus.System.Owner role.')
}

// ---------------------------------------------------------------------------
// Customer: signed-in Papyrus user's Entra ID token (any tenant)

export type CustomerIdentity = { oid: string; tid: string; name: string; email: string | null }

export async function verifyCustomerIdToken(idToken: string, expectedAudience: string | null, nowSeconds?: number): Promise<CustomerIdentity> {
  const decoded = decodeJwt(idToken)
  const tid = decoded.claims.tid
  if (typeof tid !== 'string' || !GUID_RE.test(tid)) throw new ApiError(401, 'invalid_id_token', 'ID token is missing a valid tenant id.')
  const tenantId = tid.toLowerCase()
  await verifyRs256(decoded, `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
  const claims = decoded.claims
  if (claims.iss !== `https://login.microsoftonline.com/${tenantId}/v2.0`) throw new ApiError(401, 'invalid_id_token', 'ID token issuer does not match its tenant.')
  checkTimes(claims, nowSeconds)
  if (expectedAudience && claims.aud !== expectedAudience) throw new ApiError(401, 'invalid_audience', 'ID token was issued for another application.')
  const oid = typeof claims.oid === 'string' ? claims.oid : null
  if (!oid) throw new ApiError(401, 'invalid_id_token', 'ID token is missing the oid claim.')
  const email = [claims.email, claims.preferred_username, claims.upn].find((value): value is string => typeof value === 'string' && value.includes('@')) ?? null
  const name = typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : email ?? 'Papyrus user'
  return { oid, tid: tenantId, name, email }
}

// ---------------------------------------------------------------------------
// Customer chat session token (HS256)

export async function issueChatSession(env: Bindings, input: { oid: string; tid: string; dep: string; name: string }, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!env.CHAT_SESSION_SECRET) throw new ApiError(503, 'chat_not_configured', 'Chat sessions are not configured.')
  const exp = nowSeconds + CHAT_SESSION_TTL_SECONDS
  const token = await signHs256({ sub: input.oid, tid: input.tid, dep: input.dep, name: input.name, kind: 'customer', iat: nowSeconds, exp }, env.CHAT_SESSION_SECRET)
  return { token, expiresAt: new Date(exp * 1000).toISOString() }
}

export async function verifyChatSession(env: Bindings, token: string, nowSeconds?: number): Promise<CustomerActor> {
  if (!env.CHAT_SESSION_SECRET) throw new ApiError(503, 'chat_not_configured', 'Chat sessions are not configured.')
  const claims = await verifyHs256(token, env.CHAT_SESSION_SECRET, nowSeconds)
  if (claims.kind !== 'customer' || typeof claims.sub !== 'string' || typeof claims.tid !== 'string' || typeof claims.dep !== 'string') {
    throw new ApiError(401, 'invalid_token', 'Session token is invalid.')
  }
  return { kind: 'customer', oid: claims.sub, tenantId: claims.tid, deploymentId: claims.dep, name: typeof claims.name === 'string' ? claims.name : 'Papyrus user' }
}

/** Chat routes accept a customer session (HS256) or a staff Entra token (RS256). */
export async function requireChatActor(env: Bindings, request: Request, allowQueryToken = false): Promise<ChatActor> {
  const token = bearerToken(request, allowQueryToken)
  if (!token) throw new ApiError(401, 'unauthorized', 'Authentication is required.')
  const { header } = decodeJwt(token)
  if (header.alg === 'HS256') return verifyChatSession(env, token)
  return authenticateStaffToken(env, token)
}

// ---------------------------------------------------------------------------
// Deployment keys

export function newDeploymentKey(): string {
  return `pdk_${randomToken(32)}`
}

export async function deploymentKeyHash(key: string): Promise<string> {
  return sha256Hex(key)
}

export async function authenticateDeployment(env: Bindings, key: string): Promise<DeploymentActor> {
  if (!/^pdk_[A-Za-z0-9_-]{20,128}$/.test(key)) throw new ApiError(401, 'invalid_deployment_key', 'Deployment key is invalid.')
  const row = first<Row>(await getDb(env).execute({
    sql: 'SELECT id, tenant_id, entra_client_id, subscription_id FROM papyrus_deployments WHERE key_sha256=?',
    args: [await deploymentKeyHash(key)],
  }))
  if (!row) throw new ApiError(401, 'invalid_deployment_key', 'Deployment key is invalid.')
  return {
    kind: 'deployment',
    deploymentId: String(row.id),
    tenantId: row.tenant_id ? String(row.tenant_id) : null,
    entraClientId: row.entra_client_id ? String(row.entra_client_id) : null,
    subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
  }
}

export async function requireDeployment(env: Bindings, request: Request): Promise<DeploymentActor> {
  const parts = authorizationParts(request)
  if (parts?.scheme !== 'deployment') throw new ApiError(401, 'unauthorized', 'Deployment authentication is required.')
  return authenticateDeployment(env, parts.credentials)
}
