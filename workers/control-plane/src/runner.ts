import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import { decryptJson, encryptJson } from './crypto'
import { checkRecord, checkRecords, describeFailures } from './dns'
import { HOSTED_PROVIDER, hostedOrgFor, hostedProviderContext, loadHostedInfra } from './hosted'
import { hostedDeploy } from './providers/aws-hosted'
import type { Bindings } from './env'
import type { SignedLicense } from './license-rpc'
import { providerById } from './providers/registry'
import { ProviderError, type DeployContext, type ProviderContext } from './providers/types'
import { logEvent, type EventLevel, type EventSource } from './events'
import { canRun, record, type StepId, type StepOutcome } from './setup'
import { Env, UserError, nowIso, run, saveProgress, type Account, type Deployment } from './services'

/** The license Worker (service binding) failed. */
export class LicenseRpcError extends Data.TaggedError('LicenseRpcError')<{ message: string }> {}

export const license = <A>(what: string, call: (rpc: Bindings['LICENSE']) => Promise<A>) =>
  Effect.gen(function* () {
    const env = yield* Env
    return yield* Effect.tryPromise({ try: () => call(env.LICENSE), catch: (cause) => new LicenseRpcError({ message: `${what}: ${cause instanceof Error ? cause.message : 'failed'}` }) })
  })

/** Where the master key is mounted read-only inside the container. */
export const SECRET_KEY_PATH = '/run/secrets/papyrus/master.key'

/** Container environment from the contract (plain values; the bootstrap token and license go in as secrets). */
export const containerEnv = (input: { controlPlaneUrl: string; deploymentId: string; hostname: string }) => ({
  PAPYRUS_CONTROL_PLANE_URL: input.controlPlaneUrl,
  PAPYRUS_DEPLOYMENT_ID: input.deploymentId,
  PAPYRUS_PUBLIC_ORIGIN: `https://${input.hostname}`,
  PAPYRUS_SECRET_KEY_FILE: SECRET_KEY_PATH,
})

const HOSTNAME = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

export const isHostname = (value: string) => HOSTNAME.test(value) && !value.endsWith('.beaglabs.com')

const providerContext = (env: Bindings, deployment: Deployment, credentials: Record<string, string>): ProviderContext => ({
  credentials,
  externalId: deployment.aws_external_id,
  aws: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, principalArn: env.AWS_PRINCIPAL_ARN },
})

/** Decrypt the deployment's provider credentials. Only called inside a check, deploy or update. */
export const loadCredentials = (deployment: Deployment) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (!deployment.credentials_ciphertext) return yield* new ProviderError({ message: 'Connect your cloud account first' })
    return yield* decryptJson<Record<string, string>>(env.CREDENTIALS_KEY, deployment.account_id, deployment.credentials_ciphertext).pipe(
      Effect.mapError(() => new ProviderError({ message: 'Saved credentials could not be read; enter them again' })),
    )
  })

/** Run the provider's read-only credential check. */
export const checkCredentials = (deployment: Deployment, credentials: Record<string, string>) =>
  Effect.gen(function* () {
    const env = yield* Env
    const provider = providerById(deployment.provider)
    if (!provider) return yield* new ProviderError({ message: 'Choose a provider' })
    return yield* provider.check(providerContext(env, deployment, credentials))
  })

/** Register with the license Worker once, keeping the bootstrap token and license (encrypted) for retries. */
const ensureRegistered = (deployment: Deployment, account: Account) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (deployment.license_deployment_id && deployment.deploy_secrets_ciphertext) {
      const secrets = yield* decryptJson<{ bootstrapToken: string; license: SignedLicense }>(env.CREDENTIALS_KEY, account.id, deployment.deploy_secrets_ciphertext)
      return { deploymentId: deployment.license_deployment_id, ...secrets }
    }
    const created = yield* license('Registering the deployment failed', (rpc) =>
      rpc.createDeployment({ accountId: account.id, hostname: deployment.hostname!, provider: deployment.provider!, organization: account.organization ?? account.email }),
    )
    const sealed = yield* encryptJson(env.CREDENTIALS_KEY, account.id, { bootstrapToken: created.bootstrapToken, license: created.license })
    yield* run('UPDATE deployments SET license_deployment_id = ?, deploy_secrets_ciphertext = ?, updated_at = ? WHERE id = ?', created.deploymentId, sealed, nowIso(), deployment.id)
    deployment.license_deployment_id = created.deploymentId
    deployment.deploy_secrets_ciphertext = sealed
    return created
  })

