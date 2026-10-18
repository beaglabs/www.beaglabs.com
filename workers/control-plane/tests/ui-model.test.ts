import { describe, expect, it, vi } from 'vitest'
import { createActionRunner } from '../src/ui/actions'
import { collapseActivity, isLong, mergeEvents, matchesFilter } from '../src/ui/activity-model'
import { DEFAULT_QUERY, queryDeployments, replaceRow, upsertRows } from '../src/ui/list-model'
import { createPoller, isNewer, nextDelay, type Scheduler } from '../src/ui/polling'
import { PREVIEW_RATE_MS, isCredentialFree, previewUrl, selectPreview, type PreviewInput } from '../src/ui/preview-model'
import type { ActionResult, ActivityEvent, DeploymentSummary, DeploymentView } from '../src/ui/types'

/** A scheduler we drive by hand: `tick()` runs whatever is due. */
const fakeScheduler = () => {
  let now = 0
  const timers = new Map<number, { at: number; fn: () => void }>()
  let seq = 0
  const scheduler: Scheduler = {
    set: (fn, ms) => {
      timers.set(++seq, { at: now + ms, fn })
      return seq
    },
    clear: (handle) => void timers.delete(handle as number),
  }
  const advance = (ms: number) => {
    now += ms
    for (const [id, timer] of [...timers]) if (timer.at <= now) (timers.delete(id), timer.fn())
  }
  return { scheduler, advance, pending: () => [...timers.values()].map((t) => t.at - now), now: () => now }
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('polling', () => {
  it('is fast while busy, slow when idle, slower when hidden, and backs off after failures', () => {
    expect(nextDelay({ busy: true, hidden: false, failures: 0 })).toBe(3_000)
    expect(nextDelay({ busy: false, hidden: false, failures: 0 })).toBe(20_000)
    expect(nextDelay({ busy: true, hidden: true, failures: 0 })).toBe(60_000)
    expect(nextDelay({ busy: true, hidden: false, failures: 1 })).toBe(6_000)
    expect(nextDelay({ busy: true, hidden: false, failures: 3 })).toBe(24_000)
    expect(nextDelay({ busy: false, hidden: false, failures: 10 })).toBe(120_000)
  })

  it('single flight: a refresh while a request is in flight joins it', async () => {
    const { scheduler } = fakeScheduler()
    const gate = deferred<{ version: number }>()
    const load = vi.fn(() => gate.promise)
    const poller = createPoller({ load, onData: () => {}, isBusy: () => true, isHidden: () => false, scheduler })
    const a = poller.refresh()
    const b = poller.refresh()
    expect(a).toBe(b)
    expect(load).toHaveBeenCalledTimes(1)
    expect(poller.status().inFlight).toBe(true)
    gate.resolve({ version: 1 })
    await a
    expect(poller.status().inFlight).toBe(false)
  })

  it('never overlaps requests: the next one is scheduled only after the last settles', async () => {
    const clock = fakeScheduler()
    const gates: ReturnType<typeof deferred<{ version: number }>>[] = []
    const load = vi.fn(() => {
      const gate = deferred<{ version: number }>()
      gates.push(gate)
      return gate.promise
    })
    const poller = createPoller({ load, onData: () => {}, isBusy: () => true, isHidden: () => false, scheduler: clock.scheduler })
    poller.start()
    clock.advance(3_000)
    expect(load).toHaveBeenCalledTimes(1)
    clock.advance(30_000) // still in flight: nothing new fires
    expect(load).toHaveBeenCalledTimes(1)
    gates[0]!.resolve({ version: 1 })
    await flush()
    expect(clock.pending()).toEqual([3_000])
    poller.stop()
  })

  it('drops responses older than what is shown, and anything arriving after stop()', async () => {
    const shown = { version: 5 }
    const onData = vi.fn()
    const gate = deferred<{ version: number }>()
    const poller = createPoller({ load: () => gate.promise, onData, isStale: (d) => !isNewer(shown, d), isBusy: () => true, isHidden: () => false, scheduler: fakeScheduler().scheduler })
    const request = poller.refresh()
    gate.resolve({ version: 4 }) // an action already returned version 5
    await request
    expect(onData).not.toHaveBeenCalled()

    const late = deferred<{ version: number }>()
    const p2 = createPoller({ load: () => late.promise, onData, isBusy: () => true, isHidden: () => false, scheduler: fakeScheduler().scheduler })
    p2.start()
    const r2 = p2.refresh()
    p2.stop()
    late.resolve({ version: 9 })
    await r2
    expect(onData).not.toHaveBeenCalled()
    expect(isNewer({ version: 3 }, { version: 3 })).toBe(true)
    expect(isNewer({ version: 3 }, { version: 2 })).toBe(false)
  })

  it('marks data stale after a failure, keeps it, backs off, and recovers', async () => {
    const clock = fakeScheduler()
    let fail = true
    const onData = vi.fn()
    const poller = createPoller({ load: async () => (fail ? Promise.reject(new Error('502')) : { version: 2 }), onData, isBusy: () => true, isHidden: () => false, scheduler: clock.scheduler })
    poller.start()
    await poller.refresh()
    expect(poller.status()).toMatchObject({ stale: true, failures: 1, lastError: '502' })
    expect(clock.pending()).toEqual([6_000])
    await poller.refresh()
    expect(clock.pending()).toEqual([12_000])
    fail = false
    await poller.refresh()
    expect(poller.status()).toMatchObject({ stale: false, failures: 0 })
    expect(onData).toHaveBeenCalledWith({ version: 2 })
    expect(clock.pending()).toEqual([3_000])
    poller.stop()
    expect(clock.pending()).toEqual([])
  })

  it('slows down in a hidden tab and catches up when it is visible again', async () => {
    const clock = fakeScheduler()
    let hidden = false
    const load = vi.fn(async () => ({ version: 1 }))
    const poller = createPoller({ load, onData: () => {}, isBusy: () => true, isHidden: () => hidden, scheduler: clock.scheduler, now: clock.now })
    poller.start()
    hidden = true
    poller.visibilityChanged()
    expect(clock.pending()).toEqual([60_000])
    clock.advance(10_000)
    hidden = false
    poller.visibilityChanged()
    expect(load).toHaveBeenCalledTimes(1)
    await flush()
    expect(clock.pending()).toEqual([3_000])
    poller.stop()
  })
})

const view = (patch: Partial<DeploymentView>) => ({ id: 'dep_1', version: 1, status: 'running', health: 'healthy', ...patch }) as DeploymentView

describe('lifecycle actions', () => {
  const runner = (post: () => Promise<ActionResult>) => {
    const notify = vi.fn()
    const pending: unknown[] = []
    const snapshots: DeploymentView[] = []
    const r = createActionRunner({ post, notify, onPending: (p) => pending.push(p), onSnapshot: (v) => snapshots.push(v) })
    return { r, notify, pending, snapshots }
  }

  it('pending → confirmed when the backend returns the target state', async () => {
    const gate = deferred<ActionResult>()
    const { r, notify, pending, snapshots } = runner(() => gate.promise)
    const run = r.run('stop')
    expect(r.pending()).toMatchObject({ id: 'stop', awaiting: false })
    gate.resolve({ ok: true, message: 'Stopped.', deployment: view({ status: 'stopped', health: 'stopped', version: 2 }) })
    expect(await run).toBe('confirmed')
    expect(r.pending()).toBeNull()
    expect(pending.at(-1)).toBeNull()
    expect(snapshots.at(-1)?.status).toBe('stopped')
    expect(notify).toHaveBeenCalledWith({ tone: 'ok', title: 'Stopped.' })
  })

  it('stays pending (awaiting) until a later snapshot confirms it', async () => {
    const { r, notify } = runner(async () => ({ ok: true, message: '', deployment: view({ status: 'running', version: 2 }) }))
    expect(await r.run('stop')).toBe('awaiting')
    expect(r.pending()).toMatchObject({ id: 'stop', awaiting: true })
    r.observe(view({ status: 'running' }))
    expect(r.pending()).not.toBeNull()
    r.observe(view({ status: 'stopped', health: 'stopped' }))
    expect(r.pending()).toBeNull()
    expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ tone: 'ok' }))
  })

  it('blocks a second or conflicting request while one is pending', async () => {
    const gate = deferred<ActionResult>()
    const post = vi.fn(() => gate.promise)
    const { r, notify } = runner(post)
    const first = r.run('stop')
    expect(await r.run('start')).toBe('blocked')
    expect(await r.run('stop')).toBe('blocked')
    expect(post).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ tone: 'info' }))
    gate.resolve({ ok: true, message: 'Stopped.', deployment: view({ status: 'stopped', health: 'stopped' }) })
    await first
  })

  it('shows refusals and network errors as error toasts and clears the pending state', async () => {
    const refused = runner(async () => ({ ok: false, message: 'Stop is not available for this deployment right now.', deployment: view({}) }))
    expect(await refused.r.run('stop')).toBe('failed')
    expect(refused.r.pending()).toBeNull()
    expect(refused.notify).toHaveBeenCalledWith({ tone: 'err', title: 'Stop is not available for this deployment right now.' })
    expect(refused.snapshots).toHaveLength(1)

    const offline = runner(() => Promise.reject(new TypeError('Failed to fetch')))
    expect(await offline.r.run('start')).toBe('failed')
    expect(offline.r.pending()).toBeNull()
    expect(offline.notify).toHaveBeenCalledWith(expect.objectContaining({ tone: 'err', title: 'Could not reach the control plane' }))
  })
})

