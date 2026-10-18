import * as Effect from 'effect/Effect'
import { cancelSubscription } from './billing'
import { logEvent } from './events'
import { HOSTED_PROVIDER, hostedOrgFor, hostedProviderContext, loadHostedInfra, saveHostedInfra } from './hosted'
import { canStop, confirmNameFor, supportsStop, teardownSteps, TEARDOWN_LABELS, type TeardownStep } from './lifecycle-model'
import { awsScale } from './providers/aws'
import { hostedScale, hostedTeardownStep, type HostedTeardownStep, type TeardownOutcome } from './providers/aws-hosted'
import { license, loadCredentials, providerContext, runStep } from './runner'
import { Env, SELECT_DEPLOYMENT, UserError, all, nowIso, run, saveLifecycle, saveProgress, toDeployment, type Account, type Deployment, type DeploymentRow } from './services'
import { PLATFORM_MONTHLY_USD } from './pricing'

/**
 * Stop/Start (reversible) and Delete (irreversible). Spec: "Stop, Start and Delete" in
 * docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md.
 */

const message = (error: unknown) => (error as { message?: string })?.message ?? 'Request failed'

/** Scale the deployment's ECS service: hosted through Beag Labs' role, BYOC (AWS) through the customer's role. */
const scale = (deployment: Deployment, desiredCount: 0 | 1) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (deployment.provider === HOSTED_PROVIDER) return yield* hostedScale(hostedProviderContext(env), yield* loadHostedInfra(), deployment.id, desiredCount)
    return yield* awsScale(providerContext(env, deployment, yield* loadCredentials(deployment)), deployment.id, desiredCount)
  }).pipe(Effect.mapError((error) => new UserError({ message: message(error), status: 502 })))

const setLifecycle = (deployment: Deployment, state: Deployment['lifecycle']) => {
  deployment.lifecycle = state
  deployment.lifecycle_at = nowIso()
  return saveLifecycle(deployment)
}

/** Stop: desiredCount 0. Data, secrets, routing, DNS and registration stay; the subscription (platform fee) continues. */
export const stopDeployment = (deployment: Deployment, account: Account) =>
  Effect.gen(function* () {
    if (deployment.lifecycle !== 'running') return yield* new UserError({ message: `This deployment is ${deployment.lifecycle}.`, status: 409 })
    if (!supportsStop(deployment)) return yield* new UserError({ message: 'Stop is not available for this provider.', status: 409 })
    if (!canStop(deployment)) return yield* new UserError({ message: 'Stop is available once Papyrus is deployed.', status: 409 })
    yield* scale(deployment, 0)
    yield* setLifecycle(deployment, 'stopped')
    yield* logEvent({
      accountId: account.id,
      deploymentId: deployment.id,
      level: 'info',
      source: 'lifecycle',
      message: `Stopped · scaled to 0. Data, address and registration are kept; VM hours stop, the $${PLATFORM_MONTHLY_USD}/month platform fee continues.`,
    })
  })

/** Start: desiredCount 1, then health goes back to pending and is checked again, as after a redeploy. */
export const startDeployment = (deployment: Deployment, account: Account) =>
  Effect.gen(function* () {
    if (deployment.lifecycle !== 'stopped') return yield* new UserError({ message: 'This deployment is not stopped.', status: 409 })
    yield* scale(deployment, 1)
    yield* setLifecycle(deployment, 'running')
    deployment.steps = { ...deployment.steps, health: { status: 'pending' } }
    yield* saveProgress(deployment)
    yield* logEvent({ accountId: account.id, deploymentId: deployment.id, level: 'info', source: 'lifecycle', message: 'Started · scaled to 1. Papyrus is starting.' })
    yield* runStep(deployment, account, 'health').pipe(Effect.ignore)
  })

/** Delete: the customer typed the exact confirm name. Marks it deleting and runs the teardown as far as it goes. */
export const deleteDeployment = (deployment: Deployment, account: Account, typed: string) =>
  Effect.gen(function* () {
    if (deployment.lifecycle === 'deleted') return yield* new UserError({ message: 'This deployment is already deleted.', status: 409 })
    if (deployment.lifecycle !== 'deleting') {
      const expected = confirmNameFor(deployment)
      if (typed.trim() !== expected) return yield* new UserError({ message: `Type ${expected} exactly to confirm.`, status: 400 })
      deployment.teardown = {}
      // Kept for audit: the org name is released at the end of the teardown.
      const org = deployment.provider === HOSTED_PROVIDER ? yield* hostedOrgFor(deployment.id) : null
      if (org) deployment.resources.orgName = org.org_name
      yield* setLifecycle(deployment, 'deleting')
      yield* saveProgress(deployment)
      yield* logEvent({ accountId: account.id, deploymentId: deployment.id, level: 'info', source: 'lifecycle', message: `Deleting ${deployment.hostname ?? expected}` })
    }
    return yield* runTeardown(deployment, account.id)
  })

