import { Hono, type Context } from 'hono'
import { z, ZodError, type ZodType } from 'zod'

import { buildAuth } from './auth'
import { first, getDb, rows, type Database } from './db'
import { adminOids, type Bindings } from './env'

type Row = Record<string, unknown>
type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type AppEnv = { Bindings: Bindings; Variables: { admin: Admin } }
type AppContext = Context<AppEnv>

const app = new Hono<AppEnv>()

const RESOURCE_TYPES = ['person', 'organization', 'opportunity', 'order', 'vehicle'] as const
const LINK_RESOURCE_TYPES = ['organization', 'opportunity', 'order', 'vehicle'] as const
const REFERENCE_RESOURCE_TYPES = ['organization', 'opportunity', 'order', 'vehicle'] as const
const LEAD_STAGES = ['new', 'contacted', 'qualified', 'nurture', 'customer', 'closed', 'do_not_contact'] as const
const ACCOUNT_STAGES = ['prospect', 'qualified', 'active_customer', 'partner', 'inactive'] as const
const RELATIONSHIP_TYPES = ['lead', 'contact', 'customer', 'partner', 'other'] as const
const REFERENCE_TYPES = ['sam_notice', 'sam_award', 'solicitation', 'prime_contract', 'subcontract', 'task_order', 'purchase_order', 'vehicle', 'other'] as const
const ACTIVITY_TYPES = ['note', 'email', 'call', 'meeting', 'task', 'status', 'file', 'contract', 'other'] as const

const nullableText = z.string().trim().max(4000).nullable().optional()
const nullableShortText = z.string().trim().max(512).nullable().optional()
const nullableUrl = z.string().trim().url().max(2048).nullable().optional()
const isoDate = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))

const personCreateSchema = z.object({
  organizationId: z.string().min(1).nullable().optional(),
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().min(1).max(128),
  title: nullableShortText,
  email: z.string().trim().email().nullable().optional(),
  phone: nullableShortText,
  linkedinUrl: nullableUrl,
  avatarUrl: nullableUrl,
  leadStage: z.enum(LEAD_STAGES).optional().default('new'),
  leadSource: nullableShortText,
  relationshipType: z.enum(RELATIONSHIP_TYPES).optional().default('lead'),
  status: z.enum(['active', 'inactive', 'archived']).optional().default('active'),
  notes: nullableText,
  tags: z.array(z.string().trim().min(1).max(64)).max(50).optional().default([]),
  lastContactedAt: isoDate.nullable().optional(),
  nextFollowUpAt: isoDate.nullable().optional(),
})
const personPatchSchema = personCreateSchema.partial()

const customerCreateSchema = z.object({
  organizationType: z.enum(['federal_agency', 'state_local', 'commercial', 'prime', 'distributor', 'reseller', 'integrator', 'partner']),
  legalName: z.string().trim().min(1).max(256),
  displayName: nullableShortText,
  uei: nullableShortText,
  cageCode: nullableShortText,
  domain: nullableShortText,
  status: z.enum(['active', 'inactive', 'prospect']).optional().default('prospect'),
  websiteUrl: nullableUrl,
  linkedinUrl: nullableUrl,
  logoUrl: nullableUrl,
  accountStage: z.enum(ACCOUNT_STAGES).optional().default('prospect'),
  notes: nullableText,
  tags: z.array(z.string().trim().min(1).max(64)).max(50).optional().default([]),
})
const customerPatchSchema = customerCreateSchema.partial()

const opportunityCreateSchema = z.object({
  customerOrganizationId: z.string().min(1),
  name: z.string().trim().min(1).max(256),
  stage: z.enum(['identified','qualified','pilot_proposed','technical_validation','procurement','verbal','closed_won','closed_lost']).optional().default('identified'),
  estimatedValueCents: z.number().int().nonnegative().nullable().optional(),
  expectedCloseDate: isoDate.nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  expectedProductId: z.string().nullable().optional(),
})
const opportunityPatchSchema = opportunityCreateSchema.omit({ customerOrganizationId: true }).partial()

const orderPatchSchema = z.object({
  status: z.enum(['draft','booked','fulfilled','cancelled','refunded']).optional(),
  contractNumber: nullableShortText,
  taskOrderNumber: nullableShortText,
  poNumber: nullableShortText,
  opportunityId: z.string().nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
})

const referenceCreateSchema = z.object({
  resourceType: z.enum(REFERENCE_RESOURCE_TYPES),
  resourceId: z.string().min(1),
  referenceType: z.enum(REFERENCE_TYPES),
  identifier: z.string().trim().min(1).max(256),
  url: nullableUrl,
  label: nullableShortText,
  notes: nullableText,
})

const linkCreateSchema = z.object({
  personId: z.string().min(1),
  resourceType: z.enum(LINK_RESOURCE_TYPES),
  resourceId: z.string().min(1),
  role: z.string().trim().min(1).max(128).optional().default('stakeholder'),
  isPrimary: z.boolean().optional().default(false),
})

const activityCreateSchema = z.object({
  organizationId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  resourceType: z.enum(RESOURCE_TYPES).nullable().optional(),
  resourceId: z.string().nullable().optional(),
  activityType: z.enum(ACTIVITY_TYPES).optional().default('note'),
  subject: nullableShortText,
  body: nullableText,
  occurredAt: isoDate.optional(),
})

const externalAttachmentSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  resourceId: z.string().min(1),
  fileName: z.string().trim().min(1).max(512),
  externalUrl: z.string().trim().url().max(2048),
  contentType: nullableShortText,
  description: nullableText,
})

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function now() {
  return new Date().toISOString()
}