const ev = (id: number, patch: Partial<ActivityEvent> = {}): ActivityEvent => ({ id, at: new Date(Date.UTC(2026, 9, 17, id)).toISOString(), level: 'info', source: 'deploy', message: `event ${id}`, deploymentId: 'dep_1', ...patch })

describe('activity', () => {
  it('collapses hourly "usage not billed during trial" lines into one summary', () => {
    const billing = (id: number) => ev(id, { source: 'billing', message: `Usage not billed during trial · 1 VM hour · ${String(id).padStart(2, '0')}:00–${String(id + 1).padStart(2, '0')}:00 UTC` })
    const items = collapseActivity([ev(1), billing(2), billing(3), billing(4), ev(5, { source: 'billing', message: 'Usage not billed during trial · 1,200 agent-seconds · 05:00–06:00 UTC' }), ev(6)])
    expect(items.map((i) => i.kind)).toEqual(['event', 'group', 'event'])
    const group = items[1]!
    expect(group.kind === 'group' && group.summary).toBe('Usage not billed during trial · 4 reports · 3 VM hours, 1,200 agent-seconds')
    expect(group.kind === 'group' && group.events.map((e) => e.id)).toEqual([2, 3, 4, 5])
  })

  it('collapses repeated waits regardless of attempt numbers; a single routine line stays as is', () => {
    const wait = (id: number, n: number) => ev(id, { level: 'wait', source: 'health', message: `GET … → 503; Papyrus is still starting.${n > 1 ? ` (attempt ${n})` : ''}` })
    const items = collapseActivity([wait(1, 1), wait(2, 2), wait(3, 3), ev(4, { level: 'ok', source: 'health' }), ev(5, { source: 'billing', message: 'Usage not billed during trial · 1 VM hour · 05:00–06:00 UTC' })])
    expect(items.map((i) => i.kind)).toEqual(['group', 'event', 'event'])
    expect(items[0]!.kind === 'group' && items[0]!.summary).toBe('GET … → 503; Papyrus is still starting. · ×3')
  })

  it('merges pages and live events without duplicates, oldest first, never replaying', () => {
    const shown = mergeEvents([], [ev(3), ev(2), ev(1)])
    expect(shown.map((e) => e.id)).toEqual([1, 2, 3])
    expect(mergeEvents(shown, [ev(3)])).toBe(shown)
    expect(mergeEvents(shown, [ev(5), ev(4), ev(3)]).map((e) => e.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('flags long or multi-line output as expandable and filters by source and level', () => {
    expect(isLong('short')).toBe(false)
    expect(isLong('x'.repeat(141))).toBe(true)
    expect(isLong('line one\nline two')).toBe(true)
    expect(matchesFilter(ev(1, { source: 'billing' }), 'billing')).toBe(true)
    expect(matchesFilter(ev(1, { source: 'billing' }), 'deploy')).toBe(false)
    expect(matchesFilter(ev(1, { level: 'error' }), 'errors')).toBe(true)
  })
})

describe('preview selection', () => {
  const base: PreviewInput = {
    hostname: 'acme.papyrus.beaglabs.com',
    lifecycle: 'running',
    healthPassed: true,
    healthPassedAt: '2026-10-18T10:00:00.000Z',
    failed: false,
    screenshots: true,
    capture: null,
    imageUrl: (at) => `/api/deployments/dep_1/preview.jpg?v=${Date.parse(at)}`,
    now: Date.parse('2026-10-18T11:00:00.000Z'),
  }
  const inputs: PreviewInput[] = [
    base,
    { ...base, healthPassed: false, healthPassedAt: null },
    { ...base, lifecycle: 'stopped' },
    { ...base, lifecycle: 'deleting' },
    { ...base, failed: true },
    { ...base, screenshots: false },
    { ...base, capture: { capturedAt: '2026-10-18T10:30:00.000Z', attemptedAt: '2026-10-18T10:30:00.000Z', error: null } },
  ]

  it('never embeds: every state is a screenshot, a card or nothing', () => {
    for (const input of inputs) expect(['screenshot', 'card', 'none']).toContain(selectPreview(input).mode)
  })

  it('takes a screenshot only after the health check passes', () => {
    expect(selectPreview({ ...base, healthPassed: false, healthPassedAt: null })).toMatchObject({ state: 'provisioning', mode: 'none', captureDue: false, image: null })
    expect(selectPreview(base)).toMatchObject({ state: 'loading', captureDue: true })
    // A capture from before the latest health pass (e.g. a redeploy) is not shown.
    expect(selectPreview({ ...base, capture: { capturedAt: '2026-10-18T09:00:00.000Z', attemptedAt: '2026-10-18T09:00:00.000Z', error: null } })).toMatchObject({ state: 'loading', image: null })
    expect(selectPreview(inputs[6]!)).toMatchObject({ state: 'running', mode: 'screenshot', image: `/api/deployments/dep_1/preview.jpg?v=${Date.parse('2026-10-18T10:30:00.000Z')}`, canRefresh: true })
  })

  it('distinct states for stopped, failed, unavailable; an Open environment card without Browser Rendering', () => {
    expect(selectPreview({ ...base, lifecycle: 'stopped' }).state).toBe('stopped')
    expect(selectPreview({ ...base, failed: true }).state).toBe('failed')
    expect(selectPreview({ ...base, lifecycle: 'deleted' }).state).toBe('unavailable')
    expect(selectPreview({ ...base, screenshots: false })).toMatchObject({ state: 'running', mode: 'card', url: 'https://acme.papyrus.beaglabs.com/' })
  })

  it('rate-limits captures and refreshes', () => {
    const recent = { capturedAt: null, attemptedAt: new Date(base.now - PREVIEW_RATE_MS / 2).toISOString(), error: null }
    expect(selectPreview({ ...base, capture: recent })).toMatchObject({ state: 'loading', captureDue: false })
    expect(selectPreview({ ...base, capture: { ...recent, attemptedAt: new Date(base.now - PREVIEW_RATE_MS).toISOString(), error: 'timeout' } })).toMatchObject({ mode: 'card', canRefresh: true })
  })

  it('never puts a credential in the preview URL', () => {
    for (const input of inputs) {
      const url = selectPreview(input).url
      if (url) expect(isCredentialFree(url)).toBe(true)
    }
    expect(previewUrl('user:pass@acme.papyrus.beaglabs.com')).toBeNull()
    expect(previewUrl('acme.papyrus.beaglabs.com/?token=x')).toBeNull()
    expect(isCredentialFree('https://acme.papyrus.beaglabs.com/?code=abc')).toBe(false)
    expect(isCredentialFree('https://u:p@acme.papyrus.beaglabs.com/')).toBe(false)
    expect(isCredentialFree('https://acme.papyrus.beaglabs.com/')).toBe(true)
  })
})

const row = (id: string, patch: Partial<DeploymentSummary> = {}): DeploymentSummary =>
  ({ id, version: 1, name: `${id}.papyrus.beaglabs.com`, environment: 'Production', url: null, provider: 'Hosted by Beag Labs', region: 'us-east-2', configuration: null, status: 'running', statusLabel: 'Running', tone: 'ok', health: 'healthy', healthLabel: 'Healthy', busy: false, progress: { completed: 5, total: 5, mode: 'determinate', label: '' }, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-10T00:00:00.000Z', actions: [], ...patch }) as DeploymentSummary

describe('deployments table', () => {
  const rows = [
    row('acme', { createdAt: '2026-10-03T00:00:00.000Z', updatedAt: '2026-10-12T00:00:00.000Z' }),
    row('globex', { status: 'stopped', statusLabel: 'Stopped', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-15T00:00:00.000Z' }),
    row('fabrikam', { status: 'failed', statusLabel: 'Failed', region: 'eu-west-1', createdAt: '2026-10-02T00:00:00.000Z' }),
    row('northwind', { status: 'provisioning', statusLabel: 'Provisioning', busy: true }),
  ]

  it('filters by status and counts each filter', () => {
    const result = queryDeployments(rows, { ...DEFAULT_QUERY, status: 'attention' })
    expect(result.rows.map((r) => r.id)).toEqual(['fabrikam'])
    expect(result.counts).toEqual({ all: 4, live: 1, progress: 1, stopped: 1, attention: 1 })
  })

  it('searches across name, region, status (all terms must match)', () => {
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, search: 'EU-WEST' }).rows.map((r) => r.id)).toEqual(['fabrikam'])
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, search: 'papyrus stopped' }).rows.map((r) => r.id)).toEqual(['globex'])
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, search: 'nothing-like-this' })).toMatchObject({ rows: [], matched: 0, total: 4 })
  })

  it('sorts by any column in both directions, problems first for status', () => {
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, sort: 'name', dir: 'asc' }).rows.map((r) => r.id)).toEqual(['acme', 'fabrikam', 'globex', 'northwind'])
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, sort: 'createdAt', dir: 'desc' }).rows[0]!.id).toBe('acme')
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, sort: 'updatedAt', dir: 'desc' }).rows[0]!.id).toBe('globex')
    expect(queryDeployments(rows, { ...DEFAULT_QUERY, sort: 'status', dir: 'asc' }).rows.map((r) => r.id)).toEqual(['fabrikam', 'northwind', 'acme', 'globex'])
  })

  it('pages and clamps the page number', () => {
    const many = Array.from({ length: 23 }, (_, i) => row(`d${String(i).padStart(2, '0')}`))
    const page3 = queryDeployments(many, { ...DEFAULT_QUERY, sort: 'name', dir: 'asc', page: 3 })
    expect(page3).toMatchObject({ page: 3, pages: 3, matched: 23 })
    expect(page3.rows.map((r) => r.id)).toEqual(['d20', 'd21', 'd22'])
    expect(queryDeployments(many, { ...DEFAULT_QUERY, page: 9 }).page).toBe(3)
  })

  it('polling replaces rows in place by version; deleted rows disappear', () => {
    const shown = [row('a', { version: 5, statusLabel: 'Newer' }), row('b')]
    const next = upsertRows(shown, [row('a', { version: 4, statusLabel: 'Older' }), row('b', { version: 2, statusLabel: 'B2' })])
    expect(next.map((r) => [r.id, r.statusLabel])).toEqual([['a', 'Newer'], ['b', 'B2']])
    expect(upsertRows(shown, [row('b')]).map((r) => r.id)).toEqual(['b'])
    expect(replaceRow(shown, row('a', { version: 3 }))[0]!.statusLabel).toBe('Newer')
  })
})
