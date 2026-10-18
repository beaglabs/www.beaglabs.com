import * as Stripe from '@distilled.cloud/stripe'
import { CreateBillingMeterEvent, GetBillingMeter, GetPrice } from '@distilled.cloud/stripe/stripe'
import * as Effect from 'effect/Effect'
import { isTrialing, stripeLayer } from './billing'
import { logEvent } from './events'
import type { PriceKind } from './pricing'
import { license } from './runner'
import { Env, SELECT_DEPLOYMENT, UserError, all, first, nowIso, run, toDeployment, type Deployment, type DeploymentRow } from './services'

/**
 * Usage billing through Stripe Billing Meters.
 *
 * - Compute: an hourly cron sends one meter event (value 1) per running deployment-hour, identifier
 *   `<deploymentId>:<hourStart>`.
 * - Execution: Papyrus posts `POST /api/deployments/usage`; each report becomes one meter event (value =
 *   executionSeconds), identifier `<deploymentId>:<reportId>`.
 *
 * Each metered price's meter is resolved at runtime (price.recurring.meter → GET /v1/billing/meters/{id} →
 * event_name) and cached in D1; no event names are hardcoded and nothing is created in Stripe. While a subscription
 * is trialing nothing is sent: the report is recorded as dropped and logged as INFO. Every outcome is one `billing`
 * line in Activity, without customer ids or keys. `meter_pushes` makes both paths idempotent.
 */

export type MeteredKind = Exclude<PriceKind, 'platform'>

const priceFor = (env: { STRIPE_PRICE_COMPUTE: string; STRIPE_PRICE_EXECUTION: string }, kind: MeteredKind) =>
  kind === 'compute' ? env.STRIPE_PRICE_COMPUTE : env.STRIPE_PRICE_EXECUTION

const stripeFailure = (cause: unknown) => new UserError({ message: `Stripe: ${cause instanceof Error ? cause.message : (cause as { message?: string })?.message ?? 'request failed'}`, status: 502 })

/** The Billing Meter event name behind a metered price, from the D1 cache or Stripe. */
export const meterEventName = (priceId: string) =>
  Effect.gen(function* () {
    const cached = yield* first<{ event_name: string }>('SELECT event_name FROM stripe_meters WHERE price_id = ?', priceId)
    if (cached) return cached.event_name
    const env = yield* Env
    const price = (yield* GetPrice({ price: priceId }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))) as {
      product?: string | { id: string }
      recurring?: { meter?: string | null } | null
    }
    const product = typeof price.product === 'string' ? price.product : price.product?.id
    if (env.STRIPE_PRODUCT && product && product !== env.STRIPE_PRODUCT) return yield* new UserError({ message: `Stripe price ${priceId} is not on ${env.STRIPE_PRODUCT}`, status: 500 })
    const meterId = price.recurring?.meter
    if (!meterId) return yield* new UserError({ message: `Stripe price ${priceId} has no billing meter`, status: 500 })
    const meter = (yield* GetBillingMeter({ id: meterId }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))) as { event_name?: string }
    if (!meter.event_name) return yield* new UserError({ message: `Stripe meter ${meterId} has no event name`, status: 500 })
    yield* run(
      'INSERT INTO stripe_meters (price_id, meter_id, event_name, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(price_id) DO UPDATE SET meter_id = excluded.meter_id, event_name = excluded.event_name, updated_at = excluded.updated_at',
      priceId,
      meterId,
      meter.event_name,
      nowIso(),
    )
    return meter.event_name
  })

/** The id meter identifiers use: the license deployment id Papyrus knows, else the control-plane row id. */
export const meterDeploymentId = (deployment: Pick<Deployment, 'id' | 'license_deployment_id'>) => deployment.license_deployment_id ?? deployment.id

const clock = (iso: string) => iso.slice(11, 16)
const describe = (kind: MeteredKind, value: number, periodStart: string, periodEnd: string) =>
  `${kind === 'compute' ? `${value} VM hour${value === 1 ? '' : 's'}` : `${value.toLocaleString('en-US')} agent-second${value === 1 ? '' : 's'}`} · ${clock(periodStart)}–${clock(periodEnd)} UTC`

export type MeterOutcome = 'sent' | 'trial' | 'unbilled' | 'duplicate'

export interface MeterInput {
  deployment: Deployment
  kind: MeteredKind
  value: number
  identifier: string
  periodStart: string
  periodEnd: string
}

/**
 * Record one usage report and forward it to Stripe as a meter event. Idempotent on `identifier`: a second call with
 * the same identifier changes nothing (a failed send is retried). Fails (502) only when Stripe refused the event.
 */
