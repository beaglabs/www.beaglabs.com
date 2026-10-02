import { Hono } from 'hono'
import { Resend } from 'resend'

import { first, getDb } from './db'
import type { Bindings } from './env'

type Row = Record<string, unknown>
type AppEnv = { Bindings: Bindings }

type MarketplaceLeadPayload = {
  ActionCode?: unknown
  OfferTitle?: unknown
  LeadSource?: unknown
  Description?: unknown
  UserDetails?: Record<string, unknown> | unknown
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

function inferDomain(email: string): string | null {
  const domain = email.split('@')[1]?.trim().toLowerCase() ?? ''
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) return null
  return domain.replace(/^www\./, '')
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
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

async function verifySignature(env: Bindings, rawBody: string, timestamp: string, signatureHeader: string): Promise<boolean> {
  if (!env.MARKETPLACE_LEAD_WEBHOOK_SECRET || !timestamp || !signatureHeader) return false
  const timestampMs = parseTimestamp(timestamp)
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_SIGNATURE_AGE_MS) return false
  const expected = await hmacHex(env.MARKETPLACE_LEAD_WEBHOOK_SECRET, `${timestamp}.${rawBody}`)
  const provided = signatureHeader.trim().toLowerCase().replace(/^sha256=/, '')
  return /^[a-f0-9]{64}$/.test(provided) && constantTimeEqual(expected, provided)
}

function isMicrosoftTestLead(payload: MarketplaceLeadPayload, user: Record<string, unknown>): boolean {
  const values = [
    user.FirstName,
    user.LastName,
    user.Email,
    user.Company,
    user.Title,
    payload.OfferTitle,
    payload.Description,
  ].map(stringValue).join(' ')

  // Partner Center validation leads use MSFT_TEST_* values. Keep the older
  // Contoso/test heuristic as a second guard for HTTPS/Logic App validation.
  if (/MSFT_TEST_/i.test(values)) return true
  const email = stringValue(user.Email)
  const description = stringValue(payload.Description)
  return /@contoso\.com$/i.test(email) && /test/i.test(description)
}

function leadStatus(actionCode: string, isTest: boolean): 'new' | 'qualified' | 'customer' | 'closed' {
  if (isTest || actionCode === 'DNC') return 'closed'
  if (actionCode === 'Create') return 'customer'
  if (actionCode === 'INS') return 'qualified'
  return 'new'
}

async function findOrCreateOrganization(env: Bindings, input: { companyName: string; domain: string | null; active: boolean }): Promise<string> {
  const db = getDb(env)
  const companyName = input.companyName.trim() || input.domain || 'Microsoft Marketplace customer'
  let existing: Row | null = null

  if (input.domain) {
    existing = first<Row>(await db.execute({ sql: 'SELECT * FROM organizations WHERE lower(domain)=? LIMIT 1', args: [input.domain] }))
  }
  if (!existing) {
    existing = first<Row>(await db.execute({
      sql: "SELECT * FROM organizations WHERE lower(legal_name)=lower(?) OR lower(COALESCE(display_name,''))=lower(?) LIMIT 1",
      args: [companyName, companyName],
    }))
  }

  if (existing) {
    const recordId = String(existing.id)
    await db.execute({
      sql: 'UPDATE organizations SET domain=COALESCE(domain,?),status=?,updated_at=? WHERE id=?',
      args: [input.domain, input.active ? 'active' : String(existing.status ?? 'prospect'), now(), recordId],
    })
    return recordId
  }

  const recordId = id('org')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,domain,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?)`,
    args: [recordId, 'commercial', companyName, companyName, input.domain, input.active ? 'active' : 'prospect', timestamp, timestamp],
  })
  return recordId
}

async function findOrCreateContact(env: Bindings, organizationId: string, lead: {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
}): Promise<string | null> {
  if (!lead.email) return null
  const db = getDb(env)
  const existing = first<Row>(await db.execute({ sql: 'SELECT * FROM contacts WHERE lower(email)=lower(?) LIMIT 1', args: [lead.email] }))
  if (existing) {
    const recordId = String(existing.id)
    await db.execute({
      sql: 'UPDATE contacts SET organization_id=?,first_name=?,last_name=?,title=?,phone=?,is_primary=1,updated_at=? WHERE id=?',
      args: [organizationId, lead.firstName || 'Marketplace', lead.lastName || 'Contact', lead.title || null, lead.phone || null, now(), recordId],
    })
    return recordId
  }

  const recordId = id('con')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO contacts (id,organization_id,first_name,last_name,title,email,phone,contact_type,is_primary,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, organizationId, lead.firstName || 'Marketplace', lead.lastName || 'Contact', lead.title || null, lead.email, lead.phone || null, 'other', 1, timestamp, timestamp],
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
  actionCode: string
}) {
  if (!lead.email || !env.RESEND_API_KEY) return
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
    lead.actionCode ? `Action: ${lead.actionCode}` : null,
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
  if (!(await verifySignature(c.env, rawBody, timestamp, signature))) {
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
  const domain = inferDomain(email)
  const companyName = stringValue(user.Company) || domain || 'Microsoft Marketplace lead'
  const actionCode = stringValue(payload.ActionCode)
  const isTest = isMicrosoftTestLead(payload, user)
  const status = leadStatus(actionCode, isTest)
  const suppressContact = isTest || actionCode === 'DNC'

  const externalKey = await sha256(rawBody)
  const db = getDb(c.env)
  const duplicate = first<Row>(await db.execute({ sql: 'SELECT id FROM marketplace_leads WHERE external_key=?', args: [externalKey] }))
  if (duplicate) return c.json({ accepted: true, duplicate: true, id: duplicate.id })

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
    actionCode,
  }

  let organizationId: string | null = null
  let contactId: string | null = null
  if (!suppressContact) {
    organizationId = await findOrCreateOrganization(c.env, { companyName, domain, active: status === 'customer' })
    contactId = await findOrCreateContact(c.env, organizationId, lead)
  }

  const recordId = id('mkl')
  const timestampNow = now()
  await db.execute({
    sql: `INSERT INTO marketplace_leads
      (id,external_key,action_code,lead_source,offer_title,description,first_name,last_name,title,email,phone,country,company_name,domain,organization_id,contact_id,status,raw_json,received_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      recordId, externalKey, actionCode || null, lead.leadSource || null, lead.offerTitle || null,
      lead.description || null, lead.firstName || null, lead.lastName || null, lead.title || null, lead.email || null,
      lead.phone || null, lead.country || null, lead.companyName, domain, organizationId, contactId, status, rawBody, timestampNow, timestampNow,
    ],
  })

  if (!suppressContact) {
    try {
      await sendLeadThread(c.env, lead)
    } catch (error) {
      console.error('marketplace lead email failed', error)
    }
  }

  return c.json({
    accepted: true,
    id: recordId,
    status,
    contactSuppressed: suppressContact,
    suppressionReason: isTest ? 'microsoft_test_lead' : actionCode === 'DNC' ? 'do_not_contact' : null,
  }, 202)
})

export default app
