/** /api/admin/* — staff (Entra) auth; managers are limited to assigned orgs. */
import { Hono, type Context } from 'hono'
import { putManagerPhoto } from './attachments'
import { requireOwner, requireStaff, type StaffActor } from './auth'
import { listConversations } from './chat-store'
import { waitUntilOf } from './chat-routes'
import { first, getDb, rows } from './db'
import type { Bindings } from './env'
import { recordEvent } from './events'
import { listInbox, markInboxDone } from './inbox'
import { MANAGER_LEADS_SQL, MANAGER_TENANTS_SQL, staffCanSeeTenant } from './visibility'
import { ApiError, GUID_RE, background, emailDomain, id, now, parseJsonObject, readJsonObject, str } from './util'

type AppEnv = { Bindings: Bindings; Variables: { staff: StaffActor } }
type Ctx = Context<AppEnv>
type Row = Record<string, unknown>

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'trial', 'won', 'lost'] as const
type LeadStage = (typeof LEAD_STAGES)[number]

const app = new Hono<AppEnv>()

app.use('/api/admin/*', async (c, next) => {
  c.set('staff', await requireStaff(c.env, c.req.raw))
  await next()
})

const staff = (c: Ctx) => c.get('staff')

const PRIMARY_MANAGER = (orgColumn: string) => `(SELECT oam.account_manager_id FROM organization_account_managers oam
  WHERE oam.organization_id = ${orgColumn} ORDER BY CASE oam.role WHEN 'primary' THEN 0 ELSE 1 END LIMIT 1)`

async function managerNames(env: Bindings, ids: unknown[]): Promise<Map<string, { id: string; name: string }>> {
  const unique = [...new Set(ids.filter((value): value is string => typeof value === 'string' && value.length > 0))]
  if (!unique.length) return new Map()
  const result = rows<Row>(await getDb(env).execute({
    sql: `SELECT id, display_name FROM account_managers WHERE id IN (${unique.map(() => '?').join(',')})`,
    args: unique,
  }))
  return new Map(result.map((row) => [String(row.id), { id: String(row.id), name: String(row.display_name) }]))
}

// ---------------------------------------------------------------------------
// Me + devices

async function meResponse(env: Bindings, actor: StaffActor) {
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT * FROM account_managers WHERE id=?', args: [actor.accountManagerId] }))
  return {
    id: actor.accountManagerId,
    oid: actor.oid,
    name: String(row?.display_name ?? actor.name),
    email: row?.email ? String(row.email) : actor.email,
    title: row?.title ? String(row.title) : null,
    photoUrl: row?.avatar_url ? String(row.avatar_url) : null,
    role: actor.role,
  }
}

app.get('/api/admin/me', async (c) => c.json(await meResponse(c.env, staff(c))))

app.put('/api/admin/me', async (c) => {
  const body = await readJsonObject(c.req.raw)
  if (body.title !== undefined) {
    const title = body.title === null ? null : str(body.title, 120)
    if (body.title !== null && !title) throw new ApiError(422, 'validation_error', 'title must be a non-empty string up to 120 characters, or null.')
    await getDb(c.env).execute({ sql: 'UPDATE account_managers SET title=?, updated_at=? WHERE id=?', args: [title, now(), staff(c).accountManagerId] })
  }
  return c.json(await meResponse(c.env, staff(c)))
})

app.put('/api/admin/me/photo', async (c) => {
  await putManagerPhoto(c.env, staff(c).accountManagerId, c.req.raw)
  return c.json(await meResponse(c.env, staff(c)))
})

