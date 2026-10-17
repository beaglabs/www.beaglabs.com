import * as Effect from 'effect/Effect'
import { all, nowIso, run } from './services'

/**
 * The Activity log: an append-only list of what happened to an account and its deployments (setup steps, billing,
 * sign-ins, org names, credential checks). Rows are written by the code that did the thing and never updated.
 * Messages are customer-facing and must never contain secrets or credentials.
 */

export type EventLevel = 'ok' | 'info' | 'wait' | 'error'
export const EVENT_LEVELS: readonly EventLevel[] = ['ok', 'info', 'wait', 'error']

export type EventSource = 'deploy' | 'address' | 'dns' | 'health' | 'microsoft' | 'registration' | 'connect' | 'billing' | 'account'

/** The Activity card's filter buttons. */
export const EVENT_FILTERS = {
  all: {},
  deploy: { sources: ['deploy', 'address', 'dns', 'health', 'microsoft', 'registration', 'connect'] as EventSource[] },
  billing: { sources: ['billing'] as EventSource[] },
  team: { sources: ['account'] as EventSource[] },
  errors: { levels: ['error'] as EventLevel[] },
} as const satisfies Record<string, { sources?: EventSource[]; levels?: EventLevel[] }>

export type EventFilter = keyof typeof EVENT_FILTERS

export const isEventFilter = (value: string | undefined): value is EventFilter => Boolean(value && Object.hasOwn(EVENT_FILTERS, value))

export interface EventRow {
  id: number
  account_id: string
  deployment_id: string | null
  at: string
  level: EventLevel
  source: string
  message: string
}

/** Belt and braces: strip anything shaped like a credential before it is stored. */
export const redact = (message: string) =>
  message
    .replace(/\b(Bearer)\s+\S+/gi, '$1 [redacted]')
    .replace(/\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]+/g, '[redacted]')
    .replace(/\bwhsec_[A-Za-z0-9]+/g, '[redacted]')
    .replace(/\b(AKIA|ASIA)[A-Z0-9]{12,}/g, '[redacted]')
    .replace(/([?&](?:token|code|key|secret|password)=)[^&\s]+/gi, '$1[redacted]')
    .slice(0, 500)

/** Append one event. Never fails the caller: losing a log line is better than failing a deploy or a webhook. */
export const logEvent = (event: { accountId: string; deploymentId?: string | null; level: EventLevel; source: EventSource; message: string }) =>
  run(
    'INSERT INTO events (account_id, deployment_id, at, level, source, message) VALUES (?, ?, ?, ?, ?, ?)',
    event.accountId,
    event.deploymentId ?? null,
    nowIso(),
    event.level,
    event.source,
    redact(event.message),
  ).pipe(Effect.ignore)

export interface EventQuery {
  /** Only this deployment's events plus account-wide ones (sign-ins, settings). */
  deploymentId?: string | null
  sources?: readonly string[]
  levels?: readonly string[]
  /** Older than this id (paging back). */
  before?: number | null
  /** Newer than this id (live polling). */
  after?: number | null
  limit?: number
}

export const MAX_EVENTS_PAGE = 100

/** Newest first, always scoped to one account. `next` is the cursor for the following (older) page. */
export const listEvents = (accountId: string, query: EventQuery = {}) =>
  Effect.gen(function* () {
    const limit = Math.min(Math.max(Math.trunc(query.limit ?? 50) || 50, 1), MAX_EVENTS_PAGE)
    const where = ['account_id = ?']
    const args: unknown[] = [accountId]
    if (query.deploymentId) {
      where.push('(deployment_id = ? OR deployment_id IS NULL)')
      args.push(query.deploymentId)
    }
    if (query.sources?.length) {
      where.push(`source IN (${query.sources.map(() => '?').join(', ')})`)
      args.push(...query.sources)
    }
    if (query.levels?.length) {
      where.push(`level IN (${query.levels.map(() => '?').join(', ')})`)
      args.push(...query.levels)
    }
    if (query.before) {
      where.push('id < ?')
      args.push(query.before)
    }
    if (query.after) {
      where.push('id > ?')
      args.push(query.after)
    }
    const rows = yield* all<EventRow>(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ?`, ...args, limit + 1)
    const page = rows.slice(0, limit)
    return { events: page, next: rows.length > limit && !query.after ? page[page.length - 1]!.id : null }
  })

/** The JSON shape served by GET /api/events. */
export const eventJson = (row: EventRow) => ({ id: row.id, at: row.at, level: row.level, source: row.source, message: row.message, deploymentId: row.deployment_id })
