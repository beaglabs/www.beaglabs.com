import * as Effect from 'effect/Effect'
import { runTeardown } from './lifecycle'
import { isHosted } from './lifecycle-model'
import { runStep } from './runner'
import { run, type Account, type Deployment } from './services'
import { canRun, visibleSteps, type StepId } from './setup'

/**
 * While a deployment page is open, its read-only checks run on their own instead of waiting for "Check now": the
 * address resolving, the health check, Microsoft and registration, and a teardown that is waiting (e.g. on the data
 * cleanup task). Never a deploy, never a failed step (those wait for Retry). Throttled per step, with a D1 lease so two
 * open tabs don't run the same check, and quiet: Activity gets a line only when the outcome changes.
 */

/** Minimum gap between automatic runs of a step. */
export const AUTO_CHECK_MS: Partial<Record<StepId | 'teardown', number>> = { dns: 10_000, health: 10_000, microsoft: 30_000, registration: 15_000, teardown: 15_000 }

const age = (iso: string | undefined, now: number) => {
  const at = Date.parse(iso ?? '')
  return Number.isFinite(at) ? now - at : Number.POSITIVE_INFINITY
}

/** What would run now, if anything. */
export const dueCheck = (deployment: Deployment, now = Date.now()): StepId | 'teardown' | null => {
  if (deployment.lifecycle === 'deleting') {
    const steps = Object.values(deployment.teardown)
    if (steps.some((step) => step.status === 'fail')) return null
    const last = Math.max(0, ...steps.map((step) => Date.parse(step.at ?? '') || 0))
    return now - last >= AUTO_CHECK_MS.teardown! ? 'teardown' : null
  }
  if (deployment.lifecycle !== 'running' || deployment.billing_state !== 'active' || !deployment.provider) return null
  const step = visibleSteps(isHosted(deployment) ? 'hosted' : 'byoc').find((id) => deployment.steps[id].status !== 'pass')
  if (!step || deployment.steps[step].status !== 'pending' || !canRun(deployment.steps, step)) return null
  const gap = AUTO_CHECK_MS[step]
  if (gap === undefined) return null
  // BYOC DNS records are the customer's to create: check only after they asked once.
  if (step === 'dns' && !isHosted(deployment) && !deployment.steps.dns.at) return null
  return age(deployment.steps[step].at, now) >= gap ? step : null
}

/** Take the lease for this deployment's automatic check. */
const claim = (deploymentId: string, gap: number, now: number) =>
  run(
    `INSERT INTO auto_checks (deployment_id, claimed_at) VALUES (?, ?)
     ON CONFLICT(deployment_id) DO UPDATE SET claimed_at = excluded.claimed_at WHERE auto_checks.claimed_at < ?`,
    deploymentId,
    new Date(now).toISOString(),
    new Date(now - gap).toISOString(),
  ).pipe(Effect.map((changes) => changes > 0))

/** Run the due check, if any and if this caller wins the lease. Never fails. */
export const autoAdvance = (deployment: Deployment, account: Account, now = Date.now()) =>
  Effect.gen(function* () {
    const due = dueCheck(deployment, now)
    if (!due) return false
    if (!(yield* claim(deployment.id, AUTO_CHECK_MS[due]!, now))) return false
    if (due === 'teardown') yield* runTeardown(deployment, account.id)
    else yield* runStep(deployment, account, due, { quiet: true })
    return true
  }).pipe(Effect.orElseSucceed(() => false))
