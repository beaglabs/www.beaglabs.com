import { Hono, type Context } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { ZodError, type ZodType } from 'zod'
import { buildAuth } from './auth'
import { first, getDb, parseJsonArray, rows } from './db'
import { adminOids, isDeploymentProfile, type Bindings } from './env'
import { deploymentIdForPublicKey, payloadSha256, signLicense, type LicensePayload } from './license'
import {
  contactCreateSchema,
  contactPatchSchema,
  deploymentCreateSchema,
  deploymentPatchSchema,
  entitlementCreateSchema,
  entitlementPatchSchema,
  opportunityCreateSchema,
  opportunityPatchSchema,
  orderCreateSchema,
  orderPatchSchema,
  organizationCreateSchema,
  organizationPatchSchema,
  partnerCreateSchema,
  partnerPatchSchema,
  vehicleCreateSchema,
  vehiclePatchSchema,
} from './schemas'

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

type Row = Record<string, unknown>

class ApiError extends Error {
  constructor(readonly status: 400 | 401 | 403 | 404 | 409 | 422, readonly code: string, message: string) {
    super(message)
  }
}

const app = new Hono<AppEnv>()

app.use('*', secureHeaders())
app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
})

app.all('/api/auth/*', (c) => buildAuth(c.env).handler(c.req.raw))

app.get('/health', async (c) => {
  await getDb(c.env).execute('SELECT 1 AS ok')
  return c.json({ ok: true, service: 'beaglabs-license' })
})

