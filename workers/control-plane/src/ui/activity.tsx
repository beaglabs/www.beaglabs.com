import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import { ACTIVITY_FILTERS, collapseActivity, firstLine, isLong, matchesFilter, mergeEvents, type ActivityFilter, type ActivityItem } from './activity-model'
import { eventTime } from './format'
import { IconArrowDown, IconChevron } from './icons'
import { createPoller } from './polling'
import { useRuntime, type LiveState } from './runtime'
import { Spinner } from './primitives'
import type { ActivityEvent } from './types'

/**
 * The Activity panel: a terminal-style log of real events (never scripted commands). New events append at the bottom
 * without replaying old ones; the view follows new lines only while you are at the bottom, otherwise a "new" button
 * appears. Routine repeats collapse into one summary line; long technical output is expandable.
 */

const LEVEL: Record<ActivityEvent['level'], string> = { ok: 'OK', info: 'INFO', wait: 'WAIT', error: 'ERR' }

/** Sources whose events mean the deployment changed: refresh the view model. */
const RELEVANT = new Set(['deploy', 'address', 'dns', 'health', 'microsoft', 'registration', 'connect', 'lifecycle', 'billing'])

export interface ActivityProps {
  deploymentId: string
  /** Newest first, as GET /api/events returns them. */
  initial: ActivityEvent[]
  next: number | null
  now: number
  mounted: boolean
  onRelevant: () => void
}

const LIVE_LABEL: Record<LiveState, string> = { connecting: 'Connecting', live: 'Live', polling: 'Polling', offline: 'Offline' }

export const ActivityPanel = ({ deploymentId, initial, next: initialNext, now, mounted, onRelevant }: ActivityProps) => {
  const runtime = useRuntime()
  const [events, setEvents] = useState<ActivityEvent[]>(() => mergeEvents([], initial))
  const [next, setNext] = useState(initialNext)
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [live, setLive] = useState<LiveState>('connecting')
  const [unseen, setUnseen] = useState(0)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const seen = useRef(new Set(initial.map((e) => e.id)))
  const keepOffset = useRef<number | null>(null)
  const relevant = useRef(onRelevant)
  relevant.current = onRelevant
  const liveRef = useRef(live)
  liveRef.current = live
  const eventsRef = useRef(events)
  eventsRef.current = events

  const base = `/api/events?deployment=${encodeURIComponent(deploymentId)}`

  const add = (incoming: ActivityEvent[]) => {
    const fresh = incoming.filter((e) => (!e.deploymentId || e.deploymentId === deploymentId) && !seen.current.has(e.id))
    if (!fresh.length) return
    for (const e of fresh) seen.current.add(e.id)
    setEvents((current) => mergeEvents(current, fresh))
    if (!atBottom.current) setUnseen((n) => n + fresh.length)
    if (fresh.some((e) => RELEVANT.has(e.source))) relevant.current()
  }

  // Live socket, with polling while it is down.
  useEffect(() => {
    const close = runtime.live({ onEvent: (event) => add([event]), onState: setLive })
    const poller = createPoller<{ events: ActivityEvent[] }>({
      load: () => {
        const newest = eventsRef.current[eventsRef.current.length - 1]?.id
        return runtime.getJson(newest ? `${base}&after=${newest}&limit=100` : `${base}&limit=50`)
      },
      onData: (result) => add(result.events),
      isBusy: () => liveRef.current !== 'live',
      isHidden: runtime.isHidden,
      config: { fastMs: 8_000, slowMs: 60_000, hiddenMs: 120_000, maxBackoffMs: 120_000 },
    })
    poller.start()
    const off = runtime.onVisibility(() => poller.visibilityChanged())
    return () => {
      close()
      poller.stop()
      off()
    }
  }, [deploymentId])

  // Start at the newest line.
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight
  }, [])

  // Follow new lines only while at the bottom; keep position when older lines are prepended.
  useLayoutEffect(() => {
    const el = body.current
    if (!el) return
    if (keepOffset.current !== null) {
      el.scrollTop = el.scrollHeight - keepOffset.current
      keepOffset.current = null
    } else if (atBottom.current) el.scrollTop = el.scrollHeight
  }, [events, filter])

  const onScroll = () => {
    const el = body.current
    if (!el) return
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    if (atBottom.current && unseen) setUnseen(0)
  }

  const jump = () => {
    const el = body.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: runtime.reducedMotion ? 'auto' : 'smooth' })
    atBottom.current = true
    setUnseen(0)
  }

  const loadOlder = () => {
    if (next === null || loadingOlder) return
    setLoadingOlder(true)
    runtime
      .getJson<{ events: ActivityEvent[]; next: number | null }>(`${base}&before=${next}&limit=100`)
      .then((result) => {
        if (body.current) keepOffset.current = body.current.scrollHeight - body.current.scrollTop
        for (const e of result.events) seen.current.add(e.id)
        setEvents((current) => mergeEvents(current, result.events))
        setNext(result.next)
      })
      .catch(() => {})
      .finally(() => setLoadingOlder(false))
  }

  const toggle = (key: string) =>
    setOpen((current) => {
      const copy = new Set(current)
      if (copy.has(key)) copy.delete(key)
      else copy.add(key)
      return copy
    })

  const items = useMemo(() => collapseActivity(events.filter((e) => matchesFilter(e, filter))), [events, filter])

  return (
    <section class="term" aria-labelledby="activity-h">
      <div class="term-bar">
        <h2 id="activity-h" class="term-h">
          Activity
        </h2>
        <div class="term-filters" role="group" aria-label="Filter activity">
          {(Object.keys(ACTIVITY_FILTERS) as ActivityFilter[]).map((key) => (
            <button key={key} type="button" class={`chip${key === filter ? ' on' : ''}`} aria-pressed={key === filter ? 'true' : 'false'} onClick={() => setFilter(key)}>
              {ACTIVITY_FILTERS[key].label}
            </button>
          ))}
        </div>
        <span class="term-live" data-state={live} role="status">
          <span class="term-live-dot" aria-hidden="true" />
          {mounted ? LIVE_LABEL[live] : 'Connecting'}
        </span>
      </div>
      <div class="term-body" ref={body} onScroll={onScroll} tabIndex={0} role="log" aria-label="Activity log" aria-live="polite" aria-relevant="additions">
        {next !== null ? (
          <button type="button" class="term-older" onClick={loadOlder} disabled={loadingOlder}>
            {loadingOlder ? <Spinner /> : null}
            {loadingOlder ? 'Loading…' : 'Load earlier events'}
          </button>
        ) : (
          <div class="term-start">— start of activity —</div>
        )}
        {items.length ? (
          <ol class="tl-list">
            {items.map((item) => (
              <Line key={item.key} item={item} open={open} toggle={toggle} now={now} mounted={mounted} />
            ))}
          </ol>
        ) : (
          <p class="term-empty">{filter === 'all' ? 'No activity yet.' : `No ${ACTIVITY_FILTERS[filter].label.toLowerCase()} events loaded.`}</p>
        )}
        <div class="term-cursor" aria-hidden="true">
          <span>▍</span>
        </div>
      </div>
      {unseen > 0 ? (
        <button type="button" class="term-jump" onClick={jump}>
          <IconArrowDown />
          {unseen} new
        </button>
      ) : null}
    </section>
  )
}

