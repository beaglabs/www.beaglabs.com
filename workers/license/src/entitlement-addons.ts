import { Hono } from 'hono'
import { buildAuth } from './auth'
import { first, getDb, parseJsonArray, rows } from './db'
import { adminOids, CLASSIFICATION_BANNER_FEATURE, isClassificationLevel, type Bindings } from './env'

type Row = Record<string, unknown>
type Admin = { oid: string; tenantId: string; email?: string }
type Env = { Bindings: Bindings }

const app = new Hono<Env>()

function id(prefix: string): string { return `${prefix}_${crypto.randomUUID()}` }
function now(): string { return new Date().toISOString() }

async function admin(request: Request, env: Bindings): Promise<Admin | null> {
  const session = await buildAuth(env).api.getSession({ headers: request.headers })
  if (!session) return null
  const user = session.user as typeof session.user & { entraOid?: string; entraTenantId?: string }
  const oid = user.entraOid?.toLowerCase() ?? ''
  const tenantId = user.entraTenantId?.toLowerCase() ?? ''
  if (!oid || tenantId !== env.MICROSOFT_TENANT_ID.toLowerCase() || !adminOids(env).has(oid)) return null
  return { oid, tenantId, ...(user.email ? { email: user.email } : {}) }
}

async function audit(env: Bindings, request: Request, actor: Admin, action: string, resourceId: string, organizationId: string, before: unknown, after: unknown) {
  await getDb(env).execute({
    sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id('aud'), 'admin', actor.oid, action, 'entitlement_addon', resourceId, organizationId, null,
      request.headers.get('cf-ray') ?? crypto.randomUUID(), request.headers.get('cf-connecting-ip'), request.headers.get('user-agent'),
      before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after), now()],
  })
}

app.use('*', async (c, next) => {
  const actor = await admin(c.req.raw, c.env)
  if (!actor) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  c.set('actor' as never, actor as never)
  await next()
})

app.get('/api/v1/entitlements/:id/addons', async (c) => {
  const entitlement = first<Row>(await getDb(c.env).execute({ sql: 'SELECT id FROM entitlements WHERE id=?', args: [c.req.param('id')] }))
  if (!entitlement) return c.json({ error: 'not_found', message: 'Entitlement not found.' }, 404)
  const result = await getDb(c.env).execute({
    sql: `SELECT ea.*, p.sku, p.name AS product_name
          FROM entitlement_addons ea
          JOIN order_items oi ON oi.id=ea.order_item_id
          JOIN products p ON p.id=oi.product_id
          WHERE ea.entitlement_id=? ORDER BY ea.created_at DESC`,
    args: [c.req.param('id')],
  })
  return c.json({ addons: rows<Row>(result) })
})

