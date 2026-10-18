import { isTrialing, trialStatus } from './billing'
import { HOSTED_DOMAIN, HOSTED_PROVIDER } from './hosted'
import { TEARDOWN_LABELS, byocCleanupList, canStop, isHosted, teardownSteps } from './lifecycle-model'
import { PRICE_ROWS, TRIAL_DAYS, usageLine, type MonthUsage } from './pricing'
import { LEGAL } from './legal'
import { PROVIDERS } from './providers/registry'
import type { Account, Deployment } from './services'
import { canRun, visibleSteps, type StepId } from './setup'
import { selectPreview, type PreviewCapture } from './ui/preview-model'
import type {
  Action,
  ActionId,
  DeploymentStatus,
  DeploymentSummary,
  DeploymentView,
  DetailRow,
  FailureView,
  HealthState,
  MicrosoftConnectView,
  Milestone,
  NextStepView,
  PlanView,
  ProgressView,
  Tone,
} from './ui/types'

/**
 * The deployment pages' view model, derived from the stored deployment (setup steps, lifecycle, billing) and the
 * preview capture. Pure: the routes load the rows and pass them in.
 */

export interface ViewContext {
  account: Account
  /** Region of the shared hosted infrastructure. */
  region: string
  now: number
  /** Browser Rendering and the preview store are bound. */
  screenshots: boolean
  capture?: PreviewCapture | null
  usage?: MonthUsage
  /** The account's other deployments, for the switcher. */
  siblings?: Deployment[]
  /** The owner accepted the Papyrus terms for this deployment (asked before Connect Microsoft). */
  termsAccepted?: boolean
}

/** Hosted tasks run on Graviton with the size registerTask gives every Papyrus task. */
const TASK_SIZE = '2 vCPU · 8 GB'

const parse = (iso: string | null | undefined) => {
  const ms = Date.parse(iso ?? '')
  return Number.isFinite(ms) ? ms : 0
}

const iso = (ms: number) => (ms > 0 ? new Date(ms).toISOString() : null)

/** Monotonic per deployment: any write to the row, its steps or its lifecycle moves it forward. */
export const deploymentVersion = (deployment: Pick<Deployment, 'updated_at' | 'lifecycle_at' | 'steps' | 'teardown'>) =>
  Math.max(
    parse(deployment.updated_at),
    parse(deployment.lifecycle_at),
    ...Object.values(deployment.steps).map((step) => parse(step.at)),
    ...Object.values(deployment.teardown ?? {}).map((step) => parse(step.at)),
  )

export const deploymentName = (deployment: Pick<Deployment, 'hostname' | 'id'>) => deployment.hostname ?? `Deployment ${deployment.id.slice(-6)}`

export const providerLabel = (deployment: Pick<Deployment, 'provider'>) =>
  isHosted(deployment) ? 'Hosted by Beag Labs' : PROVIDERS.find((p) => p.id === deployment.provider)?.name ?? deployment.provider ?? 'Not chosen'

const configuration = (deployment: Pick<Deployment, 'provider'>) =>
  deployment.provider === HOSTED_PROVIDER ? `AWS Fargate · ARM64 · ${TASK_SIZE}` : deployment.provider === 'aws' ? `AWS Fargate · ${TASK_SIZE}` : null

const region = (deployment: Pick<Deployment, 'provider' | 'resources'>, hostedRegion: string) => {
  if (isHosted(deployment)) return hostedRegion
  const stored = deployment.resources.region
  return typeof stored === 'string' && stored ? stored : null
}

// Milestones -----------------------------------------------------------------------------------------------------------

interface MilestoneCopy {
  label: string
  completed: string
  active: string
  pending: string
}

