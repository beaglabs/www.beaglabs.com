import { Hono, type Context } from 'hono'
import { z, ZodError, type ZodType } from 'zod'

import { buildAuth } from './auth'
import { first, getDb, rows } from './db'
import { adminOids, type Bindings } from './env'

type Row = Record<string, unknown>
type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type AppEnv = { Bindings: Bindings; Variables: { admin: Admin } }
type AppContext = Context<AppEnv>

const app = new Hono<AppEnv>()

const PURSUIT_TYPES = ['direct_sale','subcontract','prime_teaming','rfp','rfi','cso','baa','sbir','task_order','ota','pilot','reseller','oem','partnership','vehicle_capture','other'] as const
const PURSUIT_STAGES = ['watching','researching','outreach','shaping','qualifying','teaming','drafting','review','submitted','evaluation','negotiation','won','lost','no_bid','paused','archived'] as const
const ENTITY_KINDS = ['federal_agency','office','program','state_local','prime','integrator','reseller','distributor','commercial','university','nonprofit','partner','contracting_office','other'] as const
const VEHICLE_KINDS = ['idiq','gwac','boa','bpa','ota','cso','baa','sbir_program','prime_contract','subcontract','task_order','marketplace','channel_program','other'] as const

const nullableText = z.string().trim().max(8000).nullable().optional()
const nullableShort = z.string().trim().max(512).nullable().optional()
const nullableUrl = z.string().trim().url().max(2048).nullable().optional()
const dateValue = z.string().trim().max(64).nullable().optional()

const entitySchema = z.object({
  entityKind: z.enum(ENTITY_KINDS).default('other'),
  legalName: z.string().trim().min(1).max(256),
  displayName: nullableShort,
  uei: nullableShort,
  cageCode: nullableShort,
  domain: nullableShort,
  parentEntityId: z.string().nullable().optional(),
  websiteUrl: nullableUrl,
  linkedinUrl: nullableUrl,
  trackingStatus: z.string().trim().max(64).default('active'),
  summary: nullableText,
  tags: z.array(z.string()).default([]),
  naics: z.array(z.string()).default([]),
  psc: z.array(z.string()).default([]),
  smallBusinessPrograms: z.array(z.string()).default([]),
})

const vehicleSchema = z.object({
  name: z.string().trim().min(1).max(256),
  vehicleKind: z.enum(VEHICLE_KINDS).default('other'),
  vehicleNumber: nullableShort,
  ownerEntityId: z.string().nullable().optional(),
  managingEntityId: z.string().nullable().optional(),
  startDate: dateValue,
  endDate: dateValue,
  orderingEndDate: dateValue,
  status: z.enum(['planned','active','expired','inactive']).default('active'),
  sourceUrl: nullableUrl,
  sourceSystem: nullableShort,
  ceilingCents: z.number().int().nonnegative().nullable().optional(),
  summary: nullableText,
  tags: z.array(z.string()).default([]),
})

const pursuitSchema = z.object({
  title: z.string().trim().min(1).max(300),
  pursuitType: z.enum(PURSUIT_TYPES).default('other'),
  stage: z.enum(PURSUIT_STAGES).default('watching'),
  priority: z.enum(['low','normal','high','critical']).default('normal'),
  targetEntityId: z.string().nullable().optional(),
  primaryVehicleId: z.string().nullable().optional(),
  identifier: nullableShort,
  sourceUrl: nullableUrl,
  sourceSystem: nullableShort,
  postedAt: dateValue,
  dueAt: dateValue,
  expectedDecisionAt: dateValue,
  estimatedValueCents: z.number().int().nonnegative().nullable().optional(),
  probabilityPercent: z.number().int().min(0).max(100).nullable().optional(),
  nextAction: nullableText,
  nextActionAt: dateValue,
  summary: nullableText,
  tags: z.array(z.string()).default([]),
})

const linkEntitySchema = z.object({
  organizationId: z.string().min(1),
  role: z.string().trim().min(1).max(128),
  isPrimary: z.boolean().default(false),
  notes: nullableText,
})

const linkPersonSchema = z.object({
  personId: z.string().min(1),
  role: z.string().trim().min(1).max(128).default('stakeholder'),
  isPrimary: z.boolean().default(false),
  notes: nullableText,
})

