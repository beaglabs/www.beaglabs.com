import { Hono, type Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { secureHeaders } from 'hono/secure-headers'
import { first, getDb, rows, type Database } from './db'
import type { Bindings } from './env'

type PortalEnvironment = 'commercial' | 'government'
type Row = Record<string, unknown>

type Session = {
  id: string
  oid: string
  tenant_id: string
  email?: string | null
  display_name?: string | null
  environment: PortalEnvironment
  organization_id?: string | null
  arm_token_ciphertext?: string | null
  arm_expires_at?: string | null
  expires_at: string
}

type AppEnv = {
  Bindings: Bindings
  Variables: { portalSession: Session }
}

type AppContext = Context<AppEnv>

const app = new Hono<AppEnv>()
const SESSION_COOKIE = 'beag_provision_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000
const CLAIM_TTL_MS = 30 * 60 * 1000
const VM_API_VERSION = '2024-07-01'
const PERMISSIONS_API_VERSION = '2022-04-01'
const REQUIRED_AZURE_ACTION = 'Microsoft.Compute/virtualMachines/write'

const AGREEMENTS: Record<PortalEnvironment, Array<{
  type: string
  version: string
  title: string
  href: string
  summary: string
}>> = {
  commercial: [
    {
      type: 'terms-of-service',
      version: '2026-10-08',
      title: 'Commercial Terms of Service',
      href: 'https://www.beaglabs.com/provision/commercial/terms',
      summary: 'Commercial product terms governing use of the Beag Labs provisioning service and Papyrus.',
    },
    {
      type: 'privacy-policy',
      version: '2026-10-08',
      title: 'Privacy Policy',
      href: 'https://www.beaglabs.com/provision/commercial/privacy',
      summary: 'How Beag Labs handles account, provisioning, support, and operational metadata.',
    },
  ],
  government: [
    {
      type: 'government-deployment-acknowledgment',
      version: '2026-10-08',
      title: 'Government Deployment Acknowledgment',
      href: 'https://www.beaglabs.com/provision/government/acknowledgment',
      summary: 'Deployment responsibilities and use acknowledgment. The applicable contract, order, OTA, or license controls if terms conflict.',
    },
    {
      type: 'privacy-policy',
      version: '2026-10-08',
      title: 'Privacy & Data Handling Notice',
      href: 'https://www.beaglabs.com/provision/government/privacy',
      summary: 'How Beag Labs handles provisioning and account metadata for connected government deployments.',
    },
  ],
}

app.use('*', secureHeaders())
app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
})

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function now(): string {
  return new Date().toISOString()
}

function environment(value: unknown): PortalEnvironment | null {
  return value === 'commercial' || value === 'government' ? value : null
}

function nonEmpty(value: unknown, max = 512): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= max ? normalized : null
}

function requiredString(value: unknown, name: string, max = 512): string {
  const result = nonEmpty(value, max)
  if (!result) throw new PortalError(422, 'validation_error', `${name} is required.`)
  return result
}

class PortalError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 410 | 422 | 500 | 502 | 503,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

async function requestJson(c: AppContext): Promise<Record<string, unknown>> {
  try {
    const value = await c.req.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object required')
    return value as Record<string, unknown>
  } catch {
    throw new PortalError(400, 'invalid_json', 'Request body must be a JSON object.')
  }
}

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function randomToken(bytes = 32): string {
  const value = new Uint8Array(bytes)
  crypto.getRandomValues(value)
  return base64url(value)
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return base64url(new Uint8Array(digest))
}

async function encryptionKey(env: Bindings): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.BETTER_AUTH_SECRET))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function seal(env: Bindings, value: string): Promise<string> {
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    await encryptionKey(env),
    new TextEncoder().encode(value),
  )
  return `${base64url(iv)}.${base64url(new Uint8Array(ciphertext))}`
}

async function unseal(env: Bindings, value: string): Promise<string> {
  const [ivRaw, ciphertextRaw] = value.split('.')
  if (!ivRaw || !ciphertextRaw) throw new Error('Malformed encrypted value')
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64url(ivRaw) },
    await encryptionKey(env),
    decodeBase64url(ciphertextRaw),
  )
  return new TextDecoder().decode(plaintext)
}


function emailDomain(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase()
  if (!email) return null
  const at = email.lastIndexOf('@')
  if (at <= 0 || at === email.length - 1) return null
  const domain = email.slice(at + 1)
  return /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/.test(domain) ? domain : null
}

function isGovernmentDomain(domain: string | null): boolean {
  return Boolean(domain && (domain.endsWith('.gov') || domain.endsWith('.mil')))
}

function authErrorReturnTo(value: string, target: PortalEnvironment, code: string): string {
  const url = new URL(safeReturnTo(value, target))
  url.searchParams.set('provisionError', code)
  return url.toString()
}

function preferredVerifiedDomain(value: unknown): string | null {
  if (!Array.isArray(value)) return null
  const entries = value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
  const selected = entries.find((item) => item.isDefault === true)
    ?? entries.find((item) => item.isInitial !== true)
    ?? entries[0]
  return selected ? nonEmpty(selected.name, 253)?.toLowerCase() ?? null : null
}

async function tenantProfileFromGraph(input: {
  token: string
  tenantId: string
  target: PortalEnvironment
  graphOrigin: string
  fallbackEmail?: string
}): Promise<{
  displayName: string | null
  primaryDomain: string | null
  verifiedDomains: string[]
  entraLogoUrl: string | null
  logoSource: 'entra' | 'logo_dev' | 'none'
}> {
  let displayName: string | null = null
  let primaryDomain: string | null = input.target === 'government' ? emailDomain(input.fallbackEmail) : null
  let verifiedDomains: string[] = []
  let entraLogoUrl: string | null = null

  try {
    const orgResponse = await fetch(
      `${input.graphOrigin}/v1.0/organization?$select=id,displayName,verifiedDomains`,
      { headers: { authorization: `Bearer ${input.token}`, accept: 'application/json' } },
    )
    if (orgResponse.ok) {
      const body = await orgResponse.json() as { value?: Array<Record<string, unknown>> }
      const org = Array.isArray(body.value)
        ? body.value.find((item) => String(item.id ?? '').toLowerCase() === input.tenantId.toLowerCase()) ?? body.value[0]
        : undefined
      if (org) {
        displayName = nonEmpty(org.displayName, 256)
        if (Array.isArray(org.verifiedDomains)) {
          verifiedDomains = org.verifiedDomains
            .map((item) => item && typeof item === 'object' && !Array.isArray(item) ? nonEmpty((item as Record<string, unknown>).name, 253)?.toLowerCase() : null)
            .filter((value): value is string => Boolean(value))
        }
        if (input.target === 'commercial') primaryDomain = preferredVerifiedDomain(org.verifiedDomains)
      }
    }
  } catch {
    // Tenant metadata is enrichment. Authentication and Azure ownership remain authoritative.
  }

  if (input.target === 'commercial') {
    try {
      const brandingResponse = await fetch(
        `${input.graphOrigin}/v1.0/organization/${encodeURIComponent(input.tenantId)}/branding?$select=cdnList,squareLogoRelativeUrl`,
        { headers: { authorization: `Bearer ${input.token}`, accept: 'application/json' } },
      )
      if (brandingResponse.ok) {
        const branding = await brandingResponse.json() as { cdnList?: string[]; squareLogoRelativeUrl?: string }
        const base = Array.isArray(branding.cdnList) ? branding.cdnList.find((value) => typeof value === 'string' && value.startsWith('https://')) : undefined
        const relative = nonEmpty(branding.squareLogoRelativeUrl, 2048)
        if (base && relative) {
          try { entraLogoUrl = new URL(relative, base.endsWith('/') ? base : `${base}/`).toString() } catch { /* ignore malformed branding URL */ }
        }
      }
    } catch {
      // A tenant might not expose organizational branding to this user. Domain fallback remains available.
    }
  }

  if (input.target === 'government' && !primaryDomain) primaryDomain = emailDomain(input.fallbackEmail)
  const logoSource = input.target === 'government'
    ? (primaryDomain ? 'logo_dev' : 'none')
    : (entraLogoUrl ? 'entra' : primaryDomain ? 'logo_dev' : 'none')

  return { displayName, primaryDomain, verifiedDomains, entraLogoUrl, logoSource }
}