app.post('/api/admin/devices', async (c) => {
  const body = await readJsonObject(c.req.raw)
  const platform = body.platform
  if (platform !== 'android' && platform !== 'macos') throw new ApiError(422, 'validation_error', 'platform must be "android" or "macos".')
  const token = str(body.token, 4096)
  if (!token) throw new ApiError(422, 'validation_error', 'token is required.')
  const timestamp = now()
  await getDb(c.env).execute({
    sql: `INSERT INTO staff_devices (id, account_manager_id, platform, token, created_at, updated_at) VALUES (?,?,?,?,?,?)
          ON CONFLICT(token) DO UPDATE SET account_manager_id=excluded.account_manager_id, platform=excluded.platform, updated_at=excluded.updated_at`,
    args: [id('dev'), staff(c).accountManagerId, platform, token, timestamp, timestamp],
  })
  return c.json({ ok: true }, 201)
})

// ---------------------------------------------------------------------------
// Inbox

app.get('/api/admin/inbox', async (c) => c.json(await listInbox(c.env, staff(c), c.req.query('before') ?? null)))
app.post('/api/admin/inbox/:id/done', async (c) => c.json(await markInboxDone(c.env, staff(c), c.req.param('id'))))

// ---------------------------------------------------------------------------
// Leads

const LEAD_SELECT = `SELECT l.id, l.first_name, l.last_name, l.email, l.company_name, l.offer_title, l.organization_id, l.received_at,
    COALESCE(p.stage, CASE l.status WHEN 'customer' THEN 'won' WHEN 'closed' THEN 'lost' ELSE l.status END) AS stage,
    COALESCE(p.notes, '') AS notes,
    ${PRIMARY_MANAGER('l.organization_id')} AS account_manager_id,
    (SELECT t.tenant_id FROM tenants t WHERE t.organization_id = l.organization_id ORDER BY t.first_seen_at LIMIT 1) AS tenant_id
  FROM marketplace_leads l LEFT JOIN lead_pipeline p ON p.lead_id = l.id`

export type Lead = {
  id: string
  name: string
  email: string | null
  company: string | null
  offer: string | null
  stage: LeadStage
  notes: string
  organizationId: string | null
  accountManager: { id: string; name: string } | null
  tenantId: string | null
  createdAt: string
}

async function toLeads(env: Bindings, result: Row[]): Promise<Lead[]> {
  const names = await managerNames(env, result.map((row) => row.account_manager_id))
  return result.map((row) => ({
    id: String(row.id),
    name: [row.first_name, row.last_name].filter(Boolean).join(' '),
    email: row.email ? String(row.email) : null,
    company: row.company_name ? String(row.company_name) : null,
    offer: row.offer_title ? String(row.offer_title) : null,
    stage: String(row.stage) as LeadStage,
    notes: String(row.notes ?? ''),
    organizationId: row.organization_id ? String(row.organization_id) : null,
    accountManager: row.account_manager_id ? names.get(String(row.account_manager_id)) ?? null : null,
    tenantId: row.tenant_id ? String(row.tenant_id) : null,
    createdAt: String(row.received_at),
  }))
}

async function queryLeads(env: Bindings, actor: StaffActor, filters: { stage?: string | null; q?: string | null; leadId?: string; unassigned?: boolean }): Promise<Lead[]> {
  const where: string[] = []
  const args: unknown[] = []
  if (actor.role !== 'owner') { where.push(`x.id IN (${MANAGER_LEADS_SQL})`); args.push(actor.accountManagerId) }
  if (filters.stage) {
    if (!LEAD_STAGES.includes(filters.stage as LeadStage)) throw new ApiError(422, 'validation_error', `stage must be one of ${LEAD_STAGES.join(', ')}.`)
    where.push('x.stage = ?'); args.push(filters.stage)
  }
  if (filters.q) {
    const like = `%${filters.q.toLowerCase()}%`
    where.push("(lower(COALESCE(x.first_name,'') || ' ' || COALESCE(x.last_name,'')) LIKE ? OR lower(COALESCE(x.email,'')) LIKE ? OR lower(COALESCE(x.company_name,'')) LIKE ?)")
    args.push(like, like, like)
  }
  if (filters.leadId) { where.push('x.id = ?'); args.push(filters.leadId) }
  if (filters.unassigned) where.push("x.account_manager_id IS NULL AND x.stage <> 'lost'")
  const result = rows<Row>(await getDb(env).execute({
    sql: `SELECT * FROM (${LEAD_SELECT}) x ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY x.received_at DESC LIMIT 500`,
    args,
  }))
  return toLeads(env, result)
}