const submissionSchema = z.object({
  name: z.string().trim().min(1).max(256),
  submissionType: z.string().trim().min(1).max(128).default('other'),
  status: z.enum(['planned','drafting','review','ready','submitted','accepted','rejected','superseded']).default('planned'),
  dueAt: dateValue,
  submittedAt: dateValue,
  deliveryMethod: nullableShort,
  destination: nullableShort,
  confirmationId: nullableShort,
  notes: nullableText,
})

const engagementSchema = z.object({
  organizationId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  pursuitId: z.string().nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  channel: z.enum(['linkedin','email','call','meeting','teams','event','portal','other']).default('other'),
  direction: z.enum(['outbound','inbound']).default('outbound'),
  status: z.enum(['planned','completed','replied','no_response','cancelled']).default('completed'),
  subject: nullableShort,
  body: nullableText,
  outcome: nullableText,
  externalUrl: nullableUrl,
  occurredAt: dateValue,
  followUpAt: dateValue,
})

function makeId(prefix: string) { return prefix + '_' + crypto.randomUUID() }
function now() { return new Date().toISOString() }

function parseArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function withTags(row: Row) {
  return { ...row, tags: parseArray(row.tags_json) }
}

function withEntityArrays(row: Row) {
  return {
    ...row,
    tags: parseArray(row.tags_json),
    naics: parseArray(row.naics_json),
    psc: parseArray(row.psc_json),
    smallBusinessPrograms: parseArray(row.small_business_programs_json),
  }
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
      throw new Response(JSON.stringify({ error: 'validation_error', message: error.issues.map((issue) => (issue.path.join('.') || 'body') + ': ' + issue.message).join('; ') }), { status: 422, headers: { 'content-type': 'application/json' } })
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

app.use('/api/v2/capture/*', async (c, next) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  c.set('admin', admin)
  await next()
})

async function recordExists(c: AppContext, table: string, idValue: string | null | undefined) {
  if (!idValue) return true
  const row = first<Row>(await getDb(c.env).execute({ sql: 'SELECT id FROM ' + table + ' WHERE id=?', args: [idValue] }))
  return Boolean(row)
}

function legacyType(kind: typeof ENTITY_KINDS[number]) {
  if (kind === 'federal_agency' || kind === 'office' || kind === 'program' || kind === 'contracting_office') return 'federal_agency'
  if (kind === 'state_local') return 'state_local'
  if (kind === 'prime') return 'prime'
  if (kind === 'integrator') return 'integrator'
  if (kind === 'reseller') return 'reseller'
  if (kind === 'distributor') return 'distributor'
  if (kind === 'partner') return 'partner'
  return 'commercial'
}

app.get('/api/v2/capture/dashboard', async (c) => {
  const db = getDb(c.env)
  const [entities, vehicles, pursuits, due, followUps, submissions] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM organizations WHERE status!='inactive'"),
    db.execute("SELECT COUNT(*) AS count FROM vehicles WHERE status IN ('planned','active')"),
    db.execute("SELECT COUNT(*) AS count,COALESCE(SUM(estimated_value_cents),0) AS value FROM crm_pursuits WHERE stage NOT IN ('won','lost','no_bid','archived')"),
    db.execute("SELECT COUNT(*) AS count FROM crm_pursuits WHERE due_at IS NOT NULL AND due_at <= datetime('now','+14 days') AND stage NOT IN ('submitted','won','lost','no_bid','archived')"),
    db.execute("SELECT COUNT(*) AS count FROM crm_engagements WHERE follow_up_at IS NOT NULL AND follow_up_at <= datetime('now','+7 days')"),
    db.execute("SELECT COUNT(*) AS count FROM crm_submissions WHERE status IN ('planned','drafting','review','ready')"),
  ])
  return c.json({
    entities: Number(entities.rows[0]?.count ?? 0),
    vehicles: Number(vehicles.rows[0]?.count ?? 0),
    activePursuits: Number(pursuits.rows[0]?.count ?? 0),
    pursuitValueCents: Number(pursuits.rows[0]?.value ?? 0),
    dueSoon: Number(due.rows[0]?.count ?? 0),
    followUpsDue: Number(followUps.rows[0]?.count ?? 0),
    openSubmissions: Number(submissions.rows[0]?.count ?? 0),
  })
})

