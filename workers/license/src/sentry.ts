/** POST /api/sentry/webhook — Sentry integration webhooks (issue created, event alerts). */
import { first, getDb } from './db'
import type { Bindings } from './env'
import { createInboxItem } from './inbox'
import { ApiError, GUID_RE, constantTimeEqual, hmacSha256, id, isObject, now, readText, toHex, type WaitUntil, background } from './util'

/** Repeat alerts for one issue are collapsed to one error.spike per window. */
export const SPIKE_ALERT_WINDOW_MS = 6 * 60 * 60 * 1000
const MAX_WEBHOOK_BYTES = 1024 * 1024

type Row = Record<string, unknown>

export async function verifySentrySignature(secret: string | undefined, rawBody: string, signature: string | null): Promise<boolean> {
  if (!secret || !signature) return false
  const expected = toHex(await hmacSha256(secret, rawBody))
  return constantTimeEqual(expected, signature.trim().toLowerCase())
}

/** Sentry sends tags as [[key, value]] on events, or [{ key, value }] on some payloads. */
export function readTag(source: unknown, name: string): string | null {
  if (!isObject(source)) return null
  const tags = source.tags
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (Array.isArray(tag) && tag[0] === name && typeof tag[1] === 'string') return tag[1]
      if (isObject(tag) && tag.key === name && typeof tag.value === 'string') return tag.value
    }
  } else if (isObject(tags) && typeof tags[name] === 'string') {
    return tags[name] as string
  }
  return null
}

type Parsed = {
  issueId: string
  title: string
  culprit: string | null
  level: string | null
  url: string | null
  tenantId: string | null
  deploymentId: string | null
  source: string | null
}

function parsePayload(resource: string, payload: Record<string, unknown>): Parsed | null {
  const data = isObject(payload.data) ? payload.data : {}
  const subject = resource === 'issue' ? data.issue : resource === 'event_alert' ? data.event : null
  if (!isObject(subject)) return null
  const issueId = resource === 'issue' ? subject.id : subject.issue_id
  if (issueId == null) return null
  const text = (value: unknown) => (typeof value === 'string' && value ? value : null)
  const tenant = readTag(subject, 'tenant_id')?.toLowerCase() ?? null
  return {
    issueId: String(issueId),
    title: text(subject.title) ?? 'Untitled error',
    culprit: text(subject.culprit),
    level: text(subject.level),
    url: text(subject.permalink) ?? text(subject.web_url) ?? text(subject.issue_url),
    tenantId: tenant && GUID_RE.test(tenant) ? tenant : null,
    deploymentId: readTag(subject, 'deployment_id'),
    source: readTag(subject, 'source'),
  }
}

export async function handleSentryWebhook(request: Request, env: Bindings, ctx?: WaitUntil, nowMs = Date.now()): Promise<Response> {
  if (!env.SENTRY_CLIENT_SECRET) throw new ApiError(503, 'sentry_not_configured', 'Sentry webhook is not configured.')
  const raw = await readText(request, MAX_WEBHOOK_BYTES)
  if (!(await verifySentrySignature(env.SENTRY_CLIENT_SECRET, raw, request.headers.get('sentry-hook-signature')))) {
    throw new ApiError(401, 'invalid_signature', 'Sentry-Hook-Signature is invalid.')
  }
  const resource = request.headers.get('sentry-hook-resource') ?? ''
  let payload: unknown
  try { payload = JSON.parse(raw) } catch { throw new ApiError(400, 'invalid_json', 'Body must be JSON.') }
  if (!isObject(payload)) throw new ApiError(400, 'invalid_json', 'Body must be a JSON object.')
  if (resource === 'issue' && payload.action !== 'created') return Response.json({ ignored: true })
  if (resource !== 'issue' && resource !== 'event_alert') return Response.json({ ignored: true })
  const parsed = parsePayload(resource, payload)
  if (!parsed) return Response.json({ ignored: true })

  const db = getDb(env)
  const timestamp = new Date(nowMs).toISOString()
  const existing = first<Row>(await db.execute({ sql: 'SELECT * FROM tenant_errors WHERE sentry_issue_id=?', args: [parsed.issueId] }))
  let kind: 'error.new' | 'error.spike' | null = null
  let tenantId = parsed.tenantId
  if (!existing) {
    const inserted = await db.execute({
      sql: `INSERT INTO tenant_errors (id, sentry_issue_id, tenant_id, deployment_id, source, title, culprit, level, sentry_url, alert_count, first_seen_at, last_seen_at, last_alerted_at, raw_json)
            VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?) ON CONFLICT(sentry_issue_id) DO NOTHING`,
      args: [id('err'), parsed.issueId, parsed.tenantId, parsed.deploymentId, parsed.source, parsed.title.slice(0, 500), parsed.culprit, parsed.level, parsed.url, timestamp, timestamp, timestamp, raw.slice(0, 64 * 1024)],
    })
    if (inserted.rowsAffected) kind = 'error.new'
  } else {
    tenantId = existing.tenant_id ? String(existing.tenant_id) : parsed.tenantId
    const lastAlerted = existing.last_alerted_at ? Date.parse(String(existing.last_alerted_at)) : 0
    const spike = resource === 'event_alert' && nowMs - lastAlerted >= SPIKE_ALERT_WINDOW_MS
    await db.execute({
      sql: `UPDATE tenant_errors SET last_seen_at=?, tenant_id=COALESCE(tenant_id, ?), sentry_url=COALESCE(sentry_url, ?),
              alert_count=alert_count + ?, last_alerted_at=CASE WHEN ? THEN ? ELSE last_alerted_at END WHERE id=?`,
      args: [timestamp, parsed.tenantId, parsed.url, resource === 'event_alert' ? 1 : 0, spike ? 1 : 0, timestamp, String(existing.id)],
    })
    if (spike) kind = 'error.spike'
  }
  if (kind) {
    background(ctx, `${kind} inbox`, createInboxItem(env, {
      kind,
      title: kind === 'error.new' ? `New error: ${parsed.title}`.slice(0, 200) : `Error spike: ${parsed.title}`.slice(0, 200),
      body: [parsed.culprit, parsed.source, tenantId ? `Tenant ${tenantId}` : 'No tenant tag'].filter(Boolean).join(' · '),
      tenantId,
    }, { audience: 'assigned' }))
  }
  return Response.json({ ok: true, alert: kind })
}