async function requireLead(env: Bindings, actor: StaffActor, leadId: string): Promise<Lead> {
  const [lead] = await queryLeads(env, actor, { leadId })
  if (!lead) throw new ApiError(404, 'not_found', 'Lead was not found.')
  return lead
}

app.get('/api/admin/leads', async (c) => c.json(await queryLeads(c.env, staff(c), { stage: c.req.query('stage') || null, q: c.req.query('q') || null })))

app.patch('/api/admin/leads/:id', async (c) => {
  const actor = staff(c)
  const lead = await requireLead(c.env, actor, c.req.param('id'))
  const body = await readJsonObject(c.req.raw)
  let stage = lead.stage
  let notes = lead.notes
  if (body.stage !== undefined) {
    if (!LEAD_STAGES.includes(body.stage as LeadStage)) throw new ApiError(422, 'validation_error', `stage must be one of ${LEAD_STAGES.join(', ')}.`)
    stage = body.stage as LeadStage
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string' || body.notes.length > 20_000) throw new ApiError(422, 'validation_error', 'notes must be a string up to 20000 characters.')
    notes = body.notes
  }
  await getDb(c.env).execute({
    sql: `INSERT INTO lead_pipeline (lead_id, stage, notes, updated_by_oid, updated_at) VALUES (?,?,?,?,?)
          ON CONFLICT(lead_id) DO UPDATE SET stage=excluded.stage, notes=excluded.notes, updated_by_oid=excluded.updated_by_oid, updated_at=excluded.updated_at`,
    args: [lead.id, stage, notes, actor.oid, now()],
  })
  if (stage !== lead.stage) {
    background(waitUntilOf(c), 'lead.stage_changed event', recordEvent(c.env, {
      tenantId: lead.tenantId, source: 'admin', type: 'track', event: 'lead.stage_changed', userId: actor.oid,
      properties: { leadId: lead.id, from: lead.stage, to: stage },
    }))
  }
  return c.json((await queryLeads(c.env, actor, { leadId: lead.id }))[0])
})

async function requireActiveManager(env: Bindings, accountManagerId: unknown): Promise<string> {
  if (typeof accountManagerId !== 'string') throw new ApiError(422, 'validation_error', 'accountManagerId is required.')
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT id FROM account_managers WHERE id=? AND active=1', args: [accountManagerId] }))
  if (!row) throw new ApiError(404, 'not_found', 'Account manager was not found.')
  return accountManagerId
}

async function assignOrganization(env: Bindings, actor: StaffActor, organizationId: string, accountManagerId: string | null): Promise<void> {
  const db = getDb(env)
  if (accountManagerId === null) {
    await db.execute({ sql: "DELETE FROM organization_account_managers WHERE organization_id=? AND role='primary'", args: [organizationId] })
    return
  }
  await db.execute({
    sql: `INSERT INTO organization_account_managers (organization_id, account_manager_id, role, assigned_by_oid, assigned_at) VALUES (?,?, 'primary', ?, ?)
          ON CONFLICT(organization_id, role) DO UPDATE SET account_manager_id=excluded.account_manager_id, assigned_by_oid=excluded.assigned_by_oid, assigned_at=excluded.assigned_at`,
    args: [organizationId, accountManagerId, actor.oid, now()],
  })
}

