import { first, getDb } from './db'
import type { Bindings } from './env'
import licenseApp from './index'
import { payloadSha256, signLicense, type LicensePayload } from './license'

type Row = Record<string, unknown>
type ExecutionLike = any

type AdminIdentity = { oid: string }
type BrandingPayload = { branding: { entraAppLogoUrl: string } }

function requestId(request: Request): string {
  return request.headers.get('cf-ray') ?? request.headers.get('x-request-id') ?? crypto.randomUUID()
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
  const response = await licenseApp.fetch(request, env, ctx)
  if (response.status !== 201) return response

  const db = getDb(env)
  const branding = first<Row>(await db.execute({ sql: 'SELECT entra_app_logo_url FROM deployment_branding WHERE deployment_id=?', args: [deploymentId] }))
  const logoUrl = typeof branding?.entra_app_logo_url === 'string' ? branding.entra_app_logo_url.trim() : ''
  if (!logoUrl) return response

  const result = await response.clone().json().catch(() => null) as { issuanceId?: unknown; document?: Record<string, unknown> } | null
  if (!result || typeof result.issuanceId !== 'string' || !result.document) return response
  const { signature: _signature, keyId: _keyId, ...basePayload } = result.document
  const payload = {
    ...basePayload,
    branding: { entraAppLogoUrl: logoUrl },
  } as LicensePayload & BrandingPayload
  const signed = signLicense(payload, env.PAPYRUS_LICENSE_KEY_ID, env.PAPYRUS_LICENSE_PRIVATE_KEY_PEM) as ReturnType<typeof signLicense> & BrandingPayload
  const issuance = first<Row>(await db.execute({ sql: `SELECT li.issued_by_oid,d.customer_organization_id FROM license_issuances li JOIN deployments d ON d.id=li.deployment_id WHERE li.id=?`, args: [result.issuanceId] }))
  const timestamp = new Date().toISOString()
  await db.batch([
    {
      sql: 'UPDATE license_issuances SET payload_json=?,signed_document_json=?,payload_sha256=? WHERE id=?',
      args: [JSON.stringify(payload), JSON.stringify(signed), payloadSha256(payload), result.issuanceId],
    },
    {
      sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        `aud_${crypto.randomUUID()}`, 'admin', String(issuance?.issued_by_oid ?? 'unknown'), 'license.branding.sign', 'license', result.issuanceId,
        issuance?.customer_organization_id ?? null, null, requestId(request), request.headers.get('cf-connecting-ip'), request.headers.get('user-agent'),
        null, JSON.stringify({ branding: payload.branding }), timestamp,
      ],
    },
  ], 'write')

  const headers = new Headers(response.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify({ ...result, document: signed }), { status: 201, headers })
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
