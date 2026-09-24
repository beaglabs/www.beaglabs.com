import { first, getDb, parseJsonArray } from './db'
import { isDeploymentProfile, type Bindings } from './env'
import licenseApp from './index'
import { payloadSha256, type LicensePayload } from './license'
import { signLicenseWithAzureKeyVault } from './azure-key-vault-signer'

type Row = Record<string, unknown>
type ExecutionLike = any

type AdminIdentity = { oid: string }
type BrandingPayload = { branding: { entraAppLogoUrl: string } }

function requestId(request: Request): string {
  return request.headers.get('cf-ray') ?? request.headers.get('x-request-id') ?? crypto.randomUUID()
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function now(): string {
  return new Date().toISOString()
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: code, message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function parseLogoUrl(body: unknown): string | null | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.prototype.hasOwnProperty.call(body, 'entraAppLogoUrl')) return undefined
  const raw = (body as Record<string, unknown>).entraAppLogoUrl
  if (raw === null || raw === '') return null
  if (typeof raw !== 'string') throw new TypeError('entraAppLogoUrl must be an HTTPS URL or null.')
  const value = raw.trim()
  if (!value || value.length > 2048) throw new TypeError('entraAppLogoUrl must be an HTTPS URL no longer than 2048 characters.')
  let parsed: URL
  try { parsed = new URL(value) } catch { throw new TypeError('entraAppLogoUrl must be a valid HTTPS URL.') }
  if (parsed.protocol !== 'https:') throw new TypeError('entraAppLogoUrl must use HTTPS.')
  return parsed.toString()
}

async function adminIdentity(request: Request, env: Bindings, ctx: ExecutionLike): Promise<{ admin?: AdminIdentity; response?: Response }> {
  const url = new URL('/api/v1/me', request.url)
  const probe = new Request(url, { method: 'GET', headers: request.headers })
  const response = await licenseApp.fetch(probe, env, ctx)
  if (!response.ok) return { response }
  const body = await response.json().catch(() => null) as { admin?: AdminIdentity } | null
  if (!body?.admin?.oid) return { response: jsonError(401, 'unauthorized', 'Microsoft administrator sign-in required.') }
  return { admin: body.admin }
}

async function setBranding(env: Bindings, deploymentId: string, logoUrl: string | null, adminOid: string, request: Request): Promise<Response> {
  const db = getDb(env)
  const deployment = first<Row>(await db.execute({ sql: 'SELECT id,customer_organization_id FROM deployments WHERE id=?', args: [deploymentId] }))
  if (!deployment) return jsonError(404, 'deployment_not_found', 'Deployment not found.')

  const before = first<Row>(await db.execute({ sql: 'SELECT * FROM deployment_branding WHERE deployment_id=?', args: [deploymentId] }))
  const timestamp = new Date().toISOString()
  if (logoUrl === null) {
    await db.batch([
      { sql: 'DELETE FROM deployment_branding WHERE deployment_id=?', args: [deploymentId] },
      {
        sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          `aud_${crypto.randomUUID()}`, 'admin', adminOid, 'deployment.branding.clear', 'deployment', deploymentId,
          deployment.customer_organization_id, null, requestId(request), request.headers.get('cf-connecting-ip'), request.headers.get('user-agent'),
          before ? JSON.stringify(before) : null, JSON.stringify({ entraAppLogoUrl: null }), timestamp,
        ],
      },
    ], 'write')
    return Response.json({ deploymentId, entraAppLogoUrl: null }, { headers: { 'Cache-Control': 'no-store' } })
  }

  await db.batch([
    {
      sql: `INSERT INTO deployment_branding (deployment_id,entra_app_logo_url,updated_by_oid,created_at,updated_at)
            VALUES (?,?,?,?,?)
            ON CONFLICT(deployment_id) DO UPDATE SET entra_app_logo_url=excluded.entra_app_logo_url,updated_by_oid=excluded.updated_by_oid,updated_at=excluded.updated_at`,
      args: [deploymentId, logoUrl, adminOid, before?.created_at ?? timestamp, timestamp],
    },
    {
      sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        `aud_${crypto.randomUUID()}`, 'admin', adminOid, 'deployment.branding.set', 'deployment', deploymentId,
        deployment.customer_organization_id, null, requestId(request), request.headers.get('cf-connecting-ip'), request.headers.get('user-agent'),
        before ? JSON.stringify(before) : null, JSON.stringify({ entraAppLogoUrl: logoUrl }), timestamp,
      ],
    },
  ], 'write')
  return Response.json({ deploymentId, entraAppLogoUrl: logoUrl }, { headers: { 'Cache-Control': 'no-store' } })
}