app.post('/api/admin/leads/:id/assign', async (c) => {
  const actor = staff(c)
  requireOwner(actor)
  const body = await readJsonObject(c.req.raw)
  const accountManagerId = await requireActiveManager(c.env, body.accountManagerId)
  const db = getDb(c.env)
  const lead = first<Row>(await db.execute({ sql: 'SELECT * FROM marketplace_leads WHERE id=?', args: [c.req.param('id')] }))
  if (!lead) throw new ApiError(404, 'not_found', 'Lead was not found.')
  let organizationId = lead.organization_id ? String(lead.organization_id) : null
  if (!organizationId) {
    organizationId = id('org')
    const domain = (lead.domain ? String(lead.domain) : null) ?? emailDomain(lead.email)
    const name = String(lead.company_name || domain || lead.email || 'Marketplace lead')
    const timestamp = now()
    await db.batch([
      {
        sql: `INSERT INTO organizations (id, organization_type, legal_name, display_name, domain, status, created_at, updated_at) VALUES (?, 'commercial', ?, ?, ?, 'prospect', ?, ?)`,
        args: [organizationId, name, name, domain, timestamp, timestamp],
      },
      { sql: 'UPDATE marketplace_leads SET organization_id=?, updated_at=? WHERE id=?', args: [organizationId, timestamp, String(lead.id)] },
    ])
  }
  await assignOrganization(c.env, actor, organizationId, accountManagerId)
  const [result] = await queryLeads(c.env, actor, { leadId: String(lead.id) })
  background(waitUntilOf(c), 'lead.assigned event', recordEvent(c.env, {
    tenantId: result.tenantId, source: 'admin', type: 'track', event: 'lead.assigned', userId: actor.oid,
    properties: { leadId: result.id, organizationId, accountManagerId },
  }))
  return c.json(result)
})

// ---------------------------------------------------------------------------
// Customers

const CUSTOMER_SELECT = `SELECT t.tenant_id, t.organization_id, t.first_seen_at, t.last_seen_at,
    COALESCE(o.display_name, o.legal_name) AS org_name,
    ${PRIMARY_MANAGER('t.organization_id')} AS account_manager_id,
    (SELECT COUNT(*) FROM papyrus_deployments d WHERE d.tenant_id = t.tenant_id) AS deployments,
    (SELECT d.version FROM papyrus_deployments d WHERE d.tenant_id = t.tenant_id AND d.version IS NOT NULL ORDER BY d.last_seen_at DESC LIMIT 1) AS version,
    (SELECT MAX(d.last_seen_at) FROM papyrus_deployments d WHERE d.tenant_id = t.tenant_id) AS deployment_seen_at
  FROM tenants t LEFT JOIN organizations o ON o.id = t.organization_id`

export type Customer = {
  tenantId: string
  organizationId: string | null
  name: string
  accountManager: { id: string; name: string } | null
  deployments: number
  version: string | null
  lastSeenAt: string | null
}

async function queryCustomers(env: Bindings, actor: StaffActor, filters: { q?: string | null; tenantId?: string }): Promise<Customer[]> {
  const where: string[] = []
  const args: unknown[] = []
  if (actor.role !== 'owner') { where.push(`x.tenant_id IN (${MANAGER_TENANTS_SQL})`); args.push(actor.accountManagerId) }
  if (filters.q) {
    const like = `%${filters.q.toLowerCase()}%`
    where.push("(lower(x.tenant_id) LIKE ? OR lower(COALESCE(x.org_name,'')) LIKE ?)")
    args.push(like, like)
  }
  if (filters.tenantId) { where.push('x.tenant_id = ?'); args.push(filters.tenantId) }
  const result = rows<Row>(await getDb(env).execute({
    sql: `SELECT * FROM (${CUSTOMER_SELECT}) x ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY x.last_seen_at DESC LIMIT 500`,
    args,
  }))
  const names = await managerNames(env, result.map((row) => row.account_manager_id))
  return result.map((row) => {
    const seen = [row.last_seen_at, row.deployment_seen_at].filter(Boolean).map(String).sort().at(-1) ?? null
    return {
      tenantId: String(row.tenant_id),
      organizationId: row.organization_id ? String(row.organization_id) : null,
      name: row.org_name ? String(row.org_name) : String(row.tenant_id),
      accountManager: row.account_manager_id ? names.get(String(row.account_manager_id)) ?? null : null,
      deployments: Number(row.deployments ?? 0),
      version: row.version ? String(row.version) : null,
      lastSeenAt: seen,
    }
  })
}