async function upsertTenantProfile(c: AppContext, input: {
  tenantId: string
  environment: PortalEnvironment
  displayName: string | null
  primaryDomain: string | null
  verifiedDomains: string[]
  entraLogoUrl: string | null
  logoSource: 'entra' | 'logo_dev' | 'none'
}): Promise<void> {
  await getDb(c.env).execute({
    sql: `INSERT INTO provision_tenant_profiles
      (tenant_id,environment,display_name,primary_domain,verified_domains_json,entra_logo_url,logo_source,updated_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(tenant_id,environment) DO UPDATE SET
        display_name=excluded.display_name,
        primary_domain=excluded.primary_domain,
        verified_domains_json=excluded.verified_domains_json,
        entra_logo_url=excluded.entra_logo_url,
        logo_source=excluded.logo_source,
        updated_at=excluded.updated_at`,
    args: [
      input.tenantId, input.environment, input.displayName, input.primaryDomain,
      JSON.stringify(input.verifiedDomains), input.entraLogoUrl, input.logoSource, now(),
    ],
  })
}

async function refreshResourceToken(config: ReturnType<typeof oauthConfig>, refreshToken: string, scope: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${config.authority}/organizations/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope,
    }),
  })
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  if (!response.ok || !body) {
    throw new PortalError(502, 'microsoft_resource_token_failed', nonEmpty(body?.error_description, 1000) ?? 'Microsoft resource token exchange failed.')
  }
  return body
}

function oauthConfig(env: Bindings, target: PortalEnvironment) {
  if (target === 'commercial') {
    const clientId = env.PROVISION_COMMERCIAL_CLIENT_ID || env.MICROSOFT_CLIENT_ID
    const clientSecret = env.PROVISION_COMMERCIAL_CLIENT_SECRET || env.MICROSOFT_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new PortalError(503, 'commercial_auth_not_configured', 'Commercial provisioning sign-in is not configured.')
    return {
      clientId,
      clientSecret,
      authority: 'https://login.microsoftonline.com',
      armOrigin: 'https://management.azure.com',
      armScope: 'https://management.azure.com/user_impersonation',
      graphOrigin: 'https://graph.microsoft.com',
      graphScope: 'https://graph.microsoft.com/User.Read',
    }
  }

  const clientId = env.PROVISION_GOVERNMENT_CLIENT_ID
  const clientSecret = env.PROVISION_GOVERNMENT_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new PortalError(503, 'government_auth_not_configured', 'Government provisioning sign-in requires the Azure Government app registration.')
  return {
    clientId,
    clientSecret,
    authority: 'https://login.microsoftonline.us',
    armOrigin: 'https://management.usgovcloudapi.net',
    armScope: 'https://management.core.usgovcloudapi.net//user_impersonation',
    graphOrigin: 'https://graph.microsoft.us',
    graphScope: 'https://graph.microsoft.us/User.Read',
  }
}

function safeReturnTo(value: string | undefined, target: PortalEnvironment): string {
  const fallback = `https://www.beaglabs.com/provision/${target}`
  if (!value) return fallback
  let url: URL
  try { url = new URL(value) } catch { return fallback }
  const allowedOrigins = new Set(['https://www.beaglabs.com', 'https://beaglabs.com', 'http://localhost:3000', 'http://127.0.0.1:3000'])
  if (!allowedOrigins.has(url.origin) || !url.pathname.startsWith('/provision/')) return fallback
  return url.toString()
}

function redirectUri(env: Bindings): string {
  return new URL('/api/provision/auth/callback', env.BASE_URL).toString()
}

async function createOauthState(c: AppContext, target: PortalEnvironment, returnTo: string): Promise<string> {
  const state = randomToken()
  const verifier = randomToken(48)
  const nonce = randomToken(24)
  const stateHash = await sha256(state)
  const created = now()
  const expires = new Date(Date.now() + OAUTH_STATE_TTL_MS).toISOString()
  await getDb(c.env).execute({
    sql: `INSERT INTO provision_oauth_states (state_hash,code_verifier,nonce,environment,return_to,created_at,expires_at)
          VALUES (?,?,?,?,?,?,?)`,
    args: [stateHash, verifier, nonce, target, returnTo, created, expires],
  })
  return JSON.stringify({ state, verifier, nonce })
}

function decodeJwtPart(value: string): Record<string, unknown> {
  const decoded = new TextDecoder().decode(decodeBase64url(value))
  const parsed = JSON.parse(decoded) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JWT payload')
  return parsed as Record<string, unknown>
}

async function verifyMicrosoftIdToken(input: {
  token: string
  target: PortalEnvironment
  clientId: string
  authority: string
  nonce: string
}): Promise<{ oid: string; tenantId: string; email?: string; name?: string }> {
  const parts = input.token.split('.')
  if (parts.length !== 3) throw new PortalError(401, 'invalid_id_token', 'Microsoft returned an invalid identity token.')
  const header = decodeJwtPart(parts[0])
  const unverified = decodeJwtPart(parts[1])
  const kid = nonEmpty(header.kid, 256)
  const tenantId = nonEmpty(unverified.tid, 128)
  if (!kid || !tenantId) throw new PortalError(401, 'invalid_id_token', 'Microsoft identity token is missing tenant metadata.')

  const discoveryUrl = `${input.authority}/${encodeURIComponent(tenantId)}/v2.0/.well-known/openid-configuration`
  const discoveryResponse = await fetch(discoveryUrl, { headers: { accept: 'application/json' } })
  if (!discoveryResponse.ok) throw new PortalError(502, 'identity_discovery_failed', 'Unable to validate Microsoft identity.')
  const discovery = await discoveryResponse.json() as { issuer?: string; jwks_uri?: string }
  if (!discovery.issuer || !discovery.jwks_uri) throw new PortalError(502, 'identity_discovery_failed', 'Microsoft identity metadata was incomplete.')

  const jwksResponse = await fetch(discovery.jwks_uri, { headers: { accept: 'application/json' } })
  if (!jwksResponse.ok) throw new PortalError(502, 'identity_keys_failed', 'Unable to validate Microsoft identity signing keys.')
  const jwks = await jwksResponse.json() as { keys?: Array<JsonWebKey & { kid?: string; alg?: string }> }
  const jwk = jwks.keys?.find((candidate) => candidate.kid === kid)
  if (!jwk) throw new PortalError(401, 'identity_key_not_found', 'Microsoft identity signing key was not found.')

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  )
  if (!verified) throw new PortalError(401, 'invalid_id_token', 'Microsoft identity signature validation failed.')

  const claims = decodeJwtPart(parts[1])
  const current = Math.floor(Date.now() / 1000)
  if (claims.aud !== input.clientId) throw new PortalError(401, 'invalid_id_token', 'Microsoft identity token was issued for another application.')
  if (claims.iss !== discovery.issuer) throw new PortalError(401, 'invalid_id_token', 'Microsoft identity token issuer did not match the selected cloud.')
  if (claims.nonce !== input.nonce) throw new PortalError(401, 'invalid_id_token', 'Microsoft identity nonce validation failed.')
  if (typeof claims.exp !== 'number' || claims.exp <= current) throw new PortalError(401, 'expired_id_token', 'Microsoft identity token has expired.')
  if (typeof claims.nbf === 'number' && claims.nbf > current + 60) throw new PortalError(401, 'invalid_id_token', 'Microsoft identity token is not active yet.')

  const oid = nonEmpty(claims.oid, 128)
  const verifiedTenant = nonEmpty(claims.tid, 128)
  if (!oid || !verifiedTenant || verifiedTenant.toLowerCase() !== tenantId.toLowerCase()) {
    throw new PortalError(401, 'invalid_id_token', 'Microsoft identity token is missing immutable identity claims.')
  }

  return {
    oid: oid.toLowerCase(),
    tenantId: verifiedTenant.toLowerCase(),
    ...(nonEmpty(claims.preferred_username, 512) ? { email: nonEmpty(claims.preferred_username, 512)! } : {}),
    ...(nonEmpty(claims.name, 512) ? { name: nonEmpty(claims.name, 512)! } : {}),
  }
}

