import { Hono, type Context } from 'hono'
import { z, ZodError, type ZodType } from 'zod'
import { buildAuth } from './auth'
import { first, getDb, rows } from './db'
import { adminOids, type Bindings } from './env'
import { sendApplicationReviewEmail, sendPartnerInviteEmail } from './email'
import {
  adminLoginPage,
  adminPortalPage,
  applicationReviewPage,
  messagePage,
  oauthConsentPage,
  partnerApplyPage,
  partnerInvitePage,
  partnerLoginPage,
  partnerPortalPage,
} from './ui'

type Row = Record<string, unknown>
type AppEnv = { Bindings: Bindings }
type AppContext = Context<AppEnv>

type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type PartnerSession = Row & { id: string; partner_id: string; organization_id: string; auth_user_id: string; email: string; role: string }

class PortalError extends Error {
  constructor(readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502, readonly code: string, message: string) {
    super(message)
  }
}

const applicationSchema = z.object({
  companyName: z.string().trim().min(2).max(256),
  companyDomain: z.string().trim().min(3).max(253),
  annualRevenueUsd: z.number().int().nonnegative().max(10_000_000_000_000),
  uei: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{12}$/, 'UEI must be 12 alphanumeric characters'),
  cage: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{5}$/, 'CAGE must be 5 alphanumeric characters'),
  partnerType: z.enum(['distributor', 'reseller', 'prime', 'systems_integrator', 'referral', 'technology']),
  pocName: z.string().trim().min(2).max(200),
  pocEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  skuInterests: z.array(z.string().trim().min(1)).min(1).max(20),
  website: z.string().optional().default(''),
})

const partnerOrderSchema = z.object({
  sku: z.string().trim().min(1).max(128),
  quantity: z.number().int().min(1).max(100),
  endCustomerName: z.string().trim().max(256).nullable().optional(),
  endCustomerUei: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{12}$/).nullable().optional(),
  endCustomerCage: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{5}$/).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
})

const inviteSendSchema = z.object({ token: z.string().min(32).max(256) })

const app = new Hono<AppEnv>()

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function now(): string {
  return new Date().toISOString()
}

