import { Hono, type Context } from 'hono'
import { buildAuth } from './auth'
import { signLicenseWithAzureKeyVault } from './azure-key-vault-signer'
import { first, getDb, parseJsonArray, rows } from './db'
import { adminOids, isDeploymentProfile, type Bindings } from './env'
import { payloadSha256, type OrganizationLicensePayload } from './license'

type Row = Record<string, unknown>

type Admin = {
  oid: string
  tenantId: string
  email?: string
  name?: string
}

type AppEnv = {
  Bindings: Bindings
  Variables: { admin: Admin }
}

type AppContext = Context<AppEnv>

const app = new Hono<AppEnv>()

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function now(): string {
  return new Date().toISOString()
}

function isGovernmentDomain(value: unknown): boolean {
  const domain = String(value ?? '').trim().toLowerCase()
  return Boolean(domain && (domain.endsWith('.gov') || domain.endsWith('.mil')))
}

async function getAdmin(c: AppContext): Promise<Admin | null> {
  const session = await buildAuth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!session) return null
  const user = session.user as typeof session.user & { entraOid?: string; entraTenantId?: string }
  const oid = user.entraOid?.toLowerCase() ?? ''
  const tenantId = user.entraTenantId?.toLowerCase() ?? ''
  if (!oid || !tenantId) return null
  if (tenantId !== c.env.MICROSOFT_TENANT_ID.toLowerCase() || !adminOids(c.env).has(oid)) return null
  return { oid, tenantId, email: user.email ?? undefined, name: user.name ?? undefined }
}

app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store')
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  c.set('admin', admin)
  await next()
})