function cookieOptions(c: AppContext) {
  const secure = c.env.BASE_URL.startsWith('https://')
  return {
    httpOnly: true,
    secure,
    sameSite: (secure ? 'None' : 'Lax') as 'None' | 'Lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  }
}

async function portalSession(c: AppContext): Promise<Session | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = await sha256(token)
  const session = first<Session>(await getDb(c.env).execute({
    sql: `SELECT * FROM provision_portal_sessions WHERE token_hash=? AND expires_at>? LIMIT 1`,
    args: [tokenHash, now()],
  }))
  if (!session) {
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return null
  }
  if (session.environment === 'government' && !isGovernmentDomain(emailDomain(session.email))) {
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return null
  }
  await getDb(c.env).execute({
    sql: 'UPDATE provision_portal_sessions SET last_seen_at=? WHERE id=?',
    args: [now(), session.id],
  })
  return session
}

app.use('/api/provision/private/*', async (c, next) => {
  const session = await portalSession(c)
  if (!session) return c.json({ error: 'unauthorized', message: 'Microsoft sign-in is required.' }, 401)
  c.set('portalSession', session)
  await next()
})

function primaryManagerSql() {
  return `SELECT am.* FROM organization_account_managers oam
          JOIN account_managers am ON am.id=oam.account_manager_id
          WHERE oam.organization_id=? AND oam.role='primary' AND am.active=1 LIMIT 1`
}

async function organizationForSession(c: AppContext, session: Session): Promise<Row | null> {
  if (!session.organization_id) return null
  return first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM organizations WHERE id=? LIMIT 1',
    args: [session.organization_id],
  }))
}

async function requiredAgreementViews(c: AppContext, session: Session) {
  if (!session.organization_id) return AGREEMENTS[session.environment].map((agreement) => ({ ...agreement, accepted: false }))
  const accepted = rows<Row>(await getDb(c.env).execute({
    sql: `SELECT agreement_type,agreement_version,accepted_at FROM agreement_acceptances
          WHERE organization_id=? AND actor_tenant_id=? ORDER BY accepted_at DESC`,
    args: [session.organization_id, session.tenant_id],
  }))
  const keys = new Set(accepted.map((row) => `${row.agreement_type}:${row.agreement_version}`))
  return AGREEMENTS[session.environment].map((agreement) => ({
    ...agreement,
    accepted: keys.has(`${agreement.type}:${agreement.version}`),
  }))
}

async function agreementsComplete(c: AppContext, session: Session): Promise<boolean> {
  const views = await requiredAgreementViews(c, session)
  return views.every((item) => item.accepted)
}

function parseSubscriptionId(resourceId: string): string | null {
  const match = resourceId.match(/^\/subscriptions\/([^/]+)\//i)
  return match?.[1]?.toLowerCase() ?? null
}

function vmName(resourceId: string): string {
  const parts = resourceId.split('/').filter(Boolean)
  return parts.at(-1) ?? resourceId
}

function rate(env: Bindings): number {
  const parsed = Number(env.PAPYRUS_VCPU_HOURLY_USD ?? '0.50')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0.50
}

function armOrigin(target: PortalEnvironment): string {
  return target === 'government' ? 'https://management.usgovcloudapi.net' : 'https://management.azure.com'
}

async function armToken(c: AppContext, session: Session): Promise<string> {
  if (!session.arm_token_ciphertext || !session.arm_expires_at || Date.parse(session.arm_expires_at) <= Date.now() + 30_000) {
    throw new PortalError(401, 'azure_reauthentication_required', 'Reconnect Microsoft Azure before performing deployment operations.')
  }
  try {
    return await unseal(c.env, session.arm_token_ciphertext)
  } catch {
    throw new PortalError(401, 'azure_reauthentication_required', 'Reconnect Microsoft Azure before performing deployment operations.')
  }
}

async function armJson<T>(target: PortalEnvironment, token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${armOrigin(target)}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const body = await response.json().catch(() => null) as T & { error?: { message?: string } }
  if (!response.ok) {
    const message = body && typeof body === 'object' && body.error?.message
      ? body.error.message
      : `Azure Resource Manager request failed (${response.status}).`
    throw new PortalError(response.status === 403 ? 403 : 502, 'azure_request_failed', message)
  }
  return body
}

function wildcardPattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`, 'i')
}

function permissionAllows(permission: Record<string, unknown>, action: string): boolean {
  const actions = Array.isArray(permission.actions) ? permission.actions.filter((v): v is string => typeof v === 'string') : []
  const notActions = Array.isArray(permission.notActions) ? permission.notActions.filter((v): v is string => typeof v === 'string') : []
  const allowed = actions.some((pattern) => wildcardPattern(pattern).test(action))
  return allowed && !notActions.some((pattern) => wildcardPattern(pattern).test(action))
}

async function verifyVmWrite(target: PortalEnvironment, token: string, resourceId: string): Promise<void> {
  const result = await armJson<{ value?: Array<Record<string, unknown>> }>(
    target,
    token,
    `${resourceId}/providers/Microsoft.Authorization/permissions?api-version=${PERMISSIONS_API_VERSION}`,
  )
  if (!Array.isArray(result.value) || !result.value.some((item) => permissionAllows(item, REQUIRED_AZURE_ACTION))) {
    throw new PortalError(403, 'azure_permission_required', 'Your Microsoft account does not have permission to manage this Papyrus VM.')
  }
}

async function availableVmSizes(target: PortalEnvironment, token: string, resourceId: string) {
  const result = await armJson<{ value?: Array<Record<string, unknown>> }>(
    target,
    token,
    `${resourceId}/vmSizes?api-version=${VM_API_VERSION}`,
  )
  return (Array.isArray(result.value) ? result.value : [])
    .map((item) => ({
      name: nonEmpty(item.name, 256) ?? '',
      vcpus: Number(item.numberOfCores ?? 0),
      memoryMb: Number(item.memoryInMB ?? 0),
      osDiskMb: Number(item.osDiskSizeInMB ?? 0),
      resourceDiskMb: Number(item.resourceDiskSizeInMB ?? 0),
    }))
    .filter((item) => item.name && Number.isFinite(item.vcpus) && item.vcpus > 0)
    .sort((a, b) => a.vcpus - b.vcpus || a.memoryMb - b.memoryMb || a.name.localeCompare(b.name))
}

async function auditCustomer(c: AppContext, session: Session, action: string, resourceType: string, resourceId: string | null, after: unknown) {
  await getDb(c.env).execute({
    sql: `INSERT INTO audit_events
          (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('aud'), 'customer', session.oid, action, resourceType, resourceId,
      session.organization_id ?? null, null,
      c.req.header('cf-ray') ?? c.req.header('x-request-id') ?? crypto.randomUUID(),
      c.req.header('cf-connecting-ip') ?? null,
      c.req.header('user-agent') ?? null,
      null,
      JSON.stringify(after),
      now(),
    ],
  })
}