function limit(c: AppContext, fallback = 250, max = 1000) {
  const parsed = Number.parseInt(c.req.query('limit') ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

function requestId(c: AppContext) {
  return c.req.header('cf-ray') ?? c.req.header('x-request-id') ?? crypto.randomUUID()
}

function jsonArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function decorate(row: Row | null): Row | null {
  if (!row) return null
  const result = { ...row }
  if ('tags_json' in result) result.tags = jsonArray(result.tags_json)
  return result
}

async function parseBody<T>(c: AppContext, schema: ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new Response(JSON.stringify({ error: 'invalid_json', message: 'Request body must be valid JSON.' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
  try {
    return schema.parse(raw)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Response(JSON.stringify({ error: 'validation_error', message: error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ') }), { status: 422, headers: { 'content-type': 'application/json' } })
    }
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

app.use('/api/v2/crm/*', async (c, next) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  c.set('admin', admin)
  await next()
})

async function audit(c: AppContext, action: string, resourceType: string, resourceId: string | null, organizationId: string | null, before: unknown, after: unknown) {
  const admin = c.get('admin')
  await getDb(c.env).execute({
    sql: `INSERT INTO audit_events (id,actor_type,actor_id,action,resource_type,resource_id,organization_id,partner_id,request_id,source_ip,user_agent,before_json,after_json,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('aud'), 'admin', admin.oid, action, resourceType, resourceId, organizationId, null, requestId(c),
      c.req.header('cf-connecting-ip') ?? null, c.req.header('user-agent') ?? null,
      before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, now(),
    ],
  })
}

async function organizationExists(db: Database, organizationId: string | null | undefined) {
  if (!organizationId) return true
  return Boolean(first<Row>(await db.execute({ sql: 'SELECT id FROM organizations WHERE id=?', args: [organizationId] })))
}

async function resourceExists(db: Database, resourceType: typeof RESOURCE_TYPES[number], resourceId: string) {
  const table = {
    person: 'crm_people',
    organization: 'organizations',
    opportunity: 'opportunities',
    order: 'orders',
    vehicle: 'vehicles',
  }[resourceType]
  return Boolean(first<Row>(await db.execute({ sql: `SELECT id FROM ${table} WHERE id=?`, args: [resourceId] })))
}

function linkedInProfileUrl(value: string | null | undefined): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (url.protocol !== 'https:' || host !== 'linkedin.com' || !url.pathname.startsWith('/in/')) return null
    return url
  } catch {
    return null
  }
}

function decodeHtml(value: string) {
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>')
}

async function resolveLinkedInAvatar(linkedinUrl: string | null | undefined): Promise<string | null> {
  const url = linkedInProfileUrl(linkedinUrl)
  if (!url) return null
  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'Mozilla/5.0 (compatible; BeagLabsCRM/1.0; +https://www.beaglabs.com)',
      },
      redirect: 'follow',
    })
    if (!response.ok) return null
    const html = await response.text()
    const candidates = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]
    for (const pattern of candidates) {
      const match = html.match(pattern)
      if (match?.[1]) {
        const image = decodeHtml(match[1])
        if (/^https:\/\//i.test(image)) return image
      }
    }
  } catch (error) {
    console.warn('LinkedIn avatar resolution failed', error)
  }
  return null
}

function logoForDomain(env: Bindings, domain: unknown) {
  const value = typeof domain === 'string' ? domain.trim().replace(/^https?:\/\//, '').split('/')[0] : ''
  return value ? `https://img.logo.dev/${encodeURIComponent(value)}?token=${encodeURIComponent(env.LOGO_DEV_TOKEN)}&size=128&format=png` : null
}

app.get('/api/v2/crm/dashboard', async (c) => {
  const db = getDb(c.env)
  const [people, customers, opportunities, orders, followUps] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM crm_people WHERE status='active'"),
    db.execute("SELECT COUNT(*) AS count FROM organizations WHERE status!='inactive'"),
    db.execute("SELECT COUNT(*) AS count, COALESCE(SUM(estimated_value_cents),0) AS value FROM opportunities WHERE stage NOT IN ('closed_won','closed_lost')"),
    db.execute("SELECT COUNT(*) AS count, COALESCE(SUM(total_cents),0) AS value FROM orders WHERE status IN ('booked','fulfilled')"),
    db.execute("SELECT COUNT(*) AS count FROM crm_people WHERE next_follow_up_at IS NOT NULL AND next_follow_up_at <= datetime('now','+7 days') AND status='active'"),
  ])
  return c.json({
    people: Number(people.rows[0]?.count ?? 0),
    customers: Number(customers.rows[0]?.count ?? 0),
    openOpportunities: Number(opportunities.rows[0]?.count ?? 0),
    pipelineValueCents: Number(opportunities.rows[0]?.value ?? 0),
    orders: Number(orders.rows[0]?.count ?? 0),
    bookedValueCents: Number(orders.rows[0]?.value ?? 0),
    followUpsDue: Number(followUps.rows[0]?.count ?? 0),
  })
})

app.get('/api/v2/crm/people', async (c) => {
  const db = getDb(c.env)
  const q = c.req.query('q')?.trim()
  const stage = c.req.query('stage')?.trim()
  const organizationId = c.req.query('organizationId')?.trim()
  const where: string[] = []
  const args: unknown[] = []
  if (q) {
    const term = `%${q}%`
    where.push("(p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ? OR p.title LIKE ? OR p.linkedin_url LIKE ? OR COALESCE(o.display_name,o.legal_name,'') LIKE ?)")
    args.push(term, term, term, term, term, term)
  }
  if (stage) { where.push('p.lead_stage=?'); args.push(stage) }
  if (organizationId) { where.push('p.organization_id=?'); args.push(organizationId) }
  args.push(limit(c))
  const result = await db.execute({
    sql: `SELECT p.*,COALESCE(o.display_name,o.legal_name) AS organization_name,o.organization_type
          FROM crm_people p LEFT JOIN organizations o ON o.id=p.organization_id
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY p.updated_at DESC LIMIT ?`,
    args,
  })
  return c.json({ items: rows<Row>(result).map((row) => decorate(row)) })
})

app.post('/api/v2/crm/people', async (c) => {
  const body = await parseBody(c, personCreateSchema)
  const db = getDb(c.env)
  if (!(await organizationExists(db, body.organizationId))) return c.json({ error: 'organization_not_found', message: 'Customer organization not found.' }, 404)
  const timestamp = now()
  const recordId = id('per')
  const avatarUrl = body.avatarUrl ?? await resolveLinkedInAvatar(body.linkedinUrl)
  await db.execute({
    sql: `INSERT INTO crm_people
      (id,organization_id,first_name,last_name,title,email,phone,linkedin_url,avatar_url,lead_stage,lead_source,relationship_type,status,owner_oid,notes,tags_json,last_contacted_at,next_follow_up_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      recordId, body.organizationId ?? null, body.firstName, body.lastName, body.title ?? null, body.email ?? null, body.phone ?? null,
      body.linkedinUrl ?? null, avatarUrl, body.leadStage, body.leadSource ?? null, body.relationshipType, body.status,
      c.get('admin').oid, body.notes ?? null, JSON.stringify(body.tags), body.lastContactedAt ?? null, body.nextFollowUpAt ?? null, timestamp, timestamp,
    ],
  })
  const created = first<Row>(await db.execute({ sql: `SELECT p.*,COALESCE(o.display_name,o.legal_name) AS organization_name FROM crm_people p LEFT JOIN organizations o ON o.id=p.organization_id WHERE p.id=?`, args: [recordId] }))
  await audit(c, 'crm.person.create', 'person', recordId, body.organizationId ?? null, null, created)
  return c.json(decorate(created), 201)
})

app.get('/api/v2/crm/people/:id', async (c) => {
  const db = getDb(c.env)
  const person = first<Row>(await db.execute({
    sql: `SELECT p.*,COALESCE(o.display_name,o.legal_name) AS organization_name,o.legal_name AS organization_legal_name
          FROM crm_people p LEFT JOIN organizations o ON o.id=p.organization_id WHERE p.id=?`,
    args: [c.req.param('id')],
  }))
  if (!person) return c.json({ error: 'person_not_found', message: 'Person not found.' }, 404)
  const [links, attachments, activities] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM crm_record_people WHERE person_id=? ORDER BY created_at DESC', args: [person.id] }),
    db.execute({ sql: "SELECT * FROM crm_attachments WHERE resource_type='person' AND resource_id=? ORDER BY created_at DESC", args: [person.id] }),
    db.execute({ sql: 'SELECT * FROM crm_activities WHERE person_id=? OR (resource_type=\'person\' AND resource_id=?) ORDER BY occurred_at DESC LIMIT 100', args: [person.id, person.id] }),
  ])
  return c.json({ ...decorate(person), links: rows<Row>(links), attachments: rows<Row>(attachments), activities: rows<Row>(activities) })
})

app.patch('/api/v2/crm/people/:id', async (c) => {
  const body = await parseBody(c, personPatchSchema)
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const before = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_people WHERE id=?', args: [recordId] }))
  if (!before) return c.json({ error: 'person_not_found', message: 'Person not found.' }, 404)
  if (body.organizationId !== undefined && !(await organizationExists(db, body.organizationId))) return c.json({ error: 'organization_not_found', message: 'Customer organization not found.' }, 404)

  const mapping: Record<string, string> = {
    organizationId: 'organization_id', firstName: 'first_name', lastName: 'last_name', title: 'title', email: 'email',
    phone: 'phone', linkedinUrl: 'linkedin_url', avatarUrl: 'avatar_url', leadStage: 'lead_stage', leadSource: 'lead_source',
    relationshipType: 'relationship_type', status: 'status', notes: 'notes', lastContactedAt: 'last_contacted_at', nextFollowUpAt: 'next_follow_up_at',
  }
  const patch = { ...body } as Record<string, unknown>
  if (body.tags !== undefined) patch.tags = JSON.stringify(body.tags)
  if (body.linkedinUrl !== undefined && body.avatarUrl === undefined) {
    patch.avatarUrl = body.linkedinUrl ? await resolveLinkedInAvatar(body.linkedinUrl) : null
  }
  const assignments: string[] = []
  const args: unknown[] = []
  for (const [key, value] of Object.entries(patch)) {
    const column = key === 'tags' ? 'tags_json' : mapping[key]
    if (!column || value === undefined) continue
    assignments.push(`${column}=?`)
    args.push(value ?? null)
  }
  if (!assignments.length) return c.json({ error: 'empty_patch', message: 'No mutable fields were provided.' }, 422)
  assignments.push('updated_at=?')
  args.push(now(), recordId)
  await db.execute({ sql: `UPDATE crm_people SET ${assignments.join(',')} WHERE id=?`, args })
  const after = first<Row>(await db.execute({ sql: `SELECT p.*,COALESCE(o.display_name,o.legal_name) AS organization_name FROM crm_people p LEFT JOIN organizations o ON o.id=p.organization_id WHERE p.id=?`, args: [recordId] }))
  await audit(c, 'crm.person.update', 'person', recordId, String(after?.organization_id ?? '') || null, before, after)
  return c.json(decorate(after))
})

app.post('/api/v2/crm/people/:id/refresh-avatar', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const person = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_people WHERE id=?', args: [recordId] }))
  if (!person) return c.json({ error: 'person_not_found', message: 'Person not found.' }, 404)
  const avatarUrl = await resolveLinkedInAvatar(typeof person.linkedin_url === 'string' ? person.linkedin_url : null)
  await db.execute({ sql: 'UPDATE crm_people SET avatar_url=?,updated_at=? WHERE id=?', args: [avatarUrl, now(), recordId] })
  return c.json({ avatarUrl })
})

app.get('/api/v2/crm/customers', async (c) => {
  const db = getDb(c.env)
  const q = c.req.query('q')?.trim()
  const args: unknown[] = []
  let where = ''
  if (q) {
    const term = `%${q}%`
    where = 'WHERE (o.legal_name LIKE ? OR o.display_name LIKE ? OR o.uei LIKE ? OR o.cage_code LIKE ? OR o.domain LIKE ?)'
    args.push(term, term, term, term, term)
  }
  args.push(limit(c))
  const result = await db.execute({
    sql: `SELECT o.*,p.website_url,p.linkedin_url,p.logo_url,p.account_stage,p.owner_oid,p.notes,p.tags_json,
      (SELECT COUNT(*) FROM crm_people cp WHERE cp.organization_id=o.id AND cp.status!='archived') AS people_count,
      (SELECT COUNT(*) FROM opportunities op WHERE op.customer_organization_id=o.id AND op.stage NOT IN ('closed_won','closed_lost')) AS opportunity_count,
      (SELECT COUNT(*) FROM orders ord WHERE ord.customer_organization_id=o.id) AS order_count
      FROM organizations o LEFT JOIN crm_organization_profiles p ON p.organization_id=o.id
      ${where} ORDER BY o.updated_at DESC LIMIT ?`,
    args,
  })
  return c.json({ items: rows<Row>(result).map((row) => ({ ...row, logo_url: row.logo_url || logoForDomain(c.env, row.domain), tags: jsonArray(row.tags_json) })) })
})

app.post('/api/v2/crm/customers', async (c) => {
  const body = await parseBody(c, customerCreateSchema)
  const db = getDb(c.env)
  const recordId = id('org')
  const timestamp = now()
  const logoUrl = body.logoUrl ?? logoForDomain(c.env, body.domain)
  await db.batch([
    {
      sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,uei,cage_code,domain,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [recordId, body.organizationType, body.legalName, body.displayName ?? null, body.uei ?? null, body.cageCode ?? null, body.domain ?? null, body.status, timestamp, timestamp],
    },
    {
      sql: `INSERT INTO crm_organization_profiles (organization_id,website_url,linkedin_url,logo_url,account_stage,owner_oid,notes,tags_json,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [recordId, body.websiteUrl ?? null, body.linkedinUrl ?? null, logoUrl, body.accountStage, c.get('admin').oid, body.notes ?? null, JSON.stringify(body.tags), timestamp, timestamp],
    },
  ], 'write')
  const created = first<Row>(await db.execute({ sql: 'SELECT o.*,p.* FROM organizations o LEFT JOIN crm_organization_profiles p ON p.organization_id=o.id WHERE o.id=?', args: [recordId] }))
  await audit(c, 'crm.customer.create', 'organization', recordId, recordId, null, created)
  return c.json({ ...created, tags: body.tags }, 201)
})

app.get('/api/v2/crm/customers/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const customer = first<Row>(await db.execute({ sql: 'SELECT o.*,p.website_url,p.linkedin_url,p.logo_url,p.account_stage,p.owner_oid,p.notes,p.tags_json FROM organizations o LEFT JOIN crm_organization_profiles p ON p.organization_id=o.id WHERE o.id=?', args: [recordId] }))
  if (!customer) return c.json({ error: 'customer_not_found', message: 'Customer not found.' }, 404)
  const [people, opportunities, orders, references, attachments, activities] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM crm_people WHERE organization_id=? ORDER BY updated_at DESC', args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM opportunities WHERE customer_organization_id=? ORDER BY updated_at DESC', args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM orders WHERE customer_organization_id=? ORDER BY created_at DESC', args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_references WHERE resource_type='organization' AND resource_id=? ORDER BY created_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_attachments WHERE resource_type='organization' AND resource_id=? ORDER BY created_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_activities WHERE organization_id=? OR (resource_type='organization' AND resource_id=?) ORDER BY occurred_at DESC LIMIT 100", args: [recordId, recordId] }),
  ])
  return c.json({
    ...customer,
    logo_url: customer.logo_url || logoForDomain(c.env, customer.domain),
    tags: jsonArray(customer.tags_json),
    people: rows<Row>(people).map((row) => decorate(row)),
    opportunities: rows<Row>(opportunities),
    orders: rows<Row>(orders),
    references: rows<Row>(references),
    attachments: rows<Row>(attachments),
    activities: rows<Row>(activities),
  })
})

app.patch('/api/v2/crm/customers/:id', async (c) => {
  const body = await parseBody(c, customerPatchSchema)
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const before = first<Row>(await db.execute({ sql: 'SELECT o.*,p.website_url,p.linkedin_url,p.logo_url,p.account_stage,p.notes,p.tags_json FROM organizations o LEFT JOIN crm_organization_profiles p ON p.organization_id=o.id WHERE o.id=?', args: [recordId] }))
  if (!before) return c.json({ error: 'customer_not_found', message: 'Customer not found.' }, 404)
  const orgMap: Record<string, string> = { organizationType: 'organization_type', legalName: 'legal_name', displayName: 'display_name', uei: 'uei', cageCode: 'cage_code', domain: 'domain', status: 'status' }
  const profileMap: Record<string, string> = { websiteUrl: 'website_url', linkedinUrl: 'linkedin_url', logoUrl: 'logo_url', accountStage: 'account_stage', notes: 'notes' }
  const orgAssignments: string[] = []
  const orgArgs: unknown[] = []
  const profileAssignments: string[] = []
  const profileArgs: unknown[] = []
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue
    if (orgMap[key]) { orgAssignments.push(`${orgMap[key]}=?`); orgArgs.push(value ?? null) }
    if (profileMap[key]) { profileAssignments.push(`${profileMap[key]}=?`); profileArgs.push(value ?? null) }
  }
  if (body.tags !== undefined) { profileAssignments.push('tags_json=?'); profileArgs.push(JSON.stringify(body.tags)) }
  const timestamp = now()
  const statements: Array<{ sql: string; args: unknown[] }> = []
  if (orgAssignments.length) statements.push({ sql: `UPDATE organizations SET ${orgAssignments.join(',')},updated_at=? WHERE id=?`, args: [...orgArgs, timestamp, recordId] })
  if (profileAssignments.length) {
    statements.push({ sql: `INSERT INTO crm_organization_profiles (organization_id,account_stage,owner_oid,tags_json,created_at,updated_at) VALUES (?,?,?,?,?,?)
      ON CONFLICT(organization_id) DO NOTHING`, args: [recordId, body.accountStage ?? 'prospect', c.get('admin').oid, JSON.stringify(body.tags ?? []), timestamp, timestamp] })
    statements.push({ sql: `UPDATE crm_organization_profiles SET ${profileAssignments.join(',')},updated_at=? WHERE organization_id=?`, args: [...profileArgs, timestamp, recordId] })
  }
  if (!statements.length) return c.json({ error: 'empty_patch', message: 'No mutable fields were provided.' }, 422)
  await db.batch(statements, 'write')
  const after = first<Row>(await db.execute({ sql: 'SELECT o.*,p.website_url,p.linkedin_url,p.logo_url,p.account_stage,p.notes,p.tags_json FROM organizations o LEFT JOIN crm_organization_profiles p ON p.organization_id=o.id WHERE o.id=?', args: [recordId] }))
  await audit(c, 'crm.customer.update', 'organization', recordId, recordId, before, after)
  return c.json({ ...after, tags: jsonArray(after?.tags_json) })
})

app.get('/api/v2/crm/opportunities', async (c) => {
  const result = await getDb(c.env).execute({
    sql: `SELECT op.*,COALESCE(o.display_name,o.legal_name) AS customer_name,
      (SELECT COUNT(*) FROM crm_references r WHERE r.resource_type='opportunity' AND r.resource_id=op.id) AS reference_count,
      (SELECT COUNT(*) FROM crm_attachments a WHERE a.resource_type='opportunity' AND a.resource_id=op.id) AS attachment_count,
      (SELECT COUNT(*) FROM crm_record_people rp WHERE rp.resource_type='opportunity' AND rp.resource_id=op.id) AS people_count
      FROM opportunities op JOIN organizations o ON o.id=op.customer_organization_id
      ORDER BY op.updated_at DESC LIMIT ?`,
    args: [limit(c)],
  })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v2/crm/opportunities', async (c) => {
  const body = await parseBody(c, opportunityCreateSchema)
  const db = getDb(c.env)
  if (!(await organizationExists(db, body.customerOrganizationId))) return c.json({ error: 'organization_not_found', message: 'Customer organization not found.' }, 404)
  const recordId = id('opp')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO opportunities (id,customer_organization_id,originating_partner_id,transacting_partner_id,primary_contact_id,name,stage,estimated_value_cents,vehicle_id,expected_product_id,expected_close_date,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, body.customerOrganizationId, null, null, null, body.name, body.stage, body.estimatedValueCents ?? null, body.vehicleId ?? null, body.expectedProductId ?? null, body.expectedCloseDate ?? null, timestamp, timestamp],
  })
  const created = first<Row>(await db.execute({ sql: 'SELECT * FROM opportunities WHERE id=?', args: [recordId] }))
  await audit(c, 'crm.opportunity.create', 'opportunity', recordId, body.customerOrganizationId, null, created)
  return c.json(created, 201)
})

app.get('/api/v2/crm/opportunities/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const record = first<Row>(await db.execute({
    sql: 'SELECT op.*,COALESCE(o.display_name,o.legal_name) AS customer_name FROM opportunities op JOIN organizations o ON o.id=op.customer_organization_id WHERE op.id=?',
    args: [recordId],
  }))
  if (!record) return c.json({ error: 'opportunity_not_found', message: 'Opportunity not found.' }, 404)
  const [people, references, attachments, activities, orders] = await Promise.all([
    db.execute({ sql: `SELECT p.*,rp.role,rp.is_primary FROM crm_record_people rp JOIN crm_people p ON p.id=rp.person_id WHERE rp.resource_type='opportunity' AND rp.resource_id=? ORDER BY rp.is_primary DESC,p.last_name`, args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_references WHERE resource_type='opportunity' AND resource_id=? ORDER BY created_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_attachments WHERE resource_type='opportunity' AND resource_id=? ORDER BY created_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_activities WHERE resource_type='opportunity' AND resource_id=? ORDER BY occurred_at DESC LIMIT 100", args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM orders WHERE opportunity_id=? ORDER BY created_at DESC', args: [recordId] }),
  ])
  return c.json({ ...record, people: rows<Row>(people), references: rows<Row>(references), attachments: rows<Row>(attachments), activities: rows<Row>(activities), orders: rows<Row>(orders) })
})