const stepCopy = (deployment: Deployment, mode: 'hosted' | 'byoc', hostedRegion: string): Record<StepId, MilestoneCopy> => {
  const host = deployment.hostname ?? (mode === 'hosted' ? `your-org.${HOSTED_DOMAIN}` : 'your hostname')
  return {
    connect: { label: 'Cloud account', completed: 'Credentials checked with a read-only call.', active: 'Connect your cloud account.', pending: 'Credentials for your cloud account.' },
    deploy:
      mode === 'hosted'
        ? { label: 'Workspace', completed: `Container and storage created in ${hostedRegion}.`, active: 'Creating the container and storage.', pending: 'An isolated container and storage.' }
        : { label: 'Deploy', completed: 'Signed Papyrus image running in your account.', active: 'Deploying the signed Papyrus image.', pending: 'Runs the signed Papyrus image in your account.' },
    dns:
      mode === 'hosted'
        ? { label: 'Address', completed: `${host} resolves with a valid certificate.`, active: `Waiting for ${host} to resolve.`, pending: `${host} with a valid certificate.` }
        : { label: 'DNS', completed: 'All records found (checked with 1.1.1.1).', active: 'Create the DNS records, then we check them with 1.1.1.1.', pending: `Records that point ${host} at Papyrus.` },
    health: { label: 'Health check', completed: 'Papyrus answered over TLS. Healthy.', active: 'Waiting for Papyrus to answer. Usually under two minutes.', pending: 'Runs once the address resolves.' },
    microsoft: { label: 'Microsoft', completed: 'Microsoft connected. Your team signs in with Microsoft.', active: 'Connect Microsoft so your team can sign in.', pending: 'Sign-in for your team.' },
    registration: { label: 'Registration', completed: 'Registered with Beag Labs. Updates are on.', active: 'Papyrus registers itself on first start.', pending: 'Links Papyrus to your account.' },
  }
}

const setupMilestones = (deployment: Deployment, mode: 'hosted' | 'byoc', hostedRegion: string): Milestone[] => {
  const copy = stepCopy(deployment, mode, hostedRegion)
  const ids = visibleSteps(mode)
  const current = ids.find((id) => deployment.steps[id].status !== 'pass')
  // Nothing moves while stopped, unsubscribed or before the address exists.
  const moving = deployment.lifecycle === 'running' && deployment.billing_state === 'active' && Boolean(deployment.provider)
  return ids.map((id) => {
    const step = deployment.steps[id]
    const text = copy[id]
    if (step.status === 'pass') return { id, label: text.label, state: 'completed', detail: text.completed, at: step.at ?? null }
    if (step.status === 'fail') return { id, label: text.label, state: 'failed', detail: step.reason ?? 'Failed.', at: step.at ?? null }
    if (id === current && moving) return { id, label: text.label, state: 'active', detail: text.active, at: step.at ?? null, ...(step.reason ? { note: step.reason } : {}) }
    return { id, label: text.label, state: 'pending', detail: text.pending, at: null }
  })
}

const teardownMilestones = (deployment: Deployment): Milestone[] => {
  const steps = teardownSteps(deployment)
  const current = steps.find((step) => deployment.teardown[step]?.status !== 'pass')
  return steps.map((step) => {
    const state = deployment.teardown[step]
    const label = TEARDOWN_LABELS[step]
    if (state?.status === 'pass') return { id: step, label, state: 'completed', detail: state.reason ?? 'Done.', at: state.at ?? null }
    if (state?.status === 'fail') return { id: step, label, state: 'failed', detail: state.reason ?? 'Failed.', at: state.at ?? null }
    if (step === current && deployment.lifecycle === 'deleting') return { id: step, label, state: 'active', detail: state?.reason ?? 'In progress.', at: state?.at ?? null }
    return { id: step, label, state: 'pending', detail: 'Waiting for the steps before it.', at: null }
  })
}

// Status ---------------------------------------------------------------------------------------------------------------

export const deploymentStatusOf = (deployment: Deployment, mode = isHosted(deployment) ? ('hosted' as const) : ('byoc' as const)): DeploymentStatus => {
  if (deployment.lifecycle === 'deleted') return 'deleted'
  if (deployment.lifecycle === 'deleting') return Object.values(deployment.teardown).some((step) => step.status === 'fail') ? 'failed' : 'deleting'
  if (deployment.billing_state === 'suspended') return 'suspended'
  if (deployment.lifecycle === 'stopped') return 'stopped'
  if (!deployment.provider || deployment.billing_state === 'none') return 'setup'
  const ids = visibleSteps(mode)
  const current = ids.find((id) => deployment.steps[id].status !== 'pass')
  if (!current) return 'running'
  if (deployment.steps[current].status === 'fail') return 'failed'
  if (current === 'microsoft' || current === 'registration') return 'running'
  if (current === 'health') return 'starting'
  return 'provisioning'
}

const STATUS_LABEL: Record<DeploymentStatus, [string, Tone]> = {
  setup: ['Not set up', 'wait'],
  provisioning: ['Provisioning', 'run'],
  starting: ['Starting', 'run'],
  running: ['Running', 'ok'],
  stopped: ['Stopped', 'off'],
  failed: ['Failed', 'err'],
  suspended: ['Suspended', 'err'],
  deleting: ['Deleting', 'run'],
  deleted: ['Deleted', 'off'],
}