const deployContext = (deployment: Deployment, account: Account) =>
  Effect.gen(function* () {
    const env = yield* Env
    const hosted = deployment.provider === HOSTED_PROVIDER
    const base = hosted ? hostedProviderContext(env) : providerContext(env, deployment, yield* loadCredentials(deployment))
    const registered = yield* ensureRegistered(deployment, account)
    return {
      ...base,
      deploymentId: deployment.id,
      licenseDeploymentId: registered.deploymentId,
      hostname: deployment.hostname!,
      image: `${env.PAPYRUS_IMAGE}@${env.PAPYRUS_IMAGE_DIGEST}`,
      env: containerEnv({ controlPlaneUrl: env.BASE_URL, deploymentId: registered.deploymentId, hostname: deployment.hostname! }),
      secretEnv: { PAPYRUS_BOOTSTRAP_TOKEN: registered.bootstrapToken, PAPYRUS_LICENSE: JSON.stringify(registered.license) },
      secretKeyPath: SECRET_KEY_PATH,
      resources: deployment.resources,
    } satisfies DeployContext
  })

const getJson = (url: string) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient
    const response = yield* client.execute(HttpClientRequest.get(url, { headers: { accept: 'application/json' } }))
    const body = yield* response.json.pipe(Effect.orElseSucceed(() => null))
    return { status: response.status, body: body as Record<string, unknown> | null }
  }).pipe(Effect.timeout('15 seconds'))

const outcome = (status: StepOutcome['status'], reason?: string): StepOutcome => ({ status, ...(reason ? { reason } : {}) })

/** Run one setup step; the outcome is what the setup page shows. */
const stepOutcome = (deployment: Deployment, account: Account, step: StepId): Effect.Effect<StepOutcome, never, Env | HttpClient.HttpClient> => {
  const program: Effect.Effect<StepOutcome, unknown, Env | HttpClient.HttpClient> = Effect.gen(function* () {
    const provider = providerById(deployment.provider)
    const hosted = deployment.provider === HOSTED_PROVIDER
    switch (step) {
      case 'connect': {
        const summary = yield* checkCredentials(deployment, yield* loadCredentials(deployment))
        return outcome('pass', summary)
      }
      case 'deploy': {
        if (deployment.billing_state !== 'active') return outcome('fail', 'Billing is not active. Start or renew the subscription on the Billing page.')
        if (hosted) {
          const org = yield* hostedOrgFor(deployment.id)
          if (!org || !deployment.hostname) return outcome('fail', 'Choose your organization name first.')
          const ctx = yield* deployContext(deployment, account)
          const result = yield* hostedDeploy(ctx, yield* loadHostedInfra(), { name: org.org_name, slot: org.slot })
          return outcome(result.status, result.reason)
        }
        if (!deployment.hostname) return outcome('fail', 'Choose the hostname Papyrus will use.')
        if (!provider) return outcome('fail', 'Choose a provider.')
        const ctx = yield* deployContext(deployment, account)
        const result = yield* provider.recipe.deploy(ctx)
        deployment.dnsRecords = result.dnsRecords.length ? result.dnsRecords : deployment.dnsRecords
        return outcome(result.status, result.reason ?? (result.status === 'pass' ? 'Deployed. Create the DNS records below.' : undefined))
      }
      case 'dns': {
        if (hosted) {
          // One wildcard record covers every hosted customer; this only confirms the name resolves to the shared ALB.
          const infra = yield* loadHostedInfra()
          if (!infra.loadBalancerDns || !deployment.hostname) return outcome('fail', 'Hosted infrastructure is not ready yet. Retry shortly.')
          const check = yield* checkRecord({ type: 'CNAME', name: deployment.hostname, value: infra.loadBalancerDns })
          return check.ok ? outcome('pass', `${deployment.hostname} resolves (checked with 1.1.1.1).`) : outcome('pending', `${deployment.hostname} does not resolve yet. Retry in a minute.`)
        }
        if (deployment.dnsRecords.length === 0) return outcome('fail', 'No DNS records yet. Run the deploy step again.')
        const checks = yield* checkRecords(deployment.dnsRecords)
        if (checks.some((check) => !check.ok)) return outcome('fail', describeFailures(checks))
        if (provider?.recipe.afterDns) {
          const ctx = yield* deployContext(deployment, account)
          const result = yield* provider.recipe.afterDns(ctx)
          if (result.status !== 'pass') return outcome(result.status, result.reason)
        }
        return outcome('pass', 'All records found (checked with 1.1.1.1).')
      }
      case 'health': {
        // /api/config/public answers in both of Papyrus's modes: setup (before Connect Microsoft) and running. /api/health is running-only.
        const url = `https://${deployment.hostname}/api/config/public`
        const result = yield* getJson(url).pipe(Effect.result)
        // Papyrus usually answers within two minutes of a deploy; until STARTUP_GRACE_MS has passed, not yet is "still starting".
        const starting = Date.now() - Date.parse(deployment.steps.deploy.at ?? '') < STARTUP_GRACE_MS
        if (result._tag === 'Failure')
          return outcome(starting ? 'pending' : 'fail', `GET ${url} → no answer over valid TLS${starting ? '; Papyrus is still starting.' : '. Retry, or email james@beaglabs.com if it keeps failing.'}`)
        if (result.success.status !== 200 || typeof result.success.body !== 'object' || result.success.body === null)
          return outcome(starting ? 'pending' : 'fail', `GET ${url} → ${result.success.status}${starting ? '; Papyrus is still starting.' : '. Retry, or email james@beaglabs.com if it keeps failing.'}`)
        return outcome('pass', `GET ${url} → 200 · healthy.`)
      }
      case 'microsoft': {
        const result = yield* getJson(`https://${deployment.hostname}/api/config/public`).pipe(Effect.result)
        if (result._tag === 'Success' && result.success.body?.entraConfigured === true) return outcome('pass', 'Microsoft Entra sign-in is connected.')
        return outcome('pending', `A system owner needs to open https://${deployment.hostname}/ and complete Connect Microsoft.`)
      }
      case 'registration': {
        if (!deployment.license_deployment_id) return outcome('fail', 'Deploy first.')
        const state = yield* license('Reading registration failed', (rpc) => rpc.registrationState(deployment.license_deployment_id!))
        return state === 'registered' ? outcome('pass', 'Papyrus exchanged its bootstrap token and is registered.') : outcome('pending', 'Waiting for Papyrus to exchange its bootstrap token on first start.')
      }
    }
  })
  return program.pipe(
    Effect.catch((error) => {
      const tagged = error as { _tag?: string; message?: string }
      if (tagged._tag === 'ProviderError' || tagged._tag === 'UserError' || tagged._tag === 'LicenseRpcError') return Effect.succeed(outcome('fail', tagged.message))
      return Effect.succeed(outcome('fail', 'Something went wrong on our side. Retry, or contact Beag Labs if it keeps failing.'))
    }),
  )
}