app.patch('/api/v2/crm/opportunities/:id', async (c) => {
  const body = await parseBody(c, opportunityPatchSchema)
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const before = first<Row>(await db.execute({ sql: 'SELECT * FROM opportunities WHERE id=?', args: [recordId] }))
  if (!before) return c.json({ error: 'opportunity_not_found', message: 'Opportunity not found.' }, 404)
  const map: Record<string, string> = { name: 'name', stage: 'stage', estimatedValueCents: 'estimated_value_cents', expectedCloseDate: 'expected_close_date', vehicleId: 'vehicle_id', expectedProductId: 'expected_product_id' }
  const assignments: string[] = []
  const args: unknown[] = []
  for (const [key, value] of Object.entries(body)) {
    if (!map[key] || value === undefined) continue
    assignments.push(`${map[key]}=?`); args.push(value ?? null)
  }
  if (!assignments.length) return c.json({ error: 'empty_patch', message: 'No mutable fields were provided.' }, 422)
  assignments.push('updated_at=?'); args.push(now(), recordId)
  await db.execute({ sql: `UPDATE opportunities SET ${assignments.join(',')} WHERE id=?`, args })
  const after = first<Row>(await db.execute({ sql: 'SELECT * FROM opportunities WHERE id=?', args: [recordId] }))
  await audit(c, 'crm.opportunity.update', 'opportunity', recordId, String(before.customer_organization_id), before, after)
  return c.json(after)
})