app.get('/api/v2/capture/entities', async (c) => {
  const result = await getDb(c.env).execute(
    "SELECT o.*,COALESCE(ep.entity_kind,o.organization_type) AS entity_kind,ep.parent_organization_id,ep.website_url,ep.linkedin_url,ep.logo_url,COALESCE(ep.tracking_status,o.status) AS tracking_status,ep.summary,ep.tags_json,ep.naics_json,ep.psc_json,ep.small_business_programs_json," +
    "(SELECT COUNT(*) FROM crm_people p WHERE p.organization_id=o.id AND p.status!='archived') AS people_count," +
    "(SELECT COUNT(*) FROM crm_pursuits p WHERE p.target_entity_id=o.id AND p.stage NOT IN ('won','lost','no_bid','archived')) AS pursuit_count," +
    "(SELECT COUNT(*) FROM crm_vehicle_entities ve WHERE ve.organization_id=o.id) AS vehicle_count " +
    "FROM organizations o LEFT JOIN crm_entity_profiles_v2 ep ON ep.organization_id=o.id ORDER BY o.updated_at DESC LIMIT 500"
  )
  return c.json({ items: rows<Row>(result).map(withEntityArrays) })
})

app.post('/api/v2/capture/entities', async (c) => {
  const body = await parseBody(c, entitySchema)
  if (!(await recordExists(c, 'organizations', body.parentEntityId))) return c.json({ error: 'parent_not_found', message: 'Parent entity not found.' }, 404)
  const db = getDb(c.env)
  const recordId = makeId('org')
  const timestamp = now()
  await db.batch([
    {
      sql: 'INSERT INTO organizations (id,organization_type,legal_name,display_name,uei,cage_code,domain,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      args: [recordId, legacyType(body.entityKind), body.legalName, body.displayName ?? null, body.uei ?? null, body.cageCode ?? null, body.domain ?? null, body.trackingStatus === 'inactive' ? 'inactive' : 'active', timestamp, timestamp],
    },
    {
      sql: 'INSERT INTO crm_entity_profiles_v2 (organization_id,entity_kind,parent_organization_id,website_url,linkedin_url,tracking_status,summary,tags_json,naics_json,psc_json,small_business_programs_json,owner_oid,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      args: [recordId, body.entityKind, body.parentEntityId ?? null, body.websiteUrl ?? null, body.linkedinUrl ?? null, body.trackingStatus, body.summary ?? null, JSON.stringify(body.tags), JSON.stringify(body.naics), JSON.stringify(body.psc), JSON.stringify(body.smallBusinessPrograms), c.get('admin').oid, timestamp, timestamp],
    },
  ], 'write')
  return c.json({ id: recordId }, 201)
})

app.get('/api/v2/capture/entities/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const entity = first<Row>(await db.execute({
    sql: "SELECT o.*,COALESCE(ep.entity_kind,o.organization_type) AS entity_kind,ep.*,COALESCE(parent.display_name,parent.legal_name) AS parent_name FROM organizations o LEFT JOIN crm_entity_profiles_v2 ep ON ep.organization_id=o.id LEFT JOIN organizations parent ON parent.id=ep.parent_organization_id WHERE o.id=?",
    args: [recordId],
  }))
  if (!entity) return c.json({ error: 'entity_not_found', message: 'Entity not found.' }, 404)
  const [people, pursuits, vehicles, engagements] = await Promise.all([
    db.execute({ sql: "SELECT * FROM crm_people WHERE organization_id=? AND status!='archived' ORDER BY updated_at DESC", args: [recordId] }),
    db.execute({ sql: "SELECT DISTINCT p.* FROM crm_pursuits p LEFT JOIN crm_pursuit_entities pe ON pe.pursuit_id=p.id WHERE p.target_entity_id=? OR pe.organization_id=? ORDER BY p.updated_at DESC", args: [recordId, recordId] }),
    db.execute({ sql: "SELECT DISTINCT v.*,vp.vehicle_kind,ve.role FROM vehicles v LEFT JOIN crm_vehicle_profiles vp ON vp.vehicle_id=v.id LEFT JOIN crm_vehicle_entities ve ON ve.vehicle_id=v.id WHERE vp.owner_entity_id=? OR vp.managing_entity_id=? OR ve.organization_id=? ORDER BY v.updated_at DESC", args: [recordId, recordId, recordId] }),
    db.execute({ sql: 'SELECT * FROM crm_engagements WHERE organization_id=? ORDER BY occurred_at DESC LIMIT 200', args: [recordId] }),
  ])
  return c.json({ ...withEntityArrays(entity), people: rows<Row>(people), pursuits: rows<Row>(pursuits).map(withTags), vehicles: rows<Row>(vehicles), engagements: rows<Row>(engagements) })
})

