/**
 * Polling for the deployment pages, as plain functions with injectable timers so it can be unit-tested.
 *
 * - Single flight: at most one request at a time; a refresh while one is in flight joins it.
 * - Monotonic: a response older than what is already shown (lower `version`, or from before stop()) is dropped.
 * - Fast while something is in flight on the backend, slow otherwise, slower still in a hidden tab.
 * - Exponential backoff after failures; the last good data stays on screen and is marked stale.
 * - stop() cancels the timer and ignores any response still on its way.
 */

export interface PollConfig {
  /** While the backend reports work in flight (provisioning, starting, deleting). */
  fastMs: number
  /** Nothing in flight. */
  slowMs: number
  /** Floor while the tab is hidden. */
  hiddenMs: number
  /** Ceiling for the backoff. */
  maxBackoffMs: number
}

export const DEFAULT_POLL: PollConfig = { fastMs: 3_000, slowMs: 20_000, hiddenMs: 60_000, maxBackoffMs: 120_000 }

/** How long to wait before the next request. */
export const nextDelay = (input: { busy: boolean; hidden: boolean; failures: number }, config: PollConfig = DEFAULT_POLL) => {
  const base = input.busy ? config.fastMs : config.slowMs
  const visible = input.hidden ? Math.max(base, config.hiddenMs) : base
  if (input.failures <= 0) return visible
  return Math.min(config.maxBackoffMs, Math.max(visible, base * 2 ** input.failures))
}

/** Accept a snapshot only when it is at least as new as the one shown. */
export const isNewer = <T extends { version: number }>(current: T | null | undefined, incoming: T) => !current || incoming.version >= current.version

export interface Scheduler {
  set(fn: () => void, ms: number): unknown
  clear(handle: unknown): void
}

export const realScheduler: Scheduler = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export interface PollStatus {
  inFlight: boolean
  failures: number
  /** Epoch ms of the last successful response. */
  lastSuccessAt: number | null
  lastError: string | null
  /** Last data failed to refresh: what is shown may be out of date. */
  stale: boolean
  running: boolean
  nextDelayMs: number | null
}

export interface PollerOptions<T> {
  load: () => Promise<T>
  /** Called with each accepted response. */
  onData: (data: T) => void
  /** A response is older than what is shown (e.g. an action already returned newer state). */
  isStale?: (data: T) => boolean
  onStatus?: (status: PollStatus) => void
  isBusy: () => boolean
  isHidden: () => boolean
  scheduler?: Scheduler
  now?: () => number
  config?: PollConfig
}

export interface Poller {
  start(): void
  stop(): void
  /** Request now (manual refresh, an event arrived, the tab became visible). Joins a request already in flight. */
  refresh(): Promise<void>
  /** The tab's visibility changed. */
  visibilityChanged(): void
  status(): PollStatus
}

export function createPoller<T>(options: PollerOptions<T>): Poller {
  const scheduler = options.scheduler ?? realScheduler
  const now = options.now ?? (() => Date.now())
  const config = options.config ?? DEFAULT_POLL
  let timer: unknown = null
  let inFlight: Promise<void> | null = null
  let generation = 0
  const state: PollStatus = { inFlight: false, failures: 0, lastSuccessAt: null, lastError: null, stale: false, running: false, nextDelayMs: null }

  const emit = () => options.onStatus?.({ ...state })

  const clearTimer = () => {
    if (timer !== null) scheduler.clear(timer)
    timer = null
    state.nextDelayMs = null
  }

  const schedule = () => {
    clearTimer()
    if (!state.running) return
    const delay = nextDelay({ busy: options.isBusy(), hidden: options.isHidden(), failures: state.failures }, config)
    state.nextDelayMs = delay
    timer = scheduler.set(() => {
      timer = null
      void refresh()
    }, delay)
  }

  const refresh = (): Promise<void> => {
    if (inFlight) return inFlight
    const mine = generation
    state.inFlight = true
    emit()
    const request = options
      .load()
      .then(
        (data) => {
          if (mine !== generation) return
          state.failures = 0
          state.lastError = null
          state.stale = false
          state.lastSuccessAt = now()
          if (!options.isStale?.(data)) options.onData(data)
        },
        (error: unknown) => {
          if (mine !== generation) return
          state.failures += 1
          state.lastError = error instanceof Error ? error.message : String(error)
          state.stale = true
        },
      )
      .finally(() => {
        if (mine !== generation) return
        inFlight = null
        state.inFlight = false
        schedule()
        emit()
      })
    inFlight = request
    return request
  }

  return {
    start() {
      if (state.running) return
      state.running = true
      schedule()
      emit()
    },
    stop() {
      generation += 1
      state.running = false
      state.inFlight = false
      inFlight = null
      clearTimer()
      emit()
    },
    refresh,
    visibilityChanged() {
      if (!state.running) return
      if (options.isHidden()) {
        // Keep polling, just slowly.
        if (!inFlight) schedule()
        return
      }
      // Back in view: catch up straight away if what is shown is older than a fast interval.
      if (!inFlight && (state.lastSuccessAt === null || now() - state.lastSuccessAt >= config.fastMs)) void refresh()
      else if (!inFlight) schedule()
    },
    status: () => ({ ...state }),
  }
}