app.get('/api/v2/crm/orders', async (c) => {
  const result = await getDb(c.env).execute({
    sql: `SELECT ord.*,COALESCE(o.display_name,o.legal_name) AS customer_name,
      (SELECT COUNT(*) FROM crm_references r WHERE r.resource_type='order' AND r.resource_id=ord.id) AS reference_count,
      (SELECT COUNT(*) FROM crm_attachments a WHERE a.resource_type='order' AND a.resource_id=ord.id) AS attachment_count,
      (SELECT COUNT(*) FROM crm_record_people rp WHERE rp.resource_type='order' AND rp.resource_id=ord.id) AS people_count
      FROM orders ord JOIN organizations o ON o.id=ord.customer_organization_id
      ORDER BY ord.created_at DESC LIMIT ?`,
    args: [limit(c)],
  })
  return c.json({ items: rows<Row>(result) })
})

app.get('/api/v2/crm/orders/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const record = first<Row>(await db.execute({
    sql: `SELECT ord.*,COALESCE(o.display_name,o.legal_name) AS customer_name,op.name AS opportunity_name,v.vehicle_name
          FROM orders ord JOIN organizations o ON o.id=ord.customer_organization_id
          LEFT JOIN opportunities op ON op.id=ord.opportunity_id LEFT JOIN vehicles v ON v.id=ord.vehicle_id WHERE ord.id=?`,
    args: [recordId],
  }))
  if (!record) return c.json({ error: 'order_not_found', message: 'Order not found.' }, 404)
  const [items, people, references, attachments, activities, entitlements] = await Promise.all([
    db.execute({ sql: 'SELECT oi.*,p.sku,p.name,p.provisioning_type FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=? ORDER BY oi.created_at', args: [recordId] }),
    db.execute({ sql: `SELECT p.*,rp.role,rp.is_primary FROM crm_record_people rp JOIN crm_people p ON p.id=rp.person_id WHERE rp.resource_type='order' AND rp.resource_id=? ORDER BY rp.is_primary DESC,p.last_name`, args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_references WHERE resource_type='order' AND resource_id=? ORDER BY created_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_attachments WHERE resource_type='order' AND resource_id=? ORDER BY created_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT * FROM crm_activities WHERE resource_type='order' AND resource_id=? ORDER BY occurred_at DESC LIMIT 100", args: [recordId] }),
    db.execute({ sql: 'SELECT e.*,oi.order_id,p.sku,p.name FROM entitlements e JOIN order_items oi ON oi.id=e.order_item_id JOIN products p ON p.id=e.product_id WHERE oi.order_id=? ORDER BY e.created_at', args: [recordId] }),
  ])
  return c.json({ ...record, items: rows<Row>(items), people: rows<Row>(people), references: rows<Row>(references), attachments: rows<Row>(attachments), activities: rows<Row>(activities), entitlements: rows<Row>(entitlements) })
})