/** How long after a deploy a health check that doesn't answer yet counts as "starting" rather than failed. */
export const STARTUP_GRACE_MS = 15 * 60_000

/** Which Activity source a step logs under. */
export const stepSource = (deployment: Pick<Deployment, 'provider'>, step: StepId): EventSource =>
  step === 'dns' ? (deployment.provider === HOSTED_PROVIDER ? 'address' : 'dns') : step

const levelFor = (status: StepOutcome['status']): EventLevel => (status === 'pass' ? 'ok' : status === 'pending' ? 'wait' : 'error')

/** Run a step if allowed, record the outcome, and save progress (resources are saved whatever happened). */
export const runStep = (deployment: Deployment, account: Account, step: StepId) =>
  Effect.gen(function* () {
    if (!canRun(deployment.steps, step)) return yield* new UserError({ message: 'Finish the earlier steps first', status: 409 })
    const previous = deployment.steps[step]
    // Repeated runs of a step that hasn't passed yet (e.g. health checks while Papyrus starts) are numbered.
    const attempt = previous.status !== 'pass' && previous.at ? (previous.attempts ?? 1) + 1 : 1
    const source = stepSource(deployment, step)
    if (step === 'deploy') yield* logEvent({ accountId: account.id, deploymentId: deployment.id, level: 'info', source, message: `Deploying ${deployment.hostname ?? 'Papyrus'}` })
    const result = yield* stepOutcome(deployment, account, step)
    deployment.steps = record(deployment.steps, step, result)
    // A redeploy rolls out a new container, so its health has to be shown again; later steps keep their state.
    if (step === 'deploy' && result.status === 'pass' && previous.status === 'pass') deployment.steps = { ...deployment.steps, health: { status: 'pending' } }
    if (result.status !== 'pass') deployment.steps[step] = { ...deployment.steps[step], attempts: attempt }
    yield* saveProgress(deployment)
    const message = result.reason ?? (result.status === 'pass' ? 'Done.' : 'Not ready yet.')
    yield* logEvent({ accountId: account.id, deploymentId: deployment.id, level: levelFor(result.status), source, message: attempt > 1 ? `${message} (attempt ${attempt})` : message })
    return result
  })
