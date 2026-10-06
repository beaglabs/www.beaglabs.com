import { Hono } from 'hono'
import { z } from 'zod'
import { buildAuth } from './auth'
import { first, getDb, parseJsonArray, rows, type Database, type LooseStatement } from './db'
import { adminOids, isDeploymentProfile, type Bindings } from './env'
import { signLicenseWithAzureKeyVault } from './azure-key-vault-signer'
import { payloadSha256, type LicensePayload, type OrganizationLicensePayload, type SignedLicense } from './license'

type Row = Record<string, unknown>
type Actor = { oid: string }
type Dependencies = {
  database: (env: Bindings) => Database
  admin: (request: Request, env: Bindings) => Promise<Actor | null>
  sign: (env: Bindings, payload: LicensePayload) => Promise<SignedLicense>
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const hostname = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/
const scopeSchema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('deployment') }).strict(),
  z.object({
    scope: z.literal('organization'),
    allowedTenantIds: z.array(z.string().trim().regex(uuid).transform(value => value.toLowerCase())).min(1).max(64),
    allowedDomains: z.array(z.string().trim().toLowerCase().regex(hostname)).min(1).max(64).optional(),
  }).strict(),
])
const sourceSql = `SELECT e.*, o.id AS organization_id,o.status AS organization_status,o.legal_name,o.display_name,
  ord.status AS order_status,ord.customer_organization_id AS order_customer_id,
  s.scope,s.allowed_tenant_ids_json,s.allowed_domains_json,s.version AS scope_version
  FROM entitlements e JOIN organizations o ON o.id=e.customer_organization_id
  JOIN order_items oi ON oi.id=e.order_item_id JOIN orders ord ON ord.id=oi.order_id
  LEFT JOIN entitlement_license_scopes s ON s.entitlement_id=e.id AND s.organization_id=e.customer_organization_id
  WHERE e.id=?`
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

async function approvedAdmin(request: Request, env: Bindings): Promise<Actor | null> {
  const session = await buildAuth(env).api.getSession({ headers: request.headers })
  if (!session) return null
  const user = session.user as typeof session.user & { entraOid?: string; entraTenantId?: string }
  const oid = user.entraOid?.toLowerCase() ?? ''
  if (!oid || user.entraTenantId?.toLowerCase() !== env.MICROSOFT_TENANT_ID.toLowerCase() || !adminOids(env).has(oid)) return null
  return { oid }
}

function termError(source: Row): string | undefined {
  if (source.status !== 'active' || source.organization_status !== 'active') return 'The entitlement and customer organization must be active.'
  if (!['booked', 'fulfilled'].includes(String(source.order_status)) || source.order_customer_id !== source.customer_organization_id) return 'A booked order belonging to this customer is required.'
  const from = Date.parse(String(source.valid_from))
  const until = source.valid_until ? Date.parse(String(source.valid_until)) : NaN
  if (!Number.isFinite(from) || !Number.isFinite(until) || from > Date.now() || until <= Date.now() || until <= from) return 'Organization licensing requires a started, finite, unexpired entitlement term.'
}

function scopeView(source: Row) {
  return {
    scope: source.scope === 'organization' ? 'organization' : 'deployment',
    organizationId: source.customer_organization_id,
    organizationName: source.display_name || source.legal_name,
    entitlementId: source.id,
    expiresAt: source.valid_until,
    ...(source.scope === 'organization' ? {
      allowedTenantIds: parseJsonArray(source.allowed_tenant_ids_json),
      ...(source.allowed_domains_json !== null ? { allowedDomains: parseJsonArray(source.allowed_domains_json) } : {}),
      version: source.scope_version,
    } : {}),
  }
}

