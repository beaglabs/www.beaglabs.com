import { Hono, type Context } from 'hono'
import { Resend } from 'resend'

import { buildAuth } from './auth'
import { first, getDb, rows } from './db'
import { adminOids, type Bindings } from './env'

type Row = Record<string, unknown>
type AppEnv = { Bindings: Bindings }
type AppContext = Context<AppEnv>

type Admin = {
  oid: string
  tenantId: string
  email?: string
  name?: string
}

type MarketplaceLeadPayload = {
  ActionCode?: unknown
  OfferTitle?: unknown
  LeadSource?: unknown
  Description?: unknown
  UserDetails?: {
    Company?: unknown
    Country?: unknown
    Email?: unknown
    FirstName?: unknown
    LastName?: unknown
    Phone?: unknown
    Title?: unknown
  } | unknown
}

const app = new Hono<AppEnv>()
const JAMES_EMAIL = 'james@beaglabs.com'
const DEFAULT_MARKETPLACE_FROM = 'Beag Labs Marketplace <sales@mail.beaglabs.com>'
const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'yahoo.com', 'aol.com', 'proton.me', 'protonmail.com',
])

function now(): string {
  return new Date().toISOString()
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function numberValue(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function inferDomain(email: string): string | null {
  const domain = email.split('@')[1]?.trim().toLowerCase() ?? ''
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) return null
  return domain.replace(/^www\./, '')
}

function logoUrl(env: Bindings, domain: unknown): string | null {
  const value = stringValue(domain).toLowerCase().replace(/^www\./, '')
  if (!value || !env.LOGO_DEV_TOKEN) return null
  return `https://img.logo.dev/${encodeURIComponent(value)}?token=${encodeURIComponent(env.LOGO_DEV_TOKEN)}&size=128&format=png`
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function parseTimestamp(value: string): number {
  if (/^\d+$/.test(value)) {
    const n = Number(value)
    return value.length <= 10 ? n * 1000 : n
  }
  return Date.parse(value)
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return diff === 0
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyLeadSignature(env: Bindings, rawBody: string, timestamp: string, signatureHeader: string): Promise<boolean> {
  const secret = env.MARKETPLACE_LEAD_WEBHOOK_SECRET
  if (!secret || !timestamp || !signatureHeader) return false
  const timestampMs = parseTimestamp(timestamp)
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_SIGNATURE_AGE_MS) return false
  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`)
  const provided = signatureHeader.trim().toLowerCase().replace(/^sha256=/, '')
  return /^[a-f0-9]{64}$/.test(provided) && constantTimeEqual(expected, provided)
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

async function findOrCreateOrganization(env: Bindings, input: { companyName: string; domain?: string | null; active?: boolean }): Promise<string> {
  const db = getDb(env)
  const companyName = input.companyName.trim() || input.domain || 'Microsoft Marketplace customer'
  const domain = input.domain?.trim().toLowerCase() || null

  let existing: Row | null = null
  if (domain) {
    existing = first<Row>(await db.execute({ sql: 'SELECT * FROM organizations WHERE lower(domain)=? LIMIT 1', args: [domain] }))
  }
  if (!existing && companyName) {
    existing = first<Row>(await db.execute({
      sql: 'SELECT * FROM organizations WHERE lower(legal_name)=lower(?) OR lower(COALESCE(display_name,\'\'))=lower(?) LIMIT 1',
      args: [companyName, companyName],
    }))
  }

  if (existing) {
    const recordId = String(existing.id)
    await db.execute({
      sql: `UPDATE organizations SET domain=COALESCE(domain,?),status=?,updated_at=? WHERE id=?`,
      args: [domain, input.active ? 'active' : String(existing.status ?? 'prospect'), now(), recordId],
    })
    return recordId
  }

  const recordId = id('org')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,domain,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?)`,
    args: [recordId, 'commercial', companyName, companyName, domain, input.active ? 'active' : 'prospect', timestamp, timestamp],
  })
  return recordId
}