const Line = ({ item, open, toggle, now, mounted }: { item: ActivityItem; open: Set<string>; toggle: (key: string) => void; now: number; mounted: boolean }) => {
  const runtime = useRuntime()
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    // Only lines that arrive after first paint animate in.
    if (mounted) runtime.animate(ref.current, { opacity: [0, 1], transform: ['translateX(-6px)', 'translateX(0)'] }, { duration: 0.3, ease: 'easeOut' })
  }, [])
  if (item.kind === 'group') {
    const expanded = open.has(item.key)
    return (
      <li ref={ref} class="tl tl-group" data-level={item.level}>
        <time class="tl-t" dateTime={item.last}>
          {eventTime(item.last, mounted, now)}
        </time>
        <span class="tl-lv">{LEVEL[item.level]}</span>
        <span class="tl-src">{item.source}</span>
        <div class="tl-msg">
          <button type="button" class="tl-sum" aria-expanded={expanded ? 'true' : 'false'} onClick={() => toggle(item.key)}>
            <IconChevron dir={expanded ? 'down' : 'right'} />
            <span>{item.summary}</span>
            <span class="tl-range">
              {eventTime(item.first, mounted, now)} → {eventTime(item.last, mounted, now)}
            </span>
          </button>
          {expanded ? (
            <ol class="tl-sub">
              {item.events.map((e) => (
                <li key={e.id}>
                  <time dateTime={e.at}>{eventTime(e.at, mounted, now)}</time> {e.message}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </li>
    )
  }
  const e = item.event
  const long = isLong(e.message)
  const expanded = open.has(item.key)
  return (
    <li ref={ref} class="tl" data-level={e.level}>
      <time class="tl-t" dateTime={e.at}>
        {eventTime(e.at, mounted, now)}
      </time>
      <span class="tl-lv">{LEVEL[e.level]}</span>
      <span class="tl-src">{e.source}</span>
      <div class="tl-msg">
        {long && !expanded ? <span>{firstLine(e.message)}</span> : <span class={long ? 'tl-pre' : undefined}>{e.message}</span>}
        {long ? (
          <button type="button" class="tl-more" aria-expanded={expanded ? 'true' : 'false'} onClick={() => toggle(item.key)}>
            {expanded ? 'Show less' : 'Show full output'}
          </button>
        ) : null}
      </div>
    </li>
  )
}