async function registerDeployment(request: Request, env: Bindings, ctx: ExecutionLike): Promise<Response> {
  const forward = request.clone()
  let body: unknown
  try { body = await request.json() } catch { return licenseApp.fetch(forward, env, ctx) }

  let logoUrl: string | null | undefined
  try { logoUrl = parseLogoUrl(body) } catch (error) {
    const auth = await adminIdentity(request, env, ctx)
    if (auth.response) return auth.response
    return jsonError(422, 'validation_error', error instanceof Error ? error.message : 'Invalid Entra App Registration logo URL.')
  }
  if (logoUrl === undefined) return licenseApp.fetch(forward, env, ctx)

  const auth = await adminIdentity(request, env, ctx)
  if (auth.response || !auth.admin) return auth.response ?? jsonError(401, 'unauthorized', 'Microsoft administrator sign-in required.')

  const response = await licenseApp.fetch(forward, env, ctx)
  if (!response.ok) return response
  const created = await response.clone().json().catch(() => null) as { id?: unknown } | null
  if (!created || typeof created.id !== 'string') return response
  const brandingResponse = await setBranding(env, created.id, logoUrl, auth.admin.oid, request)
  if (!brandingResponse.ok) return brandingResponse
  return response
}

async function updateBranding(request: Request, env: Bindings, ctx: ExecutionLike, deploymentId: string): Promise<Response> {
  const auth = await adminIdentity(request, env, ctx)
  if (auth.response || !auth.admin) return auth.response ?? jsonError(401, 'unauthorized', 'Microsoft administrator sign-in required.')
  let body: unknown
  try { body = await request.json() } catch { return jsonError(400, 'invalid_json', 'Request body must be valid JSON.') }
  let logoUrl: string | null | undefined
  try { logoUrl = parseLogoUrl(body) } catch (error) {
    return jsonError(422, 'validation_error', error instanceof Error ? error.message : 'Invalid Entra App Registration logo URL.')
  }
  if (logoUrl === undefined) return jsonError(422, 'validation_error', 'entraAppLogoUrl is required and may be an HTTPS URL or null.')
  return setBranding(env, deploymentId, logoUrl, auth.admin.oid, request)
}

