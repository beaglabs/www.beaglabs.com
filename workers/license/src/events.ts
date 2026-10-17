/** Tenant event storage (timeline) and Customer.io forwarding. */
import { getDb } from './db'
import type { Bindings } from './env'
import { id, now } from './util'

export type EventSource = 'papyrus' | 'admin' | 'web' | 'system'

export type StoredEvent = {
  tenantId: string | null
  source: EventSource
  deploymentId?: string | null
  type: 'track' | 'identify' | 'page'
  event: string | null
  userId?: string | null
  anonymousId?: string | null
  properties?: Record<string, unknown>
  traits?: Record<string, unknown>
  context?: Record<string, unknown>
  timestamp?: string | null
}

export async function storeEvents(env: Bindings, events: readonly StoredEvent[]): Promise<void> {
  if (!events.length) return
  const receivedAt = now()
  await getDb(env).batch(events.map((event) => ({
    sql: `INSERT INTO tenant_events (id, tenant_id, source, deployment_id, type, event, user_id, anonymous_id, properties_json, traits_json, context_json, occurred_at, received_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id('evt'), event.tenantId, event.source, event.deploymentId ?? null, event.type, event.event,
      event.userId ?? null, event.anonymousId ?? null,
      JSON.stringify(event.properties ?? {}), JSON.stringify(event.traits ?? {}), JSON.stringify(event.context ?? {}),
      event.timestamp ?? receivedAt, receivedAt,
    ],
  })))
}

/** Records one server-side event (admin mutations, huddle.ended) and forwards it. */
export async function recordEvent(env: Bindings, event: StoredEvent): Promise<void> {
  try {
    await storeEvents(env, [event])
    await forwardToCustomerIo(env, [event])
  } catch (error) {
    console.error('record event failed', { event: event.event, message: error instanceof Error ? error.message : String(error) })
  }
}

// ---------------------------------------------------------------------------
// Customer.io Track API v2 batch

export function customerIoConfigured(env: Bindings): boolean {
  return Boolean(env.CUSTOMERIO_SITE_ID && env.CUSTOMERIO_API_KEY)
}

export function customerIoBatchItem(event: StoredEvent): Record<string, unknown> | null {
  const identity: Record<string, unknown> | null = event.userId
    ? { identifiers: { id: event.userId } }
    : event.anonymousId
      ? { anonymous_id: event.anonymousId }
      : event.tenantId
        ? { anonymous_id: `tenant:${event.tenantId}` }
        : null
  if (!identity) return null
  const timestamp = event.timestamp ? Math.floor(Date.parse(event.timestamp) / 1000) : Math.floor(Date.now() / 1000)
  const common = { source: event.source, ...(event.tenantId ? { tenant_id: event.tenantId } : {}), ...(event.deploymentId ? { deployment_id: event.deploymentId } : {}) }
  if (event.type === 'identify') {
    if (!event.userId) return null
    return { type: 'person', action: 'identify', ...identity, attributes: { ...(event.traits ?? {}), ...common }, timestamp }
  }
  const name = event.type === 'page'
    ? String(event.event || (event.properties?.url as string | undefined) || (event.properties?.path as string | undefined) || 'page')
    : String(event.event)
  return {
    type: 'person',
    action: event.type === 'page' ? 'page' : 'event',
    ...identity,
    name,
    attributes: { ...(event.properties ?? {}), ...common },
    timestamp: Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000),
  }
}

export async function forwardToCustomerIo(env: Bindings, events: readonly StoredEvent[]): Promise<void> {
  if (!customerIoConfigured(env) || !events.length) return
  const batch = events.map(customerIoBatchItem).filter((item): item is Record<string, unknown> => Boolean(item))
  if (!batch.length) return
  const host = env.CUSTOMERIO_REGION === 'eu' ? 'track-eu.customer.io' : 'track.customer.io'
  const response = await fetch(`https://${host}/api/v2/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.CUSTOMERIO_SITE_ID}:${env.CUSTOMERIO_API_KEY}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ batch }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Customer.io batch failed: HTTP ${response.status}`)
}