app.post('/api/v1/entitlements/:id/addons', async (c) => {
  const actor = await admin(c.req.raw, c.env)
  if (!actor) return c.json({ error: 'unauthorized' }, 401)
  let input: Record<string, unknown>
  try { input = await c.req.json<Record<string, unknown>>() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const orderItemId = typeof input.orderItemId === 'string' ? input.orderItemId.trim() : ''
  const classificationLevel = typeof input.classificationLevel === 'string' ? input.classificationLevel.trim().toLowerCase() : undefined
  if (!orderItemId) return c.json({ error: 'validation_error', message: 'orderItemId is required.' }, 422)

  const db = getDb(c.env)
  const entitlement = first<Row>(await db.execute({ sql: 'SELECT * FROM entitlements WHERE id=?', args: [c.req.param('id')] }))
  if (!entitlement) return c.json({ error: 'not_found', message: 'Entitlement not found.' }, 404)
  if (!['pending', 'active'].includes(String(entitlement.status))) return c.json({ error: 'entitlement_not_active', message: 'Add-ons can only be attached to pending or active entitlements.' }, 409)

  const source = first<Row>(await db.execute({
    sql: `SELECT oi.id AS order_item_id, o.customer_organization_id, o.status AS order_status,
                 p.sku, p.name, p.provisioning_type, p.default_features_json, p.allowed_profiles_json
          FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN products p ON p.id=oi.product_id
          WHERE oi.id=?`,
    args: [orderItemId],
  }))
  if (!source) return c.json({ error: 'order_item_not_found', message: 'Add-on order item not found.' }, 404)
  if (String(source.customer_organization_id) !== String(entitlement.customer_organization_id)) return c.json({ error: 'customer_mismatch', message: 'The add-on order item belongs to a different customer.' }, 409)
  if (!['booked', 'fulfilled'].includes(String(source.order_status))) return c.json({ error: 'order_not_booked', message: 'The add-on order must be booked or fulfilled before it can change an entitlement.' }, 409)

  const features = parseJsonArray(source.default_features_json)
  if (!features.length || String(source.provisioning_type) !== 'service') return c.json({ error: 'not_an_addon', message: 'This order item is not a feature add-on.' }, 409)

  const isClassification = features.includes(CLASSIFICATION_BANNER_FEATURE)
  if (isClassification && (!classificationLevel || !isClassificationLevel(classificationLevel))) {
    return c.json({ error: 'classification_required', message: 'classificationLevel must be one of unclassified, cui, confidential, secret, top-secret, or top-secret-sci.' }, 422)
  }
  if (!isClassification && classificationLevel) return c.json({ error: 'classification_not_supported', message: 'classificationLevel is only valid for the classification banner add-on.' }, 422)

  const entitlementProfiles = parseJsonArray(entitlement.allowed_profiles_json)
  const addOnProfiles = parseJsonArray(source.allowed_profiles_json)
  if (addOnProfiles.length && !entitlementProfiles.some((profile) => addOnProfiles.includes(profile))) {
    return c.json({ error: 'profile_mismatch', message: 'The add-on is not permitted on any profile allowed by this entitlement.' }, 409)
  }

  if (isClassification) {
    const existing = first<Row>(await db.execute({ sql: "SELECT id FROM entitlement_addons WHERE entitlement_id=? AND status='active' AND classification_level IS NOT NULL LIMIT 1", args: [c.req.param('id')] }))
    if (existing) return c.json({ error: 'classification_already_active', message: 'Revoke the current classification add-on before attaching another.' }, 409)
  }
  const consumed = first<Row>(await db.execute({ sql: 'SELECT id FROM entitlement_addons WHERE order_item_id=? LIMIT 1', args: [orderItemId] }))
  if (consumed) return c.json({ error: 'order_item_already_used', message: 'This add-on order item has already been attached.' }, 409)

  const addonId = id('add')
  const timestamp = now()
  const current = parseJsonArray(entitlement.feature_set_json).filter((feature) => !feature.startsWith('classification:'))
  const nextFeatures = [...new Set([...current, ...features, ...(classificationLevel ? [`classification:${classificationLevel}`] : [])])]
  await db.batch([
    {
      sql: `INSERT INTO entitlement_addons (id,entitlement_id,order_item_id,feature_set_json,classification_level,status,granted_by_oid,created_at,updated_at)
            VALUES (?,?,?,?,?,'active',?,?,?)`,
      args: [addonId, c.req.param('id'), orderItemId, JSON.stringify(features), classificationLevel ?? null, actor.oid, timestamp, timestamp],
    },
    { sql: 'UPDATE entitlements SET feature_set_json=?,updated_at=? WHERE id=?', args: [JSON.stringify(nextFeatures), timestamp, c.req.param('id')] },
  ], 'write')

  const after = { id: addonId, entitlementId: c.req.param('id'), orderItemId, sku: source.sku, features, classificationLevel: classificationLevel ?? null, status: 'active' }
  await audit(c.env, c.req.raw, actor, 'entitlement.addon_attached', addonId, String(entitlement.customer_organization_id), null, after)
  return c.json(after, 201)
})

app.post('/api/v1/entitlements/:id/addons/:addonId/revoke', async (c) => {
  const actor = await admin(c.req.raw, c.env)
  if (!actor) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  const entitlement = first<Row>(await db.execute({ sql: 'SELECT * FROM entitlements WHERE id=?', args: [c.req.param('id')] }))
  if (!entitlement) return c.json({ error: 'not_found', message: 'Entitlement not found.' }, 404)
  const addon = first<Row>(await db.execute({ sql: 'SELECT * FROM entitlement_addons WHERE id=? AND entitlement_id=?', args: [c.req.param('addonId'), c.req.param('id')] }))
  if (!addon) return c.json({ error: 'addon_not_found', message: 'Entitlement add-on not found.' }, 404)
  if (String(addon.status) === 'revoked') return c.json({ addon })

  const timestamp = now()
  let nextFeatures = parseJsonArray(entitlement.feature_set_json)
  for (const feature of parseJsonArray(addon.feature_set_json)) nextFeatures = nextFeatures.filter((value) => value !== feature)
  if (addon.classification_level) nextFeatures = nextFeatures.filter((value) => !value.startsWith('classification:'))

  await db.batch([
    { sql: "UPDATE entitlement_addons SET status='revoked',updated_at=? WHERE id=?", args: [timestamp, c.req.param('addonId')] },
    { sql: 'UPDATE entitlements SET feature_set_json=?,updated_at=? WHERE id=?', args: [JSON.stringify([...new Set(nextFeatures)]), timestamp, c.req.param('id')] },
  ], 'write')
  const after = { ...addon, status: 'revoked', updated_at: timestamp }
  await audit(c.env, c.req.raw, actor, 'entitlement.addon_revoked', c.req.param('addonId'), String(entitlement.customer_organization_id), addon, after)
  return c.json({ addon: after })
})

export default app