async function findOrCreateContact(env: Bindings, organizationId: string, input: {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
}): Promise<string | null> {
  if (!input.email) return null
  const db = getDb(env)
  const existing = first<Row>(await db.execute({ sql: 'SELECT * FROM contacts WHERE lower(email)=lower(?) LIMIT 1', args: [input.email] }))
  if (existing) {
    const recordId = String(existing.id)
    await db.execute({
      sql: `UPDATE contacts SET organization_id=?,first_name=?,last_name=?,title=?,phone=?,is_primary=1,updated_at=? WHERE id=?`,
      args: [organizationId, input.firstName || 'Marketplace', input.lastName || 'Contact', input.title || null, input.phone || null, now(), recordId],
    })
    return recordId
  }

  const recordId = id('con')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO contacts (id,organization_id,first_name,last_name,title,email,phone,contact_type,is_primary,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, organizationId, input.firstName || 'Marketplace', input.lastName || 'Contact', input.title || null, input.email, input.phone || null, 'other', 1, timestamp, timestamp],
  })
  return recordId
}

async function sendLeadThread(env: Bindings, lead: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  title: string
  phone: string
  country: string
  offerTitle: string
  leadSource: string
  description: string
}) {
  if (!lead.email || !env.RESEND_API_KEY) return
  const isMicrosoftTest = /@contoso\.com$/i.test(lead.email) && /test/i.test(lead.description)
  if (isMicrosoftTest) return

  const resend = new Resend(env.RESEND_API_KEY)
  const from = env.MARKETPLACE_FROM_EMAIL || DEFAULT_MARKETPLACE_FROM
  const name = `${lead.firstName} ${lead.lastName}`.trim() || 'there'
  const subject = `Papyrus on Microsoft Marketplace — ${lead.companyName || name}`
  const details = [
    `Contact: ${name} <${lead.email}>`,
    lead.title ? `Title: ${lead.title}` : null,
    lead.companyName ? `Company: ${lead.companyName}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.country ? `Country: ${lead.country}` : null,
    lead.offerTitle ? `Offer: ${lead.offerTitle}` : null,
    lead.leadSource ? `Lead source: ${lead.leadSource}` : null,
    lead.description ? `Marketplace note: ${lead.description}` : null,
  ].filter((line): line is string => Boolean(line)).join('\n')

  const customer = await resend.emails.send({
    from,
    to: lead.email,
    replyTo: JAMES_EMAIL,
    subject,
    text: `Hi ${lead.firstName || name},\n\nThanks for your interest in Papyrus through Microsoft Marketplace. I wanted to open a direct thread in case you have questions about deployment, pricing, or fit. Just reply to this email and it will come directly to me.\n\n— James\nBeag Labs`,
  })
  if (customer.error) throw new Error(`Resend customer message failed: ${customer.error.message}`)

  const admin = await resend.emails.send({
    from,
    to: JAMES_EMAIL,
    replyTo: lead.email,
    subject,
    text: `New Microsoft Marketplace lead. Reply to this email to respond directly to the contact.\n\n${details}`,
  })
  if (admin.error) throw new Error(`Resend admin message failed: ${admin.error.message}`)
}

app.post('/api/marketplace/leads', async (c) => {
  const rawBody = await c.req.text()
  const timestamp = c.req.header('x-beag-timestamp') ?? ''
  const signature = c.req.header('x-beag-signature') ?? ''
  if (!(await verifyLeadSignature(c.env, rawBody, timestamp, signature))) {
    return c.json({ error: 'invalid_signature', message: 'Marketplace webhook signature is invalid or expired.' }, 401)
  }

  let payload: MarketplaceLeadPayload
  try {
    payload = JSON.parse(rawBody) as MarketplaceLeadPayload
  } catch {
    return c.json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, 400)
  }

  const user = payload.UserDetails && typeof payload.UserDetails === 'object'
    ? payload.UserDetails as Record<string, unknown>
    : {}
  const email = stringValue(user.Email).toLowerCase()
  const companyName = stringValue(user.Company) || inferDomain(email) || 'Microsoft Marketplace lead'
  const domain = inferDomain(email)
  const externalKey = await sha256(rawBody)
  const db = getDb(c.env)
  const duplicate = first<Row>(await db.execute({ sql: 'SELECT id FROM marketplace_leads WHERE external_key=?', args: [externalKey] }))
  if (duplicate) return c.json({ accepted: true, duplicate: true, id: duplicate.id })

  const organizationId = await findOrCreateOrganization(c.env, { companyName, domain, active: false })
  const lead = {
    firstName: stringValue(user.FirstName),
    lastName: stringValue(user.LastName),
    title: stringValue(user.Title),
    email,
    phone: stringValue(user.Phone),
    country: stringValue(user.Country),
    companyName,
    offerTitle: stringValue(payload.OfferTitle),
    leadSource: stringValue(payload.LeadSource),
    description: stringValue(payload.Description),
  }
  const contactId = await findOrCreateContact(c.env, organizationId, lead)
  const recordId = id('mkl')
  const timestampNow = now()

  await db.execute({
    sql: `INSERT INTO marketplace_leads
      (id,external_key,action_code,lead_source,offer_title,description,first_name,last_name,title,email,phone,country,company_name,domain,organization_id,contact_id,status,raw_json,received_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      recordId, externalKey, stringValue(payload.ActionCode) || null, lead.leadSource || null, lead.offerTitle || null,
      lead.description || null, lead.firstName || null, lead.lastName || null, lead.title || null, lead.email || null,
      lead.phone || null, lead.country || null, lead.companyName, domain, organizationId, contactId, 'new', rawBody, timestampNow, timestampNow,
    ],
  })

  try {
    await sendLeadThread(c.env, lead)
  } catch (error) {
    console.error('marketplace lead email failed', error)
  }

  return c.json({ accepted: true, id: recordId }, 202)
})