function auditStatement(c: AppContext, action: string, resourceType: string, resourceId: string | null, organizationId: string | null, after: unknown) {
  const admin = c.get('admin')
  return {
    sql: `INSERT INTO audit_events
      (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('aud'), 'admin', admin.oid, action, resourceType, resourceId, organizationId, null,
      c.req.header('cf-ray') ?? c.req.header('x-request-id') ?? crypto.randomUUID(),
      c.req.header('cf-connecting-ip') ?? null,
      c.req.header('user-agent') ?? null,
      null,
      JSON.stringify(after),
      now(),
    ],
  }
}

app.get('/api/v1/provisioned-accounts', async (c) => {
  const result = await getDb(c.env).execute(`
    WITH ranked AS (
      SELECT ps.*,
        ROW_NUMBER() OVER (
          PARTITION BY ps.organization_id,ps.oid,ps.environment
          ORDER BY ps.last_seen_at DESC,ps.created_at DESC
        ) AS rn
      FROM provision_portal_sessions ps
      WHERE ps.organization_id IS NOT NULL
    )
    SELECT
      ps.organization_id,
      ps.oid,
      ps.email,
      ps.display_name,
      ps.environment,
      ps.tenant_id,
      ps.created_at AS first_session_at,
      ps.last_seen_at,
      o.legal_name,
      o.display_name AS organization_display_name,
      o.domain,
      o.organization_type,
      o.status AS organization_status,
      tp.logo_source,
      tp.primary_domain,
      am.display_name AS account_manager_name,
      am.email AS account_manager_email,
      (SELECT COUNT(*) FROM managed_deployments md WHERE md.organization_id=o.id AND md.status!='retired') AS deployment_count,
      (SELECT COUNT(*) FROM agreement_acceptances aa WHERE aa.organization_id=o.id AND aa.environment=ps.environment) AS agreement_count,
      (SELECT oli.id FROM organization_license_issuances oli WHERE oli.organization_id=o.id AND oli.status='issued' ORDER BY oli.issued_at DESC LIMIT 1) AS active_license_issuance_id,
      (SELECT oli.license_id FROM organization_license_issuances oli WHERE oli.organization_id=o.id AND oli.status='issued' ORDER BY oli.issued_at DESC LIMIT 1) AS active_license_id,
      (SELECT oli.expires_at FROM organization_license_issuances oli WHERE oli.organization_id=o.id AND oli.status='issued' ORDER BY oli.issued_at DESC LIMIT 1) AS active_license_expires_at
    FROM ranked ps
    JOIN organizations o ON o.id=ps.organization_id
    LEFT JOIN provision_tenant_profiles tp ON tp.tenant_id=ps.tenant_id AND tp.environment=ps.environment
    LEFT JOIN organization_account_managers oam ON oam.organization_id=o.id AND oam.role='primary'
    LEFT JOIN account_managers am ON am.id=oam.account_manager_id
    WHERE ps.rn=1
    ORDER BY ps.last_seen_at DESC
  `)
  const items = rows<Row>(result).map((row) => ({
    ...row,
    logo_url: row.logo_source !== 'none'
      ? `${c.env.BASE_URL}/api/v1/provisioned-accounts/${encodeURIComponent(String(row.organization_id))}/logo?environment=${encodeURIComponent(String(row.environment))}`
      : null,
  }))
  return c.json({ items })
})

app.get('/api/v1/provisioned-accounts/:organizationId/logo', async (c) => {
  const organizationId = c.req.param('organizationId')
  const environment = c.req.query('environment') === 'government' ? 'government' : 'commercial'
  const profile = first<Row>(await getDb(c.env).execute({
    sql: `SELECT tp.* FROM provision_tenant_profiles tp
      JOIN organization_tenants ot ON ot.tenant_id=tp.tenant_id AND ot.environment=tp.environment
      WHERE ot.organization_id=? AND tp.environment=? LIMIT 1`,
    args: [organizationId, environment],
  }))
  if (!profile) return c.json({ error: 'logo_not_found' }, 404)

  let source = typeof profile.entra_logo_url === 'string' && profile.entra_logo_url ? profile.entra_logo_url : null
  if (!source && profile.primary_domain && c.env.LOGO_DEV_TOKEN) {
    source = `https://img.logo.dev/${encodeURIComponent(String(profile.primary_domain))}?token=${encodeURIComponent(c.env.LOGO_DEV_TOKEN)}&size=192&format=png&theme=light&retina=true`
  }
  if (!source) return c.json({ error: 'logo_not_found' }, 404)

  const response = await fetch(source, { headers: { accept: 'image/png,image/jpeg,image/*;q=0.8' } })
  if (!response.ok || !response.body) return c.json({ error: 'logo_not_found' }, 404)
  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') || 'image/png',
      'Cache-Control': 'private, max-age=3600',
    },
  })
})

app.get('/api/v1/provisioned-accounts/:organizationId/offline-license', async (c) => {
  const organizationId = c.req.param('organizationId')
  const record = first<Row>(await getDb(c.env).execute({
    sql: `SELECT oli.id,oli.license_id,oli.issued_at,oli.expires_at,oli.status,oli.signed_document_json,
      e.id AS entitlement_id,p.sku,p.name
      FROM organization_license_issuances oli
      JOIN entitlements e ON e.id=oli.entitlement_id
      JOIN products p ON p.id=e.product_id
      WHERE oli.organization_id=? AND p.sku='PAP-FED-PILOT-90'
      ORDER BY oli.issued_at DESC LIMIT 1`,
    args: [organizationId],
  }))
  return c.json({ license: record ?? null })
})