app.get('/api/v2/capture/vehicles', async (c) => {
  const result = await getDb(c.env).execute(
    "SELECT v.*,COALESCE(vp.vehicle_kind,v.vehicle_type) AS vehicle_kind,vp.owner_entity_id,vp.managing_entity_id,vp.source_url,vp.source_system,vp.ceiling_cents,vp.ordering_end_date,vp.summary,vp.tags_json," +
    "COALESCE(owner.display_name,owner.legal_name) AS owner_name," +
    "(SELECT COUNT(*) FROM crm_pursuits p WHERE p.primary_vehicle_id=v.id AND p.stage NOT IN ('won','lost','no_bid','archived')) AS pursuit_count," +
    "(SELECT COUNT(*) FROM crm_vehicle_entities ve WHERE ve.vehicle_id=v.id) AS entity_count " +
    "FROM vehicles v LEFT JOIN crm_vehicle_profiles vp ON vp.vehicle_id=v.id LEFT JOIN organizations owner ON owner.id=vp.owner_entity_id " +
    "ORDER BY CASE v.status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,v.updated_at DESC LIMIT 500"
  )
  return c.json({ items: rows<Row>(result).map(withTags) })
})

app.post('/api/v2/capture/vehicles', async (c) => {
  const body = await parseBody(c, vehicleSchema)
  if (!(await recordExists(c, 'organizations', body.ownerEntityId)) || !(await recordExists(c, 'organizations', body.managingEntityId))) {
    return c.json({ error: 'entity_not_found', message: 'Vehicle entity not found.' }, 404)
  }
  const db = getDb(c.env)
  const recordId = makeId('veh')
  const timestamp = now()
  await db.batch([
    {
      sql: 'INSERT INTO vehicles (id,vehicle_name,vehicle_type,vehicle_number,holder_organization_id,start_date,end_date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      args: [recordId, body.name, body.vehicleKind, body.vehicleNumber ?? null, body.ownerEntityId ?? null, body.startDate ?? null, body.endDate ?? null, body.status, timestamp, timestamp],
    },
    {
      sql: 'INSERT INTO crm_vehicle_profiles (vehicle_id,vehicle_kind,owner_entity_id,managing_entity_id,source_url,source_system,ceiling_cents,ordering_end_date,summary,tags_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      args: [recordId, body.vehicleKind, body.ownerEntityId ?? null, body.managingEntityId ?? null, body.sourceUrl ?? null, body.sourceSystem ?? null, body.ceilingCents ?? null, body.orderingEndDate ?? null, body.summary ?? null, JSON.stringify(body.tags), timestamp, timestamp],
    },
  ], 'write')
  return c.json({ id: recordId }, 201)
})

app.get('/api/v2/capture/vehicles/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const vehicle = first<Row>(await db.execute({
    sql: "SELECT v.*,COALESCE(vp.vehicle_kind,v.vehicle_type) AS vehicle_kind,vp.*,COALESCE(owner.display_name,owner.legal_name) AS owner_name,COALESCE(manager.display_name,manager.legal_name) AS managing_name FROM vehicles v LEFT JOIN crm_vehicle_profiles vp ON vp.vehicle_id=v.id LEFT JOIN organizations owner ON owner.id=vp.owner_entity_id LEFT JOIN organizations manager ON manager.id=vp.managing_entity_id WHERE v.id=?",
    args: [recordId],
  }))
  if (!vehicle) return c.json({ error: 'vehicle_not_found', message: 'Vehicle not found.' }, 404)
  const [entities, pursuits, engagements] = await Promise.all([
    db.execute({ sql: 'SELECT o.*,ve.role,ve.contract_number,ve.notes,ve.is_primary FROM crm_vehicle_entities ve JOIN organizations o ON o.id=ve.organization_id WHERE ve.vehicle_id=? ORDER BY ve.is_primary DESC,o.legal_name', args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM crm_pursuits WHERE primary_vehicle_id=? ORDER BY updated_at DESC', args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM crm_engagements WHERE vehicle_id=? ORDER BY occurred_at DESC LIMIT 200', args: [recordId] }),
  ])
  return c.json({ ...withTags(vehicle), entities: rows<Row>(entities), pursuits: rows<Row>(pursuits).map(withTags), engagements: rows<Row>(engagements) })
})