app.use('/api/v1/marketplace/*', async (c, next) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  await next()
})

app.get('/api/v1/marketplace/overview', async (c) => {
  const db = getDb(c.env)
  const [leadCount, newLeadCount, customerCount, usageCount, lastSync] = await Promise.all([
    db.execute('SELECT COUNT(*) AS count FROM marketplace_leads'),
    db.execute("SELECT COUNT(*) AS count FROM marketplace_leads WHERE status='new'"),
    db.execute(`SELECT COUNT(*) AS count FROM organizations o WHERE EXISTS (SELECT 1 FROM marketplace_leads l WHERE l.organization_id=o.id) OR EXISTS (SELECT 1 FROM marketplace_vm_customers m WHERE m.organization_id=o.id)`),
    db.execute('SELECT COUNT(*) AS count FROM marketplace_vm_customers'),
    db.execute('SELECT * FROM marketplace_sync_runs ORDER BY started_at DESC LIMIT 1'),
  ])
  return c.json({
    leadCount: Number(first<Row>(leadCount)?.count ?? 0),
    newLeadCount: Number(first<Row>(newLeadCount)?.count ?? 0),
    customerCount: Number(first<Row>(customerCount)?.count ?? 0),
    marketplaceCustomerCount: Number(first<Row>(usageCount)?.count ?? 0),
    analyticsConfigured: Boolean((c.env.MARKETPLACE_ANALYTICS_CLIENT_ID || c.env.MICROSOFT_CLIENT_ID) && (c.env.MARKETPLACE_ANALYTICS_CLIENT_SECRET || c.env.MICROSOFT_CLIENT_SECRET)),
    lastSync: first<Row>(lastSync),
  })
})

app.get('/api/v1/marketplace/leads', async (c) => {
  const result = await getDb(c.env).execute({
    sql: `SELECT l.*,COALESCE(o.display_name,o.legal_name,l.company_name) AS organization_name,o.domain AS organization_domain
          FROM marketplace_leads l LEFT JOIN organizations o ON o.id=l.organization_id
          ORDER BY l.received_at DESC LIMIT ?`,
    args: [Math.min(Number(c.req.query('limit') || 250), 500)],
  })
  return c.json({ items: rows<Row>(result).map((row) => ({ ...row, logo_url: logoUrl(c.env, row.organization_domain ?? row.domain) })) })
})