app.get('/api/provision/auth/start', async (c) => {
  const target = environment(c.req.query('environment'))
  if (!target) throw new PortalError(422, 'invalid_environment', 'Choose commercial or government provisioning.')
  const config = oauthConfig(c.env, target)
  const returnTo = safeReturnTo(c.req.query('returnTo'), target)
  const raw = JSON.parse(await createOauthState(c, target, returnTo)) as { state: string; verifier: string; nonce: string }
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw.verifier))))
  const url = new URL(`${config.authority}/organizations/oauth2/v2.0/authorize`)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri(c.env))
  url.searchParams.set('response_mode', 'query')
  url.searchParams.set('scope', `openid profile email offline_access ${config.graphScope} ${config.armScope}`)
  url.searchParams.set('state', raw.state)
  url.searchParams.set('nonce', raw.nonce)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('prompt', 'select_account')
  return c.json({ url: url.toString() })
})

app.get('/api/provision/auth/callback', async (c) => {
  const state = c.req.query('state')
  const code = c.req.query('code')
  const oauthError = c.req.query('error_description') || c.req.query('error')
  if (oauthError) throw new PortalError(401, 'microsoft_sign_in_failed', oauthError)
  if (!state || !code) throw new PortalError(400, 'invalid_oauth_callback', 'Microsoft sign-in callback is incomplete.')

  const stateHash = await sha256(state)
  const record = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM provision_oauth_states WHERE state_hash=? LIMIT 1',
    args: [stateHash],
  }))
  if (!record || Date.parse(String(record.expires_at)) <= Date.now()) {
    throw new PortalError(410, 'oauth_state_expired', 'Microsoft sign-in expired. Start again from the provisioning portal.')
  }
  await getDb(c.env).execute({ sql: 'DELETE FROM provision_oauth_states WHERE state_hash=?', args: [stateHash] })

  const target = environment(record.environment)
  if (!target) throw new PortalError(400, 'invalid_oauth_state', 'Provisioning environment was invalid.')
  const config = oauthConfig(c.env, target)
  const tokenResponse = await fetch(`${config.authority}/organizations/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(c.env),
      code_verifier: String(record.code_verifier),
      scope: `openid profile email offline_access ${config.graphScope}`,
    }),
  })
  const tokenBody = await tokenResponse.json().catch(() => null) as Record<string, unknown> | null
  if (!tokenResponse.ok || !tokenBody) {
    throw new PortalError(502, 'microsoft_token_exchange_failed', nonEmpty(tokenBody?.error_description, 1000) ?? 'Microsoft token exchange failed.')
  }
  const graphToken = requiredString(tokenBody.access_token, 'access_token', 32_768)
  const refreshToken = requiredString(tokenBody.refresh_token, 'refresh_token', 65_536)
  const idToken = requiredString(tokenBody.id_token, 'id_token', 32_768)
  const identity = await verifyMicrosoftIdToken({
    token: idToken,
    target,
    clientId: config.clientId,
    authority: config.authority,
    nonce: String(record.nonce),
  })

  const governmentDomain = emailDomain(identity.email)
  if (target === 'government' && !isGovernmentDomain(governmentDomain)) {
    return c.redirect(authErrorReturnTo(String(record.return_to), target, 'government_email_required'), 302)
  }

  const tenantProfile = await tenantProfileFromGraph({
    token: graphToken,
    tenantId: identity.tenantId,
    target,
    graphOrigin: config.graphOrigin,
    fallbackEmail: identity.email,
  })
  if (target === 'government' && governmentDomain) {
    tenantProfile.primaryDomain = governmentDomain
    tenantProfile.logoSource = 'logo_dev'
  }
  await upsertTenantProfile(c, {
    tenantId: identity.tenantId,
    environment: target,
    displayName: tenantProfile.displayName,
    primaryDomain: tenantProfile.primaryDomain,
    verifiedDomains: tenantProfile.verifiedDomains,
    entraLogoUrl: tenantProfile.entraLogoUrl,
    logoSource: tenantProfile.logoSource,
  })

  const armTokenBody = await refreshResourceToken(config, refreshToken, config.armScope)
  const accessToken = requiredString(armTokenBody.access_token, 'access_token', 32_768)

  const tenantBinding = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT organization_id FROM organization_tenants WHERE tenant_id=? AND environment=? LIMIT 1',
    args: [identity.tenantId, target],
  }))
  const sessionId = id('psn')
  const sessionToken = randomToken()
  const sessionHash = await sha256(sessionToken)
  const timestamp = now()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  const expiresIn = Number(armTokenBody.expires_in ?? 3600)
  const armExpiresAt = new Date(Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000).toISOString()
  await getDb(c.env).execute({
    sql: `INSERT INTO provision_portal_sessions
          (id,token_hash,oid,tenant_id,email,display_name,environment,organization_id,arm_token_ciphertext,arm_expires_at,created_at,expires_at,last_seen_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      sessionId, sessionHash, identity.oid, identity.tenantId,
      identity.email ?? null, identity.name ?? null, target,
      tenantBinding?.organization_id ?? null,
      await seal(c.env, accessToken), armExpiresAt,
      timestamp, expiresAt, timestamp,
    ],
  })
  setCookie(c, SESSION_COOKIE, sessionToken, cookieOptions(c))
  return c.redirect(safeReturnTo(String(record.return_to), target), 302)
})

app.post('/api/provision/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    await getDb(c.env).execute({ sql: 'DELETE FROM provision_portal_sessions WHERE token_hash=?', args: [await sha256(token)] })
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ signedOut: true })
})

