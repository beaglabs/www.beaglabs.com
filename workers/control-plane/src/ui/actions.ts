import type { ActionId, ActionResult, DeploymentView } from './types'

/**
 * Lifecycle actions on the client: one at a time per page, pending until the backend confirms, then a toast.
 * The backend still checks ownership and whether the action is allowed; this only keeps the UI honest.
 */

export interface Toast {
  tone: 'ok' | 'err' | 'info'
  title: string
  body?: string
}

export interface PendingAction {
  id: ActionId
  startedAt: number
  /** The request returned, but the deployment has not reached the target state yet. */
  awaiting: boolean
}

/** When the returned deployment counts as "done" for an action. Start is confirmed once the service is scaled up. */
export const confirmedBy: Record<ActionId, (view: Pick<DeploymentView, 'status' | 'health'>) => boolean> = {
  stop: (view) => view.status === 'stopped',
  start: (view) => view.status !== 'stopped' && view.health !== 'stopped',
  redeploy: () => true,
  retry: () => true,
  check: () => true,
  teardown: () => true,
}

export const DONE_COPY: Record<ActionId, string> = {
  stop: 'Stopped. Data, address and registration are kept.',
  start: 'Started. Papyrus is starting up.',
  redeploy: 'Redeploy finished.',
  retry: 'Retried.',
  check: 'Checked.',
  teardown: 'Teardown continued.',
}

export type RunOutcome = 'confirmed' | 'awaiting' | 'failed' | 'blocked'

export interface ActionRunnerOptions {
  post: (id: ActionId) => Promise<ActionResult>
  onSnapshot: (view: DeploymentView) => void
  notify: (toast: Toast) => void
  onPending: (pending: PendingAction | null) => void
  now?: () => number
}

export interface ActionRunner {
  run(id: ActionId): Promise<RunOutcome>
  /** Feed every newer snapshot (from polling) so an awaiting action can be confirmed. */
  observe(view: Pick<DeploymentView, 'status' | 'health'>): void
  pending(): PendingAction | null
}

export function createActionRunner(options: ActionRunnerOptions): ActionRunner {
  const now = options.now ?? (() => Date.now())
  let pending: PendingAction | null = null

  const set = (next: PendingAction | null) => {
    pending = next
    options.onPending(next)
  }

  const finish = (id: ActionId, message?: string) => {
    set(null)
    options.notify({ tone: 'ok', title: message || DONE_COPY[id] })
  }

  return {
    async run(id) {
      if (pending) {
        options.notify({ tone: 'info', title: 'One thing at a time', body: `Wait for “${pending.id}” to finish first.` })
        return 'blocked'
      }
      const startedAt = now()
      set({ id, startedAt, awaiting: false })
      let result: ActionResult
      try {
        result = await options.post(id)
      } catch {
        set(null)
        options.notify({ tone: 'err', title: 'Could not reach the control plane', body: 'Nothing was confirmed. Check your connection, then refresh to see the current state.' })
        return 'failed'
      }
      if (result.deployment) options.onSnapshot(result.deployment)
      if (!result.ok) {
        set(null)
        options.notify({ tone: 'err', title: result.message || 'That did not work' })
        return 'failed'
      }
      if (!result.deployment || confirmedBy[id](result.deployment)) {
        finish(id, result.message)
        return 'confirmed'
      }
      set({ id, startedAt, awaiting: true })
      return 'awaiting'
    },
    observe(view) {
      if (pending?.awaiting && confirmedBy[pending.id](view)) finish(pending.id)
    },
    pending: () => pending,
  }
}