app.patch('/api/v1/marketplace/leads/:id', async (c) => {
  const status = stringValue((await c.req.json().catch(() => ({})) as Record<string, unknown>).status)
  if (!['new', 'contacted', 'qualified', 'customer', 'closed'].includes(status)) {
    return c.json({ error: 'validation_error', message: 'Invalid lead status.' }, 422)
  }
  const db = getDb(c.env)
  await db.execute({ sql: 'UPDATE marketplace_leads SET status=?,updated_at=? WHERE id=?', args: [status, now(), c.req.param('id')] })
  const updated = first<Row>(await db.execute({ sql: 'SELECT * FROM marketplace_leads WHERE id=?', args: [c.req.param('id')] }))
  if (!updated) return c.json({ error: 'not_found', message: 'Marketplace lead not found.' }, 404)
  return c.json(updated)
})

app.get('/api/v1/marketplace/customers', async (c) => {
  const result = await getDb(c.env).execute({
    sql: `SELECT o.*,
      (SELECT email FROM contacts c WHERE c.organization_id=o.id ORDER BY c.is_primary DESC,c.created_at ASC LIMIT 1) AS contact_email,
      (SELECT first_name || ' ' || last_name FROM contacts c WHERE c.organization_id=o.id ORDER BY c.is_primary DESC,c.created_at ASC LIMIT 1) AS contact_name,
      (SELECT COUNT(*) FROM marketplace_leads l WHERE l.organization_id=o.id) AS lead_count,
      (SELECT MAX(received_at) FROM marketplace_leads l WHERE l.organization_id=o.id) AS last_lead_at,
      (SELECT MAX(last_seen_at) FROM marketplace_vm_customers m WHERE m.organization_id=o.id) AS last_marketplace_seen_at,
      (SELECT offer_name FROM marketplace_vm_customers m WHERE m.organization_id=o.id ORDER BY last_seen_at DESC LIMIT 1) AS offer_name,
      (SELECT sku FROM marketplace_vm_customers m WHERE m.organization_id=o.id ORDER BY last_seen_at DESC LIMIT 1) AS sku,
      (SELECT marketplace_subscription_id FROM marketplace_vm_customers m WHERE m.organization_id=o.id ORDER BY last_seen_at DESC LIMIT 1) AS marketplace_subscription_id
      FROM organizations o
      WHERE EXISTS (SELECT 1 FROM marketplace_leads l WHERE l.organization_id=o.id)
         OR EXISTS (SELECT 1 FROM marketplace_vm_customers m WHERE m.organization_id=o.id)
      ORDER BY COALESCE(last_marketplace_seen_at,last_lead_at,o.updated_at) DESC
      LIMIT ?`,
    args: [Math.min(Number(c.req.query('limit') || 250), 500)],
  })
  return c.json({ items: rows<Row>(result).map((row) => ({ ...row, logo_url: logoUrl(c.env, row.domain) })) })
})

app.get('/api/v1/marketplace/usage', async (c) => {
  const result = await getDb(c.env).execute({
    sql: `SELECT m.*,COALESCE(o.display_name,o.legal_name,m.customer_company_name) AS organization_name,o.domain
          FROM marketplace_vm_customers m LEFT JOIN organizations o ON o.id=m.organization_id
          ORDER BY m.last_seen_at DESC LIMIT ?`,
    args: [Math.min(Number(c.req.query('limit') || 250), 500)],
  })
  return c.json({ items: rows<Row>(result).map((row) => ({ ...row, logo_url: logoUrl(c.env, row.domain) })) })
})

app.get('/api/v1/marketplace/activity', async (c) => {
  const result = await getDb(c.env).execute({
    sql: `SELECT 'lead' AS kind,id,company_name AS title,offer_title AS offer,status,received_at AS occurred_at,email AS detail FROM marketplace_leads
          UNION ALL
          SELECT 'usage' AS kind,id,customer_company_name AS title,offer_name AS offer,'active' AS status,last_seen_at AS occurred_at,sku AS detail FROM marketplace_vm_customers
          ORDER BY occurred_at DESC LIMIT ?`,
    args: [Math.min(Number(c.req.query('limit') || 100), 250)],
  })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v1/marketplace/sync', async (c) => {
  try {
    return c.json(await syncMarketplaceVmUsage(c.env))
  } catch (error) {
    console.error('marketplace analytics sync failed', error)
    return c.json({ error: 'sync_failed', message: error instanceof Error ? error.message : 'Marketplace analytics sync failed.' }, 502)
  }
})