const healthOf = (deployment: Deployment): HealthState => {
  if (deployment.lifecycle === 'stopped') return 'stopped'
  if (deployment.lifecycle !== 'running') return 'unknown'
  const health = deployment.steps.health
  if (health.status === 'pass') return 'healthy'
  if (health.status === 'fail') return 'unhealthy'
  // Only once the health step is the one in progress: before that nothing has been asked.
  return deployment.steps.deploy.status === 'pass' && deployment.steps.dns.status === 'pass' ? 'starting' : 'unknown'
}

const HEALTH_LABEL: Record<HealthState, string> = { healthy: 'Healthy', starting: 'Starting', unhealthy: 'Not answering', stopped: 'Stopped', unknown: 'Not checked yet' }

// Actions --------------------------------------------------------------------------------------------------------------

const stopAction = (deployment: Deployment): Action => ({
  id: 'stop',
  label: 'Stop',
  pendingLabel: 'Stopping…',
  kind: 'secondary',
  confirm: {
    title: `Stop ${deploymentName(deployment)}?`,
    body: 'Papyrus shuts down and nobody can use it until you start it again. Anyone signed in loses unsaved work and running agents are cut off. Data, address and registration are kept. VM hours stop; the $250/month platform fee continues while stopped.',
    confirmLabel: 'Stop deployment',
  },
})

const ACTIONS: Record<Exclude<ActionId, 'stop'>, Omit<Action, 'id'>> = {
  start: { label: 'Start', pendingLabel: 'Starting…', kind: 'primary' },
  redeploy: {
    label: 'Redeploy',
    pendingLabel: 'Redeploying…',
    kind: 'secondary',
    confirm: { title: 'Redeploy Papyrus?', body: 'Rolls out a fresh container from the signed image. Papyrus restarts, so people signed in are interrupted for a minute or two. Data is kept.', confirmLabel: 'Redeploy' },
  },
  retry: { label: 'Retry', pendingLabel: 'Retrying…', kind: 'primary' },
  check: { label: 'Check now', pendingLabel: 'Checking…', kind: 'secondary' },
  teardown: { label: 'Retry teardown', pendingLabel: 'Retrying…', kind: 'primary' },
}

const action = (id: Exclude<ActionId, 'stop'>, label?: string): Action => ({ id, ...ACTIONS[id], ...(label ? { label } : {}) })

/** The setup step the "retry" and "check" actions run: the first one that has not passed. */
export const currentStep = (deployment: Deployment): StepId | null => visibleSteps(isHosted(deployment) ? 'hosted' : 'byoc').find((id) => deployment.steps[id].status !== 'pass') ?? null

/**
 * Steps whose "check" re-runs a read-only check (the others need the customer or start real work). Microsoft has its
 * own Connect Microsoft button and passes from it (or from the automatic check).
 */
const CHECKABLE: readonly StepId[] = ['deploy', 'dns', 'health', 'registration']

export const availableActions = (deployment: Deployment): Action[] => {
  const actions: Action[] = []
  if (deployment.lifecycle === 'deleted') return actions
  if (deployment.lifecycle === 'deleting') {
    if (Object.values(deployment.teardown).some((step) => step.status === 'fail')) actions.push(action('teardown'))
    return actions
  }
  if (deployment.lifecycle === 'stopped') return [action('start')]
  if (deployment.billing_state !== 'active' || !deployment.provider) return actions
  const step = currentStep(deployment)
  const failed = step && deployment.steps[step].status === 'fail'
  if (step && failed && canRun(deployment.steps, step) && step !== 'connect') actions.push(action('retry', `Retry ${stepCopy(deployment, isHosted(deployment) ? 'hosted' : 'byoc', '')[step].label.toLowerCase()}`))
  else if (step && CHECKABLE.includes(step) && canRun(deployment.steps, step)) {
    // Never run yet (e.g. BYOC deploy, or DNS once the records exist): the same action starts it.
    const label = stepCopy(deployment, isHosted(deployment) ? 'hosted' : 'byoc', '')[step].label
    actions.push(deployment.steps[step].at ? action('check') : { ...action('check', step === 'deploy' ? 'Deploy' : `Check ${label.toLowerCase()}`), kind: 'primary' })
  }
  // Redeploy is for a live deployment, or a recovery when the health check failed; not mid-setup.
  const status = deploymentStatusOf(deployment)
  if (deployment.steps.deploy.status === 'pass' && (status === 'running' || (status === 'failed' && step === 'health'))) actions.push(action('redeploy'))
  if (canStop(deployment)) actions.push(stopAction(deployment))
  return actions
}