async function issueLicense(request: Request, env: Bindings, ctx: ExecutionLike, deploymentId: string): Promise<Response> {
  const auth = await adminIdentity(request, env, ctx)
  if (auth.response || !auth.admin) return auth.response ?? jsonError(401, 'unauthorized', 'Microsoft administrator sign-in required.')

  const db = getDb(env)
  const source = first<Row>(await db.execute({
    sql: `SELECT d.id AS deployment_record_id,d.papyrus_deployment_id,d.deployment_profile,d.status AS deployment_status,
                 e.id AS entitlement_id,e.status AS entitlement_status,e.valid_from,e.valid_until,e.feature_set_json,e.allowed_profiles_json,
                 o.id AS organization_id,o.legal_name,o.display_name,b.entra_app_logo_url
          FROM deployments d
          JOIN entitlements e ON e.id=d.entitlement_id
          JOIN organizations o ON o.id=d.customer_organization_id
          LEFT JOIN deployment_branding b ON b.deployment_id=d.id
          WHERE d.id=?`,
    args: [deploymentId],
  }))
  if (!source) return jsonError(404, 'deployment_not_found', 'Deployment not found.')
  if (!['registered', 'licensed'].includes(String(source.deployment_status))) return jsonError(409, 'deployment_inactive', 'Deployment is suspended or retired.')
  if (source.entitlement_status !== 'active') return jsonError(409, 'entitlement_inactive', 'Entitlement must be active before a license can be issued.')

  const validFrom = Date.parse(String(source.valid_from))
  const validUntil = source.valid_until ? Date.parse(String(source.valid_until)) : null
  const currentTime = Date.now()
  if (Number.isFinite(validFrom) && validFrom > currentTime) return jsonError(409, 'entitlement_not_started', 'Entitlement validity has not started.')
  if (validUntil !== null && Number.isFinite(validUntil) && validUntil <= currentTime) return jsonError(409, 'entitlement_expired', 'Entitlement has expired.')
  if (!isDeploymentProfile(source.deployment_profile)) return jsonError(422, 'invalid_profile', 'Deployment profile is invalid.')
  const allowedProfiles = parseJsonArray(source.allowed_profiles_json)
  if (!allowedProfiles.includes(source.deployment_profile)) return jsonError(409, 'profile_not_entitled', 'Deployment profile is no longer allowed by the entitlement.')

  const issuedAt = now()
  const licenseId = id('lic')
  const logoUrl = typeof source.entra_app_logo_url === 'string' ? source.entra_app_logo_url.trim() : ''
  const payload = {
    licenseId,
    licensee: String(source.display_name || source.legal_name),
    deploymentId: String(source.papyrus_deployment_id),
    profiles: [source.deployment_profile],
    features: parseJsonArray(source.feature_set_json),
    issuedAt,
    expiresAt: source.valid_until ? new Date(String(source.valid_until)).toISOString() : null,
    ...(logoUrl ? { branding: { entraAppLogoUrl: logoUrl } } : {}),
  } as LicensePayload & Partial<BrandingPayload>

  let signed
  try {
    signed = await signLicenseWithAzureKeyVault(env, payload)
  } catch (error) {
    console.error('Azure Key Vault license signing failed', error)
    return jsonError(503, 'license_signer_unavailable', 'Azure Key Vault could not sign the license. No license was issued.')
  }

  const issuanceId = id('lsi')
  await db.batch([
    { sql: `UPDATE license_issuances SET status='superseded' WHERE deployment_id=? AND status='issued'`, args: [deploymentId] },
    {
      sql: `INSERT INTO license_issuances (id,license_id,deployment_id,entitlement_id,key_id,payload_json,signed_document_json,payload_sha256,status,issued_by_oid,issued_at,expires_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [issuanceId, licenseId, deploymentId, source.entitlement_id, signed.keyId, JSON.stringify(payload), JSON.stringify(signed), payloadSha256(payload), 'issued', auth.admin.oid, issuedAt, payload.expiresAt],
    },
    { sql: `UPDATE deployments SET status='licensed',updated_at=? WHERE id=?`, args: [issuedAt, deploymentId] },
    {
      sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id('aud'), 'admin', auth.admin.oid, 'license.issue', 'license', issuanceId, source.organization_id, null,
        requestId(request), request.headers.get('cf-connecting-ip'), request.headers.get('user-agent'), null,
        JSON.stringify({
          licenseId,
          deploymentId: payload.deploymentId,
          profile: source.deployment_profile,
          features: payload.features,
          expiresAt: payload.expiresAt,
          keyId: signed.keyId,
          signer: 'azure-key-vault',
          ...(logoUrl ? { branding: payload.branding } : {}),
        }),
        issuedAt,
      ],
    },
  ], 'write')

  return Response.json({ issuanceId, document: signed }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionLike): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    if (path === '/api/v1/deployments' && request.method === 'POST') return registerDeployment(request, env, ctx)

    const brandingMatch = path.match(/^\/api\/v1\/deployments\/([^/]+)\/branding\/?$/)
    if (brandingMatch && ['PUT', 'PATCH'].includes(request.method)) {
      return updateBranding(request, env, ctx, decodeURIComponent(brandingMatch[1] as string))
    }

    const licenseMatch = path.match(/^\/api\/v1\/deployments\/([^/]+)\/licenses\/?$/)
    if (licenseMatch && request.method === 'POST') {
      return issueLicense(request, env, ctx, decodeURIComponent(licenseMatch[1] as string))
    }

    return licenseApp.fetch(request, env, ctx)
  },
}