export const meterUsage = (input: MeterInput) =>
  Effect.gen(function* () {
    const { deployment, kind, value, identifier, periodStart, periodEnd } = input
    const existing = yield* first<{ status: string }>('SELECT status FROM meter_pushes WHERE identifier = ?', identifier)
    if (existing && existing.status !== 'failed') return 'duplicate' as MeterOutcome
    const status: MeterOutcome = isTrialing(deployment) ? 'trial' : !deployment.stripe_customer_id || deployment.billing_state === 'none' ? 'unbilled' : 'sent'
    // Claim the identifier first so concurrent duplicates send once.
    const claimed = existing
      ? yield* run("UPDATE meter_pushes SET status = 'sending', created_at = ? WHERE identifier = ? AND status = 'failed'", nowIso(), identifier)
      : yield* run(
          "INSERT OR IGNORE INTO meter_pushes (identifier, deployment_id, kind, value, period_start, period_end, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'sending', ?)",
          identifier,
          deployment.id,
          kind,
          value,
          periodStart,
          periodEnd,
          nowIso(),
        )
    if (!claimed) return 'duplicate' as MeterOutcome
    const what = describe(kind, value, periodStart, periodEnd)
    const log = (level: 'ok' | 'info' | 'error', message: string) => logEvent({ accountId: deployment.account_id, deploymentId: deployment.id, level, source: 'billing', message })

    if (status === 'trial' || status === 'unbilled') {
      yield* run('UPDATE meter_pushes SET status = ? WHERE identifier = ?', status, identifier)
      yield* Effect.logInfo(`meter event dropped (${status})`, { kind, identifier })
      yield* log('info', status === 'trial' ? `Usage not billed during trial · ${what}` : `Usage not billed · no active subscription · ${what}`)
      return status
    }

    const env = yield* Env
    const sent = yield* Effect.gen(function* () {
      const eventName = yield* meterEventName(priceFor(env, kind))
      yield* CreateBillingMeterEvent({
        event_name: eventName,
        identifier,
        timestamp: Math.floor(Math.min(Date.parse(periodEnd) - 1000, Date.now()) / 1000),
        payload: { stripe_customer_id: deployment.stripe_customer_id!, value: String(value) },
      }).pipe(Stripe.withRequestOptions({ idempotencyKey: identifier }), Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))
    }).pipe(Effect.result)

    if (sent._tag === 'Failure') {
      yield* run("UPDATE meter_pushes SET status = 'failed' WHERE identifier = ?", identifier)
      yield* log('error', `Usage report to Stripe failed, will retry · ${what}`)
      return yield* sent.failure instanceof UserError ? sent.failure : new UserError({ message: 'Stripe: request failed', status: 502 })
    }
    yield* run("UPDATE meter_pushes SET status = 'sent' WHERE identifier = ?", identifier)
    yield* log('ok', `Usage sent to Stripe · ${what}`)
    return 'sent' as MeterOutcome
  })

// Compute: hourly cron ------------------------------------------------------------------------------------------------

const HOUR_MS = 3_600_000

/** Start of the last full UTC hour before `now`. */
export const previousHourStart = (now: number) => new Date(Math.floor(now / HOUR_MS) * HOUR_MS - HOUR_MS)

/**
 * Running = deployed (deploy step passed before the hour ended) on a subscription that is active or trialing, and not
 * stopped or deleted before the hour began. A deployment stopped part-way through an hour is billed for that hour (it
 * ran in it); hours that start while it is stopped are not.
 */
export const runningDuring = (deployment: Deployment, hourEnd: number, hourStart = hourEnd - HOUR_MS) =>
  Boolean(deployment.provider) &&
  deployment.billing_state === 'active' &&
  deployment.steps.deploy.status === 'pass' &&
  Date.parse(deployment.steps.deploy.at ?? '') < hourEnd &&
  (deployment.lifecycle === 'running' || !(Date.parse(deployment.lifecycle_at ?? '') <= hourStart))

/**
 * The hourly cron: one compute meter event per running deployment for the hour that just ended, then retries of
 * reports that failed in the last day. Never throws: a failure is logged and retried next hour.
 */
export const meterComputeHour = (now = Date.now()) =>
  Effect.gen(function* () {
    const hourStart = previousHourStart(now)
    const hourEnd = hourStart.getTime() + HOUR_MS
    const rows = yield* all<DeploymentRow>(`${SELECT_DEPLOYMENT} WHERE d.provider IS NOT NULL`)
    const outcomes: Record<string, MeterOutcome | 'failed'> = {}
    for (const deployment of rows.map(toDeployment)) {
      if (!runningDuring(deployment, hourEnd, hourStart.getTime())) continue
      const identifier = `${meterDeploymentId(deployment)}:${hourStart.toISOString()}`
      const result = yield* meterUsage({ deployment, kind: 'compute', value: 1, identifier, periodStart: hourStart.toISOString(), periodEnd: new Date(hourEnd).toISOString() }).pipe(Effect.result)
      outcomes[identifier] = result._tag === 'Success' ? result.success : 'failed'
    }
    // Retry failed sends from the last 24 hours (both kinds).
    const failed = yield* all<{ identifier: string; deployment_id: string; kind: MeteredKind; value: number; period_start: string; period_end: string }>(
      "SELECT * FROM meter_pushes WHERE status = 'failed' AND period_start >= ?",
      new Date(now - 24 * HOUR_MS).toISOString(),
    )
    for (const row of failed) {
      if (outcomes[row.identifier]) continue
      const deploymentRow = yield* first<DeploymentRow>(`${SELECT_DEPLOYMENT} WHERE d.id = ?`, row.deployment_id)
      if (!deploymentRow) continue
      const result = yield* meterUsage({ deployment: toDeployment(deploymentRow), kind: row.kind, value: row.value, identifier: row.identifier, periodStart: row.period_start, periodEnd: row.period_end }).pipe(Effect.result)
      outcomes[row.identifier] = result._tag === 'Success' ? result.success : 'failed'
    }
    return outcomes
  })