// Plan -----------------------------------------------------------------------------------------------------------------

const planView = (deployment: Deployment, usage: MonthUsage | undefined, now: number): PlanView => {
  const trialing = isTrialing(deployment)
  const label = deployment.billing_state === 'none' ? 'No plan' : deployment.billing_state === 'suspended' ? 'Suspended' : trialing ? 'Trial' : 'Active'
  const status = trialing
    ? trialStatus(deployment.trial_end, now)
    : deployment.billing_state === 'suspended'
      ? `Suspended${deployment.stripe_status ? ` · ${deployment.stripe_status.replace(/_/g, ' ')}` : ''}`
      : deployment.billing_state === 'none'
        ? `${TRIAL_DAYS}-day free trial available`
        : null
  return {
    label,
    status,
    pricing: PRICE_ROWS.map((row) => ({ label: row.label, amount: row.amount, unit: row.unit })),
    usage: deployment.billing_state === 'none' ? null : usageLine(usage ?? { vmHours: 0, executionSeconds: 0 }, { platform: deployment.billing_state === 'active' && !trialing }),
    billing: deployment.stripe_customer_id ? { action: '/billing/portal', label: 'Manage billing' } : { action: '/billing/checkout', label: `Start ${TRIAL_DAYS}-day trial` },
  }
}

// Views ----------------------------------------------------------------------------------------------------------------

const progressOf = (milestones: Milestone[], status: DeploymentStatus): ProgressView => {
  const completed = milestones.filter((m) => m.state === 'completed').length
  const total = milestones.length
  if (!total) return { completed: 0, total: 0, mode: 'indeterminate', label: STATUS_LABEL[status][0] }
  return { completed, total, mode: 'determinate', label: `${completed} of ${total} complete` }
}

export const buildSummary = (deployment: Deployment, ctx: Pick<ViewContext, 'region' | 'now'>): DeploymentSummary => {
  const mode = isHosted(deployment) ? 'hosted' : 'byoc'
  const status = deploymentStatusOf(deployment, mode)
  const milestones = deployment.lifecycle === 'deleting' || deployment.lifecycle === 'deleted' ? teardownMilestones(deployment) : deployment.provider ? setupMilestones(deployment, mode, ctx.region) : []
  const health = healthOf(deployment)
  const [statusLabel, tone] = STATUS_LABEL[status]
  const host = deployment.hostname && deployment.lifecycle !== 'deleted' ? `https://${deployment.hostname}/` : null
  const version = deploymentVersion(deployment)
  return {
    id: deployment.id,
    version,
    name: deploymentName(deployment),
    environment: 'Production',
    url: host,
    provider: providerLabel(deployment),
    region: deployment.provider ? region(deployment, ctx.region) : null,
    configuration: configuration(deployment),
    status,
    statusLabel,
    tone,
    health,
    healthLabel: HEALTH_LABEL[health],
    busy: status === 'provisioning' || status === 'starting' || status === 'deleting',
    progress: progressOf(milestones, status),
    createdAt: iso(parse(deployment.created_at)) ?? deployment.created_at,
    updatedAt: iso(version) ?? deployment.updated_at,
    actions: availableActions(deployment),
  }
}