app.get('/api/admin/customers', async (c) => c.json(await queryCustomers(c.env, staff(c), { q: c.req.query('q') || null })))

app.get('/api/admin/customers/:tenantId', async (c) => {
  const actor = staff(c)
  const [customer] = await queryCustomers(c.env, actor, { tenantId: c.req.param('tenantId').toLowerCase() })
  if (!customer) throw new ApiError(404, 'not_found', 'Customer was not found.')
  const deployments = rows<Row>(await getDb(c.env).execute({
    sql: 'SELECT * FROM papyrus_deployments WHERE tenant_id=? ORDER BY registered_at DESC',
    args: [customer.tenantId],
  }))
  return c.json({
    ...customer,
    deploymentList: deployments.map((row) => ({
      id: String(row.id),
      subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
      region: row.region ? String(row.region) : null,
      vmSize: row.vm_size ? String(row.vm_size) : null,
      version: row.version ? String(row.version) : null,
      publicOrigin: row.public_origin ? String(row.public_origin) : null,
      registeredAt: String(row.registered_at),
      lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : null,
    })),
    conversations: await listConversations(c.env, actor, customer.tenantId),
  })
})

export type TimelineEntry = { id: string; type: 'event' | 'error' | 'chat'; name: string; at: string; properties: Record<string, unknown>; sentryUrl?: string }

app.get('/api/admin/customers/:tenantId/timeline', async (c) => {
  const actor = staff(c)
  const tenantId = c.req.param('tenantId').toLowerCase()
  if (!(await staffCanSeeTenant(c.env, actor, tenantId))) throw new ApiError(404, 'not_found', 'Customer was not found.')
  const type = c.req.query('type')
  if (type && type !== 'event' && type !== 'error' && type !== 'chat') throw new ApiError(422, 'validation_error', 'type must be event, error or chat.')
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 100) || 100, 1), 200)
  const db = getDb(c.env)
  let before = c.req.query('before') || null
  if (before && !/^\d{4}-\d{2}-\d{2}T/.test(before)) {
    const anchor = first<Row>(await db.execute({
      sql: `SELECT occurred_at AS at FROM tenant_events WHERE id=? UNION ALL SELECT last_seen_at FROM tenant_errors WHERE id=?
            UNION ALL SELECT created_at FROM messages WHERE id=? LIMIT 1`,
      args: [before, before, before],
    }))
    before = anchor ? String(anchor.at) : null
  }
  const parts: string[] = []
  const args: unknown[] = []
  if (!type || type === 'event') {
    parts.push(`SELECT id, 'event' AS type, COALESCE(event, type) AS name, occurred_at AS at,
      json_object('source', source, 'type', type, 'userId', user_id, 'deploymentId', deployment_id, 'properties', json(properties_json), 'traits', json(traits_json)) AS props,
      NULL AS sentry_url FROM tenant_events WHERE tenant_id = ?`)
    args.push(tenantId)
  }
  if (!type || type === 'error') {
    parts.push(`SELECT id, 'error' AS type, title AS name, last_seen_at AS at,
      json_object('issueId', sentry_issue_id, 'culprit', culprit, 'level', level, 'source', source, 'deploymentId', deployment_id, 'alerts', alert_count, 'firstSeenAt', first_seen_at) AS props,
      sentry_url FROM tenant_errors WHERE tenant_id = ?`)
    args.push(tenantId)
  }
  if (!type || type === 'chat') {
    parts.push(`SELECT m.id, 'chat' AS type, CASE WHEN m.huddle_id IS NOT NULL THEN 'huddle.started' ELSE 'chat.message' END AS name, m.created_at AS at,
      json_object('conversationId', m.conversation_id, 'conversationKind', c.kind, 'senderType', m.sender_type, 'senderName', m.sender_name, 'body', substr(m.body, 1, 280)) AS props,
      NULL AS sentry_url FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.tenant_id = ?`)
    args.push(tenantId)
  }
  const sql = `SELECT * FROM (${parts.join(' UNION ALL ')}) ${before ? 'WHERE at < ?' : ''} ORDER BY at DESC, id DESC LIMIT ?`
  if (before) args.push(before)
  args.push(limit)
  const result = rows<Row>(await db.execute({ sql, args }))
  const entries: TimelineEntry[] = result.map((row) => {
    const entry: TimelineEntry = { id: String(row.id), type: row.type as TimelineEntry['type'], name: String(row.name), at: String(row.at), properties: parseJsonObject(row.props) }
    if (row.sentry_url) entry.sentryUrl = String(row.sentry_url)
    return entry
  })
  return c.json(entries)
})