async function partnerCenterToken(env: Bindings): Promise<string> {
  const tenantId = env.MARKETPLACE_ANALYTICS_TENANT_ID || env.MICROSOFT_TENANT_ID
  const clientId = env.MARKETPLACE_ANALYTICS_CLIENT_ID || env.MICROSOFT_CLIENT_ID
  const clientSecret = env.MARKETPLACE_ANALYTICS_CLIENT_SECRET || env.MICROSOFT_CLIENT_SECRET
  if (!tenantId || !clientId || !clientSecret) throw new Error('Marketplace analytics credentials are not configured.')

  const body = new URLSearchParams({
    resource: 'https://api.partnercenter.microsoft.com',
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw new Error(`Partner Center token request failed (${response.status}): ${await response.text()}`)
  const json = await response.json() as { access_token?: string }
  if (!json.access_token) throw new Error('Partner Center token response did not contain an access token.')
  return json.access_token
}

async function fetchVmUsage(env: Bindings): Promise<Row[]> {
  const token = await partnerCenterToken(env)
  const query = `SELECT MarketplaceSubscriptionId,OfferType,AzureLicenseType,MarketplaceLicenseType,SKU,CustomerCountry,VMSize,CloudInstanceName,OfferName,DeploymentMethod,CustomerName,CustomerCompanyName,UsageDate,IsNewCustomer,CustomerId,BillingAccountId,NormalizedUsage,RawUsage,EstimatedExtendedChargePC,TrialEndDate,SKUBillingType,CustomerCurrencyCC,PriceCC,EstimatedPricePC FROM ISVUsage WHERE OfferType IN ('vm core image', 'Virtual Machine Licenses', 'multisolution') TIMESPAN LAST_MONTH`
  const url = new URL('https://api.partnercenter.microsoft.com/insights/v1.1/cmp/ScheduledQueries/testQueryResult')
  url.searchParams.set('exportQuery', query)
  const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`Partner Center ISVUsage query failed (${response.status}): ${await response.text()}`)
  const json = await response.json() as { value?: Row[]; message?: string }
  return Array.isArray(json.value) ? json.value : []
}

export async function syncMarketplaceVmUsage(env: Bindings): Promise<{ status: string; recordsSeen: number; recordsWritten: number }> {
  const db = getDb(env)
  const runId = id('mks')
  const startedAt = now()
  await db.execute({
    sql: `INSERT INTO marketplace_sync_runs (id,source,status,records_seen,records_written,started_at) VALUES (?,?,?,?,?,?)`,
    args: [runId, 'partner_center_isvusage', 'started', 0, 0, startedAt],
  })

  try {
    const records = await fetchVmUsage(env)
    let written = 0
    for (const record of records) {
      const companyName = stringValue(record.CustomerCompanyName) || stringValue(record.CustomerName) || 'Microsoft Marketplace customer'
      const organizationId = await findOrCreateOrganization(env, { companyName, active: true })
      const observationKey = await sha256([
        stringValue(record.MarketplaceSubscriptionId),
        stringValue(record.CustomerId),
        stringValue(record.OfferName),
        stringValue(record.SKU),
      ].join('|'))
      const timestamp = now()
      const usageDate = stringValue(record.UsageDate) || timestamp
      const existing = first<Row>(await db.execute({ sql: 'SELECT id FROM marketplace_vm_customers WHERE observation_key=?', args: [observationKey] }))
      const recordId = existing ? String(existing.id) : id('mkc')

      await db.execute({
        sql: `INSERT INTO marketplace_vm_customers
          (id,observation_key,marketplace_subscription_id,customer_id,billing_account_id,customer_name,customer_company_name,customer_country,offer_name,sku,azure_license_type,marketplace_license_type,vm_size,cloud_instance_name,deployment_method,first_seen_at,last_seen_at,normalized_usage,raw_usage,estimated_charge,trial_end_date,sku_billing_type,customer_currency_cc,price_cc,estimated_price_pc,organization_id,raw_json,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(observation_key) DO UPDATE SET
            marketplace_subscription_id=excluded.marketplace_subscription_id,
            customer_id=excluded.customer_id,
            billing_account_id=excluded.billing_account_id,
            customer_name=excluded.customer_name,
            customer_company_name=excluded.customer_company_name,
            customer_country=excluded.customer_country,
            offer_name=excluded.offer_name,
            sku=excluded.sku,
            azure_license_type=excluded.azure_license_type,
            marketplace_license_type=excluded.marketplace_license_type,
            vm_size=excluded.vm_size,
            cloud_instance_name=excluded.cloud_instance_name,
            deployment_method=excluded.deployment_method,
            first_seen_at=CASE WHEN excluded.first_seen_at < marketplace_vm_customers.first_seen_at THEN excluded.first_seen_at ELSE marketplace_vm_customers.first_seen_at END,
            last_seen_at=CASE WHEN excluded.last_seen_at > marketplace_vm_customers.last_seen_at THEN excluded.last_seen_at ELSE marketplace_vm_customers.last_seen_at END,
            normalized_usage=MAX(COALESCE(marketplace_vm_customers.normalized_usage,0),COALESCE(excluded.normalized_usage,0)),
            raw_usage=MAX(COALESCE(marketplace_vm_customers.raw_usage,0),COALESCE(excluded.raw_usage,0)),
            estimated_charge=MAX(COALESCE(marketplace_vm_customers.estimated_charge,0),COALESCE(excluded.estimated_charge,0)),
            trial_end_date=COALESCE(excluded.trial_end_date,marketplace_vm_customers.trial_end_date),
            sku_billing_type=COALESCE(excluded.sku_billing_type,marketplace_vm_customers.sku_billing_type),
            customer_currency_cc=COALESCE(excluded.customer_currency_cc,marketplace_vm_customers.customer_currency_cc),
            price_cc=COALESCE(excluded.price_cc,marketplace_vm_customers.price_cc),
            estimated_price_pc=COALESCE(excluded.estimated_price_pc,marketplace_vm_customers.estimated_price_pc),
            organization_id=excluded.organization_id,
            raw_json=excluded.raw_json,
            updated_at=excluded.updated_at`,
        args: [
          recordId, observationKey, stringValue(record.MarketplaceSubscriptionId) || null, stringValue(record.CustomerId) || null,
          stringValue(record.BillingAccountId) || null, stringValue(record.CustomerName) || null, companyName,
          stringValue(record.CustomerCountry) || null, stringValue(record.OfferName) || null, stringValue(record.SKU) || null,
          stringValue(record.AzureLicenseType) || null, stringValue(record.MarketplaceLicenseType) || null, stringValue(record.VMSize) || null,
          stringValue(record.CloudInstanceName) || null, stringValue(record.DeploymentMethod) || null, usageDate, usageDate,
          numberValue(record.NormalizedUsage), numberValue(record.RawUsage), numberValue(record.EstimatedExtendedChargePC),
          stringValue(record.TrialEndDate) || null, stringValue(record.SKUBillingType) || null,
          stringValue(record.CustomerCurrencyCC) || null, numberValue(record.PriceCC), numberValue(record.EstimatedPricePC),
          organizationId, JSON.stringify(record), timestamp, timestamp,
        ],
      })
      written += 1

      await db.execute({
        sql: `UPDATE marketplace_leads SET status='customer',updated_at=? WHERE organization_id=? AND status NOT IN ('customer','closed')`,
        args: [timestamp, organizationId],
      })
    }

    await db.execute({
      sql: `UPDATE marketplace_sync_runs SET status='completed',records_seen=?,records_written=?,completed_at=? WHERE id=?`,
      args: [records.length, written, now(), runId],
    })
    return { status: 'completed', recordsSeen: records.length, recordsWritten: written }
  } catch (error) {
    await db.execute({
      sql: `UPDATE marketplace_sync_runs SET status='failed',error_message=?,completed_at=? WHERE id=?`,
      args: [error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000), now(), runId],
    })
    throw error
  }
}

export default app