// Execution: POST /api/deployments/usage ------------------------------------------------------------------------------

export interface UsageReport {
  periodStart: string
  periodEnd: string
  executionSeconds: number
  reportId: string
}

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
/** Clock skew allowed between Papyrus and the Worker. */
const SKEW_MS = 60_000

/** Validate a usage report body. Returns the report or the reason it is invalid. */
export const parseUsageReport = (body: unknown, now = Date.now()): UsageReport | string => {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object'
  const { periodStart, periodEnd, executionSeconds, reportId } = body as Record<string, unknown>
  if (typeof reportId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(reportId)) return 'reportId must be 1–128 characters of A–Z a–z 0–9 . _ : -'
  if (typeof executionSeconds !== 'number' || !Number.isSafeInteger(executionSeconds) || executionSeconds < 0) return 'executionSeconds must be a non-negative integer'
  if (typeof periodStart !== 'string' || !ISO.test(periodStart) || typeof periodEnd !== 'string' || !ISO.test(periodEnd)) return 'periodStart and periodEnd must be ISO 8601 timestamps'
  const start = Date.parse(periodStart)
  const end = Date.parse(periodEnd)
  if (Number.isNaN(start) || Number.isNaN(end)) return 'periodStart and periodEnd must be ISO 8601 timestamps'
  if (end <= start) return 'periodEnd must be after periodStart'
  if (end - start > HOUR_MS) return 'A report covers at most one hour'
  if (end > now + SKEW_MS) return 'periodEnd is in the future'
  return { periodStart: new Date(start).toISOString(), periodEnd: new Date(end).toISOString(), executionSeconds, reportId }
}

/**
 * POST /api/deployments/usage. Same auth as the status check-in: `Authorization: Bearer <deploymentKey>` +
 * `X-Papyrus-Deployment-Id`. 200 `{ accepted: true, duplicate, billed }`; 400 invalid; 401 bad key; 404 unknown.
 */
export const reportUsage = (authorization: string | null | undefined, deploymentIdHeader: string | null | undefined, body: unknown) =>
  Effect.gen(function* () {
    const key = /^Bearer\s+(\S+)$/i.exec(authorization ?? '')?.[1]
    const id = deploymentIdHeader?.trim()
    if (!key || !id) return yield* new UserError({ message: 'Deployment key required', status: 401 })
    const valid = yield* license('Verifying the deployment key failed', (rpc) => rpc.verifyDeploymentKey(id, key))
    if (!valid) return yield* new UserError({ message: 'Invalid deployment key', status: 401 })
    const report = parseUsageReport(body)
    if (typeof report === 'string') return yield* new UserError({ message: report, status: 400 })
    const row = yield* first<DeploymentRow>(`${SELECT_DEPLOYMENT} WHERE d.license_deployment_id = ?`, id)
    if (!row) return yield* new UserError({ message: 'Not a control-plane deployment', status: 404 })
    const outcome = yield* meterUsage({
      deployment: toDeployment(row),
      kind: 'execution',
      value: report.executionSeconds,
      identifier: `${id}:${report.reportId}`,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
    })
    return { accepted: true, duplicate: outcome === 'duplicate', billed: outcome === 'sent' }
  })

// Local counts for the Plan card -------------------------------------------------------------------------------------

/** Billed usage this calendar month (UTC), per deployment id. */
export const monthUsage = (accountId: string, now = new Date()) =>
  Effect.gen(function* () {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    const rows = yield* all<{ deployment_id: string; kind: MeteredKind; total: number }>(
      "SELECT m.deployment_id, m.kind, SUM(m.value) AS total FROM meter_pushes m JOIN deployments d ON d.id = m.deployment_id WHERE d.account_id = ? AND m.status = 'sent' AND m.period_start >= ? GROUP BY m.deployment_id, m.kind",
      accountId,
      monthStart,
    )
    const usage: Record<string, { vmHours: number; executionSeconds: number }> = {}
    for (const row of rows) {
      const entry = (usage[row.deployment_id] ??= { vmHours: 0, executionSeconds: 0 })
      if (row.kind === 'compute') entry.vmHours += Number(row.total)
      else entry.executionSeconds += Number(row.total)
    }
    return usage
  })