app.patch('/api/v2/crm/orders/:id', async (c) => {
  const body = await parseBody(c, orderPatchSchema)
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const before = first<Row>(await db.execute({ sql: 'SELECT * FROM orders WHERE id=?', args: [recordId] }))
  if (!before) return c.json({ error: 'order_not_found', message: 'Order not found.' }, 404)
  const map: Record<string, string> = {
    status: 'status', contractNumber: 'contract_number', taskOrderNumber: 'task_order_number', poNumber: 'po_number',
    opportunityId: 'opportunity_id', vehicleId: 'vehicle_id', startDate: 'start_date', endDate: 'end_date',
  }
  const assignments: string[] = []
  const args: unknown[] = []
  for (const [key, value] of Object.entries(body)) {
    if (!map[key] || value === undefined) continue
    assignments.push(`${map[key]}=?`); args.push(value ?? null)
  }
  if (!assignments.length) return c.json({ error: 'empty_patch', message: 'No mutable fields were provided.' }, 422)
  assignments.push('updated_at=?'); args.push(now(), recordId)
  await db.execute({ sql: `UPDATE orders SET ${assignments.join(',')} WHERE id=?`, args })
  const after = first<Row>(await db.execute({ sql: 'SELECT * FROM orders WHERE id=?', args: [recordId] }))
  await audit(c, 'crm.order.update', 'order', recordId, String(before.customer_organization_id), before, after)
  return c.json(after)
})