function requestId(c: AppContext): string {
  return c.req.header('cf-ray') ?? c.req.header('x-request-id') ?? crypto.randomUUID()
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeDomain(value: string): string {
  let input = value.trim().toLowerCase()
  if (!/^https?:\/\//.test(input)) input = `https://${input}`
  let url: URL
  try { url = new URL(input) } catch { throw new PortalError(422, 'invalid_domain', 'Company domain is invalid.') }
  if (url.username || url.password || url.port) throw new PortalError(422, 'invalid_domain', 'Company domain must be a public hostname.')
  const hostname = url.hostname.replace(/^www\./, '').replace(/\.$/, '')
  if (!hostname.includes('.') || hostname.length > 253) throw new PortalError(422, 'invalid_domain', 'Company domain must be a valid hostname.')
  return hostname
}

function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return [parts[0], 'POC']
  return [parts.shift()!, parts.join(' ')]
}

async function parseJsonBody<T>(c: AppContext, schema: ZodType<T>): Promise<T> {
  let raw: unknown
  try { raw = await c.req.json() } catch { throw new PortalError(400, 'invalid_json', 'Request body must be valid JSON.') }
  try { return schema.parse(raw) } catch (error) {
    if (error instanceof ZodError) throw new PortalError(422, 'validation_error', error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; '))
    throw error
  }
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

async function getPartner(c: AppContext): Promise<PartnerSession | null> {
  const session = await buildAuth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!session?.user?.id) return null
  return first<PartnerSession>(await getDb(c.env).execute({
    sql: `SELECT pu.id,pu.partner_id,pu.auth_user_id,pu.email,pu.role,pu.status,
                 p.organization_id,p.partner_type,p.partner_status,p.agreement_status,p.discount_tier,p.onboarded_at,
                 o.legal_name,o.display_name,o.domain,o.uei,o.cage_code
          FROM partner_users pu
          JOIN partners p ON p.id=pu.partner_id
          JOIN organizations o ON o.id=p.organization_id
          WHERE pu.auth_user_id=? AND pu.status='active' AND p.partner_status='active'
          LIMIT 1`,
    args: [session.user.id],
  }))
}

async function writeAudit(c: AppContext, input: { actorType: string; actorId: string; action: string; resourceType: string; resourceId?: string | null; organizationId?: string | null; partnerId?: string | null; before?: unknown; after?: unknown }) {
  await getDb(c.env).execute({
    sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id('aud'), input.actorType, input.actorId, input.action, input.resourceType, input.resourceId ?? null, input.organizationId ?? null, input.partnerId ?? null, requestId(c), c.req.header('cf-connecting-ip') ?? null, c.req.header('user-agent') ?? null, input.before === undefined ? null : JSON.stringify(input.before), input.after === undefined ? null : JSON.stringify(input.after), now()],
  })
}

async function issuePartnerInvite(c: AppContext, partnerId: string, email: string, companyName: string): Promise<string> {
  const db = getDb(c.env)
  const token = randomToken()
  const hash = await sha256(token)
  const timestamp = now()
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
  await db.batch([
    { sql: `UPDATE partner_invites SET status='revoked' WHERE partner_id=? AND lower(email)=? AND status='pending'`, args: [partnerId, email.toLowerCase()] },
    { sql: `INSERT INTO partner_invites (id,partner_id,email,token_hash,status,expires_at,created_at) VALUES (?,?,?,?,?,?,?)`, args: [id('pinv'), partnerId, email.toLowerCase(), hash, 'pending', expiresAt, timestamp] },
  ], 'write')
  await sendPartnerInviteEmail(c.env, { companyName, email, token })
  return token
}

app.get('/', async (c) => {
  if (await getAdmin(c)) return c.redirect('/admin')
  if (await getPartner(c)) return c.redirect('/portal')
  return c.redirect('/partners/apply')
})

app.get('/login', (c) => c.html(adminLoginPage()))
app.get('/partner/login', (c) => c.html(partnerLoginPage()))

app.get('/partners/apply', async (c) => {
  const products = rows<Row>(await getDb(c.env).execute(`SELECT sku,name,list_price_cents,term_type FROM products WHERE active=1 ORDER BY sku`))
  return c.html(partnerApplyPage(products))
})

app.post('/api/partner/applications', async (c) => {
  const body = await parseJsonBody(c, applicationSchema)
  if (body.website) return c.json({ ok: true }, 202)
  const domain = normalizeDomain(body.companyDomain)
  const db = getDb(c.env)

  const placeholders = body.skuInterests.map(() => '?').join(',')
  const activeSkus = rows<Row>(await db.execute({ sql: `SELECT sku FROM products WHERE active=1 AND sku IN (${placeholders})`, args: body.skuInterests }))
  if (activeSkus.length !== new Set(body.skuInterests).size) throw new PortalError(422, 'invalid_sku', 'One or more selected SKUs are not active.')

  const duplicate = first<Row>(await db.execute({
    sql: `SELECT id FROM partner_applications WHERE status='pending' AND (uei=? OR lower(company_domain)=? OR lower(main_poc_email)=?) LIMIT 1`,
    args: [body.uei, domain, body.pocEmail],
  }))
  if (duplicate) throw new PortalError(409, 'application_pending', 'A matching partner application is already pending review.')

  const token = randomToken()
  const hash = await sha256(token)
  const timestamp = now()
  const applicationId = id('papp')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const skus = [...new Set(body.skuInterests)]

  await db.execute({
    sql: `INSERT INTO partner_applications (id,company_name,company_domain,annual_revenue_usd,uei,cage_code,partner_type,main_poc_name,main_poc_email,sku_interests_json,status,decision_token_hash,decision_expires_at,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [applicationId, body.companyName, domain, body.annualRevenueUsd, body.uei, body.cage, body.partnerType, body.pocName, body.pocEmail, JSON.stringify(skus), 'pending', hash, expiresAt, timestamp, timestamp],
  })
  await writeAudit(c, { actorType: 'partner_applicant', actorId: body.pocEmail, action: 'partner_application.create', resourceType: 'partner_application', resourceId: applicationId, after: { companyName: body.companyName, domain, uei: body.uei, cage: body.cage, skus } })

  let notificationSent = true
  try {
    await sendApplicationReviewEmail(c.env, { companyName: body.companyName, companyDomain: domain, annualRevenueUsd: body.annualRevenueUsd, uei: body.uei, cage: body.cage, pocName: body.pocName, pocEmail: body.pocEmail, skus, token })
  } catch (error) {
    notificationSent = false
    console.error('partner application review email failed', error)
  }
  return c.json({ ok: true, applicationId, notificationSent }, 201)
})

app.get('/partner-application/review', async (c) => {
  const token = c.req.query('token') ?? ''
  const decision = c.req.query('decision')
  if (!token || (decision !== 'approve' && decision !== 'reject')) throw new PortalError(400, 'invalid_review_link', 'Review link is invalid.')
  const hash = await sha256(token)
  const application = first<Row>(await getDb(c.env).execute({ sql: `SELECT * FROM partner_applications WHERE decision_token_hash=? LIMIT 1`, args: [hash] }))
  if (!application) throw new PortalError(404, 'application_not_found', 'Partner application was not found.')
  if (application.status !== 'pending') return c.html(messagePage('Already reviewed', `This application is already ${String(application.status)}.`, { label: 'Open admin portal', href: '/admin' }))
  if (new Date(String(application.decision_expires_at)).getTime() <= Date.now()) throw new PortalError(409, 'review_expired', 'This review link has expired.')
  let skus: unknown = []
  try { skus = JSON.parse(String(application.sku_interests_json ?? '[]')) } catch {}
  return c.html(applicationReviewPage({ ...application, skus }, token, decision))
})

app.post('/partner-application/decision', async (c) => {
  const form = await c.req.parseBody()
  const token = String(form.token ?? '')
  const decision = String(form.decision ?? '')
  if (!token || (decision !== 'approve' && decision !== 'reject')) throw new PortalError(400, 'invalid_decision', 'Decision is invalid.')
  const hash = await sha256(token)
  const db = getDb(c.env)
  const application = first<Row>(await db.execute({ sql: `SELECT * FROM partner_applications WHERE decision_token_hash=? LIMIT 1`, args: [hash] }))
  if (!application) throw new PortalError(404, 'application_not_found', 'Partner application was not found.')
  if (application.status !== 'pending') return c.html(messagePage('Already reviewed', `This application is already ${String(application.status)}.`, { label: 'Open admin portal', href: '/admin' }))
  if (new Date(String(application.decision_expires_at)).getTime() <= Date.now()) throw new PortalError(409, 'review_expired', 'This review link has expired.')

  const timestamp = now()
  if (decision === 'reject') {
    await db.execute({ sql: `UPDATE partner_applications SET status='rejected',rejected_at=?,updated_at=? WHERE id=?`, args: [timestamp, timestamp, application.id] })
    await writeAudit(c, { actorType: 'email_approval', actorId: c.env.PARTNERS_EMAIL, action: 'partner_application.reject', resourceType: 'partner_application', resourceId: String(application.id), before: application, after: { status: 'rejected' } })
    return c.html(messagePage('Application rejected', `${String(application.company_name)} was rejected. No partner account was created.`, { label: 'Admin portal', href: '/admin' }))
  }

  const matches = rows<Row>(await db.execute({ sql: `SELECT * FROM organizations WHERE uei=? OR lower(domain)=? LIMIT 3`, args: [application.uei, String(application.company_domain).toLowerCase()] }))
  const uniqueIds = new Set(matches.map((row) => String(row.id)))
  if (uniqueIds.size > 1) throw new PortalError(409, 'organization_conflict', 'UEI and domain resolve to different existing organizations. Resolve the records in admin before approval.')

  let organizationId: string
  const statements: Array<{ sql: string; args: unknown[] }> = []
  if (matches[0]) {
    organizationId = String(matches[0].id)
    statements.push({ sql: `UPDATE organizations SET uei=COALESCE(NULLIF(uei,''),?),cage_code=COALESCE(NULLIF(cage_code,''),?),domain=COALESCE(NULLIF(domain,''),?),status='active',updated_at=? WHERE id=?`, args: [application.uei, application.cage_code, application.company_domain, timestamp, organizationId] })
  } else {
    organizationId = id('org')
    statements.push({ sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,uei,cage_code,domain,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, args: [organizationId, 'partner', application.company_name, application.company_name, application.uei, application.cage_code, application.company_domain, 'active', timestamp, timestamp] })
  }

  let partner = first<Row>(await db.execute({ sql: `SELECT * FROM partners WHERE organization_id=? LIMIT 1`, args: [organizationId] }))
  const partnerId = partner ? String(partner.id) : id('ptn')
  if (partner) {
    statements.push({ sql: `UPDATE partners SET partner_status='active',partner_type=?,onboarded_at=COALESCE(onboarded_at,?),updated_at=? WHERE id=?`, args: [application.partner_type, timestamp, timestamp, partnerId] })
  } else {
    statements.push({ sql: `INSERT INTO partners (id,organization_id,partner_type,partner_status,agreement_status,discount_tier,onboarded_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, args: [partnerId, organizationId, application.partner_type, 'active', 'none', null, timestamp, timestamp, timestamp] })
  }

  const existingContact = first<Row>(await db.execute({ sql: `SELECT id FROM contacts WHERE organization_id=? AND lower(email)=? LIMIT 1`, args: [organizationId, String(application.main_poc_email).toLowerCase()] }))
  if (!existingContact) {
    const [firstName, lastName] = splitName(String(application.main_poc_name))
    statements.push({ sql: `INSERT INTO contacts (id,organization_id,first_name,last_name,title,email,phone,contact_type,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [id('con'), organizationId, firstName, lastName, null, application.main_poc_email, null, 'partner_manager', 1, timestamp, timestamp] })
  }
  statements.push({ sql: `UPDATE partner_applications SET status='approved',approved_by_oid=?,approved_at=?,partner_id=?,updated_at=? WHERE id=?`, args: ['partners-email-approval', timestamp, partnerId, timestamp, application.id] })
  await db.batch(statements, 'write')

  await writeAudit(c, { actorType: 'email_approval', actorId: c.env.PARTNERS_EMAIL, action: 'partner_application.approve', resourceType: 'partner_application', resourceId: String(application.id), organizationId, partnerId, before: application, after: { status: 'approved', organizationId, partnerId } })
  await issuePartnerInvite(c, partnerId, String(application.main_poc_email), String(application.company_name))
  return c.html(messagePage('Partner approved', `${String(application.company_name)} is active and the main POC invitation has been sent.`, { label: 'Admin portal', href: '/admin' }))
})

app.get('/partner/invite', async (c) => {
  const token = c.req.query('token') ?? ''
  if (!token) throw new PortalError(400, 'invalid_invite', 'Invitation token is missing.')
  const hash = await sha256(token)
  const invite = first<Row>(await getDb(c.env).execute({
    sql: `SELECT i.*,o.legal_name FROM partner_invites i JOIN partners p ON p.id=i.partner_id JOIN organizations o ON o.id=p.organization_id WHERE i.token_hash=? LIMIT 1`,
    args: [hash],
  }))
  if (!invite) throw new PortalError(404, 'invite_not_found', 'Partner invitation was not found.')
  if (invite.status !== 'pending') return c.html(messagePage('Invitation already used', 'This partner invitation is no longer active.', { label: 'Partner sign in', href: '/partner/login' }))
  if (new Date(String(invite.expires_at)).getTime() <= Date.now()) throw new PortalError(409, 'invite_expired', 'This partner invitation has expired.')
  return c.html(partnerInvitePage(String(invite.legal_name), String(invite.email), token))
})

app.post('/api/partner/invite/send', async (c) => {
  const { token } = await parseJsonBody(c, inviteSendSchema)
  const hash = await sha256(token)
  const invite = first<Row>(await getDb(c.env).execute({
    sql: `SELECT i.*,o.legal_name FROM partner_invites i JOIN partners p ON p.id=i.partner_id JOIN organizations o ON o.id=p.organization_id WHERE i.token_hash=? LIMIT 1`,
    args: [hash],
  }))
  if (!invite || invite.status !== 'pending' || new Date(String(invite.expires_at)).getTime() <= Date.now()) throw new PortalError(403, 'invite_invalid', 'Partner invitation is invalid or expired.')

  const callbackURL = `${c.env.BASE_URL}/partner/activate?invite=${encodeURIComponent(token)}`
  const authRequest = new Request(`${c.env.BASE_URL}/api/auth/sign-in/magic-link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: invite.email, name: invite.legal_name, callbackURL, errorCallbackURL: `${c.env.BASE_URL}/partner/login?error=invite` }),
  })
  const response = await buildAuth(c.env).handler(authRequest)
  if (!response.ok) {
    console.error('Better Auth magic link failed', await response.text())
    throw new PortalError(502, 'magic_link_failed', 'Unable to send registration link.')
  }
  return c.json({ ok: true })
})