app.post('/api/provision/bootstrap', async (c) => {
  const input = await requestJson(c)
  const target = environment(input.environment)
  if (!target) throw new PortalError(422, 'invalid_environment', 'environment must be commercial or government.')
  const deploymentId = requiredString(input.papyrusDeploymentId, 'papyrusDeploymentId', 256)
  const resourceId = requiredString(input.azureResourceId, 'azureResourceId', 2048)
  if (!/^\/subscriptions\/[^/]+\/resourceGroups\/[^/]+\/providers\/Microsoft\.Compute\/virtualMachines\/[^/]+$/i.test(resourceId)) {
    throw new PortalError(422, 'invalid_resource_id', 'azureResourceId must identify one Azure virtual machine.')
  }
  const publicOrigin = nonEmpty(input.publicOrigin, 2048)
  if (publicOrigin) {
    let parsed: URL
    try { parsed = new URL(publicOrigin) } catch { throw new PortalError(422, 'invalid_public_origin', 'publicOrigin must be a valid URL.') }
    if (parsed.protocol !== 'https:') throw new PortalError(422, 'invalid_public_origin', 'Connected Marketplace deployments must use HTTPS.')
  }

  const token = randomToken()
  const timestamp = now()
  await getDb(c.env).execute({
    sql: `INSERT INTO provisioning_claims
          (id,token_hash,environment,papyrus_deployment_id,azure_resource_id,public_origin,marketplace_publisher,marketplace_product,marketplace_plan,activation_public_key_pem,expires_at,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('pcl'), await sha256(token), target, deploymentId, resourceId, publicOrigin,
      nonEmpty(input.marketplacePublisher, 256), nonEmpty(input.marketplaceProduct, 256), nonEmpty(input.marketplacePlan, 256),
      nonEmpty(input.activationPublicKeyPem, 16_384),
      new Date(Date.now() + CLAIM_TTL_MS).toISOString(), timestamp,
    ],
  })
  return c.json({
    claimToken: token,
    portalUrl: `https://www.beaglabs.com/provision/${target}?claim=${encodeURIComponent(token)}`,
    expiresIn: Math.floor(CLAIM_TTL_MS / 1000),
  }, 201)
})

app.get('/api/provision/bootstrap/status', async (c) => {
  const token = c.req.query('token')
  if (!token) throw new PortalError(422, 'token_required', 'Provisioning claim token is required.')
  const claim = first<Row>(await getDb(c.env).execute({
    sql: `SELECT pc.claimed_at,pc.expires_at,ps.tenant_id,ps.organization_id,
      COALESCE(o.display_name,o.legal_name) AS organization_name
      FROM provisioning_claims pc
      LEFT JOIN provision_portal_sessions ps ON ps.id=pc.claimed_by_session_id
      LEFT JOIN organizations o ON o.id=ps.organization_id
      WHERE pc.token_hash=? LIMIT 1`,
    args: [await sha256(token)],
  }))
  if (!claim) throw new PortalError(404, 'claim_not_found', 'Provisioning claim was not found.')
  if (!claim.claimed_at && Date.parse(String(claim.expires_at)) <= Date.now()) {
    return c.json({ claimed: false, expired: true })
  }
  return c.json({
    claimed: Boolean(claim.claimed_at),
    expired: false,
    claimedAt: claim.claimed_at ?? null,
    tenantId: claim.tenant_id ?? null,
    organizationId: claim.organization_id ?? null,
    organizationName: claim.organization_name ?? null,
  })
})

app.get('/api/provision/private/me', async (c) => {
  const session = c.get('portalSession')
  const organization = await organizationForSession(c, session)
  const manager = organization
    ? first<Row>(await getDb(c.env).execute({ sql: primaryManagerSql(), args: [organization.id] }))
    : null
  const agreements = await requiredAgreementViews(c, session)
  const tenantProfile = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM provision_tenant_profiles WHERE tenant_id=? AND environment=? LIMIT 1',
    args: [session.tenant_id, session.environment],
  }))
  const offlineCount = organization
    ? Number(first<Row>(await getDb(c.env).execute({
        sql: `SELECT
          (SELECT COUNT(*) FROM organization_license_issuances WHERE organization_id=?)
          + (SELECT COUNT(*) FROM license_issuances li JOIN deployments d ON d.id=li.deployment_id WHERE d.customer_organization_id=?) AS count`,
        args: [organization.id, organization.id],
      }))?.count ?? 0)
    : 0
  return c.json({
    user: {
      oid: session.oid,
      tenantId: session.tenant_id,
      email: session.email ?? null,
      name: session.display_name ?? null,
    },
    environment: session.environment,
    organization,
    tenantProfile: tenantProfile ? {
      displayName: tenantProfile.display_name ?? null,
      primaryDomain: tenantProfile.primary_domain ?? null,
      verifiedDomains: (() => { try { return JSON.parse(String(tenantProfile.verified_domains_json ?? '[]')) } catch { return [] } })(),
      logoSource: tenantProfile.logo_source ?? 'none',
      logoUrl: (tenantProfile.entra_logo_url || tenantProfile.primary_domain)
        ? `${c.env.BASE_URL}/api/provision/private/organization/logo`
        : null,
    } : null,
    accountManager: manager,
    agreements,
    agreementsComplete: agreements.every((item) => item.accepted),
    capabilities: {
      marketplaceBilling: session.environment === 'commercial',
      offlineLicenses: session.environment === 'government' || offlineCount > 0,
      containers: false,
      azureManagementConnected: Boolean(session.arm_expires_at && Date.parse(session.arm_expires_at) > Date.now() + 30_000),
    },
    pricing: { vcpuHourlyUsd: rate(c.env) },
  })
})

app.post('/api/provision/private/organization', async (c) => {
  const session = c.get('portalSession')
  if (session.organization_id) return c.json({ organization: await organizationForSession(c, session) })
  const input = await requestJson(c)
  const db = getDb(c.env)
  const tenantProfile = first<Row>(await db.execute({
    sql: 'SELECT * FROM provision_tenant_profiles WHERE tenant_id=? AND environment=? LIMIT 1',
    args: [session.tenant_id, session.environment],
  }))
  const legalName = requiredString(input.legalName ?? tenantProfile?.display_name, 'legalName', 256)
  const displayName = nonEmpty(input.displayName ?? tenantProfile?.display_name, 256)
  const domain = session.environment === 'government'
    ? emailDomain(session.email)
    : nonEmpty(tenantProfile?.primary_domain, 253)?.toLowerCase() ?? null
  if (session.environment === 'government' && !isGovernmentDomain(domain)) {
    throw new PortalError(403, 'government_email_required', 'Government provisioning requires a verified .gov or .mil Microsoft account.')
  }

  const existingTenant = first<Row>(await db.execute({
    sql: 'SELECT organization_id FROM organization_tenants WHERE tenant_id=? AND environment=? LIMIT 1',
    args: [session.tenant_id, session.environment],
  }))
  if (existingTenant) {
    await db.execute({ sql: 'UPDATE provision_portal_sessions SET organization_id=? WHERE id=?', args: [existingTenant.organization_id, session.id] })
    return c.json({ organization: first<Row>(await db.execute({ sql: 'SELECT * FROM organizations WHERE id=?', args: [existingTenant.organization_id] })) })
  }

  const organizationId = id('org')
  const timestamp = now()
  const organizationType = session.environment === 'government' ? 'federal_agency' : 'commercial'
  const manager = first<Row>(await db.execute('SELECT id FROM account_managers WHERE active=1 ORDER BY created_at ASC LIMIT 1'))
  const statements: Array<string | { sql: string; args?: readonly unknown[] }> = [
    {
      sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,domain,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [organizationId, organizationType, legalName, displayName, domain, 'active', timestamp, timestamp],
    },
    {
      sql: `INSERT INTO organization_tenants (organization_id,tenant_id,environment,verified_at,verified_by_oid)
            VALUES (?,?,?,?,?)`,
      args: [organizationId, session.tenant_id, session.environment, timestamp, session.oid],
    },
    {
      sql: 'UPDATE provision_portal_sessions SET organization_id=? WHERE id=?',
      args: [organizationId, session.id],
    },
  ]
  if (manager?.id) {
    statements.push({
      sql: `INSERT INTO organization_account_managers (organization_id,account_manager_id,role,assigned_by_oid,assigned_at)
            VALUES (?,?,?,?,?)`,
      args: [organizationId, manager.id, 'primary', session.oid, timestamp],
    })
  }
  await db.batch(statements, 'write')
  const updatedSession = { ...session, organization_id: organizationId }
  await auditCustomer(c, updatedSession, 'provision.organization.create', 'organization', organizationId, { legalName, displayName, domain, tenantId: session.tenant_id })
  return c.json({ organization: first<Row>(await db.execute({ sql: 'SELECT * FROM organizations WHERE id=?', args: [organizationId] })) }, 201)
})