app.get('/login', (c) => c.html(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Beag Labs Licensing</title></head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:12vh auto;padding:24px"><h1>Beag Labs Licensing</h1><p>Private administration service.</p><button id="sign-in" style="padding:10px 16px">Sign in with Microsoft</button><p id="error" style="color:#b00020"></p><script>
document.getElementById('sign-in').addEventListener('click', async () => {
  const error = document.getElementById('error'); error.textContent = '';
  const response = await fetch('/api/auth/sign-in/social', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({provider:'microsoft', callbackURL:'/admin'}) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.url) { error.textContent = body.message || body.error || 'Unable to start Microsoft sign-in.'; return; }
  location.assign(body.url);
});
</script></body></html>`))

async function getAdmin(c: AppContext): Promise<Admin | null> {
  const session = await buildAuth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!session) return null

  const user = session.user as typeof session.user & { entraOid?: string; entraTenantId?: string }
  const oid = user.entraOid?.toLowerCase() ?? ''
  const tenantId = user.entraTenantId?.toLowerCase() ?? ''
  if (!oid || !tenantId) return null
  if (tenantId !== c.env.MICROSOFT_TENANT_ID.toLowerCase() || !adminOids(c.env).has(oid)) return null

  return {
    oid,
    tenantId,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
  }
}

app.get('/admin', async (c) => {
  const admin = await getAdmin(c)
  if (!admin) return c.redirect('/login')
  return c.json({
    service: 'Beag Labs License Administration',
    admin,
    api: '/api/v1',
    note: 'This service has no partner self-service surface.',
  })
})

app.use('/api/v1/*', async (c, next) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  c.set('admin', admin)
  await next()
})

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function now(): string {
  return new Date().toISOString()
}

function limit(c: AppContext, fallback = 100, max = 500): number {
  const parsed = Number.parseInt(c.req.query('limit') ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

function jsonOrNull(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value)
}

async function parseBody<T>(c: AppContext, schema: ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new ApiError(400, 'invalid_json', 'Request body must be valid JSON.')
  }
  try {
    return schema.parse(raw)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(422, 'validation_error', error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; '))
    }
    throw error
  }
}

function requestId(c: AppContext): string {
  return c.req.header('cf-ray') ?? c.req.header('x-request-id') ?? crypto.randomUUID()
}

function auditStatement(c: AppContext, action: string, resourceType: string, resourceId: string | null, organizationId: string | null, partnerId: string | null, before: unknown, after: unknown) {
  const admin = c.get('admin')
  return {
    sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('aud'), 'admin', admin.oid, action, resourceType, resourceId, organizationId, partnerId,
      requestId(c), c.req.header('cf-connecting-ip') ?? null, c.req.header('user-agent') ?? null,
      jsonOrNull(before), jsonOrNull(after), now(),
    ],
  }
}

async function audit(c: AppContext, action: string, resourceType: string, resourceId: string | null, organizationId: string | null, partnerId: string | null, before: unknown, after: unknown) {
  await getDb(c.env).execute(auditStatement(c, action, resourceType, resourceId, organizationId, partnerId, before, after))
}

async function requireRow(c: AppContext, sql: string, args: unknown[], code: string, message: string): Promise<Row> {
  const row = first<Row>(await getDb(c.env).execute({ sql, args }))
  if (!row) throw new ApiError(404, code, message)
  return row
}

async function patchRow(c: AppContext, table: string, recordId: string, patch: Record<string, unknown>, mapping: Record<string, string>, resourceType: string) {
  const db = getDb(c.env)
  const before = first<Row>(await db.execute({ sql: `SELECT * FROM ${table} WHERE id=?`, args: [recordId] }))
  if (!before) throw new ApiError(404, 'not_found', `${resourceType} not found.`)

  const entries = Object.entries(patch).filter(([key, value]) => key in mapping && value !== undefined)
  if (entries.length === 0) throw new ApiError(422, 'empty_patch', 'No mutable fields were provided.')

  const assignments = entries.map(([key]) => `${mapping[key]}=?`)
  const args = entries.map(([, value]) => typeof value === 'boolean' ? (value ? 1 : 0) : value ?? null)
  assignments.push('updated_at=?')
  args.push(now(), recordId)
  await db.execute({ sql: `UPDATE ${table} SET ${assignments.join(',')} WHERE id=?`, args })
  const after = await requireRow(c, `SELECT * FROM ${table} WHERE id=?`, [recordId], 'not_found', `${resourceType} not found.`)
  await audit(c, `${resourceType}.update`, resourceType, recordId, String(after.organization_id ?? before.organization_id ?? '') || null, table === 'partners' ? recordId : null, before, after)
  return after
}

app.get('/api/v1/me', (c) => c.json({ admin: c.get('admin') }))

app.get('/api/v1/products', async (c) => {
  const result = await getDb(c.env).execute('SELECT * FROM products WHERE active=1 ORDER BY sku')
  return c.json({ items: rows<Row>(result) })
})

app.get('/api/v1/organizations', async (c) => {
  const db = getDb(c.env)
  const q = c.req.query('q')?.trim()
  const type = c.req.query('type')?.trim()
  const where: string[] = []
  const args: unknown[] = []
  if (q) { where.push('(legal_name LIKE ? OR display_name LIKE ? OR uei LIKE ? OR cage_code LIKE ?)'); const term = `%${q}%`; args.push(term, term, term, term) }
  if (type) { where.push('organization_type=?'); args.push(type) }
  args.push(limit(c))
  const result = await db.execute({ sql: `SELECT * FROM organizations ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY legal_name LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/organizations', async (c) => {
  const body = await parseBody(c, organizationCreateSchema)
  const recordId = id('org')
  const timestamp = now()
  const db = getDb(c.env)
  await db.batch([
    { sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,uei,cage_code,domain,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.organizationType, body.legalName, body.displayName ?? null, body.uei ?? null, body.cageCode ?? null, body.domain ?? null, body.status, timestamp, timestamp] },
    auditStatement(c, 'organization.create', 'organization', recordId, recordId, null, null, body),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM organizations WHERE id=?', [recordId], 'not_found', 'Organization not found.'), 201)
})

app.get('/api/v1/organizations/:id', async (c) => c.json(await requireRow(c, 'SELECT * FROM organizations WHERE id=?', [c.req.param('id')], 'not_found', 'Organization not found.')))

app.patch('/api/v1/organizations/:id', async (c) => {
  const body = await parseBody(c, organizationPatchSchema)
  return c.json(await patchRow(c, 'organizations', c.req.param('id'), body as Record<string, unknown>, {
    organizationType: 'organization_type', legalName: 'legal_name', displayName: 'display_name', uei: 'uei', cageCode: 'cage_code', domain: 'domain', status: 'status',
  }, 'organization'))
})

app.get('/api/v1/contacts', async (c) => {
  const orgId = c.req.query('organizationId')
  const args: unknown[] = []
  let where = ''
  if (orgId) { where = 'WHERE c.organization_id=?'; args.push(orgId) }
  args.push(limit(c))
  const result = await getDb(c.env).execute({ sql: `SELECT c.*,COALESCE(o.display_name,o.legal_name) AS organization_name FROM contacts c JOIN organizations o ON o.id=c.organization_id ${where} ORDER BY c.last_name,c.first_name LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/contacts', async (c) => {
  const body = await parseBody(c, contactCreateSchema)
  await requireRow(c, 'SELECT id FROM organizations WHERE id=?', [body.organizationId], 'organization_not_found', 'Organization not found.')
  const recordId = id('con')
  const timestamp = now()
  await getDb(c.env).batch([
    { sql: `INSERT INTO contacts (id,organization_id,first_name,last_name,title,email,phone,contact_type,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.organizationId, body.firstName, body.lastName, body.title ?? null, body.email ?? null, body.phone ?? null, body.contactType, body.isPrimary ? 1 : 0, timestamp, timestamp] },
    auditStatement(c, 'contact.create', 'contact', recordId, body.organizationId, null, null, body),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM contacts WHERE id=?', [recordId], 'not_found', 'Contact not found.'), 201)
})

app.patch('/api/v1/contacts/:id', async (c) => {
  const body = await parseBody(c, contactPatchSchema)
  return c.json(await patchRow(c, 'contacts', c.req.param('id'), body as Record<string, unknown>, {
    firstName: 'first_name', lastName: 'last_name', title: 'title', email: 'email', phone: 'phone', contactType: 'contact_type', isPrimary: 'is_primary',
  }, 'contact'))
})

app.get('/api/v1/partners', async (c) => {
  const result = await getDb(c.env).execute({ sql: `SELECT p.*,o.legal_name,o.display_name,o.domain FROM partners p JOIN organizations o ON o.id=p.organization_id ORDER BY COALESCE(o.display_name,o.legal_name) LIMIT ?`, args: [limit(c)] })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/partners', async (c) => {
  const body = await parseBody(c, partnerCreateSchema)
  await requireRow(c, 'SELECT id FROM organizations WHERE id=?', [body.organizationId], 'organization_not_found', 'Organization not found.')
  const recordId = id('ptn')
  const timestamp = now()
  await getDb(c.env).batch([
    { sql: `INSERT INTO partners (id,organization_id,partner_type,partner_status,agreement_status,discount_tier,onboarded_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, args: [recordId, body.organizationId, body.partnerType, body.partnerStatus, body.agreementStatus, body.discountTier ?? null, body.onboardedAt ?? null, timestamp, timestamp] },
    auditStatement(c, 'partner.create', 'partner', recordId, body.organizationId, recordId, null, body),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM partners WHERE id=?', [recordId], 'not_found', 'Partner not found.'), 201)
})

app.patch('/api/v1/partners/:id', async (c) => {
  const body = await parseBody(c, partnerPatchSchema)
  return c.json(await patchRow(c, 'partners', c.req.param('id'), body as Record<string, unknown>, {
    partnerType: 'partner_type', partnerStatus: 'partner_status', agreementStatus: 'agreement_status', discountTier: 'discount_tier', onboardedAt: 'onboarded_at',
  }, 'partner'))
})

app.get('/api/v1/vehicles', async (c) => {
  const result = await getDb(c.env).execute({ sql: `SELECT v.*,COALESCE(o.display_name,o.legal_name) AS holder_name FROM vehicles v LEFT JOIN organizations o ON o.id=v.holder_organization_id ORDER BY v.vehicle_name LIMIT ?`, args: [limit(c)] })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/vehicles', async (c) => {
  const body = await parseBody(c, vehicleCreateSchema)
  if (body.holderOrganizationId) await requireRow(c, 'SELECT id FROM organizations WHERE id=?', [body.holderOrganizationId], 'organization_not_found', 'Holder organization not found.')
  const recordId = id('veh')
  const timestamp = now()
  await getDb(c.env).batch([
    { sql: `INSERT INTO vehicles (id,vehicle_name,vehicle_type,vehicle_number,holder_organization_id,start_date,end_date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.vehicleName, body.vehicleType, body.vehicleNumber ?? null, body.holderOrganizationId ?? null, body.startDate ?? null, body.endDate ?? null, body.status, timestamp, timestamp] },
    auditStatement(c, 'vehicle.create', 'vehicle', recordId, body.holderOrganizationId ?? null, null, null, body),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM vehicles WHERE id=?', [recordId], 'not_found', 'Vehicle not found.'), 201)
})

app.patch('/api/v1/vehicles/:id', async (c) => {
  const body = await parseBody(c, vehiclePatchSchema)
  return c.json(await patchRow(c, 'vehicles', c.req.param('id'), body as Record<string, unknown>, {
    vehicleName: 'vehicle_name', vehicleType: 'vehicle_type', vehicleNumber: 'vehicle_number', holderOrganizationId: 'holder_organization_id', startDate: 'start_date', endDate: 'end_date', status: 'status',
  }, 'vehicle'))
})

app.get('/api/v1/opportunities', async (c) => {
  const stage = c.req.query('stage')
  const args: unknown[] = []
  const where = stage ? 'WHERE op.stage=?' : ''
  if (stage) args.push(stage)
  args.push(limit(c))
  const result = await getDb(c.env).execute({ sql: `SELECT op.*,COALESCE(o.display_name,o.legal_name) AS customer_name,p.sku AS expected_sku FROM opportunities op JOIN organizations o ON o.id=op.customer_organization_id LEFT JOIN products p ON p.id=op.expected_product_id ${where} ORDER BY op.updated_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/opportunities', async (c) => {
  const body = await parseBody(c, opportunityCreateSchema)
  await requireRow(c, 'SELECT id FROM organizations WHERE id=?', [body.customerOrganizationId], 'organization_not_found', 'Customer organization not found.')
  const recordId = id('opp')
  const timestamp = now()
  await getDb(c.env).batch([
    { sql: `INSERT INTO opportunities (id,customer_organization_id,originating_partner_id,transacting_partner_id,primary_contact_id,name,stage,estimated_value_cents,vehicle_id,expected_product_id,expected_close_date,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.customerOrganizationId, body.originatingPartnerId ?? null, body.transactingPartnerId ?? null, body.primaryContactId ?? null, body.name, body.stage, body.estimatedValueCents ?? null, body.vehicleId ?? null, body.expectedProductId ?? null, body.expectedCloseDate ?? null, timestamp, timestamp] },
    auditStatement(c, 'opportunity.create', 'opportunity', recordId, body.customerOrganizationId, body.transactingPartnerId ?? body.originatingPartnerId ?? null, null, body),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM opportunities WHERE id=?', [recordId], 'not_found', 'Opportunity not found.'), 201)
})

app.patch('/api/v1/opportunities/:id', async (c) => {
  const body = await parseBody(c, opportunityPatchSchema)
  return c.json(await patchRow(c, 'opportunities', c.req.param('id'), body as Record<string, unknown>, {
    originatingPartnerId: 'originating_partner_id', transactingPartnerId: 'transacting_partner_id', primaryContactId: 'primary_contact_id', name: 'name', stage: 'stage', estimatedValueCents: 'estimated_value_cents', vehicleId: 'vehicle_id', expectedProductId: 'expected_product_id', expectedCloseDate: 'expected_close_date',
  }, 'opportunity'))
})

app.get('/api/v1/orders', async (c) => {
  const status = c.req.query('status')
  const args: unknown[] = []
  const where = status ? 'WHERE ord.status=?' : ''
  if (status) args.push(status)
  args.push(limit(c))
  const result = await getDb(c.env).execute({ sql: `SELECT ord.*,COALESCE(o.display_name,o.legal_name) AS customer_name FROM orders ord JOIN organizations o ON o.id=ord.customer_organization_id ${where} ORDER BY ord.created_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/orders', async (c) => {
  const body = await parseBody(c, orderCreateSchema)
  const db = getDb(c.env)
  await requireRow(c, 'SELECT id FROM organizations WHERE id=?', [body.customerOrganizationId], 'organization_not_found', 'Customer organization not found.')

  const preparedItems: Array<{ id: string; productId: string; listPrice: number | null; unitPrice: number; discount: number; extended: number; quantity: number; serviceStart: string | null; serviceEnd: string | null; sku: string }> = []
  for (const item of body.items) {
    const product = first<Row>(await db.execute({ sql: item.productId ? 'SELECT * FROM products WHERE id=? AND active=1' : 'SELECT * FROM products WHERE sku=? AND active=1', args: [item.productId ?? item.sku!] }))
    if (!product) throw new ApiError(422, 'product_not_found', `Product ${item.productId ?? item.sku} was not found or is inactive.`)
    const listPrice = product.list_price_cents === null ? null : Number(product.list_price_cents)
    const unitPrice = item.unitPriceCents ?? listPrice
    if (unitPrice === null) throw new ApiError(422, 'price_required', `unitPriceCents is required for ${String(product.sku)}.`)
    const gross = unitPrice * item.quantity
    if (item.discountCents > gross) throw new ApiError(422, 'invalid_discount', `Discount exceeds gross amount for ${String(product.sku)}.`)
    preparedItems.push({ id: id('oli'), productId: String(product.id), listPrice, unitPrice, discount: item.discountCents, extended: gross - item.discountCents, quantity: item.quantity, serviceStart: item.serviceStart ?? null, serviceEnd: item.serviceEnd ?? null, sku: String(product.sku) })
  }

  const subtotal = preparedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const discount = preparedItems.reduce((sum, item) => sum + item.discount, 0)
  const total = subtotal - discount
  const recordId = id('ord')
  const timestamp = now()
  const orderedAt = body.orderedAt ?? (body.status === 'booked' ? timestamp : null)
  const statements = [
    { sql: `INSERT INTO orders (id,customer_organization_id,purchaser_organization_id,originating_partner_id,transacting_partner_id,vehicle_id,opportunity_id,contract_number,task_order_number,po_number,status,currency,subtotal_cents,discount_cents,total_cents,ordered_at,start_date,end_date,primary_contact_id,billing_contact_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.customerOrganizationId, body.purchaserOrganizationId ?? null, body.originatingPartnerId ?? null, body.transactingPartnerId ?? null, body.vehicleId ?? null, body.opportunityId ?? null, body.contractNumber ?? null, body.taskOrderNumber ?? null, body.poNumber ?? null, body.status, body.currency.toUpperCase(), subtotal, discount, total, orderedAt, body.startDate ?? null, body.endDate ?? null, body.primaryContactId ?? null, body.billingContactId ?? null, timestamp, timestamp] },
    ...preparedItems.map((item) => ({ sql: `INSERT INTO order_items (id,order_id,product_id,quantity,list_price_cents,unit_price_cents,discount_cents,extended_price_cents,service_start,service_end,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [item.id, recordId, item.productId, item.quantity, item.listPrice, item.unitPrice, item.discount, item.extended, item.serviceStart, item.serviceEnd, timestamp] })),
    auditStatement(c, 'order.create', 'order', recordId, body.customerOrganizationId, body.transactingPartnerId ?? body.originatingPartnerId ?? null, null, { ...body, items: preparedItems.map(({ sku, quantity, unitPrice, discount: itemDiscount }) => ({ sku, quantity, unitPriceCents: unitPrice, discountCents: itemDiscount })) }),
  ]
  await db.batch(statements, 'write')
  return c.json({ ...(await requireRow(c, 'SELECT * FROM orders WHERE id=?', [recordId], 'not_found', 'Order not found.')), items: preparedItems }, 201)
})

app.get('/api/v1/orders/:id', async (c) => {
  const order = await requireRow(c, 'SELECT * FROM orders WHERE id=?', [c.req.param('id')], 'not_found', 'Order not found.')
  const items = rows<Row>(await getDb(c.env).execute({ sql: `SELECT oi.*,p.sku,p.name,p.provisioning_type FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=? ORDER BY oi.created_at`, args: [c.req.param('id')] }))
  return c.json({ ...order, items })
})

app.patch('/api/v1/orders/:id', async (c) => {
  const body = await parseBody(c, orderPatchSchema)
  const recordId = c.req.param('id')
  const db = getDb(c.env)
  const before = await requireRow(c, 'SELECT * FROM orders WHERE id=?', [recordId], 'not_found', 'Order not found.')
  const timestamp = now()
  const orderedAt = body.status === 'booked' && !before.ordered_at ? timestamp : before.ordered_at
  await db.batch([
    { sql: 'UPDATE orders SET status=?,ordered_at=?,updated_at=? WHERE id=?', args: [body.status, orderedAt ?? null, timestamp, recordId] },
    auditStatement(c, 'order.status', 'order', recordId, String(before.customer_organization_id), before.transacting_partner_id ? String(before.transacting_partner_id) : null, before, { ...before, status: body.status, ordered_at: orderedAt }),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM orders WHERE id=?', [recordId], 'not_found', 'Order not found.'))
})

app.get('/api/v1/entitlements', async (c) => {
  const customerId = c.req.query('customerOrganizationId')
  const args: unknown[] = []
  const where = customerId ? 'WHERE e.customer_organization_id=?' : ''
  if (customerId) args.push(customerId)
  args.push(limit(c))
  const result = await getDb(c.env).execute({ sql: `SELECT e.*,p.sku,p.name,COALESCE(o.display_name,o.legal_name) AS customer_name FROM entitlements e JOIN products p ON p.id=e.product_id JOIN organizations o ON o.id=e.customer_organization_id ${where} ORDER BY e.created_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/entitlements', async (c) => {
  const body = await parseBody(c, entitlementCreateSchema)
  const db = getDb(c.env)
  const source = first<Row>(await db.execute({ sql: `SELECT oi.*,ord.customer_organization_id,ord.status AS order_status,p.sku,p.term_type,p.provisioning_type,p.default_features_json,p.allowed_profiles_json FROM order_items oi JOIN orders ord ON ord.id=oi.order_id JOIN products p ON p.id=oi.product_id WHERE oi.id=?`, args: [body.orderItemId] }))
  if (!source) throw new ApiError(404, 'order_item_not_found', 'Order item not found.')
  if (!['booked', 'fulfilled'].includes(String(source.order_status))) throw new ApiError(409, 'order_not_booked', 'The order must be booked or fulfilled before an entitlement can be created.')
  if (source.provisioning_type !== 'license') throw new ApiError(422, 'not_license_product', 'This order item is a service SKU and does not create a software entitlement.')
  const existing = first<Row>(await db.execute({ sql: 'SELECT id FROM entitlements WHERE order_item_id=?', args: [body.orderItemId] }))
  if (existing) throw new ApiError(409, 'entitlement_exists', 'This order item already has an entitlement.')

  const validFrom = new Date(body.validFrom)
  if (Number.isNaN(validFrom.valueOf())) throw new ApiError(422, 'invalid_valid_from', 'validFrom is invalid.')
  let validUntil = body.validUntil ? new Date(body.validUntil) : null
  if (!validUntil) {
    if (source.term_type === 'fixed_days' && source.sku === 'PAP-FED-PILOT-90') validUntil = new Date(validFrom.getTime() + 90 * 24 * 60 * 60 * 1000)
    if (source.term_type === 'annual') { validUntil = new Date(validFrom); validUntil.setUTCFullYear(validUntil.getUTCFullYear() + 1) }
  }
  if (validUntil && validUntil <= validFrom) throw new ApiError(422, 'invalid_validity', 'validUntil must be later than validFrom.')

  const recordId = id('ent')
  const timestamp = now()
  const status = validFrom.getTime() > Date.now() ? 'pending' : 'active'
  const admin = c.get('admin')
  const after = { id: recordId, orderItemId: body.orderItemId, customerOrganizationId: source.customer_organization_id, productId: source.product_id, status, validFrom: validFrom.toISOString(), validUntil: validUntil?.toISOString() ?? null, deploymentLimit: Number(source.quantity), features: parseJsonArray(source.default_features_json), allowedProfiles: parseJsonArray(source.allowed_profiles_json), notes: body.notes ?? null }
  await db.batch([
    { sql: `INSERT INTO entitlements (id,order_item_id,customer_organization_id,product_id,status,valid_from,valid_until,deployment_limit,feature_set_json,allowed_profiles_json,notes,issued_by_oid,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.orderItemId, source.customer_organization_id, source.product_id, status, after.validFrom, after.validUntil, after.deploymentLimit, source.default_features_json, source.allowed_profiles_json, body.notes ?? null, admin.oid, timestamp, timestamp] },
    auditStatement(c, 'entitlement.create', 'entitlement', recordId, String(source.customer_organization_id), null, null, after),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM entitlements WHERE id=?', [recordId], 'not_found', 'Entitlement not found.'), 201)
})

app.get('/api/v1/entitlements/:id', async (c) => c.json(await requireRow(c, 'SELECT * FROM entitlements WHERE id=?', [c.req.param('id')], 'not_found', 'Entitlement not found.')))

app.patch('/api/v1/entitlements/:id', async (c) => {
  const body = await parseBody(c, entitlementPatchSchema)
  return c.json(await patchRow(c, 'entitlements', c.req.param('id'), body as Record<string, unknown>, { status: 'status', notes: 'notes' }, 'entitlement'))
})

app.get('/api/v1/deployments', async (c) => {
  const entitlementId = c.req.query('entitlementId')
  const args: unknown[] = []
  const where = entitlementId ? 'WHERE d.entitlement_id=?' : ''
  if (entitlementId) args.push(entitlementId)
  args.push(limit(c))
  const result = await getDb(c.env).execute({ sql: `SELECT d.*,p.sku,COALESCE(o.display_name,o.legal_name) AS customer_name FROM deployments d JOIN entitlements e ON e.id=d.entitlement_id JOIN products p ON p.id=e.product_id JOIN organizations o ON o.id=d.customer_organization_id ${where} ORDER BY d.created_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/deployments', async (c) => {
  const body = await parseBody(c, deploymentCreateSchema)
  const db = getDb(c.env)
  const entitlement = await requireRow(c, 'SELECT * FROM entitlements WHERE id=?', [body.entitlementId], 'entitlement_not_found', 'Entitlement not found.')
  if (!['active', 'pending'].includes(String(entitlement.status))) throw new ApiError(409, 'entitlement_inactive', 'Entitlement is not active or pending.')
  const allowedProfiles = parseJsonArray(entitlement.allowed_profiles_json)
  if (!allowedProfiles.includes(body.deploymentProfile)) throw new ApiError(422, 'profile_not_entitled', `Entitlement does not allow deployment profile ${body.deploymentProfile}.`)
  const count = first<Row>(await db.execute({ sql: `SELECT COUNT(*) AS count FROM deployments WHERE entitlement_id=? AND status!='retired'`, args: [body.entitlementId] }))
  if (Number(count?.count ?? 0) >= Number(entitlement.deployment_limit)) throw new ApiError(409, 'deployment_limit_reached', 'Entitlement deployment limit has been reached.')
  if (body.activationPublicKeyPem && deploymentIdForPublicKey(body.activationPublicKeyPem) !== body.papyrusDeploymentId.toLowerCase()) throw new ApiError(422, 'deployment_identity_mismatch', 'papyrusDeploymentId does not match the SHA-256 of activationPublicKeyPem.')

  const recordId = id('dep')
  const timestamp = now()
  const admin = c.get('admin')
  const after = { id: recordId, entitlementId: body.entitlementId, customerOrganizationId: entitlement.customer_organization_id, deploymentName: body.deploymentName, papyrusDeploymentId: body.papyrusDeploymentId.toLowerCase(), deploymentProfile: body.deploymentProfile, status: 'registered' }
  await db.batch([
    { sql: `INSERT INTO deployments (id,entitlement_id,customer_organization_id,deployment_name,papyrus_deployment_id,deployment_profile,activation_public_key_pem,status,registered_by_oid,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [recordId, body.entitlementId, entitlement.customer_organization_id, body.deploymentName, body.papyrusDeploymentId.toLowerCase(), body.deploymentProfile, body.activationPublicKeyPem ?? null, 'registered', admin.oid, timestamp, timestamp] },
    auditStatement(c, 'deployment.register', 'deployment', recordId, String(entitlement.customer_organization_id), null, null, after),
  ], 'write')
  return c.json(await requireRow(c, 'SELECT * FROM deployments WHERE id=?', [recordId], 'not_found', 'Deployment not found.'), 201)
})

app.get('/api/v1/deployments/:id', async (c) => c.json(await requireRow(c, 'SELECT * FROM deployments WHERE id=?', [c.req.param('id')], 'not_found', 'Deployment not found.')))

app.patch('/api/v1/deployments/:id', async (c) => {
  const body = await parseBody(c, deploymentPatchSchema)
  return c.json(await patchRow(c, 'deployments', c.req.param('id'), body as Record<string, unknown>, { status: 'status' }, 'deployment'))
})

app.get('/api/v1/licenses', async (c) => {
  const deploymentId = c.req.query('deploymentId')
  const args: unknown[] = []
  const where = deploymentId ? 'WHERE li.deployment_id=?' : ''
  if (deploymentId) args.push(deploymentId)
  args.push(limit(c))
  const result = await getDb(c.env).execute({ sql: `SELECT li.id,li.license_id,li.deployment_id,li.entitlement_id,li.key_id,li.payload_sha256,li.status,li.issued_by_oid,li.issued_at,li.expires_at,li.revoked_at,d.deployment_name,d.papyrus_deployment_id FROM license_issuances li JOIN deployments d ON d.id=li.deployment_id ${where} ORDER BY li.issued_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/deployments/:id/licenses', async (c) => {
  const deploymentRecordId = c.req.param('id')
  const db = getDb(c.env)
  const source = first<Row>(await db.execute({ sql: `SELECT d.id AS deployment_record_id,d.papyrus_deployment_id,d.deployment_profile,d.status AS deployment_status,e.id AS entitlement_id,e.status AS entitlement_status,e.valid_from,e.valid_until,e.feature_set_json,e.allowed_profiles_json,o.id AS organization_id,o.legal_name,o.display_name FROM deployments d JOIN entitlements e ON e.id=d.entitlement_id JOIN organizations o ON o.id=d.customer_organization_id WHERE d.id=?`, args: [deploymentRecordId] }))
  if (!source) throw new ApiError(404, 'deployment_not_found', 'Deployment not found.')
  if (!['registered', 'licensed'].includes(String(source.deployment_status))) throw new ApiError(409, 'deployment_inactive', 'Deployment is suspended or retired.')
  if (source.entitlement_status !== 'active') throw new ApiError(409, 'entitlement_inactive', 'Entitlement must be active before a license can be issued.')
  const validFrom = Date.parse(String(source.valid_from))
  const validUntil = source.valid_until ? Date.parse(String(source.valid_until)) : null
  const currentTime = Date.now()
  if (Number.isFinite(validFrom) && validFrom > currentTime) throw new ApiError(409, 'entitlement_not_started', 'Entitlement validity has not started.')
  if (validUntil !== null && Number.isFinite(validUntil) && validUntil <= currentTime) throw new ApiError(409, 'entitlement_expired', 'Entitlement has expired.')
  if (!isDeploymentProfile(source.deployment_profile)) throw new ApiError(422, 'invalid_profile', 'Deployment profile is invalid.')
  const allowedProfiles = parseJsonArray(source.allowed_profiles_json)
  if (!allowedProfiles.includes(source.deployment_profile)) throw new ApiError(409, 'profile_not_entitled', 'Deployment profile is no longer allowed by the entitlement.')

  const issuedAt = now()
  const licenseId = id('lic')
  const payload: LicensePayload = {
    licenseId,
    licensee: String(source.display_name || source.legal_name),
    deploymentId: String(source.papyrus_deployment_id),
    profiles: [source.deployment_profile],
    features: parseJsonArray(source.feature_set_json),
    issuedAt,
    expiresAt: source.valid_until ? new Date(String(source.valid_until)).toISOString() : null,
  }
  const signed = signLicense(payload, c.env.PAPYRUS_LICENSE_KEY_ID, c.env.PAPYRUS_LICENSE_PRIVATE_KEY_PEM)
  const issuanceId = id('lsi')
  const admin = c.get('admin')
  await db.batch([
    { sql: `UPDATE license_issuances SET status='superseded' WHERE deployment_id=? AND status='issued'`, args: [deploymentRecordId] },
    { sql: `INSERT INTO license_issuances (id,license_id,deployment_id,entitlement_id,key_id,payload_json,signed_document_json,payload_sha256,status,issued_by_oid,issued_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, args: [issuanceId, licenseId, deploymentRecordId, source.entitlement_id, c.env.PAPYRUS_LICENSE_KEY_ID, JSON.stringify(payload), JSON.stringify(signed), payloadSha256(payload), 'issued', admin.oid, issuedAt, payload.expiresAt] },
    { sql: `UPDATE deployments SET status='licensed',updated_at=? WHERE id=?`, args: [issuedAt, deploymentRecordId] },
    auditStatement(c, 'license.issue', 'license', issuanceId, String(source.organization_id), null, null, { licenseId, deploymentId: payload.deploymentId, profile: source.deployment_profile, features: payload.features, expiresAt: payload.expiresAt, keyId: c.env.PAPYRUS_LICENSE_KEY_ID }),
  ], 'write')
  return c.json({ issuanceId, document: signed }, 201)
})

app.get('/api/v1/licenses/:id/download', async (c) => {
  const record = await requireRow(c, 'SELECT * FROM license_issuances WHERE id=?', [c.req.param('id')], 'license_not_found', 'License issuance not found.')
  c.header('Content-Type', 'application/json; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="${String(record.license_id)}.papyrus-license.json"`)
  return c.body(String(record.signed_document_json))
})

app.post('/api/v1/licenses/:id/revoke', async (c) => {
  const recordId = c.req.param('id')
  const db = getDb(c.env)
  const before = await requireRow(c, 'SELECT li.*,d.customer_organization_id FROM license_issuances li JOIN deployments d ON d.id=li.deployment_id WHERE li.id=?', [recordId], 'license_not_found', 'License issuance not found.')
  if (before.status === 'revoked') return c.json({ ...before, offlineEffect: false, note: 'Already recorded as revoked. Offline Papyrus deployments do not phone home, so this does not invalidate an already imported license.' })
  const revokedAt = now()
  await db.batch([
    { sql: `UPDATE license_issuances SET status='revoked',revoked_at=? WHERE id=?`, args: [revokedAt, recordId] },
    auditStatement(c, 'license.revoke', 'license', recordId, String(before.customer_organization_id), null, before, { ...before, status: 'revoked', revoked_at: revokedAt }),
  ], 'write')
  const after = await requireRow(c, 'SELECT * FROM license_issuances WHERE id=?', [recordId], 'license_not_found', 'License issuance not found.')
  return c.json({ ...after, offlineEffect: false, note: 'Revocation is recorded in Beag Labs commercial state. An already imported offline license remains cryptographically valid until it expires or is replaced.' })
})

app.get('/api/v1/audit', async (c) => {
  const resourceType = c.req.query('resourceType')
  const resourceId = c.req.query('resourceId')
  const where: string[] = []
  const args: unknown[] = []
  if (resourceType) { where.push('resource_type=?'); args.push(resourceType) }
  if (resourceId) { where.push('resource_id=?'); args.push(resourceId) }
  args.push(limit(c, 100, 1000))
  const result = await getDb(c.env).execute({ sql: `SELECT * FROM audit_events ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.notFound((c) => c.json({ error: 'not_found', message: 'Route not found.' }, 404))

app.onError((error, c) => {
  if (error instanceof ApiError) return c.json({ error: error.code, message: error.message }, error.status)
  console.error('license-worker error', error)
  return c.json({ error: 'internal_error', message: 'Internal server error.' }, 500)
})

export default app
