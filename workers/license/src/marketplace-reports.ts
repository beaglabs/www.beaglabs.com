import { Hono, type Context } from 'hono'

import { buildAuth } from './auth'
import { first, getDb } from './db'
import { adminOids, type Bindings } from './env'

type Row = Record<string, unknown>
type AppEnv = { Bindings: Bindings }
type AppContext = Context<AppEnv>
type Admin = { oid: string; tenantId: string; email?: string; name?: string }

const app = new Hono<AppEnv>()
const PARTNER_CENTER_API = 'https://api.partnercenter.microsoft.com/insights/v1.1/cmp'
const VM_USAGE_QUERY_ID = '2c6f384b-ad52-4aed-965f-32bfa09b3778'
const REPORT_STATE_KEY = 'vm-normalized-usage'
const REPORT_NAME_PREFIX = 'Beag Labs Papyrus VM Usage'
const REPORT_DESCRIPTION = 'Papyrus VM normalized usage ingested into Beag Labs Marketplace Operations'
const RECURRENCE_INTERVAL_HOURS = 24
const RECURRENCE_COUNT = 180

function now(): string {
  return new Date().toISOString()
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function numberValue(value: unknown): number | null {
  if (value === '' || value === undefined || value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function pick(row: Row, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
    const found = Object.keys(row).find((candidate) => candidate.toLowerCase() === key.toLowerCase())
    if (found && row[found] !== undefined && row[found] !== null) return row[found]
  }
  return undefined
}

function values(json: unknown): Row[] {
  if (!json || typeof json !== 'object') return []
  const record = json as Row
  const value = record.value ?? record.Value
  return Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === 'object') : []
}

function apiMessage(json: unknown): string {
  if (!json || typeof json !== 'object') return ''
  const record = json as Row
  return text(record.message ?? record.Message)
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function partnerCredentials(env: Bindings) {
  return {
    tenantId: env.MARKETPLACE_ANALYTICS_TENANT_ID || env.MICROSOFT_TENANT_ID,
    clientId: env.MARKETPLACE_ANALYTICS_CLIENT_ID || env.MICROSOFT_CLIENT_ID,
    clientSecret: env.MARKETPLACE_ANALYTICS_CLIENT_SECRET || env.MICROSOFT_CLIENT_SECRET,
  }
}

async function partnerCenterToken(env: Bindings): Promise<string> {
  const { tenantId, clientId, clientSecret } = partnerCredentials(env)
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

async function partnerJson(token: string, path: string, init?: RequestInit): Promise<{ response: Response; json: unknown }> {
  const response = await fetch(`${PARTNER_CENTER_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const json = await response.json().catch(() => ({}))
  return { response, json }
}

function reportId(row: Row): string {
  return text(pick(row, 'reportId', 'ReportId'))
}

function reportStatus(row: Row): string {
  return text(pick(row, 'reportStatus', 'ReportStatus'))
}

async function saveReportState(env: Bindings, patch: {
  reportId?: string | null
  reportName?: string | null
  reportStatus?: string | null
  executionId?: string | null
  executionStatus?: string | null
  generatedAt?: string | null
  syncedAt?: string | null
}) {
  const db = getDb(env)
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO marketplace_report_state
      (state_key,query_id,report_id,report_name,report_status,last_execution_id,last_execution_status,last_generated_at,last_synced_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(state_key) DO UPDATE SET
        query_id=excluded.query_id,
        report_id=COALESCE(excluded.report_id,marketplace_report_state.report_id),
        report_name=COALESCE(excluded.report_name,marketplace_report_state.report_name),
        report_status=COALESCE(excluded.report_status,marketplace_report_state.report_status),
        last_execution_id=COALESCE(excluded.last_execution_id,marketplace_report_state.last_execution_id),
        last_execution_status=COALESCE(excluded.last_execution_status,marketplace_report_state.last_execution_status),
        last_generated_at=COALESCE(excluded.last_generated_at,marketplace_report_state.last_generated_at),
        last_synced_at=COALESCE(excluded.last_synced_at,marketplace_report_state.last_synced_at),
        updated_at=excluded.updated_at`,
    args: [
      REPORT_STATE_KEY, VM_USAGE_QUERY_ID, patch.reportId ?? null, patch.reportName ?? null, patch.reportStatus ?? null,
      patch.executionId ?? null, patch.executionStatus ?? null, patch.generatedAt ?? null, patch.syncedAt ?? null, timestamp, timestamp,
    ],
  })
}

async function fetchReportById(token: string, idValue: string): Promise<Row | null> {
  const url = new URL(`${PARTNER_CENTER_API}/ScheduledReport`)
  url.searchParams.set('reportId', idValue)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
  if (response.status === 404) return null
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Get Partner Center report failed (${response.status}): ${apiMessage(json) || JSON.stringify(json)}`)
  return values(json)[0] ?? null
}

async function discoverActiveReport(token: string): Promise<Row | null> {
  const url = new URL(`${PARTNER_CENTER_API}/ScheduledReport`)
  url.searchParams.set('reportName', REPORT_NAME_PREFIX)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
  if (response.status === 404) return null
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Find Partner Center report failed (${response.status}): ${apiMessage(json) || JSON.stringify(json)}`)
  return values(json).find((row) => reportStatus(row).toLowerCase() === 'active') ?? null
}

function partnerDate(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function createScheduledReport(token: string): Promise<Row> {
  const start = new Date(Date.now() + 5 * 60 * 60 * 1000)
  const suffix = start.toISOString().slice(0, 10).replace(/-/g, '')
  const payload = {
    ReportName: `${REPORT_NAME_PREFIX} ${suffix}`,
    Description: REPORT_DESCRIPTION,
    QueryId: VM_USAGE_QUERY_ID,
    StartTime: partnerDate(start),
    RecurrenceInterval: RECURRENCE_INTERVAL_HOURS,
    RecurrenceCount: RECURRENCE_COUNT,
    Format: 'csv',
  }
  const { response, json } = await partnerJson(token, '/ScheduledReport', { method: 'POST', body: JSON.stringify(payload) })
  if (!response.ok) throw new Error(`Create Partner Center scheduled report failed (${response.status}): ${apiMessage(json) || JSON.stringify(json)}`)
  const report = values(json)[0]
  if (!report || !reportId(report)) throw new Error('Partner Center created a report without returning a reportId.')
  return report
}

async function ensureScheduledReport(env: Bindings, token: string): Promise<Row> {
  const db = getDb(env)
  const state = first<Row>(await db.execute({ sql: 'SELECT * FROM marketplace_report_state WHERE state_key=?', args: [REPORT_STATE_KEY] }))
  let report: Row | null = null

  if (state?.report_id) report = await fetchReportById(token, text(state.report_id))
  if (!report && !state?.report_id) report = await discoverActiveReport(token)

  if (report && reportStatus(report).toLowerCase() === 'active') {
    await saveReportState(env, {
      reportId: reportId(report),
      reportName: text(pick(report, 'reportName', 'ReportName')),
      reportStatus: reportStatus(report),
    })
    return report
  }

  report = await createScheduledReport(token)
  await saveReportState(env, {
    reportId: reportId(report),
    reportName: text(pick(report, 'reportName', 'ReportName')),
    reportStatus: reportStatus(report) || 'Active',
  })
  return report
}

type Execution = {
  id: string
  status: string
  secureLink: string
  generatedAt: string
  expiresAt: string
}

async function executionRequest(token: string, reportIdValue: string, status: 'Completed' | 'Pending' | 'Running'): Promise<Row | null> {
  const url = new URL(`${PARTNER_CENTER_API}/ScheduledReport/execution/${encodeURIComponent(reportIdValue)}`)
  url.searchParams.set('getLatestExecution', 'true')
  url.searchParams.set('executionStatus', status)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
  if (response.status === 404) return null
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Get Partner Center report execution failed (${response.status}): ${apiMessage(json) || JSON.stringify(json)}`)
  return values(json)[0] ?? null
}

async function latestExecution(env: Bindings, token: string, reportIdValue: string): Promise<Execution | null> {
  const completed = await executionRequest(token, reportIdValue, 'Completed')
  if (completed) {
    const execution: Execution = {
      id: text(pick(completed, 'executionId', 'ExecutionId')),
      status: text(pick(completed, 'executionStatus', 'ExecutionStatus')) || 'Completed',
      secureLink: text(pick(completed, 'reportAccessSecureLink', 'ReportAccessSecureLink')),
      generatedAt: text(pick(completed, 'reportGeneratedTime', 'ReportGeneratedTime')),
      expiresAt: text(pick(completed, 'reportExpiryTime', 'ReportExpiryTime')),
    }
    await saveReportState(env, {
      executionId: execution.id || null,
      executionStatus: execution.status,
      generatedAt: execution.generatedAt || null,
    })
    return execution.secureLink ? execution : null
  }

  const running = await executionRequest(token, reportIdValue, 'Running')
  const pending = running ?? await executionRequest(token, reportIdValue, 'Pending')
  if (pending) {
    await saveReportState(env, {
      executionId: text(pick(pending, 'executionId', 'ExecutionId')) || null,
      executionStatus: text(pick(pending, 'executionStatus', 'ExecutionStatus')) || 'Pending',
    })
  }
  return null
}

function parseCsv(input: string): Row[] {
  const textValue = input.replace(/^\uFEFF/, '')
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < textValue.length; index += 1) {
    const char = textValue[index]
    if (quoted) {
      if (char === '"') {
        if (textValue[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      record.push(field)
      field = ''
    } else if (char === '\n') {
      record.push(field.replace(/\r$/, ''))
      records.push(record)
      record = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length || record.length) {
    record.push(field.replace(/\r$/, ''))
    records.push(record)
  }

  const header = records.shift()?.map((value) => value.trim()) ?? []
  if (!header.length) return []
  return records
    .filter((row) => row.some((value) => value !== ''))
    .map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])))
}

async function downloadExecution(execution: Execution): Promise<Row[]> {
  const response = await fetch(execution.secureLink)
  if (!response.ok) throw new Error(`Download Partner Center report failed (${response.status}): ${await response.text()}`)
  return parseCsv(await response.text())
}

async function findOrCreateOrganization(env: Bindings, companyNameInput: string): Promise<string> {
  const db = getDb(env)
  const companyName = companyNameInput.trim() || 'Microsoft Marketplace customer'
  const existing = first<Row>(await db.execute({
    sql: "SELECT * FROM organizations WHERE lower(legal_name)=lower(?) OR lower(COALESCE(display_name,''))=lower(?) LIMIT 1",
    args: [companyName, companyName],
  }))
  if (existing) {
    const recordId = text(existing.id)
    await db.execute({ sql: "UPDATE organizations SET status='active',updated_at=? WHERE id=?", args: [now(), recordId] })
    return recordId
  }

  const recordId = id('org')
  const timestamp = now()
  await db.execute({
    sql: `INSERT INTO organizations (id,organization_type,legal_name,display_name,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?)`,
    args: [recordId, 'commercial', companyName, companyName, 'active', timestamp, timestamp],
  })
  return recordId
}

async function ingestUsageRows(env: Bindings, records: Row[]): Promise<number> {
  const db = getDb(env)
  let written = 0

  for (const record of records) {
    const companyName = text(pick(record, 'CustomerCompanyName')) || text(pick(record, 'CustomerName')) || 'Microsoft Marketplace customer'
    const organizationId = await findOrCreateOrganization(env, companyName)
    const observationKey = await sha256([
      text(pick(record, 'MarketplaceSubscriptionId')),
      text(pick(record, 'CustomerId')),
      text(pick(record, 'OfferName')),
      text(pick(record, 'SKU', 'Sku')),
    ].join('|'))
    const timestamp = now()
    const usageDate = text(pick(record, 'UsageDate')) || timestamp
    const existing = first<Row>(await db.execute({ sql: 'SELECT id FROM marketplace_vm_customers WHERE observation_key=?', args: [observationKey] }))
    const recordId = existing ? text(existing.id) : id('mkc')

    await db.execute({
      sql: `INSERT INTO marketplace_vm_customers
        (id,observation_key,marketplace_subscription_id,customer_id,billing_account_id,customer_name,customer_company_name,customer_country,offer_name,sku,azure_license_type,marketplace_license_type,vm_size,cloud_instance_name,deployment_method,first_seen_at,last_seen_at,normalized_usage,raw_usage,estimated_charge,organization_id,raw_json,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
          estimated_charge=MAX(COALESCE(marketplace_vm_customers.estimated_charge,0),COALESCE(excluded.estimated_charge,0)),
          organization_id=excluded.organization_id,
          raw_json=excluded.raw_json,
          updated_at=excluded.updated_at`,
      args: [
        recordId, observationKey, text(pick(record, 'MarketplaceSubscriptionId')) || null, text(pick(record, 'CustomerId')) || null,
        text(pick(record, 'BillingAccountId')) || null, text(pick(record, 'CustomerName')) || null, companyName,
        text(pick(record, 'CustomerCountry')) || null, text(pick(record, 'OfferName')) || null, text(pick(record, 'SKU', 'Sku')) || null,
        text(pick(record, 'AzureLicenseType')) || null, text(pick(record, 'MarketplaceLicenseType')) || null, text(pick(record, 'VMSize')) || null,
        text(pick(record, 'CloudInstanceName')) || null, text(pick(record, 'DeploymentMethod')) || null, usageDate, usageDate,
        numberValue(pick(record, 'NormalizedUsage')), null, numberValue(pick(record, 'EstimatedExtendedChargePC')),
        organizationId, JSON.stringify(record), timestamp, timestamp,
      ],
    })
    written += 1

    await db.execute({
      sql: "UPDATE marketplace_leads SET status='customer',updated_at=? WHERE organization_id=? AND status NOT IN ('customer','closed')",
      args: [timestamp, organizationId],
    })
  }

  return written
}

export async function syncMarketplaceVmUsageScheduled(env: Bindings): Promise<{
  status: 'completed' | 'skipped'
  recordsSeen: number
  recordsWritten: number
  reportId: string
  executionId?: string
}> {
  const db = getDb(env)
  const runId = id('mks')
  const startedAt = now()
  await db.execute({
    sql: 'INSERT INTO marketplace_sync_runs (id,source,status,records_seen,records_written,started_at) VALUES (?,?,?,?,?,?)',
    args: [runId, 'partner_center_scheduled_report', 'started', 0, 0, startedAt],
  })

  try {
    const token = await partnerCenterToken(env)
    const report = await ensureScheduledReport(env, token)
    const reportIdValue = reportId(report)
    const execution = await latestExecution(env, token, reportIdValue)

    if (!execution) {
      const message = 'Scheduled report is provisioned but no completed execution is available yet.'
      await db.execute({
        sql: "UPDATE marketplace_sync_runs SET status='skipped',error_message=?,completed_at=? WHERE id=?",
        args: [message, now(), runId],
      })
      return { status: 'skipped', recordsSeen: 0, recordsWritten: 0, reportId: reportIdValue }
    }

    const state = first<Row>(await db.execute({ sql: 'SELECT * FROM marketplace_report_state WHERE state_key=?', args: [REPORT_STATE_KEY] }))
    if (text(state?.last_synced_execution_id) === execution.id) {
      await db.execute({
        sql: "UPDATE marketplace_sync_runs SET status='skipped',error_message=?,completed_at=? WHERE id=?",
        args: ['Latest Partner Center report execution was already ingested.', now(), runId],
      })
      return { status: 'skipped', recordsSeen: 0, recordsWritten: 0, reportId: reportIdValue, executionId: execution.id }
    }

    const records = await downloadExecution(execution)
    const written = await ingestUsageRows(env, records)
    const completedAt = now()
    await db.execute({
      sql: "UPDATE marketplace_report_state SET last_synced_execution_id=?,last_synced_at=?,updated_at=? WHERE state_key=?",
      args: [execution.id, completedAt, completedAt, REPORT_STATE_KEY],
    })
    await db.execute({
      sql: "UPDATE marketplace_sync_runs SET status='completed',records_seen=?,records_written=?,completed_at=? WHERE id=?",
      args: [records.length, written, completedAt, runId],
    })
    return { status: 'completed', recordsSeen: records.length, recordsWritten: written, reportId: reportIdValue, executionId: execution.id }
  } catch (error) {
    await db.execute({
      sql: "UPDATE marketplace_sync_runs SET status='failed',error_message=?,completed_at=? WHERE id=?",
      args: [error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000), now(), runId],
    })
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

app.post('/api/v1/marketplace/sync', async (c) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'unauthorized', message: 'Microsoft administrator sign-in required.' }, 401)
  try {
    return c.json(await syncMarketplaceVmUsageScheduled(c.env))
  } catch (error) {
    console.error('Marketplace scheduled report sync failed', error)
    return c.json({ error: 'sync_failed', message: error instanceof Error ? error.message : 'Marketplace analytics sync failed.' }, 502)
  }
})

export default app