app.get('/api/provision/private/agreements', async (c) => {
  return c.json({ items: await requiredAgreementViews(c, c.get('portalSession')) })
})

app.post('/api/provision/private/agreements/accept', async (c) => {
  const session = c.get('portalSession')
  if (!session.organization_id) throw new PortalError(409, 'organization_required', 'Complete organization setup before accepting agreements.')
  const input = await requestJson(c)
  const agreementType = requiredString(input.agreementType, 'agreementType', 128)
  const agreement = AGREEMENTS[session.environment].find((item) => item.type === agreementType)
  if (!agreement) throw new PortalError(422, 'invalid_agreement', 'Agreement is not required for this provisioning environment.')
  const hash = await sha256(`${agreement.type}|${agreement.version}|${agreement.href}|${agreement.summary}`)
  const timestamp = now()
  await getDb(c.env).execute({
    sql: `INSERT INTO agreement_acceptances
          (id,organization_id,actor_oid,actor_tenant_id,actor_email,environment,agreement_type,agreement_version,agreement_sha256,source_ip,user_agent,accepted_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('agr'), session.organization_id, session.oid, session.tenant_id, session.email ?? null,
      session.environment, agreement.type, agreement.version, hash,
      c.req.header('cf-connecting-ip') ?? null, c.req.header('user-agent') ?? null, timestamp,
    ],
  })
  await auditCustomer(c, session, 'provision.agreement.accept', 'agreement', null, { type: agreement.type, version: agreement.version, sha256: hash })
  return c.json({ accepted: true, agreementType: agreement.type, version: agreement.version })
})

app.post('/api/provision/private/claim', async (c) => {
  const session = c.get('portalSession')
  if (!session.organization_id) throw new PortalError(409, 'organization_required', 'Complete organization setup before linking a deployment.')
  if (!(await agreementsComplete(c, session))) throw new PortalError(409, 'agreements_required', 'Accept the required agreements before linking a deployment.')
  const input = await requestJson(c)
  const token = requiredString(input.token, 'token', 512)
  const claim = first<Row>(await getDb(c.env).execute({
    sql: `SELECT * FROM provisioning_claims WHERE token_hash=? AND claimed_at IS NULL LIMIT 1`,
    args: [await sha256(token)],
  }))
  if (!claim) throw new PortalError(404, 'claim_not_found', 'Provisioning claim was not found or was already used.')
  if (Date.parse(String(claim.expires_at)) <= Date.now()) throw new PortalError(410, 'claim_expired', 'Provisioning claim expired. Request a new link from the Papyrus VM.')
  if (claim.environment !== session.environment) throw new PortalError(409, 'environment_mismatch', 'This deployment belongs to another provisioning environment.')

  const accessToken = await armToken(c, session)
  const resourceId = String(claim.azure_resource_id)
  await verifyVmWrite(session.environment, accessToken, resourceId)
  const vm = await armJson<Record<string, unknown>>(session.environment, accessToken, `${resourceId}?api-version=${VM_API_VERSION}`)
  if (String(vm.id ?? '').toLowerCase() !== resourceId.toLowerCase()) throw new PortalError(409, 'resource_mismatch', 'Azure returned a different VM resource.')

  const plan = vm.plan && typeof vm.plan === 'object' ? vm.plan as Record<string, unknown> : {}
  const checks: Array<[string, unknown, unknown]> = [
    ['publisher', claim.marketplace_publisher, plan.publisher],
    ['product', claim.marketplace_product, plan.product],
    ['plan', claim.marketplace_plan, plan.name],
  ]
  for (const [label, expected, observed] of checks) {
    if (expected && String(expected).toLowerCase() !== String(observed ?? '').toLowerCase()) {
      throw new PortalError(409, 'marketplace_plan_mismatch', `Azure Marketplace ${label} did not match the Papyrus appliance claim.`)
    }
  }

  const properties = vm.properties && typeof vm.properties === 'object' ? vm.properties as Record<string, unknown> : {}
  const hardware = properties.hardwareProfile && typeof properties.hardwareProfile === 'object'
    ? properties.hardwareProfile as Record<string, unknown>
    : {}
  const currentSize = nonEmpty(hardware.vmSize, 256)
  const sizes = await availableVmSizes(session.environment, accessToken, resourceId)
  const current = sizes.find((item) => item.name.toLowerCase() === currentSize?.toLowerCase())
  const deploymentId = id('mdp')
  const timestamp = now()
  const subscriptionId = parseSubscriptionId(resourceId)
  const location = nonEmpty(vm.location, 256)
  await getDb(c.env).batch([
    {
      sql: `INSERT INTO managed_deployments
            (id,organization_id,environment,deployment_kind,papyrus_deployment_id,azure_resource_id,azure_subscription_id,azure_region,azure_vm_size,vcpu_count,marketplace_publisher,marketplace_product,marketplace_plan,public_origin,status,last_seen_at,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(papyrus_deployment_id) DO UPDATE SET
              organization_id=excluded.organization_id,
              environment=excluded.environment,
              azure_resource_id=excluded.azure_resource_id,
              azure_subscription_id=excluded.azure_subscription_id,
              azure_region=excluded.azure_region,
              azure_vm_size=excluded.azure_vm_size,
              vcpu_count=excluded.vcpu_count,
              marketplace_publisher=excluded.marketplace_publisher,
              marketplace_product=excluded.marketplace_product,
              marketplace_plan=excluded.marketplace_plan,
              public_origin=excluded.public_origin,
              status='running',
              last_seen_at=excluded.last_seen_at,
              updated_at=excluded.updated_at`,
      args: [
        deploymentId, session.organization_id, session.environment, 'vm', claim.papyrus_deployment_id,
        resourceId, subscriptionId, location, currentSize, current?.vcpus ?? null,
        claim.marketplace_publisher ?? plan.publisher ?? null,
        claim.marketplace_product ?? plan.product ?? null,
        claim.marketplace_plan ?? plan.name ?? null,
        claim.public_origin ?? null, 'running', timestamp, timestamp, timestamp,
      ],
    },
    {
      sql: 'UPDATE provisioning_claims SET claimed_by_session_id=?,claimed_at=? WHERE id=?',
      args: [session.id, timestamp, claim.id],
    },
  ], 'write')
  const deployment = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM managed_deployments WHERE papyrus_deployment_id=? LIMIT 1',
    args: [claim.papyrus_deployment_id],
  }))
  await auditCustomer(c, session, 'provision.deployment.claim', 'managed_deployment', deployment?.id ? String(deployment.id) : null, { resourceId, vmSize: currentSize })
  return c.json({ deployment }, 201)
})

app.get('/api/provision/private/deployments', async (c) => {
  const session = c.get('portalSession')
  if (!session.organization_id) return c.json({ items: [] })
  const items = rows<Row>(await getDb(c.env).execute({
    sql: `SELECT md.*,
      (SELECT status FROM deployment_operations op WHERE op.deployment_id=md.id ORDER BY op.created_at DESC LIMIT 1) AS latest_operation_status,
      (SELECT operation_type FROM deployment_operations op WHERE op.deployment_id=md.id ORDER BY op.created_at DESC LIMIT 1) AS latest_operation_type
      FROM managed_deployments md WHERE organization_id=? ORDER BY updated_at DESC`,
    args: [session.organization_id],
  })).map((item) => ({
    ...item,
    vm_name: item.azure_resource_id ? vmName(String(item.azure_resource_id)) : item.papyrus_deployment_id,
    papyrus_hourly_usd: Number(item.vcpu_count ?? 0) * rate(c.env),
  }))
  return c.json({ items })
})

async function ownedDeployment(c: AppContext, deploymentId: string): Promise<Row> {
  const session = c.get('portalSession')
  if (!session.organization_id) throw new PortalError(404, 'deployment_not_found', 'Deployment not found.')
  const deployment = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM managed_deployments WHERE id=? AND organization_id=? LIMIT 1',
    args: [deploymentId, session.organization_id],
  }))
  if (!deployment) throw new PortalError(404, 'deployment_not_found', 'Deployment not found.')
  return deployment
}

app.get('/api/provision/private/deployments/:id/sizes', async (c) => {
  const session = c.get('portalSession')
  const deployment = await ownedDeployment(c, c.req.param('id'))
  if (!deployment.azure_resource_id) throw new PortalError(409, 'azure_resource_missing', 'Deployment is not linked to an Azure VM.')
  const token = await armToken(c, session)
  await verifyVmWrite(session.environment, token, String(deployment.azure_resource_id))
  const sizes = await availableVmSizes(session.environment, token, String(deployment.azure_resource_id))
  return c.json({
    current: deployment.azure_vm_size,
    ratePerVcpuHour: rate(c.env),
    items: sizes.map((size) => ({ ...size, papyrusHourlyUsd: size.vcpus * rate(c.env) })),
  })
})

async function waitForAzureOperation(response: Response, token: string, maxAttempts = 24): Promise<void> {
  if (response.status !== 202) {
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
      throw new Error(body?.error?.message ?? `Azure operation failed (${response.status}).`)
    }
    return
  }
  const pollUrl = response.headers.get('azure-asyncoperation') || response.headers.get('location')
  if (!pollUrl) return
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500))
    const poll = await fetch(pollUrl, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } })
    if (!poll.ok) throw new Error(`Azure operation status failed (${poll.status}).`)
    const body = await poll.json().catch(() => ({})) as Record<string, unknown>
    const properties = body.properties && typeof body.properties === 'object' ? body.properties as Record<string, unknown> : undefined
    const status = String(body.status ?? properties?.provisioningState ?? '').toLowerCase()
    if (['succeeded','success'].includes(status)) return
    if (['failed','canceled','cancelled'].includes(status)) throw new Error(`Azure operation ended with status ${status}.`)
  }
  throw new Error('Azure operation did not complete before the provisioning worker timeout.')
}

async function runResize(input: {
  env: Bindings
  db: Database
  deployment: Row
  operationId: string
  targetSize: string
  token: string
  target: PortalEnvironment
  targetVcpus: number
}) {
  const timestamp = now()
  await input.db.execute({ sql: `UPDATE deployment_operations SET status='running',started_at=? WHERE id=?`, args: [timestamp, input.operationId] })
  await input.db.execute({ sql: `UPDATE managed_deployments SET status='resizing',updated_at=? WHERE id=?`, args: [timestamp, input.deployment.id] })
  const resourceId = String(input.deployment.azure_resource_id)
  const origin = armOrigin(input.target)
  try {
    const deallocate = await fetch(`${origin}${resourceId}/deallocate?api-version=${VM_API_VERSION}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${input.token}`, accept: 'application/json' },
    })
    await waitForAzureOperation(deallocate, input.token)

    const resize = await fetch(`${origin}${resourceId}?api-version=${VM_API_VERSION}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${input.token}`, accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ properties: { hardwareProfile: { vmSize: input.targetSize } } }),
    })
    await waitForAzureOperation(resize, input.token)

    const start = await fetch(`${origin}${resourceId}/start?api-version=${VM_API_VERSION}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${input.token}`, accept: 'application/json' },
    })
    await waitForAzureOperation(start, input.token)

    const completed = now()
    await input.db.batch([
      {
        sql: `UPDATE managed_deployments SET azure_vm_size=?,vcpu_count=?,status='running',updated_at=? WHERE id=?`,
        args: [input.targetSize, input.targetVcpus, completed, input.deployment.id],
      },
      {
        sql: `UPDATE deployment_operations SET status='succeeded',completed_at=? WHERE id=?`,
        args: [completed, input.operationId],
      },
    ], 'write')
  } catch (cause) {
    const completed = now()
    const message = cause instanceof Error ? cause.message : String(cause)
    await input.db.batch([
      {
        sql: `UPDATE managed_deployments SET status='error',updated_at=? WHERE id=?`,
        args: [completed, input.deployment.id],
      },
      {
        sql: `UPDATE deployment_operations SET status='failed',error_message=?,completed_at=? WHERE id=?`,
        args: [message.slice(0, 2000), completed, input.operationId],
      },
    ], 'write')
  }
}

app.post('/api/provision/private/deployments/:id/resize', async (c) => {
  const session = c.get('portalSession')
  const deployment = await ownedDeployment(c, c.req.param('id'))
  if (!deployment.azure_resource_id) throw new PortalError(409, 'azure_resource_missing', 'Deployment is not linked to an Azure VM.')
  const input = await requestJson(c)
  const targetSize = requiredString(input.vmSize, 'vmSize', 256)
  const token = await armToken(c, session)
  await verifyVmWrite(session.environment, token, String(deployment.azure_resource_id))
  const sizes = await availableVmSizes(session.environment, token, String(deployment.azure_resource_id))
  const target = sizes.find((size) => size.name.toLowerCase() === targetSize.toLowerCase())
  if (!target) throw new PortalError(422, 'vm_size_unavailable', 'That VM size is not currently available for this Azure VM.')
  if (String(deployment.azure_vm_size ?? '').toLowerCase() === target.name.toLowerCase()) {
    throw new PortalError(409, 'vm_size_unchanged', 'Deployment is already using that VM size.')
  }

  const operationId = id('dop')
  await getDb(c.env).execute({
    sql: `INSERT INTO deployment_operations
          (id,deployment_id,operation_type,requested_by_oid,requested_value,previous_value,status,created_at)
          VALUES (?,?,?,?,?,?,?,?)`,
    args: [operationId, deployment.id, 'resize', session.oid, target.name, deployment.azure_vm_size ?? null, 'queued', now()],
  })
  await auditCustomer(c, session, 'provision.deployment.resize.request', 'managed_deployment', String(deployment.id), {
    from: deployment.azure_vm_size ?? null,
    to: target.name,
    vcpus: target.vcpus,
    estimatedPapyrusHourlyUsd: target.vcpus * rate(c.env),
  })

  c.executionCtx.waitUntil(runResize({
    env: c.env,
    db: getDb(c.env),
    deployment,
    operationId,
    targetSize: target.name,
    token,
    target: session.environment,
    targetVcpus: target.vcpus,
  }))
  return c.json({ operationId, status: 'queued' }, 202)
})

app.get('/api/provision/private/deployments/:id/operations', async (c) => {
  const deployment = await ownedDeployment(c, c.req.param('id'))
  const items = rows<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM deployment_operations WHERE deployment_id=? ORDER BY created_at DESC LIMIT 50',
    args: [deployment.id],
  }))
  return c.json({ items })
})

app.get('/api/provision/private/billing', async (c) => {
  const session = c.get('portalSession')
  if (!session.organization_id) return c.json({ items: [], totals: { estimatedCharge: 0, normalizedUsage: 0 } })
  const items = rows<Row>(await getDb(c.env).execute({
    sql: `SELECT usage_date,offer_name,sku,vm_size,cloud_instance_name,normalized_usage,raw_usage,estimated_charge,marketplace_subscription_id,last_seen_at
          FROM marketplace_vm_customers WHERE organization_id=? ORDER BY usage_date DESC,last_seen_at DESC LIMIT 250`,
    args: [session.organization_id],
  }))
  const totals = items.reduce<{ estimatedCharge: number; normalizedUsage: number }>((acc, row) => {
    acc.estimatedCharge += Number(row.estimated_charge ?? 0) || 0
    acc.normalizedUsage += Number(row.normalized_usage ?? 0) || 0
    return acc
  }, { estimatedCharge: 0, normalizedUsage: 0 })
  return c.json({
    items,
    totals,
    note: 'Marketplace usage is mirrored from Microsoft Partner Center. Microsoft remains the billing and invoice system of record.',
  })
})

app.get('/api/provision/private/offline-licenses', async (c) => {
  const session = c.get('portalSession')
  if (!session.organization_id) return c.json({ items: [] })
  const items = rows<Row>(await getDb(c.env).execute({
    sql: `SELECT oli.id,oli.license_id,'organization' AS scope,oli.status,oli.key_id,oli.payload_sha256,oli.issued_at,oli.expires_at,e.status AS entitlement_status,p.sku,p.name
          FROM organization_license_issuances oli
          JOIN entitlements e ON e.id=oli.entitlement_id
          JOIN products p ON p.id=e.product_id
          WHERE oli.organization_id=?
          UNION ALL
          SELECT li.id,li.license_id,'deployment' AS scope,li.status,li.key_id,li.payload_sha256,li.issued_at,li.expires_at,e.status AS entitlement_status,p.sku,p.name
          FROM license_issuances li
          JOIN deployments d ON d.id=li.deployment_id
          JOIN entitlements e ON e.id=li.entitlement_id
          JOIN products p ON p.id=e.product_id
          WHERE d.customer_organization_id=?
          ORDER BY issued_at DESC`,
    args: [session.organization_id, session.organization_id],
  }))
  return c.json({ items })
})

app.get('/api/provision/private/offline-licenses/:id/download', async (c) => {
  const session = c.get('portalSession')
  if (!session.organization_id) throw new PortalError(404, 'license_not_found', 'License not found.')
  const licenseId = c.req.param('id')
  let record = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT signed_document_json,license_id FROM organization_license_issuances WHERE id=? AND organization_id=? LIMIT 1',
    args: [licenseId, session.organization_id],
  }))
  if (!record) {
    record = first<Row>(await getDb(c.env).execute({
      sql: `SELECT li.signed_document_json,li.license_id FROM license_issuances li
            JOIN deployments d ON d.id=li.deployment_id
            WHERE li.id=? AND d.customer_organization_id=? LIMIT 1`,
      args: [licenseId, session.organization_id],
    }))
  }
  if (!record) throw new PortalError(404, 'license_not_found', 'License not found.')
  c.header('Content-Type', 'application/json; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="${String(record.license_id)}.papyrus-license.json"`)
  return c.body(String(record.signed_document_json))
})

app.get('/api/provision/private/organization', async (c) => {
  const session = c.get('portalSession')
  const organization = await organizationForSession(c, session)
  if (!organization) return c.json({ organization: null, tenants: [], accountManager: null, branding: null })
  const tenants = rows<Row>(await getDb(c.env).execute({
    sql: 'SELECT tenant_id,environment,verified_at FROM organization_tenants WHERE organization_id=? ORDER BY environment,verified_at',
    args: [organization.id],
  }))
  const manager = first<Row>(await getDb(c.env).execute({ sql: primaryManagerSql(), args: [organization.id] }))
  const profile = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM provision_tenant_profiles WHERE tenant_id=? AND environment=? LIMIT 1',
    args: [session.tenant_id, session.environment],
  }))
  return c.json({
    organization,
    tenants,
    accountManager: manager,
    branding: profile ? {
      source: profile.logo_source ?? 'none',
      domain: profile.primary_domain ?? organization.domain ?? null,
      displayName: profile.display_name ?? null,
      logoUrl: (profile.entra_logo_url || profile.primary_domain)
        ? `${c.env.BASE_URL}/api/provision/private/organization/logo`
        : null,
    } : null,
  })
})

