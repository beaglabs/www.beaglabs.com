/** POST /api/v1/track — Analytics.js-shaped batches keyed by Entra tenant id. */
import { authenticateDeployment, authenticateStaffToken, authorizationParts, verifyChatSession } from './auth'
import { getDb } from './db'
import type { Bindings } from './env'
import { forwardToCustomerIo, storeEvents, type EventSource, type StoredEvent } from './events'
import { createInboxItem } from './inbox'
import { decodeJwt } from './jwt'
import { staffCanSeeTenant } from './visibility'
import { ApiError, GUID_RE, background, isObject, now, readText, type WaitUntil } from './util'

export const MAX_BATCH_ITEMS = 100
export const MAX_BATCH_BYTES = 256 * 1024
export const MAX_ANONYMOUS_ITEM_BYTES = 1024
export const MAX_ITEM_BYTES = 32 * 1024
export const ANONYMOUS_BATCHES_PER_MINUTE = 30
const EVENT_NAME_RE = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/

type Caller = {
  source: EventSource
  tenantId: string | null
  deploymentId: string | null
  anonymous: boolean
  /** Staff may attribute events to a visible tenant via context.tenantId. */
  resolveTenant?: (candidate: string) => Promise<boolean>
}

const anonymousHits = new Map<string, { windowStart: number; count: number }>()

export function resetTrackRateLimit(): void {
  anonymousHits.clear()
}

function rateLimitAnonymous(ip: string): void {
  const current = Date.now()
  if (anonymousHits.size > 5000) {
    for (const [key, entry] of anonymousHits) if (current - entry.windowStart > 60_000) anonymousHits.delete(key)
  }
  const entry = anonymousHits.get(ip)
  if (!entry || current - entry.windowStart > 60_000) {
    anonymousHits.set(ip, { windowStart: current, count: 1 })
    return
  }
  entry.count += 1
  if (entry.count > ANONYMOUS_BATCHES_PER_MINUTE) throw new ApiError(429, 'rate_limited', 'Too many anonymous event batches; slow down.')
}

async function identifyCaller(env: Bindings, request: Request): Promise<Caller> {
  const parts = authorizationParts(request)
  if (!parts) {
    rateLimitAnonymous(request.headers.get('cf-connecting-ip') || 'unknown')
    return { source: 'web', tenantId: null, deploymentId: null, anonymous: true }
  }
  if (parts.scheme === 'deployment') {
    const deployment = await authenticateDeployment(env, parts.credentials)
    return { source: 'papyrus', tenantId: deployment.tenantId, deploymentId: deployment.deploymentId, anonymous: false }
  }
  if (parts.scheme === 'bearer') {
    if (decodeJwt(parts.credentials).header.alg === 'HS256') {
      const customer = await verifyChatSession(env, parts.credentials)
      return { source: 'papyrus', tenantId: customer.tenantId, deploymentId: customer.deploymentId, anonymous: false }
    }
    const staff = await authenticateStaffToken(env, parts.credentials)
    return { source: 'admin', tenantId: null, deploymentId: null, anonymous: false, resolveTenant: (tenantId) => staffCanSeeTenant(env, staff, tenantId) }
  }
  throw new ApiError(401, 'unauthorized', 'Unsupported authorization scheme.')
}

function optionalString(value: unknown, max = 200): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null
}

/** Validates one Analytics.js item; returns null for items that are skipped. */
export function normalizeItem(item: unknown, caller: Caller): StoredEvent | null {
  if (!isObject(item)) return null
  const size = new TextEncoder().encode(JSON.stringify(item)).byteLength
  if (size > (caller.anonymous ? MAX_ANONYMOUS_ITEM_BYTES : MAX_ITEM_BYTES)) return null
  const type = item.type
  if (type !== 'track' && type !== 'identify' && type !== 'page') return null
  const event = optionalString(item.event, 120) ?? (type === 'page' ? optionalString(item.name, 120) : null)
  if (type === 'track' && (!event || !EVENT_NAME_RE.test(event))) return null
  const timestamp = typeof item.timestamp === 'string' && Number.isFinite(Date.parse(item.timestamp)) ? new Date(item.timestamp).toISOString() : now()
  return {
    tenantId: caller.tenantId,
    source: caller.source,
    deploymentId: caller.deploymentId,
    type,
    event: type === 'identify' ? null : event,
    userId: optionalString(item.userId),
    anonymousId: optionalString(item.anonymousId),
    properties: isObject(item.properties) ? item.properties : {},
    traits: isObject(item.traits) ? item.traits : {},
    context: isObject(item.context) ? item.context : {},
    timestamp,
  }
}