app.get('/api/v2/crm/references', async (c) => {
  const resourceType = c.req.query('resourceType')
  const resourceId = c.req.query('resourceId')
  if (!resourceType || !resourceId) return c.json({ error: 'missing_filter', message: 'resourceType and resourceId are required.' }, 422)
  const result = await getDb(c.env).execute({ sql: 'SELECT * FROM crm_references WHERE resource_type=? AND resource_id=? ORDER BY created_at DESC', args: [resourceType, resourceId] })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v2/crm/references', async (c) => {
  const body = await parseBody(c, referenceCreateSchema)
  const db = getDb(c.env)
  if (!(await resourceExists(db, body.resourceType, body.resourceId))) return c.json({ error: 'resource_not_found', message: 'CRM record not found.' }, 404)
  const recordId = id('ref')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO crm_references (id,resource_type,resource_id,reference_type,identifier,url,label,notes,created_by_oid,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, body.resourceType, body.resourceId, body.referenceType, body.identifier, body.url ?? null, body.label ?? null, body.notes ?? null, c.get('admin').oid, timestamp, timestamp],
  })
  const created = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_references WHERE id=?', args: [recordId] }))
  await audit(c, 'crm.reference.create', body.resourceType, body.resourceId, null, null, created)
  return c.json(created, 201)
})

