import * as Context from 'effect/Context'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import type { Bindings } from './env'
import type { DnsRecord } from './dns'
import { parseSteps, type Steps } from './setup'

/** The Worker's bindings, provided per request. */
export class Env extends Context.Service<Env, Bindings>()('ControlPlane/Env') {}

export class DbError extends Data.TaggedError('DbError')<{ message: string }> {}

/** An error a customer should see verbatim (bad input, not allowed, provider said no). */
export class UserError extends Data.TaggedError('UserError')<{ message: string; status?: number }> {}

const d1 = <A>(run: (db: D1Database) => Promise<A>) =>
  Effect.gen(function* () {
    const env = yield* Env
    return yield* Effect.tryPromise({ try: () => run(env.DB), catch: (cause) => new DbError({ message: cause instanceof Error ? cause.message : String(cause) }) })
  })

export const all = <T>(sql: string, ...args: unknown[]) => d1(async (db) => (await db.prepare(sql).bind(...args).all<T>()).results ?? [])
export const first = <T>(sql: string, ...args: unknown[]) => d1(async (db) => (await db.prepare(sql).bind(...args).first<T>()) ?? null)
export const run = (sql: string, ...args: unknown[]) => d1(async (db) => (await db.prepare(sql).bind(...args).run()).meta?.changes ?? 0)
/** INSERT one row; returns its rowid. */
export const insert = (sql: string, ...args: unknown[]) => d1(async (db) => Number((await db.prepare(sql).bind(...args).run()).meta?.last_row_id ?? 0))

export const nowIso = () => new Date().toISOString()
export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`

export interface Account {
  id: string
  email: string
  name: string | null
  organization: string | null
  created_at: string
  /** Set per request on signed-in pages: the earliest end of a running trial, for the trial banner. */
  trial?: { trialEnd: string | null } | null
}

export type BillingState = 'none' | 'active' | 'suspended'

export interface DeploymentRow {
  id: string
  account_id: string
  license_deployment_id: string | null
  provider: string | null
  hostname: string | null
  billing_state: BillingState
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_status: string | null
  credentials_ciphertext: string | null
  deploy_secrets_ciphertext: string | null
  aws_external_id: string | null
  resources: string
  dns_records: string
  steps: string
  created_at: string
  updated_at: string
  /** From billing_periods (Stripe's trial_end), when known. */
  trial_end?: string | null
}

export interface Deployment extends Omit<DeploymentRow, 'resources' | 'dns_records' | 'steps'> {
  resources: Record<string, unknown>
  dnsRecords: DnsRecord[]
  steps: Steps
}

const parseJson = <T>(text: string | null | undefined, fallback: T): T => {
  try {
    return text ? (JSON.parse(text) as T) : fallback
  } catch {
    return fallback
  }
}

export const toDeployment = (row: DeploymentRow): Deployment => {
  const { resources, dns_records, steps, ...rest } = row
  return { ...rest, resources: parseJson(resources, {}), dnsRecords: parseJson(dns_records, []), steps: parseSteps(steps) }
}

const SELECT_DEPLOYMENT = 'SELECT d.*, b.trial_end FROM deployments d LEFT JOIN billing_periods b ON b.deployment_id = d.id'

export const getDeployment = (id: string) => first<DeploymentRow>(`${SELECT_DEPLOYMENT} WHERE d.id = ?`, id).pipe(Effect.map((row) => (row ? toDeployment(row) : null)))

/** The deployment, only if it belongs to the account. */
export const getOwnedDeployment = (accountId: string, id: string) =>
  getDeployment(id).pipe(
    Effect.flatMap((deployment) =>
      deployment && deployment.account_id === accountId ? Effect.succeed(deployment) : Effect.fail(new UserError({ message: 'Deployment not found', status: 404 })),
    ),
  )

export const listDeployments = (accountId: string) =>
  all<DeploymentRow>(`${SELECT_DEPLOYMENT} WHERE d.account_id = ? ORDER BY d.created_at`, accountId).pipe(Effect.map((rows) => rows.map(toDeployment)))

/** Write the mutable progress columns of a deployment. */
export const saveProgress = (deployment: Pick<Deployment, 'id' | 'resources' | 'dnsRecords' | 'steps'>) =>
  run(
    'UPDATE deployments SET resources = ?, dns_records = ?, steps = ?, updated_at = ? WHERE id = ?',
    JSON.stringify(deployment.resources),
    JSON.stringify(deployment.dnsRecords),
    JSON.stringify(deployment.steps),
    nowIso(),
    deployment.id,
  )
