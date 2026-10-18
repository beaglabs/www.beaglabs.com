import type { ActivityEvent } from './types'

/**
 * Activity panel model: merge pages of events, collapse routine repeats, flag long technical output.
 * Events are kept oldest → newest (terminal order) and are never replayed: merging dedupes by id.
 */

export type ActivityItem =
  | { kind: 'event'; key: string; event: ActivityEvent }
  | { kind: 'group'; key: string; events: ActivityEvent[]; summary: string; level: ActivityEvent['level']; source: string; first: string; last: string }

/** Same routine thing, again: hourly "usage not billed" lines and repeated "still starting" waits. */
export const routineKey = (event: ActivityEvent): string | null => {
  if (event.source === 'billing' && event.level === 'info') {
    if (event.message.startsWith('Usage not billed during trial')) return 'billing:trial'
    if (event.message.startsWith('Usage not billed · no active subscription')) return 'billing:unbilled'
  }
  if (event.level === 'wait') return `${event.source}:wait:${normalise(event.message)}`
  return null
}

/** Drop the parts that change on every repeat: attempt counters. */
const normalise = (message: string) => message.replace(/\s*\(attempt \d+\)\s*$/, '').trim()

const sum = (events: ActivityEvent[], pattern: RegExp) =>
  events.reduce((total, event) => {
    const match = pattern.exec(event.message)
    return total + (match ? Number(match[1]!.replace(/,/g, '')) : 0)
  }, 0)

const summarise = (key: string, events: ActivityEvent[]) => {
  if (key.startsWith('billing:')) {
    const hours = sum(events, /(\d[\d,]*) VM hours?/)
    const seconds = sum(events, /(\d[\d,]*) agent-seconds?/)
    const parts = [hours ? `${hours.toLocaleString('en-US')} VM hour${hours === 1 ? '' : 's'}` : '', seconds ? `${seconds.toLocaleString('en-US')} agent-second${seconds === 1 ? '' : 's'}` : ''].filter(Boolean)
    const head = key === 'billing:trial' ? 'Usage not billed during trial' : 'Usage not billed · no active subscription'
    return `${head} · ${events.length} reports${parts.length ? ` · ${parts.join(', ')}` : ''}`
  }
  return `${normalise(events[events.length - 1]!.message)} · ×${events.length}`
}

/** Collapse runs (≥ 2 in a row) of the same routine event into one summary line. Input and output oldest first. */
export const collapseActivity = (events: readonly ActivityEvent[]): ActivityItem[] => {
  const items: ActivityItem[] = []
  let run: ActivityEvent[] = []
  let runKey: string | null = null
  const flush = () => {
    if (run.length === 1) items.push({ kind: 'event', key: `e${run[0]!.id}`, event: run[0]! })
    else if (run.length > 1)
      items.push({
        kind: 'group',
        key: `g${run[0]!.id}`,
        events: run,
        summary: summarise(runKey!, run),
        level: run[run.length - 1]!.level,
        source: run[0]!.source,
        first: run[0]!.at,
        last: run[run.length - 1]!.at,
      })
    run = []
    runKey = null
  }
  for (const event of events) {
    const key = routineKey(event)
    if (key && key === runKey) {
      run.push(event)
      continue
    }
    flush()
    if (key) {
      run = [event]
      runKey = key
    } else items.push({ kind: 'event', key: `e${event.id}`, event })
  }
  flush()
  return items
}

/** Add events (any order, possibly overlapping what is shown) and keep them unique, oldest first. */
export const mergeEvents = (current: readonly ActivityEvent[], incoming: readonly ActivityEvent[]): ActivityEvent[] => {
  if (!incoming.length) return current as ActivityEvent[]
  const byId = new Map<number, ActivityEvent>()
  for (const event of current) byId.set(event.id, event)
  let added = false
  for (const event of incoming) {
    if (!byId.has(event.id)) added = true
    byId.set(event.id, event)
  }
  if (!added) return current as ActivityEvent[]
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

/** Long or multi-line technical output starts collapsed with an expand control. */
export const isLong = (message: string) => message.length > 140 || message.includes('\n')

/** First line, trimmed to a readable length, for the collapsed state. */
export const firstLine = (message: string, max = 140) => {
  const line = message.split('\n', 1)[0]!
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

export const ACTIVITY_FILTERS = {
  all: { label: 'All' },
  deploy: { label: 'Deploy', sources: ['deploy', 'address', 'dns', 'health', 'microsoft', 'registration', 'connect', 'lifecycle'] },
  billing: { label: 'Billing', sources: ['billing'] },
  errors: { label: 'Errors', levels: ['error'] },
} as const satisfies Record<string, { label: string; sources?: readonly string[]; levels?: readonly string[] }>

export type ActivityFilter = keyof typeof ACTIVITY_FILTERS

export const matchesFilter = (event: ActivityEvent, filter: ActivityFilter) => {
  const preset = ACTIVITY_FILTERS[filter] as { sources?: readonly string[]; levels?: readonly string[] }
  if (preset.sources && !preset.sources.includes(event.source)) return false
  if (preset.levels && !preset.levels.includes(event.level)) return false
  return true
}