app.delete('/api/v2/crm/references/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const before = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_references WHERE id=?', args: [recordId] }))
  if (!before) return c.json({ error: 'reference_not_found', message: 'Reference not found.' }, 404)
  await db.execute({ sql: 'DELETE FROM crm_references WHERE id=?', args: [recordId] })
  await audit(c, 'crm.reference.delete', String(before.resource_type), String(before.resource_id), null, before, null)
  return c.json({ deleted: true })
})

app.post('/api/v2/crm/links', async (c) => {
  const body = await parseBody(c, linkCreateSchema)
  const db = getDb(c.env)
  const person = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_people WHERE id=?', args: [body.personId] }))
  if (!person) return c.json({ error: 'person_not_found', message: 'Person not found.' }, 404)
  if (!(await resourceExists(db, body.resourceType, body.resourceId))) return c.json({ error: 'resource_not_found', message: 'CRM record not found.' }, 404)
  const recordId = id('lnk')
  await db.execute({
    sql: `INSERT INTO crm_record_people (id,person_id,resource_type,resource_id,role,is_primary,created_at)
          VALUES (?,?,?,?,?,?,?)
          ON CONFLICT(person_id,resource_type,resource_id,role) DO UPDATE SET is_primary=excluded.is_primary`,
    args: [recordId, body.personId, body.resourceType, body.resourceId, body.role, body.isPrimary ? 1 : 0, now()],
  })
  return c.json({ linked: true }, 201)
})

app.delete('/api/v2/crm/links/:id', async (c) => {
  await getDb(c.env).execute({ sql: 'DELETE FROM crm_record_people WHERE id=?', args: [c.req.param('id')] })
  return c.json({ deleted: true })
})

app.get('/api/v2/crm/activities', async (c) => {
  const resourceType = c.req.query('resourceType')
  const resourceId = c.req.query('resourceId')
  const organizationId = c.req.query('organizationId')
  const personId = c.req.query('personId')
  const where: string[] = []
  const args: unknown[] = []
  if (resourceType && resourceId) { where.push('(resource_type=? AND resource_id=?)'); args.push(resourceType, resourceId) }
  if (organizationId) { where.push('organization_id=?'); args.push(organizationId) }
  if (personId) { where.push('person_id=?'); args.push(personId) }
  if (!where.length) return c.json({ error: 'missing_filter', message: 'A resource, organization, or person filter is required.' }, 422)
  args.push(limit(c, 100, 500))
  const result = await getDb(c.env).execute({ sql: `SELECT * FROM crm_activities WHERE ${where.join(' OR ')} ORDER BY occurred_at DESC LIMIT ?`, args })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v2/crm/activities', async (c) => {
  const body = await parseBody(c, activityCreateSchema)
  const db = getDb(c.env)
  if (body.organizationId && !(await organizationExists(db, body.organizationId))) return c.json({ error: 'organization_not_found', message: 'Customer organization not found.' }, 404)
  if (body.personId && !(await resourceExists(db, 'person', body.personId))) return c.json({ error: 'person_not_found', message: 'Person not found.' }, 404)
  if (body.resourceType && body.resourceId && !(await resourceExists(db, body.resourceType, body.resourceId))) return c.json({ error: 'resource_not_found', message: 'CRM record not found.' }, 404)
  const recordId = id('act')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO crm_activities (id,organization_id,person_id,resource_type,resource_id,activity_type,subject,body,occurred_at,created_by_oid,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, body.organizationId ?? null, body.personId ?? null, body.resourceType ?? null, body.resourceId ?? null, body.activityType, body.subject ?? null, body.body ?? null, body.occurredAt ?? timestamp, c.get('admin').oid, timestamp],
  })
  return c.json(first<Row>(await db.execute({ sql: 'SELECT * FROM crm_activities WHERE id=?', args: [recordId] })), 201)
})

app.get('/api/v2/crm/attachments', async (c) => {
  const resourceType = c.req.query('resourceType')
  const resourceId = c.req.query('resourceId')
  if (!resourceType || !resourceId) return c.json({ error: 'missing_filter', message: 'resourceType and resourceId are required.' }, 422)
  const result = await getDb(c.env).execute({ sql: 'SELECT * FROM crm_attachments WHERE resource_type=? AND resource_id=? ORDER BY created_at DESC', args: [resourceType, resourceId] })
  return c.json({ items: rows<Row>(result) })
})

app.post('/api/v2/crm/attachments/link', async (c) => {
  const body = await parseBody(c, externalAttachmentSchema)
  const db = getDb(c.env)
  if (!(await resourceExists(db, body.resourceType, body.resourceId))) return c.json({ error: 'resource_not_found', message: 'CRM record not found.' }, 404)
  const recordId = id('att')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO crm_attachments (id,resource_type,resource_id,file_name,content_type,size_bytes,storage_key,external_url,description,created_by_oid,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, body.resourceType, body.resourceId, body.fileName, body.contentType ?? null, 0, null, body.externalUrl, body.description ?? null, c.get('admin').oid, timestamp],
  })
  return c.json(first<Row>(await db.execute({ sql: 'SELECT * FROM crm_attachments WHERE id=?', args: [recordId] })), 201)
})