export async function handleTrack(request: Request, env: Bindings, ctx?: WaitUntil): Promise<Response> {
  const caller = await identifyCaller(env, request)
  let raw: string
  try {
    raw = await readText(request, MAX_BATCH_BYTES)
  } catch (error) {
    if (error instanceof ApiError && error.status === 413) throw new ApiError(413, 'batch_too_large', `A batch must be at most ${MAX_BATCH_BYTES} bytes.`)
    throw error
  }
  let body: unknown
  try { body = JSON.parse(raw) } catch { throw new ApiError(400, 'invalid_json', 'Request body must be JSON.') }
  if (!isObject(body) || !Array.isArray(body.batch)) throw new ApiError(422, 'validation_error', 'Body must be { "batch": [...] }.')
  if (body.batch.length > MAX_BATCH_ITEMS) throw new ApiError(413, 'batch_too_large', `A batch must have at most ${MAX_BATCH_ITEMS} items.`)

  const events: StoredEvent[] = []
  for (const item of body.batch) {
    const event = normalizeItem(item, caller)
    if (!event) continue
    if (caller.resolveTenant) {
      const candidate = isObject(event.context) && typeof event.context.tenantId === 'string' ? event.context.tenantId.toLowerCase() : null
      event.tenantId = candidate && GUID_RE.test(candidate) && (await caller.resolveTenant(candidate)) ? candidate : null
    }
    events.push(event)
  }
  if (!events.length) return Response.json({ accepted: 0 })

  await storeEvents(env, events)
  await touchSeen(env, caller, events)

  for (const event of events) {
    if (event.type === 'track' && event.event === 'support.requested' && event.tenantId) {
      const conversationId = typeof event.properties?.conversationId === 'string' ? event.properties.conversationId : null
      background(ctx, 'support.requested inbox', createInboxItem(env, {
        kind: 'support.requested',
        title: 'Support requested',
        body: typeof event.properties?.message === 'string' ? event.properties.message.slice(0, 280) : 'A customer asked for help.',
        tenantId: event.tenantId,
        conversationId,
      }, { audience: 'assigned', coalesceMinutes: 10 }))
    }
  }
  background(ctx, 'customer.io forward', forwardToCustomerIo(env, events))
  return Response.json({ accepted: events.length })
}

async function touchSeen(env: Bindings, caller: Caller, events: StoredEvent[]): Promise<void> {
  const db = getDb(env)
  const timestamp = now()
  const tenants = [...new Set(events.map((event) => event.tenantId).filter((tenantId): tenantId is string => Boolean(tenantId)))]
  for (const tenantId of tenants) {
    await db.execute({
      sql: `INSERT INTO tenants (tenant_id, first_seen_at, last_seen_at) VALUES (?,?,?)
            ON CONFLICT(tenant_id) DO UPDATE SET last_seen_at=excluded.last_seen_at`,
      args: [tenantId, timestamp, timestamp],
    })
  }
  if (caller.deploymentId && caller.source === 'papyrus') {
    const version = events.map((event) => (isObject(event.context?.app) ? event.context.app.version : null)).find((value) => typeof value === 'string' && value.length <= 64) as string | undefined
    await db.execute({
      sql: 'UPDATE papyrus_deployments SET last_seen_at=?, version=COALESCE(?, version) WHERE id=?',
      args: [timestamp, version ?? null, caller.deploymentId],
    })
  }
}
