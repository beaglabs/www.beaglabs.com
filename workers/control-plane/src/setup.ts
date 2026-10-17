/**
 * The setup page's step state machine. Pure: the routes load a deployment's steps, run one step, record its outcome
 * here and save the result.
 *
 * Steps run in order. A step may run only when every earlier step has passed. Recording any outcome other than a pass
 * resets every later step to pending, so a changed deploy (or a DNS record that disappeared) has to be re-verified
 * downstream. Done when all steps pass.
 */

export const STEP_IDS = ['connect', 'deploy', 'dns', 'health', 'microsoft', 'registration'] as const
export type StepId = (typeof STEP_IDS)[number]

export const STEP_LABELS: Record<StepId, string> = {
  connect: 'Connect cloud account',
  deploy: 'Deploy Papyrus',
  dns: 'DNS',
  health: 'Container health',
  microsoft: 'Connect Microsoft',
  registration: 'Registration',
}

export type SetupMode = 'hosted' | 'byoc'

/**
 * Steps the setup page shows. Hosted deployments have no provider step (Beag Labs' account; `connect` is recorded as
 * passed when the org name is claimed) and their DNS step only confirms `<org>.papyrus.beaglabs.com` resolves.
 */
export const visibleSteps = (mode: SetupMode): readonly StepId[] => (mode === 'hosted' ? STEP_IDS.filter((id) => id !== 'connect') : STEP_IDS)

export const stepLabel = (mode: SetupMode, id: StepId): string => (mode === 'hosted' && id === 'dns' ? 'Address' : STEP_LABELS[id])

/** `pending` = not run yet, or running but not finished (e.g. a certificate still being issued); `reason` says which. */
export type StepStatus = 'pending' | 'pass' | 'fail'

export interface StepState {
  status: StepStatus
  reason?: string
  at?: string
}

export type Steps = Record<StepId, StepState>

export interface StepOutcome {
  status: StepStatus
  reason?: string
}

export const initialSteps = (): Steps =>
  Object.fromEntries(STEP_IDS.map((id) => [id, { status: 'pending' } satisfies StepState])) as Steps

/** Parse stored JSON, filling any missing step with pending. */
export const parseSteps = (stored: string | null | undefined): Steps => {
  const base = initialSteps()
  if (!stored) return base
  try {
    const parsed = JSON.parse(stored) as Partial<Steps>
    for (const id of STEP_IDS) {
      const step = parsed[id]
      if (step && (step.status === 'pending' || step.status === 'pass' || step.status === 'fail')) base[id] = step
    }
  } catch {
    // corrupted progress starts over
  }
  return base
}

export const isStepId = (value: string): value is StepId => (STEP_IDS as readonly string[]).includes(value)

const indexOf = (id: StepId) => STEP_IDS.indexOf(id)

/** A step may run when every earlier step has passed. */
export const canRun = (steps: Steps, id: StepId): boolean => STEP_IDS.slice(0, indexOf(id)).every((earlier) => steps[earlier].status === 'pass')

/** The first step that has not passed, or null when setup is done. */
export const nextStep = (steps: Steps): StepId | null => STEP_IDS.find((id) => steps[id].status !== 'pass') ?? null

export const isDone = (steps: Steps): boolean => nextStep(steps) === null

/**
 * Record a step's outcome. Throws if the step was not allowed to run (callers check `canRun` first).
 * Anything but a pass resets every later step to pending.
 */
export const record = (steps: Steps, id: StepId, outcome: StepOutcome, now = new Date()): Steps => {
  if (!canRun(steps, id)) throw new Error(`Step ${id} cannot run before earlier steps pass`)
  const next: Steps = { ...steps, [id]: { status: outcome.status, ...(outcome.reason ? { reason: outcome.reason } : {}), at: now.toISOString() } }
  if (outcome.status !== 'pass') {
    for (const later of STEP_IDS.slice(indexOf(id) + 1)) next[later] = { status: 'pending' }
  }
  return next
}

/** Reset a step and everything after it (e.g. the customer changed provider credentials or hostname). */
export const resetFrom = (steps: Steps, id: StepId): Steps => {
  const next = { ...steps }
  for (const later of STEP_IDS.slice(indexOf(id))) next[later] = { status: 'pending' }
  return next
}