// ---------------------------------------------------------------------------
// Account managers + assignment

app.get('/api/admin/account-managers', async (c) => {
  const result = rows<Row>(await getDb(c.env).execute(
    `SELECT am.*, sr.role, (SELECT COUNT(*) FROM organization_account_managers oam WHERE oam.account_manager_id = am.id) AS organizations
     FROM account_managers am LEFT JOIN staff_roles sr ON sr.account_manager_id = am.id
     WHERE am.active = 1 ORDER BY am.display_name`,
  ))
  return c.json(result.map((row) => ({
    id: String(row.id),
    oid: String(row.entra_oid),
    name: String(row.display_name),
    email: row.email ? String(row.email) : null,
    title: row.title ? String(row.title) : null,
    photoUrl: row.avatar_url ? String(row.avatar_url) : null,
    role: row.role ? String(row.role) : null,
    organizations: Number(row.organizations ?? 0),
  })))
})

export async function tenantSuggestions(env: Bindings, tenantId: string): Promise<{ organizationId: string; name: string; reason: string }[]> {
  const db = getDb(env)
  const users = rows<Row>(await db.execute({ sql: 'SELECT email FROM tenant_users WHERE tenant_id=? AND email IS NOT NULL', args: [tenantId] }))
  const domains = [...new Set(users.map((row) => emailDomain(row.email)).filter((domain): domain is string => Boolean(domain)))].slice(0, 20)
  const suggestions = new Map<string, { organizationId: string; name: string; reason: string }>()
  for (const domain of domains) {
    const orgs = rows<Row>(await db.execute({ sql: 'SELECT id, COALESCE(display_name, legal_name) AS name FROM organizations WHERE lower(domain)=? LIMIT 5', args: [domain] }))
    for (const org of orgs) if (!suggestions.has(String(org.id))) suggestions.set(String(org.id), { organizationId: String(org.id), name: String(org.name), reason: `Organization domain ${domain}` })
    const leads = rows<Row>(await db.execute({
      sql: `SELECT l.email, l.organization_id, COALESCE(o.display_name, o.legal_name) AS name FROM marketplace_leads l JOIN organizations o ON o.id = l.organization_id
            WHERE lower(l.email) LIKE ? LIMIT 5`,
      args: [`%@${domain}`],
    }))
    for (const lead of leads) {
      const orgId = String(lead.organization_id)
      if (!suggestions.has(orgId)) suggestions.set(orgId, { organizationId: orgId, name: String(lead.name), reason: `Marketplace lead ${lead.email}` })
    }
  }
  return [...suggestions.values()]
}