app.get('/partner/activate', async (c) => {
  const token = c.req.query('invite') ?? ''
  const session = await buildAuth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!token) throw new PortalError(400, 'invalid_invite', 'Invitation token is missing.')
  if (!session?.user?.id || !session.user.email) return c.redirect(`/partner/invite?token=${encodeURIComponent(token)}`)

  const hash = await sha256(token)
  const db = getDb(c.env)
  const invite = first<Row>(await db.execute({ sql: `SELECT * FROM partner_invites WHERE token_hash=? LIMIT 1`, args: [hash] }))
  if (!invite || invite.status !== 'pending') return c.redirect('/portal')
  if (new Date(String(invite.expires_at)).getTime() <= Date.now()) throw new PortalError(409, 'invite_expired', 'Invitation has expired.')
  if (String(invite.email).toLowerCase() !== session.user.email.toLowerCase()) throw new PortalError(403, 'email_mismatch', 'Signed-in email does not match the invitation.')

  const count = first<Row>(await db.execute({ sql: `SELECT COUNT(*) AS count FROM partner_users WHERE partner_id=? AND status='active'`, args: [invite.partner_id] }))
  const role = Number(count?.count ?? 0) === 0 ? 'owner' : 'member'
  const existing = first<Row>(await db.execute({ sql: `SELECT * FROM partner_users WHERE auth_user_id=? OR (partner_id=? AND lower(email)=?) LIMIT 1`, args: [session.user.id, invite.partner_id, session.user.email.toLowerCase()] }))
  const timestamp = now()
  const userId = existing ? String(existing.id) : id('pusr')
  const statements: Array<{ sql: string; args: unknown[] }> = []
  if (existing) statements.push({ sql: `UPDATE partner_users SET auth_user_id=?,email=?,status='active',updated_at=? WHERE id=?`, args: [session.user.id, session.user.email.toLowerCase(), timestamp, userId] })
  else statements.push({ sql: `INSERT INTO partner_users (id,partner_id,auth_user_id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`, args: [userId, invite.partner_id, session.user.id, session.user.email.toLowerCase(), role, 'active', timestamp, timestamp] })
  statements.push({ sql: `UPDATE partner_invites SET status='accepted',accepted_at=?,auth_user_id=? WHERE id=?`, args: [timestamp, session.user.id, invite.id] })
  await db.batch(statements, 'write')
  const partner = first<Row>(await db.execute({ sql: `SELECT organization_id FROM partners WHERE id=?`, args: [invite.partner_id] }))
  await writeAudit(c, { actorType: 'partner_user', actorId: session.user.id, action: 'partner_invite.accept', resourceType: 'partner_user', resourceId: userId, organizationId: partner ? String(partner.organization_id) : null, partnerId: String(invite.partner_id), after: { email: session.user.email, role } })
  return c.redirect('/portal')
})