app.post('/api/v1/provisioned-accounts/:organizationId/offline-license', async (c) => {
  const organizationId = c.req.param('organizationId')
  const db = getDb(c.env)
  const organization = first<Row>(await db.execute({
    sql: 'SELECT * FROM organizations WHERE id=? AND status=\'active\' LIMIT 1',
    args: [organizationId],
  }))
  if (!organization) return c.json({ error: 'organization_not_found', message: 'Active organization not found.' }, 404)

  const tenantRows = rows<Row>(await db.execute({
    sql: `SELECT ot.tenant_id,tp.primary_domain
      FROM organization_tenants ot
      LEFT JOIN provision_tenant_profiles tp ON tp.tenant_id=ot.tenant_id AND tp.environment=ot.environment
      WHERE ot.organization_id=? AND ot.environment='government'
      ORDER BY ot.verified_at`,
    args: [organizationId],
  }))
  if (!tenantRows.length) {
    return c.json({ error: 'government_onboarding_required', message: 'Only organizations onboarded through the government provisioning path can receive this offline license.' }, 409)
  }

  const allowedTenantIds = [...new Set(tenantRows.map((row) => String(row.tenant_id).toLowerCase()).filter(Boolean))]
  const allowedDomains = [...new Set(tenantRows.map((row) => String(row.primary_domain ?? organization.domain ?? '').toLowerCase()).filter(isGovernmentDomain))]
  if (!allowedDomains.length) {
    return c.json({ error: 'government_domain_required', message: 'A verified .gov or .mil email domain is required before minting an offline license.' }, 409)
  }

  const existingIssued = first<Row>(await db.execute({
    sql: `SELECT oli.id,oli.license_id,oli.issued_at,oli.expires_at,oli.signed_document_json
      FROM organization_license_issuances oli
      JOIN entitlements e ON e.id=oli.entitlement_id
      JOIN products p ON p.id=e.product_id
      WHERE oli.organization_id=? AND oli.status='issued' AND p.sku='PAP-FED-PILOT-90'
        AND julianday(oli.expires_at)>julianday('now')
      ORDER BY oli.issued_at DESC LIMIT 1`,
    args: [organizationId],
  }))
  if (existingIssued) {
    return c.json({
      error: 'active_offline_license_exists',
      message: 'This organization already has an active 90-day offline license.',
      license: existingIssued,
    }, 409)
  }

  const product = first<Row>(await db.execute({
    sql: `SELECT * FROM products WHERE sku='PAP-FED-PILOT-90' AND active=1 LIMIT 1`,
  }))
  if (!product) return c.json({ error: 'offline_product_missing', message: 'The 90-day offline product is not configured.' }, 503)

  const startedAt = now()
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const admin = c.get('admin')

  let entitlement = first<Row>(await db.execute({
    sql: `SELECT e.* FROM entitlements e
      JOIN products p ON p.id=e.product_id
      WHERE e.customer_organization_id=? AND p.sku='PAP-FED-PILOT-90'
        AND e.status='active' AND julianday(e.valid_until)>julianday('now')
      ORDER BY e.created_at DESC LIMIT 1`,
    args: [organizationId],
  }))

  if (!entitlement) {
    const orderId = id('ord')
    const orderItemId = id('ori')
    const entitlementId = id('ent')
    const price = Number(product.list_price_cents ?? 25_000_000)
    await db.batch([
      {
        sql: `INSERT INTO orders
          (id,customer_organization_id,status,currency,subtotal_cents,discount_cents,total_cents,ordered_at,start_date,end_date,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [orderId, organizationId, 'booked', 'USD', price, 0, price, startedAt, startedAt, expiresAt, startedAt, startedAt],
      },
      {
        sql: `INSERT INTO order_items
          (id,order_id,product_id,quantity,list_price_cents,unit_price_cents,discount_cents,extended_price_cents,service_start,service_end,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [orderItemId, orderId, product.id, 1, price, price, 0, price, startedAt, expiresAt, startedAt],
      },
      {
        sql: `INSERT INTO entitlements
          (id,order_item_id,customer_organization_id,product_id,status,valid_from,valid_until,deployment_limit,feature_set_json,allowed_profiles_json,notes,issued_by_oid,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          entitlementId, orderItemId, organizationId, product.id, 'active', startedAt, expiresAt, 1,
          product.default_features_json, product.allowed_profiles_json,
          '90-day offline license minted from provisioned government account', admin.oid, startedAt, startedAt,
        ],
      },
      auditStatement(c, 'offline_license.order_booked', 'order', orderId, organizationId, {
        sku: product.sku,
        priceCents: price,
        termDays: 90,
      }),
    ], 'write')
    entitlement = first<Row>(await db.execute({ sql: 'SELECT * FROM entitlements WHERE id=?', args: [entitlementId] }))
  }

  if (!entitlement) return c.json({ error: 'entitlement_create_failed', message: 'Offline entitlement could not be created.' }, 500)

  const scopeVersion = crypto.randomUUID()
  await db.execute({
    sql: `INSERT INTO entitlement_license_scopes
      (entitlement_id,organization_id,scope,allowed_tenant_ids_json,allowed_domains_json,version,approved_by_oid,created_at,updated_at)
      VALUES (?,?,'organization',?,?,?,?,?,?)
      ON CONFLICT(entitlement_id) DO UPDATE SET
        organization_id=excluded.organization_id,
        allowed_tenant_ids_json=excluded.allowed_tenant_ids_json,
        allowed_domains_json=excluded.allowed_domains_json,
        version=excluded.version,
        approved_by_oid=excluded.approved_by_oid,
        updated_at=excluded.updated_at`,
    args: [
      entitlement.id, organizationId, JSON.stringify(allowedTenantIds), JSON.stringify(allowedDomains),
      scopeVersion, admin.oid, startedAt, startedAt,
    ],
  })

  const profiles = parseJsonArray(entitlement.allowed_profiles_json).filter(isDeploymentProfile)
  if (profiles.length !== 1 || profiles[0] !== 'disconnected') {
    return c.json({ error: 'offline_profile_invalid', message: 'The 90-day offline product must be restricted to the disconnected profile.' }, 409)
  }

  const payload: OrganizationLicensePayload = {
    scope: 'organization',
    organizationId,
    entitlementId: String(entitlement.id),
    licenseId: id('lic'),
    licensee: String(organization.display_name || organization.legal_name),
    allowedTenantIds,
    allowedDomains,
    profiles,
    features: parseJsonArray(entitlement.feature_set_json),
    issuedAt: startedAt,
    expiresAt: String(entitlement.valid_until),
  }

  let document
  try {
    document = await signLicenseWithAzureKeyVault(c.env, payload)
  } catch (cause) {
    console.error('offline license signing failed', cause)
    return c.json({ error: 'license_signer_unavailable', message: 'Azure Key Vault could not sign the offline license.' }, 503)
  }

  const issuanceId = id('oli')
  try {
    await db.batch([
      {
        sql: `INSERT INTO organization_license_issuances
          (id,license_id,entitlement_id,organization_id,scope_version,key_id,payload_json,signed_document_json,payload_sha256,status,issued_by_oid,issued_at,expires_at)
          VALUES (?,?,?,?,?,?,?,?,?,'issued',?,?,?)`,
        args: [
          issuanceId, payload.licenseId, entitlement.id, organizationId, scopeVersion,
          document.keyId, JSON.stringify(payload), JSON.stringify(document), payloadSha256(payload),
          admin.oid, startedAt, payload.expiresAt,
        ],
      },
      {
        sql: `UPDATE organization_license_issuances
          SET status='superseded'
          WHERE organization_id=? AND entitlement_id=? AND id<>? AND status='issued'`,
        args: [organizationId, entitlement.id, issuanceId],
      },
      auditStatement(c, 'offline_license.minted', 'organization_license', issuanceId, organizationId, {
        sku: product.sku,
        priceCents: Number(product.list_price_cents ?? 25_000_000),
        termDays: 90,
        expiresAt: payload.expiresAt,
        tenants: allowedTenantIds,
        domains: allowedDomains,
      }),
    ], 'write')
  } catch (cause) {
    console.error('offline license commit failed', cause)
    return c.json({ error: 'license_commit_failed', message: 'The signed license could not be committed. Retry from the licensing table.' }, 409)
  }

  return c.json({
    issuanceId,
    licenseId: payload.licenseId,
    expiresAt: payload.expiresAt,
    priceCents: Number(product.list_price_cents ?? 25_000_000),
    document,
  }, 201)
})

export default app