app.post('/api/v2/capture/vehicles/:id/entities', async (c) => {
  const body = await parseBody(c, linkEntitySchema)
  const vehicleId = c.req.param('id')
  if (!(await recordExists(c, 'vehicles', vehicleId)) || !(await recordExists(c, 'organizations', body.organizationId))) return c.json({ error: 'not_found', message: 'Vehicle or entity not found.' }, 404)
  await getDb(c.env).execute({
    sql: 'INSERT INTO crm_vehicle_entities (id,vehicle_id,organization_id,role,notes,is_primary,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(vehicle_id,organization_id,role) DO UPDATE SET notes=excluded.notes,is_primary=excluded.is_primary',
    args: [makeId('ver'), vehicleId, body.organizationId, body.role, body.notes ?? null, body.isPrimary ? 1 : 0, now()],
  })
  return c.json({ linked: true }, 201)
})

app.get('/api/v2/capture/pursuits', async (c) => {
  const result = await getDb(c.env).execute(
    "SELECT p.*,COALESCE(e.display_name,e.legal_name) AS target_entity_name,v.vehicle_name AS vehicle_name," +
    "(SELECT COUNT(*) FROM crm_submissions s WHERE s.pursuit_id=p.id AND s.status NOT IN ('accepted','rejected','superseded')) AS submission_count," +
    "(SELECT COUNT(*) FROM crm_pursuit_entities pe WHERE pe.pursuit_id=p.id) AS entity_count," +
    "(SELECT COUNT(*) FROM crm_pursuit_people pp WHERE pp.pursuit_id=p.id) AS people_count " +
    "FROM crm_pursuits p LEFT JOIN organizations e ON e.id=p.target_entity_id LEFT JOIN vehicles v ON v.id=p.primary_vehicle_id " +
    "ORDER BY CASE p.stage WHEN 'submitted' THEN 0 WHEN 'drafting' THEN 1 WHEN 'teaming' THEN 2 WHEN 'outreach' THEN 3 ELSE 4 END,p.due_at IS NULL,p.due_at,p.updated_at DESC LIMIT 500"
  )
  return c.json({ items: rows<Row>(result).map(withTags) })
})

app.post('/api/v2/capture/pursuits', async (c) => {
  const body = await parseBody(c, pursuitSchema)
  if (!(await recordExists(c, 'organizations', body.targetEntityId)) || !(await recordExists(c, 'vehicles', body.primaryVehicleId))) {
    return c.json({ error: 'related_record_not_found', message: 'A related entity or vehicle was not found.' }, 404)
  }
  const recordId = makeId('pur')
  const timestamp = now()
  await getDb(c.env).execute({
    sql: 'INSERT INTO crm_pursuits (id,title,pursuit_type,stage,priority,target_entity_id,primary_vehicle_id,identifier,source_url,source_system,posted_at,due_at,expected_decision_at,estimated_value_cents,probability_percent,next_action,next_action_at,owner_oid,summary,tags_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [recordId, body.title, body.pursuitType, body.stage, body.priority, body.targetEntityId ?? null, body.primaryVehicleId ?? null, body.identifier ?? null, body.sourceUrl ?? null, body.sourceSystem ?? null, body.postedAt ?? null, body.dueAt ?? null, body.expectedDecisionAt ?? null, body.estimatedValueCents ?? null, body.probabilityPercent ?? null, body.nextAction ?? null, body.nextActionAt ?? null, c.get('admin').oid, body.summary ?? null, JSON.stringify(body.tags), timestamp, timestamp],
  })
  return c.json({ id: recordId }, 201)
})