app.post('/api/v2/crm/attachments', async (c) => {
  if (!c.env.CRM_ATTACHMENTS) return c.json({ error: 'attachment_storage_not_configured', message: 'CRM attachment storage is not configured.' }, 503)
  const form = await c.req.raw.formData()
  const file = form.get('file')
  const resourceType = String(form.get('resourceType') ?? '')
  const resourceId = String(form.get('resourceId') ?? '')
  const description = String(form.get('description') ?? '').trim()
  if (!(file instanceof File)) return c.json({ error: 'file_required', message: 'A file is required.' }, 422)
  if (!RESOURCE_TYPES.includes(resourceType as typeof RESOURCE_TYPES[number])) return c.json({ error: 'invalid_resource_type', message: 'Invalid CRM attachment resource type.' }, 422)
  if (!resourceId) return c.json({ error: 'resource_id_required', message: 'resourceId is required.' }, 422)
  if (file.size > 25 * 1024 * 1024) return c.json({ error: 'file_too_large', message: 'CRM attachments are limited to 25 MB.' }, 413)
  const db = getDb(c.env)
  if (!(await resourceExists(db, resourceType as typeof RESOURCE_TYPES[number], resourceId))) return c.json({ error: 'resource_not_found', message: 'CRM record not found.' }, 404)
  const recordId = id('att')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'attachment'
  const storageKey = `${resourceType}/${resourceId}/${recordId}/${safeName}`
  await c.env.CRM_ATTACHMENTS.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
    customMetadata: { originalName: file.name, resourceType, resourceId },
  })
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO crm_attachments (id,resource_type,resource_id,file_name,content_type,size_bytes,storage_key,external_url,description,created_by_oid,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [recordId, resourceType, resourceId, file.name, file.type || null, file.size, storageKey, null, description || null, c.get('admin').oid, timestamp],
  })
  const created = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_attachments WHERE id=?', args: [recordId] }))
  await audit(c, 'crm.attachment.create', resourceType, resourceId, null, null, created)
  return c.json(created, 201)
})

app.get('/api/v2/crm/attachments/:id/download', async (c) => {
  const db = getDb(c.env)
  const attachment = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_attachments WHERE id=?', args: [c.req.param('id')] }))
  if (!attachment) return c.json({ error: 'attachment_not_found', message: 'Attachment not found.' }, 404)
  if (attachment.external_url) return c.redirect(String(attachment.external_url), 302)
  if (!attachment.storage_key || !c.env.CRM_ATTACHMENTS) return c.json({ error: 'attachment_unavailable', message: 'Attachment object storage is unavailable.' }, 503)
  const object = await c.env.CRM_ATTACHMENTS.get(String(attachment.storage_key))
  if (!object) return c.json({ error: 'attachment_missing', message: 'Attachment object was not found.' }, 404)
  return new Response(object.body, {
    headers: {
      'Content-Type': String(attachment.content_type || object.httpMetadata?.contentType || 'application/octet-stream'),
      'Content-Disposition': `attachment; filename="${String(attachment.file_name).replaceAll('"', '')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
})

app.delete('/api/v2/crm/attachments/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const attachment = first<Row>(await db.execute({ sql: 'SELECT * FROM crm_attachments WHERE id=?', args: [recordId] }))
  if (!attachment) return c.json({ error: 'attachment_not_found', message: 'Attachment not found.' }, 404)
  if (attachment.storage_key && c.env.CRM_ATTACHMENTS) await c.env.CRM_ATTACHMENTS.delete(String(attachment.storage_key))
  await db.execute({ sql: 'DELETE FROM crm_attachments WHERE id=?', args: [recordId] })
  await audit(c, 'crm.attachment.delete', String(attachment.resource_type), String(attachment.resource_id), null, attachment, null)
  return c.json({ deleted: true })
})

app.post('/api/v2/crm/admin/reset', async (c) => {
  const body = await c.req.json().catch(() => null) as { confirm?: unknown } | null
  if (body?.confirm !== 'RESET CRM DATA') return c.json({ error: 'confirmation_required', message: 'Type RESET CRM DATA to confirm.' }, 422)
  const db = getDb(c.env)

  if (c.env.CRM_ATTACHMENTS) {
    let cursor: string | undefined
    do {
      const page = await c.env.CRM_ATTACHMENTS.list({ cursor, limit: 1000 })
      if (page.objects.length) await c.env.CRM_ATTACHMENTS.delete(page.objects.map((object) => object.key))
      cursor = page.truncated ? page.cursor : undefined
    } while (cursor)
  }

  const found = await db.execute("SELECT name FROM sqlite_master WHERE type='table'")
  const existing = new Set(found.rows.map((row) => String(row.name)))
  const deletionOrder = [
    'crm_activities','crm_attachments','crm_references','crm_record_people','crm_organization_profiles','crm_people',
    'organization_license_issuances','entitlement_license_scopes','deployment_branding','license_issuances','deployments',
    'entitlement_addons','entitlements','partner_order_submissions','order_items','orders','opportunities','partner_invites',
    'partner_users','partner_applications','organization_vehicles','vehicles','marketplace_leads','marketplace_vm_customers',
    'marketplace_sync_runs','marketplace_report_state','contacts','partners','audit_events','organizations',
  ]
  const cleared: Record<string, number> = {}
  for (const table of deletionOrder) {
    if (!existing.has(table)) continue
    const count = first<Row>(await db.execute(`SELECT COUNT(*) AS count FROM ${table}`))
    cleared[table] = Number(count?.count ?? 0)
    await db.execute(`DELETE FROM ${table}`)
  }
  await audit(c, 'crm.admin.reset', 'crm', null, null, null, { cleared })
  return c.json({ cleared, preserved: ['products', 'Better Auth tables', 'JWKS/signing metadata'] })
})

app.onError((error, c) => {
  if (error instanceof Response) return error
  console.error('crm-api error', error)
  return c.json({ error: 'internal_error', message: error instanceof Error ? error.message : 'Internal server error.' }, 500)
})

export default app
