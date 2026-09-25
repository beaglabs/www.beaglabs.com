import { Hono } from 'hono'
import { first, getDb, rows } from './db'
import type { Bindings } from './env'

type Row = Record<string, unknown>

const app = new Hono<{ Bindings: Bindings }>()

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const error = (message: string, status: 400 | 404 | 409) => Response.json({ error: message }, { status })

app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'no-referrer')
})

app.get('/api/public/products', async (c) => {
  const result = await getDb(c.env).execute(`
    SELECT sku,name,description,product_family,term_type,provisioning_type,list_price_cents,allowed_profiles_json
    FROM products
    WHERE active=1
    ORDER BY sku
  `)
  return c.json({ items: rows<Row>(result) })
})

// These endpoints reveal only the information already carried by a high-entropy,
// expiring email token. The token is hashed before lookup and never returned.
app.get('/api/public/partner-invite', async (c) => {
  const token = c.req.query('token') ?? ''
  if (token.length < 32) return error('invalid_invite', 400)
  const hash = await sha256(token)
  const invite = first<Row>(await getDb(c.env).execute({
    sql: `SELECT i.status,i.email,i.expires_at,o.legal_name
          FROM partner_invites i
          JOIN partners p ON p.id=i.partner_id
          JOIN organizations o ON o.id=p.organization_id
          WHERE i.token_hash=? LIMIT 1`,
    args: [hash],
  }))
  if (!invite) return error('invite_not_found', 404)
  if (String(invite.status) !== 'pending') return error('invite_not_active', 409)
  if (new Date(String(invite.expires_at)).getTime() <= Date.now()) return error('invite_expired', 409)
  return c.json({
    companyName: invite.legal_name,
    email: invite.email,
    expiresAt: invite.expires_at,
  })
})

app.get('/api/public/partner-application-review', async (c) => {
  const token = c.req.query('token') ?? ''
  if (token.length < 32) return error('invalid_review_token', 400)
  const hash = await sha256(token)
  const application = first<Row>(await getDb(c.env).execute({
    sql: `SELECT id,company_name,company_domain,annual_revenue_usd,uei,cage_code,partner_type,main_poc_name,main_poc_email,sku_interests_json,status,decision_expires_at,created_at
          FROM partner_applications WHERE decision_token_hash=? LIMIT 1`,
    args: [hash],
  }))
  if (!application) return error('application_not_found', 404)
  if (String(application.status) !== 'pending') return error(`application_${String(application.status)}`, 409)
  if (new Date(String(application.decision_expires_at)).getTime() <= Date.now()) return error('review_expired', 409)

  let skus: unknown[] = []
  try {
    const parsed = JSON.parse(String(application.sku_interests_json ?? '[]'))
    if (Array.isArray(parsed)) skus = parsed
  } catch {}

  return c.json({
    id: application.id,
    companyName: application.company_name,
    companyDomain: application.company_domain,
    annualRevenueUsd: application.annual_revenue_usd,
    uei: application.uei,
    cage: application.cage_code,
    partnerType: application.partner_type,
    pocName: application.main_poc_name,
    pocEmail: application.main_poc_email,
    skus,
    createdAt: application.created_at,
    expiresAt: application.decision_expires_at,
  })
})

export default app