app.get('/api/v2/capture/pursuits/:id', async (c) => {
  const db = getDb(c.env)
  const recordId = c.req.param('id')
  const pursuit = first<Row>(await db.execute({
    sql: 'SELECT p.*,COALESCE(e.display_name,e.legal_name) AS target_entity_name,v.vehicle_name AS vehicle_name FROM crm_pursuits p LEFT JOIN organizations e ON e.id=p.target_entity_id LEFT JOIN vehicles v ON v.id=p.primary_vehicle_id WHERE p.id=?',
    args: [recordId],
  }))
  if (!pursuit) return c.json({ error: 'pursuit_not_found', message: 'Pursuit not found.' }, 404)
  const [entities, people, submissions, engagements] = await Promise.all([
    db.execute({ sql: 'SELECT o.*,pe.role,pe.is_primary,pe.notes FROM crm_pursuit_entities pe JOIN organizations o ON o.id=pe.organization_id WHERE pe.pursuit_id=? ORDER BY pe.is_primary DESC,o.legal_name', args: [recordId] }),
    db.execute({ sql: 'SELECT p.*,pp.role,pp.is_primary,pp.notes FROM crm_pursuit_people pp JOIN crm_people p ON p.id=pp.person_id WHERE pp.pursuit_id=? ORDER BY pp.is_primary DESC,p.last_name,p.first_name', args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM crm_submissions WHERE pursuit_id=? ORDER BY due_at IS NULL,due_at,created_at DESC', args: [recordId] }),
    db.execute({ sql: 'SELECT * FROM crm_engagements WHERE pursuit_id=? ORDER BY occurred_at DESC LIMIT 200', args: [recordId] }),
  ])
  return c.json({ ...withTags(pursuit), entities: rows<Row>(entities), people: rows<Row>(people), submissions: rows<Row>(submissions), engagements: rows<Row>(engagements) })
})

app.post('/api/v2/capture/pursuits/:id/entities', async (c) => {
  const body = await parseBody(c, linkEntitySchema)
  const pursuitId = c.req.param('id')
  if (!(await recordExists(c, 'crm_pursuits', pursuitId)) || !(await recordExists(c, 'organizations', body.organizationId))) return c.json({ error: 'not_found', message: 'Pursuit or entity not found.' }, 404)
  await getDb(c.env).execute({
    sql: 'INSERT INTO crm_pursuit_entities (id,pursuit_id,organization_id,role,is_primary,notes,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(pursuit_id,organization_id,role) DO UPDATE SET is_primary=excluded.is_primary,notes=excluded.notes',
    args: [makeId('prel'), pursuitId, body.organizationId, body.role, body.isPrimary ? 1 : 0, body.notes ?? null, now()],
  })
  return c.json({ linked: true }, 201)
})

app.post('/api/v2/capture/pursuits/:id/people', async (c) => {
  const body = await parseBody(c, linkPersonSchema)
  const pursuitId = c.req.param('id')
  if (!(await recordExists(c, 'crm_pursuits', pursuitId)) || !(await recordExists(c, 'crm_people', body.personId))) return c.json({ error: 'not_found', message: 'Pursuit or person not found.' }, 404)
  await getDb(c.env).execute({
    sql: 'INSERT INTO crm_pursuit_people (id,pursuit_id,person_id,role,is_primary,notes,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(pursuit_id,person_id,role) DO UPDATE SET is_primary=excluded.is_primary,notes=excluded.notes',
    args: [makeId('pp'), pursuitId, body.personId, body.role, body.isPrimary ? 1 : 0, body.notes ?? null, now()],
  })
  return c.json({ linked: true }, 201)
})

app.post('/api/v2/capture/pursuits/:id/submissions', async (c) => {
  const body = await parseBody(c, submissionSchema)
  const pursuitId = c.req.param('id')
  if (!(await recordExists(c, 'crm_pursuits', pursuitId))) return c.json({ error: 'pursuit_not_found', message: 'Pursuit not found.' }, 404)
  const recordId = makeId('sub')
  const timestamp = now()
  await getDb(c.env).execute({
    sql: 'INSERT INTO crm_submissions (id,pursuit_id,name,submission_type,status,due_at,submitted_at,delivery_method,destination,confirmation_id,notes,created_by_oid,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [recordId, pursuitId, body.name, body.submissionType, body.status, body.dueAt ?? null, body.submittedAt ?? null, body.deliveryMethod ?? null, body.destination ?? null, body.confirmationId ?? null, body.notes ?? null, c.get('admin').oid, timestamp, timestamp],
  })
  return c.json({ id: recordId }, 201)
})

app.post('/api/v2/capture/engagements', async (c) => {
  const body = await parseBody(c, engagementSchema)
  const recordId = makeId('eng')
  const timestamp = now()
  await getDb(c.env).execute({
    sql: 'INSERT INTO crm_engagements (id,organization_id,person_id,pursuit_id,vehicle_id,channel,direction,status,subject,body,outcome,external_url,occurred_at,follow_up_at,created_by_oid,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [recordId, body.organizationId ?? null, body.personId ?? null, body.pursuitId ?? null, body.vehicleId ?? null, body.channel, body.direction, body.status, body.subject ?? null, body.body ?? null, body.outcome ?? null, body.externalUrl ?? null, body.occurredAt ?? timestamp, body.followUpAt ?? null, c.get('admin').oid, timestamp],
  })
  return c.json({ id: recordId }, 201)
})

app.onError((error, c) => {
  if (error instanceof Response) return error
  console.error('capture-crm error', error)
  return c.json({ error: 'internal_error', message: error instanceof Error ? error.message : 'Internal server error.' }, 500)
})

export default app