function audit(request: Request, actor: Actor, source: Row, action: string, resourceId: string, before: unknown, after: unknown, timestamp: string): LooseStatement {
  return { sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [id('aud'), 'admin', actor.oid, action, 'organization_license', resourceId, source.customer_organization_id, null,
    request.headers.get('cf-ray') ?? crypto.randomUUID(), request.headers.get('cf-connecting-ip'), request.headers.get('user-agent'),
    before == null ? null : JSON.stringify(before), JSON.stringify(after), timestamp] }
}

export function createOrganizationLicensingApp(dependencies: Dependencies) {
  const app = new Hono<{ Bindings: Bindings; Variables: { actor: Actor } }>()
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store')
    const actor = await dependencies.admin(c.req.raw, c.env)
    if (!actor) return c.json({ error: 'unauthorized', message: 'Beag Microsoft administrator sign-in required.' }, 401)
    c.set('actor', actor)
    await next()
  })
  app.get('/api/v1/entitlements/:id/license-scope', async c => {
    const source = first<Row>(await dependencies.database(c.env).execute({ sql: sourceSql, args: [c.req.param('id')] }))
    return source ? c.json(scopeView(source)) : c.json({ error: 'not_found' }, 404)
  })
  app.put('/api/v1/entitlements/:id/license-scope', async c => {
    const input = scopeSchema.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'validation_error', message: 'Choose an explicit scope, tenant UUIDs, and optional exact hostnames. Wildcards and URLs are not permitted.' }, 422)
    const db = dependencies.database(c.env)
    const source = first<Row>(await db.execute({ sql: sourceSql, args: [c.req.param('id')] }))
    if (!source) return c.json({ error: 'not_found' }, 404)
    const error = termError(source)
    if (error) return c.json({ error: 'invalid_entitlement', message: error }, 409)
    const timestamp = new Date().toISOString()
    const value = input.data
    const statement: LooseStatement = value.scope === 'deployment'
      ? { sql: 'DELETE FROM entitlement_license_scopes WHERE entitlement_id=?', args: [source.id] }
      : { sql: `INSERT INTO entitlement_license_scopes (entitlement_id,organization_id,scope,allowed_tenant_ids_json,allowed_domains_json,version,approved_by_oid,created_at,updated_at)
          VALUES (?,?,'organization',?,?,?,?,?,?) ON CONFLICT(entitlement_id) DO UPDATE SET organization_id=excluded.organization_id,
          allowed_tenant_ids_json=excluded.allowed_tenant_ids_json,allowed_domains_json=excluded.allowed_domains_json,version=excluded.version,
          approved_by_oid=excluded.approved_by_oid,updated_at=excluded.updated_at`, args: [source.id, source.customer_organization_id, JSON.stringify([...new Set(value.allowedTenantIds)]), value.allowedDomains ? JSON.stringify([...new Set(value.allowedDomains)]) : null, crypto.randomUUID(), c.get('actor').oid, timestamp, timestamp] }
    await db.batch([statement, audit(c.req.raw, c.get('actor'), source, 'license.scope_changed', String(source.id), scopeView(source), value, timestamp)], 'write')
    return c.json({ saved: true, reissueRequired: true })
  })
  app.get('/api/v1/entitlements/:id/licenses', async c => {
    const db = dependencies.database(c.env)
    const source = first<Row>(await db.execute({ sql: sourceSql, args: [c.req.param('id')] }))
    if (!source) return c.json({ error: 'not_found' }, 404)
    return c.json({ items: rows<Row>(await db.execute({ sql: 'SELECT * FROM organization_license_issuances WHERE entitlement_id=? ORDER BY issued_at DESC', args: [source.id] })) })
  })
  app.post('/api/v1/entitlements/:id/licenses', async c => {
    const input = z.object({}).strict().safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'validation_error', message: 'Issuance takes no claim overrides; save scope first.' }, 422)
    const db = dependencies.database(c.env)
    const source = first<Row>(await db.execute({ sql: sourceSql, args: [c.req.param('id')] }))
    if (!source) return c.json({ error: 'not_found' }, 404)
    const error = termError(source)
    if (error) return c.json({ error: 'invalid_entitlement', message: error }, 409)
    if (source.scope !== 'organization') return c.json({ error: 'scope_not_approved', message: 'Save an explicit organization scope before issuing.' }, 409)
    const restriction = scopeSchema.safeParse({ scope: 'organization', allowedTenantIds: parseJsonArray(source.allowed_tenant_ids_json), ...(source.allowed_domains_json === null ? {} : { allowedDomains: parseJsonArray(source.allowed_domains_json) }) })
    if (!restriction.success || restriction.data.scope !== 'organization') return c.json({ error: 'invalid_scope' }, 409)
    const profiles = parseJsonArray(source.allowed_profiles_json)
    if (!profiles.length || !profiles.every(isDeploymentProfile)) return c.json({ error: 'invalid_profiles' }, 409)
    const issuedAt = new Date().toISOString()
    const payload: OrganizationLicensePayload = {
      ...restriction.data, organizationId: String(source.customer_organization_id), entitlementId: String(source.id),
      licenseId: id('lic'), licensee: String(source.display_name || source.legal_name),
      profiles: profiles.filter(isDeploymentProfile), features: parseJsonArray(source.feature_set_json), issuedAt,
      expiresAt: new Date(String(source.valid_until)).toISOString(),
    }
    let document: SignedLicense
    try { document = await dependencies.sign(c.env, payload) }
    catch { return c.json({ error: 'license_signer_unavailable', message: 'Azure Key Vault could not sign. No license was issued.' }, 503) }
    const issuanceId = id('oli')
    // A NOT NULL constraint rolls the batch back if scope/entitlement ownership or
    // policy changed while Key Vault was signing. Never return an uncommitted license.
    try {
      await db.batch([
        { sql: `INSERT INTO organization_license_issuances (id,license_id,entitlement_id,organization_id,scope_version,key_id,payload_json,signed_document_json,payload_sha256,status,issued_by_oid,issued_at,expires_at)
          VALUES (?,?,?,(SELECT e.customer_organization_id FROM entitlements e JOIN entitlement_license_scopes s ON s.entitlement_id=e.id AND s.organization_id=e.customer_organization_id
          JOIN organizations o ON o.id=e.customer_organization_id JOIN order_items oi ON oi.id=e.order_item_id JOIN orders ord ON ord.id=oi.order_id
          WHERE e.id=? AND e.customer_organization_id=? AND e.status='active' AND o.status='active' AND ord.status IN ('booked','fulfilled') AND ord.customer_organization_id=e.customer_organization_id
          AND s.version=? AND e.valid_from=? AND e.valid_until=? AND e.feature_set_json=? AND e.allowed_profiles_json=? AND julianday(e.valid_until)>julianday('now') AND julianday(e.valid_from)<=julianday('now')),
          ?,?,?,?,?, 'issued',?,?,?)`, args: [issuanceId, payload.licenseId, source.id, source.id, source.customer_organization_id, source.scope_version, source.valid_from, source.valid_until, source.feature_set_json, source.allowed_profiles_json,
          source.scope_version, document.keyId, JSON.stringify(payload), JSON.stringify(document), payloadSha256(payload), c.get('actor').oid, issuedAt, payload.expiresAt] },
        { sql: "UPDATE organization_license_issuances SET status='superseded' WHERE entitlement_id=? AND id<>? AND status='issued'", args: [source.id, issuanceId] },
        audit(c.req.raw, c.get('actor'), source, 'license.organization_issued', issuanceId, null, { ...payload, keyId: document.keyId }, issuedAt),
      ], 'write')
    } catch { return c.json({ error: 'issuance_not_committed', message: 'Issuance could not be committed. Refresh the entitlement and retry.' }, 409) }
    return c.json({ issuanceId, document }, 201)
  })
  return app
}

export default createOrganizationLicensingApp({ database: getDb, admin: approvedAdmin, sign: signLicenseWithAzureKeyVault })