app.get('/api/admin/assign', async (c) => {
  const actor = staff(c)
  requireOwner(actor)
  const db = getDb(c.env)
  const unassignedLeads = await queryLeads(c.env, actor, { unassigned: true })
  const tenants = rows<Row>(await db.execute('SELECT tenant_id, first_seen_at FROM tenants WHERE organization_id IS NULL ORDER BY first_seen_at DESC LIMIT 200'))
  const unlinkedTenants = []
  for (const tenant of tenants) {
    unlinkedTenants.push({ tenantId: String(tenant.tenant_id), firstSeenAt: String(tenant.first_seen_at), suggestions: await tenantSuggestions(c.env, String(tenant.tenant_id)) })
  }
  const orgs = rows<Row>(await db.execute(`SELECT o.id, COALESCE(o.display_name, o.legal_name) AS name, ${PRIMARY_MANAGER('o.id')} AS account_manager_id
    FROM organizations o WHERE o.status <> 'inactive' ORDER BY name LIMIT 1000`))
  const names = await managerNames(c.env, orgs.map((row) => row.account_manager_id))
  return c.json({
    unassignedLeads,
    unlinkedTenants,
    organizations: orgs.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      accountManager: row.account_manager_id ? names.get(String(row.account_manager_id)) ?? null : null,
    })),
  })
})

app.put('/api/admin/organizations/:id/account-manager', async (c) => {
  const actor = staff(c)
  requireOwner(actor)
  const body = await readJsonObject(c.req.raw)
  const accountManagerId = body.accountManagerId === null ? null : await requireActiveManager(c.env, body.accountManagerId)
  const org = first<Row>(await getDb(c.env).execute({ sql: 'SELECT id, COALESCE(display_name, legal_name) AS name FROM organizations WHERE id=?', args: [c.req.param('id')] }))
  if (!org) throw new ApiError(404, 'not_found', 'Organization was not found.')
  await assignOrganization(c.env, actor, String(org.id), accountManagerId)
  const names = await managerNames(c.env, [accountManagerId])
  return c.json({ id: String(org.id), name: String(org.name), accountManager: accountManagerId ? names.get(accountManagerId) ?? null : null })
})

app.post('/api/admin/tenants/:tenantId/link', async (c) => {
  const actor = staff(c)
  requireOwner(actor)
  const tenantId = c.req.param('tenantId').toLowerCase()
  if (!GUID_RE.test(tenantId)) throw new ApiError(422, 'validation_error', 'tenantId must be a GUID.')
  const body = await readJsonObject(c.req.raw)
  const organizationId = str(body.organizationId, 128)
  if (!organizationId) throw new ApiError(422, 'validation_error', 'organizationId is required.')
  const db = getDb(c.env)
  if (!first(await db.execute({ sql: 'SELECT id FROM organizations WHERE id=?', args: [organizationId] }))) throw new ApiError(404, 'not_found', 'Organization was not found.')
  const timestamp = now()
  const updated = await db.execute({ sql: 'UPDATE tenants SET organization_id=?, linked_at=?, linked_by_oid=? WHERE tenant_id=?', args: [organizationId, timestamp, actor.oid, tenantId] })
  if (!updated.rowsAffected) throw new ApiError(404, 'not_found', 'Tenant was not found.')
  await db.execute({
    sql: `INSERT INTO organization_tenants (organization_id, tenant_id, environment, verified_at, verified_by_oid) VALUES (?,?, 'commercial', ?, ?)
          ON CONFLICT(tenant_id, environment) DO UPDATE SET organization_id=excluded.organization_id, verified_at=excluded.verified_at, verified_by_oid=excluded.verified_by_oid`,
    args: [organizationId, tenantId, timestamp, actor.oid],
  })
  background(waitUntilOf(c), 'tenant.linked event', recordEvent(c.env, {
    tenantId, source: 'admin', type: 'track', event: 'tenant.linked', userId: actor.oid, properties: { organizationId },
  }))
  const [customer] = await queryCustomers(c.env, actor, { tenantId })
  return c.json(customer)
})

export default app