const runTeardownStep = (deployment: Deployment, step: TeardownStep): Effect.Effect<TeardownOutcome, unknown, any> =>
  Effect.gen(function* () {
    switch (step) {
      case 'billing': {
        const result = yield* cancelSubscription(deployment)
        if (result === 'canceled') {
          deployment.stripe_status = 'canceled'
          yield* run("UPDATE deployments SET stripe_status = 'canceled', billing_state = 'suspended', updated_at = ? WHERE id = ?", nowIso(), deployment.id)
        }
        return { status: 'pass', reason: result === 'canceled' ? 'Subscription canceled now, prorated; usage so far is on a final invoice.' : 'No subscription to cancel.' }
      }
      case 'license': {
        if (!deployment.license_deployment_id) return { status: 'pass', reason: 'Never registered.' }
        yield* license('Revoking the license failed', (rpc) => rpc.revokeDeployment(deployment.license_deployment_id!))
        return { status: 'pass', reason: 'License revoked: Papyrus shows suspended and its deployment key no longer works.' }
      }
      case 'release': {
        yield* run('DELETE FROM hosted_orgs WHERE deployment_id = ?', deployment.id)
        return { status: 'pass', reason: deployment.resources.orgName ? `${deployment.resources.orgName} can be claimed again.` : 'No organization name.' }
      }
      default: {
        const env = yield* Env
        const infra = yield* loadHostedInfra()
        const target = { deploymentId: deployment.id, licenseDeploymentId: deployment.license_deployment_id, resources: deployment.resources }
        return yield* hostedTeardownStep(hostedProviderContext(env), infra, target, step as HostedTeardownStep).pipe(
          Effect.ensuring(saveHostedInfra(infra).pipe(Effect.ignore)),
        )
      }
    }
  })

/**
 * Run (or resume) the teardown: each step not yet passed, in order, until one is pending or fails. Each outcome is
 * one Activity line and is saved with the resources, so a retry resumes after the last step that passed.
 */
export const runTeardown = (deployment: Deployment, accountId: string) =>
  Effect.gen(function* () {
    if (deployment.lifecycle !== 'deleting') return deployment.lifecycle
    for (const step of teardownSteps(deployment)) {
      if (deployment.teardown[step]?.status === 'pass') continue
      const outcome = yield* runTeardownStep(deployment, step).pipe(
        Effect.catch((error) => Effect.succeed<TeardownOutcome>({ status: 'fail', reason: message(error) })),
      )
      deployment.teardown = { ...deployment.teardown, [step]: { status: outcome.status, reason: outcome.reason, at: nowIso() } }
      yield* saveProgress(deployment)
      yield* saveLifecycle(deployment)
      yield* logEvent({
        accountId,
        deploymentId: deployment.id,
        level: outcome.status === 'pass' ? 'ok' : outcome.status === 'pending' ? 'wait' : 'error',
        source: 'lifecycle',
        message: `${TEARDOWN_LABELS[step]}: ${outcome.reason}`,
      })
      if (outcome.status !== 'pass') return deployment.lifecycle
    }
    yield* run("UPDATE deployments SET billing_state = 'suspended', updated_at = ? WHERE id = ?", nowIso(), deployment.id)
    deployment.billing_state = 'suspended'
    yield* setLifecycle(deployment, 'deleted')
    yield* logEvent({ accountId, deploymentId: deployment.id, level: 'ok', source: 'lifecycle', message: `Deleted ${deployment.hostname ?? confirmNameFor(deployment)}.` })
    return deployment.lifecycle
  })

/** The hourly cron: move on teardowns that are waiting (e.g. for the data cleanup task). Failed steps wait for Retry. */
export const resumeTeardowns = () =>
  Effect.gen(function* () {
    const rows = yield* all<DeploymentRow>(`${SELECT_DEPLOYMENT} WHERE l.state = 'deleting'`)
    for (const deployment of rows.map(toDeployment)) {
      const failed = Object.values(deployment.teardown).some((step) => step.status === 'fail')
      if (!failed) yield* runTeardown(deployment, deployment.account_id).pipe(Effect.ignore)
    }
  })