app.get('/portal', async (c) => {
  const partner = await getPartner(c)
  if (!partner) return c.redirect('/partner/login')
  const db = getDb(c.env)
  const products = rows<Row>(await db.execute(`SELECT * FROM products WHERE active=1 ORDER BY sku`))
  const orders = rows<Row>(await db.execute({
    sql: `SELECT ord.*,pos.submitted_at,pos.requires_quote,pos.end_customer_name,pos.end_customer_uei,pos.end_customer_cage
          FROM partner_order_submissions pos JOIN orders ord ON ord.id=pos.order_id
          WHERE pos.partner_id=? ORDER BY pos.submitted_at DESC LIMIT 100`,
    args: [partner.partner_id],
  }))
  return c.html(partnerPortalPage({ partner, orders, products, user: partner }))
})

app.get('/api/partner/catalog', async (c) => {
  const partner = await getPartner(c)
  if (!partner) return c.json({ error: 'unauthorized' }, 401)
  const products = rows<Row>(await getDb(c.env).execute(`SELECT sku,name,description,term_type,provisioning_type,list_price_cents FROM products WHERE active=1 ORDER BY sku`))
  return c.json({ items: products })
})

app.get('/api/partner/orders', async (c) => {
  const partner = await getPartner(c)
  if (!partner) return c.json({ error: 'unauthorized' }, 401)
  const orders = rows<Row>(await getDb(c.env).execute({
    sql: `SELECT ord.*,pos.submitted_at,pos.requires_quote,pos.end_customer_name,pos.end_customer_uei,pos.end_customer_cage,pos.notes
          FROM partner_order_submissions pos JOIN orders ord ON ord.id=pos.order_id WHERE pos.partner_id=? ORDER BY pos.submitted_at DESC`,
    args: [partner.partner_id],
  }))
  return c.json({ items: orders })
})