export const buildDeploymentView = (deployment: Deployment, ctx: ViewContext): DeploymentView => {
  const mode = isHosted(deployment) ? 'hosted' : 'byoc'
  const summary = buildSummary(deployment, ctx)
  const deleting = deployment.lifecycle === 'deleting' || deployment.lifecycle === 'deleted'
  const milestones = deleting ? teardownMilestones(deployment) : deployment.provider ? setupMilestones(deployment, mode, ctx.region) : []
  const active = milestones.find((m) => m.state === 'active') ?? null
  const failedMilestone = milestones.find((m) => m.state === 'failed') ?? null

  let failure: FailureView | null = null
  if (failedMilestone) {
    const recovery: ActionId[] = deleting ? ['teardown'] : ['retry']
    if (!deleting && failedMilestone.id === 'health') recovery.push('redeploy')
    failure = { stage: failedMilestone.label, message: failedMilestone.detail, recovery: recovery.filter((id) => summary.actions.some((a) => a.id === id)) }
  }

  // Offered from the first deploy (Papyrus registered) until the step passes; the step itself passes once it can run.
  const microsoft: MicrosoftConnectView | null =
    !deleting && deployment.license_deployment_id && deployment.steps.microsoft.status !== 'pass'
      ? { href: `/deploy/${encodeURIComponent(deployment.id)}/microsoft/connect`, termsAccepted: Boolean(ctx.termsAccepted), termsUrl: LEGAL.termsUrl, privacyUrl: LEGAL.privacyUrl }
      : null

  let next: NextStepView | null = null
  if (!deleting && deployment.lifecycle === 'running') {
    if (deployment.billing_state === 'none') next = { title: 'Start your subscription', body: `Papyrus deploys as soon as the ${TRIAL_DAYS}-day trial starts. Nothing is charged until it ends.`, link: null }
    else if (microsoft) next = { title: 'Connect Microsoft', body: 'Connect Microsoft so your team can sign in.', link: null }
    else if (active?.id === 'connect') next = { title: 'Connect your cloud account', body: 'Credentials are checked with a read-only call and stored encrypted.', link: { label: 'Connect', href: `/provision?deployment=${encodeURIComponent(deployment.id)}` } }
  }

  const operation =
    summary.status === 'starting' && active?.id === 'health'
      ? { label: 'Starting Papyrus', detail: active.detail, startedAt: active.at ?? iso(Math.max(parse(deployment.steps.deploy.at), parse(deployment.lifecycle_at))) }
      : active && deleting
        ? { label: 'Deleting', detail: `${active.label}. ${active.detail}`, startedAt: active.at }
        : active && summary.busy
          ? { label: active.label, detail: active.detail, startedAt: active.at }
          : active && summary.status === 'running'
            ? { label: 'Papyrus is up', detail: `Setup isn't finished: ${active.label} is next.`, startedAt: null }
            : null

  const lastCheck = Math.max(0, ...Object.values(deployment.steps).map((step) => parse(step.at)))
  const details: DetailRow[] = [
    { label: 'Deployment ID', value: deployment.id, mono: true },
    ...(deployment.license_deployment_id ? [{ label: 'License ID', value: deployment.license_deployment_id, mono: true }] : []),
    { label: 'Provider', value: summary.provider },
    ...(summary.region ? [{ label: 'Region', value: summary.region, mono: true }] : []),
    ...(summary.configuration ? [{ label: 'Configuration', value: summary.configuration }] : []),
    { label: 'Address', value: deployment.hostname ?? 'Not chosen yet', mono: Boolean(deployment.hostname) },
    { label: 'Created', value: summary.createdAt, mono: true },
    { label: 'Last change', value: summary.updatedAt, mono: true },
    ...(deployment.lifecycle_at ? [{ label: `${deployment.lifecycle[0]!.toUpperCase()}${deployment.lifecycle.slice(1)} since`, value: deployment.lifecycle_at, mono: true }] : []),
  ]

  const failedSetup = !deleting && summary.status === 'failed'
  const preview = selectPreview({
    hostname: deployment.hostname,
    lifecycle: deployment.lifecycle,
    healthPassed: deployment.steps.health.status === 'pass',
    healthPassedAt: deployment.steps.health.at ?? null,
    failed: failedSetup || (summary.health === 'unhealthy' && deployment.lifecycle === 'running'),
    failedReason: failedSetup && failure ? `Failed at ${failure.stage}. The error and recovery steps are in Progress.` : null,
    screenshots: ctx.screenshots,
    capture: ctx.capture ?? null,
    imageUrl: (capturedAt) => `/api/deployments/${encodeURIComponent(deployment.id)}/preview.jpg?v=${parse(capturedAt)}`,
    now: ctx.now,
  })

  return {
    ...summary,
    mode,
    hostname: deployment.hostname,
    milestones,
    operation,
    failure,
    next,
    microsoft,
    preview,
    plan: deleting ? null : planView(deployment, ctx.usage, ctx.now),
    details,
    dnsRecords: mode === 'byoc' && !deleting ? deployment.dnsRecords : [],
    cleanup: mode === 'byoc' && deleting ? byocCleanupList(deployment) : [],
    timestamps: { createdAt: summary.createdAt, updatedAt: summary.updatedAt, lifecycleAt: deployment.lifecycle_at ?? null, lastCheckAt: iso(lastCheck) },
    siblings: (ctx.siblings ?? []).map((d) => {
      const s = deploymentStatusOf(d)
      return { id: d.id, name: deploymentName(d), tone: STATUS_LABEL[s][1], statusLabel: STATUS_LABEL[s][0] }
    }),
  }
}