app.get('/api/provision/private/organization/logo', async (c) => {
  const session = c.get('portalSession')
  const profile = first<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM provision_tenant_profiles WHERE tenant_id=? AND environment=? LIMIT 1',
    args: [session.tenant_id, session.environment],
  }))
  if (!profile) throw new PortalError(404, 'organization_logo_not_found', 'Organization logo is not available.')

  let source: string | null = nonEmpty(profile.entra_logo_url, 4096)
  if (!source && profile.primary_domain && c.env.LOGO_DEV_TOKEN) {
    source = `https://img.logo.dev/${encodeURIComponent(String(profile.primary_domain))}?token=${encodeURIComponent(c.env.LOGO_DEV_TOKEN)}&size=256&format=png&theme=light&retina=true`
  }
  if (!source) throw new PortalError(404, 'organization_logo_not_found', 'Organization logo is not available.')

  const response = await fetch(source, { headers: { accept: 'image/png,image/jpeg,image/*;q=0.8' } })
  if (!response.ok || !response.body) throw new PortalError(404, 'organization_logo_not_found', 'Organization logo could not be loaded.')
  const headers = new Headers()
  headers.set('Content-Type', response.headers.get('content-type') || 'image/png')
  headers.set('Cache-Control', 'private, max-age=3600')
  return new Response(response.body, { status: 200, headers })
})

app.onError((cause, c) => {
  if (cause instanceof PortalError) return c.json({ error: cause.code, message: cause.message }, cause.status)
  console.error('provisioning-control-plane error', cause)
  return c.json({ error: 'internal_error', message: 'Provisioning control plane encountered an unexpected error.' }, 500)
})

app.notFound((c) => c.json({ error: 'not_found', message: 'Provisioning route not found.' }, 404))

export default app