app.post('/api/partner/orders', async (c) => {
  const partner = await getPartner(c)
  if (!partner) return c.json({ error: 'unauthorized', message: 'Approved partner sign-in required.' }, 401)
  const body = await parseJsonBody(c, partnerOrderSchema)
  const db = getDb(c.env)
  const product = first<Row>(await db.execute({ sql: `SELECT * FROM products WHERE sku=? AND active=1 LIMIT 1`, args: [body.sku] }))
  if (!product) throw new PortalError(422, 'product_not_found', 'Selected SKU is not active.')

  const listPrice = product.list_price_cents === null ? null : Number(product.list_price_cents)
  const requiresQuote = listPrice === null
  const unitPrice = listPrice ?? 0
  const total = unitPrice * body.quantity
  const timestamp = now()
  const orderId = id('ord')
  const itemId = id('oli')
  await db.batch([
    { sql: `INSERT INTO orders (id,customer_organization_id,purchaser_organization_id,originating_partner_id,transacting_partner_id,vehicle_id,opportunity_id,contract_number,task_order_number,po_number,status,currency,subtotal_cents,discount_cents,total_cents,ordered_at,start_date,end_date,primary_contact_id,billing_contact_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [orderId, partner.organization_id, partner.organization_id, partner.partner_id, partner.partner_id, null, null, null, null, null, 'draft', 'USD', total, 0, total, null, null, null, null, null, timestamp, timestamp] },
    { sql: `INSERT INTO order_items (id,order_id,product_id,quantity,list_price_cents,unit_price_cents,discount_cents,extended_price_cents,service_start,service_end,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [itemId, orderId, product.id, body.quantity, listPrice, unitPrice, 0, total, null, null, timestamp] },
    { sql: `INSERT INTO partner_order_submissions (order_id,partner_id,partner_user_id,end_customer_name,end_customer_uei,end_customer_cage,notes,requires_quote,submitted_at) VALUES (?,?,?,?,?,?,?,?,?)`, args: [orderId, partner.partner_id, partner.id, body.endCustomerName ?? null, body.endCustomerUei ?? null, body.endCustomerCage ?? null, body.notes ?? null, requiresQuote ? 1 : 0, timestamp] },
  ], 'write')
  await writeAudit(c, { actorType: 'partner_user', actorId: partner.auth_user_id, action: 'partner_order.submit', resourceType: 'order', resourceId: orderId, organizationId: partner.organization_id, partnerId: partner.partner_id, after: { sku: product.sku, quantity: body.quantity, totalCents: total, requiresQuote, endCustomerName: body.endCustomerName ?? null } })
  return c.json({ ok: true, orderId, totalCents: total, requiresQuote }, 201)
})

app.get('/admin', async (c) => {
  const admin = await getAdmin(c)
  if (!admin) return c.redirect('/login')
  const db = getDb(c.env)
  const applications = rows<Row>(await db.execute(`SELECT * FROM partner_applications ORDER BY created_at DESC LIMIT 100`))
  const partners = rows<Row>(await db.execute(`
    SELECT p.*,o.legal_name,o.display_name,o.domain,o.uei,o.cage_code,
      (SELECT c.email FROM contacts c WHERE c.organization_id=o.id AND c.email IS NOT NULL ORDER BY c.is_primary DESC,c.created_at ASC LIMIT 1) AS poc_email
    FROM partners p JOIN organizations o ON o.id=p.organization_id
    WHERE p.partner_status='active' ORDER BY COALESCE(o.display_name,o.legal_name)`))
  const orders = rows<Row>(await db.execute(`
    SELECT ord.*,pos.submitted_at,pos.requires_quote,pos.end_customer_name,o.legal_name AS partner_name
    FROM partner_order_submissions pos JOIN orders ord ON ord.id=pos.order_id JOIN partners p ON p.id=pos.partner_id JOIN organizations o ON o.id=p.organization_id
    ORDER BY pos.submitted_at DESC LIMIT 100`))
  const activity = rows<Row>(await db.execute(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 75`))
  return c.html(adminPortalPage({ admin: admin as unknown as Row, applications, partners, orders, activity, logoToken: c.env.LOGO_DEV_TOKEN }))
})

app.post('/api/partner/admin/partners/:id/invite', async (c) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  const partnerId = c.req.param('id')
  const partner = first<Row>(await getDb(c.env).execute({
    sql: `SELECT p.*,o.legal_name,o.id AS organization_id,(SELECT email FROM contacts c WHERE c.organization_id=o.id AND c.email IS NOT NULL ORDER BY c.is_primary DESC,c.created_at ASC LIMIT 1) AS poc_email FROM partners p JOIN organizations o ON o.id=p.organization_id WHERE p.id=? LIMIT 1`,
    args: [partnerId],
  }))
  if (!partner) throw new PortalError(404, 'partner_not_found', 'Partner not found.')
  if (!partner.poc_email) throw new PortalError(422, 'poc_email_missing', 'Partner has no POC email to invite.')
  await issuePartnerInvite(c, partnerId, String(partner.poc_email), String(partner.legal_name))
  await writeAudit(c, { actorType: 'admin', actorId: admin.oid, action: 'partner_invite.create', resourceType: 'partner', resourceId: partnerId, organizationId: String(partner.organization_id), partnerId, after: { email: partner.poc_email } })
  return c.json({ ok: true, email: partner.poc_email })
})

app.get('/oauth/consent', async (c) => {
  const partner = await getPartner(c)
  if (!partner) return c.redirect('/partner/login')
  const clientId = c.req.query('client_id') ?? 'unknown-client'
  const scope = c.req.query('scope') ?? 'openid profile email'
  const claims = c.req.query('claims') ?? null
  return c.html(oauthConsentPage(clientId, scope, claims))
})

app.onError((error, c) => {
  console.error(error)
  if (error instanceof PortalError) {
    const wantsHtml = !c.req.path.startsWith('/api/')
    if (wantsHtml) return c.html(messagePage(error.code.replaceAll('_', ' '), error.message, { label: 'Back', href: '/' }), error.status)
    return c.json({ error: error.code, message: error.message }, error.status)
  }
  return c.req.path.startsWith('/api/')
    ? c.json({ error: 'internal_error', message: 'Unexpected server error.' }, 500)
    : c.html(messagePage('Unexpected error', 'The portal encountered an unexpected error.', { label: 'Home', href: '/' }), 500)
})

export default app
