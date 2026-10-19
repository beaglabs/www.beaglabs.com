/**
 * The setup page's step state machine. Pure: the routes load a deployment's steps, run one step, record its outcome
 * here and save the result.
 *
 * Infrastructure steps run in order. Microsoft identity is independent: it can be verified before the container is
 * ready and stays connected across infrastructure retries. Other downstream checks reset when an earlier step fails.
 * Done when all steps pass.
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
  /** How many times in a row this step has run without passing (shown as "attempt N" in Activity). */
  attempts?: number
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

/** Microsoft can be checked independently; infrastructure steps require every earlier step to pass. */
export const canRun = (steps: Steps, id: StepId): boolean => id === 'microsoft' || STEP_IDS.slice(0, indexOf(id)).every((earlier) => steps[earlier].status === 'pass')

/** The first step that has not passed, or null when setup is done. */
export const nextStep = (steps: Steps): StepId | null => STEP_IDS.find((id) => steps[id].status !== 'pass') ?? null

export const isDone = (steps: Steps): boolean => nextStep(steps) === null

/**
 * Record a step's outcome. Throws if the step was not allowed to run (callers check `canRun` first).
 * Anything but a pass resets later readiness checks, preserving the independent Microsoft connection.
 */
export const record = (steps: Steps, id: StepId, outcome: StepOutcome, now = new Date()): Steps => {
  if (!canRun(steps, id)) throw new Error(`Step ${id} cannot run before earlier steps pass`)
  const next: Steps = { ...steps, [id]: { status: outcome.status, ...(outcome.reason ? { reason: outcome.reason } : {}), at: now.toISOString() } }
  if (outcome.status !== 'pass') {
    for (const later of STEP_IDS.slice(indexOf(id) + 1)) if (later !== 'microsoft') next[later] = { status: 'pending' }
  }
  return next
}

/** Reset infrastructure readiness without discarding Microsoft identity; an explicit Microsoft reset clears it. */
export const resetFrom = (steps: Steps, id: StepId): Steps => {
  const next = { ...steps }
  for (const later of STEP_IDS.slice(indexOf(id))) if (later !== 'microsoft' || id === 'microsoft') next[later] = { status: 'pending' }
  return next
}
