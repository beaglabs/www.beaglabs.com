/**
 * The deployment pages' view model: what GET /api/deployments and GET /api/deployments/:id return, what the server
 * renders for first paint, and what the client bundle hydrates from. Environment-neutral (no DOM, no Worker types).
 */

export type Tone = 'ok' | 'run' | 'wait' | 'err' | 'off'

/** One word for where a deployment is. Derived from setup steps, lifecycle and billing on the server. */
export type DeploymentStatus =
  | 'setup' // no subscription or no address yet
  | 'provisioning' // creating the workspace / waiting for the address
  | 'starting' // deployed, waiting for the health check (first deploy, redeploy or Start)
  | 'running' // health passed
  | 'stopped'
  | 'failed'
  | 'suspended'
  | 'deleting'
  | 'deleted'

export type HealthState = 'healthy' | 'starting' | 'unhealthy' | 'stopped' | 'unknown'

export type MilestoneState = 'completed' | 'active' | 'pending' | 'failed'

export interface Milestone {
  id: string
  label: string
  state: MilestoneState
  /** Copy for the milestone's current state (never "waiting" copy on a completed milestone). */
  detail: string
  /** When the milestone last changed (ISO). */
  at: string | null
  /** The backend's own words for an active step (e.g. what the last check answered). Technical; shown small. */
  note?: string
}

/** Lifecycle and setup actions, all JSON POSTs to /api/deployments/:id/actions/:id. */
export type ActionId = 'stop' | 'start' | 'redeploy' | 'retry' | 'check' | 'teardown'

export interface Action {
  id: ActionId
  label: string
  /** Shown while the request is in flight / the backend has not confirmed yet. */
  pendingLabel: string
  kind: 'primary' | 'secondary' | 'danger'
  /** Ask first, with what it does. */
  confirm?: { title: string; body: string; confirmLabel: string }
}

export interface LinkRef {
  label: string
  href: string
}

/** The browser preview. Never an iframe: Papyrus sends frame-ancestors 'self'. */
export type PreviewState = 'provisioning' | 'loading' | 'running' | 'stopped' | 'unavailable' | 'failed'

export interface PreviewView {
  state: PreviewState
  /** How the frame shows a running environment: a captured screenshot, or an "Open environment" card. */
  mode: 'screenshot' | 'card' | 'none'
  /** The public address (https://host/), never with credentials. Null until there is one. */
  url: string | null
  /** Same-origin image URL of the last capture (versioned by capture time). */
  image: string | null
  capturedAt: string | null
  /** The client should ask for a capture (POST …/preview): health passed and none, or an older one, is cached. */
  captureDue: boolean
  /** Refresh is allowed (screenshots on, environment up, not rate-limited right now). */
  canRefresh: boolean
  title: string
  reason: string
}

export interface PriceLine {
  label: string
  amount: string
  unit: string
}

export interface PlanView {
  label: string
  /** "Trial · 12 days left · ends Oct 31" etc., or null. */
  status: string | null
  pricing: PriceLine[]
  usage: string | null
  /** Billing portal (POST) when a customer exists, else checkout. */
  billing: { action: string; label: string }
}

export interface DetailRow {
  label: string
  value: string
  mono?: boolean
}

export interface ProgressView {
  completed: number
  total: number
  /** Determinate only when milestones give real completion data and nothing is in flight beyond them. */
  mode: 'determinate' | 'indeterminate'
  label: string
}

export interface FailureView {
  stage: string
  message: string
  /** Recovery actions (also listed in `actions`, rendered once, in the failure panel). */
  recovery: ActionId[]
}

export interface NextStepView {
  title: string
  body: string
  link: LinkRef | null
}

/** One row of the deployments table. */
export interface DeploymentSummary {
  id: string
  /** Monotonic: bumps whenever the deployment row, its steps or its lifecycle change. */
  version: number
  name: string
  environment: string
  url: string | null
  provider: string
  region: string | null
  configuration: string | null
  status: DeploymentStatus
  statusLabel: string
  tone: Tone
  health: HealthState
  healthLabel: string
  /** Something is in flight: poll often. */
  busy: boolean
  progress: ProgressView
  createdAt: string
  updatedAt: string
  actions: Action[]
}

export interface DeploymentView extends DeploymentSummary {
  mode: 'hosted' | 'byoc'
  hostname: string | null
  milestones: Milestone[]
  /** What is happening right now, if anything. */
  operation: { label: string; detail: string; startedAt: string | null } | null
  failure: FailureView | null
  next: NextStepView | null
  preview: PreviewView
  plan: PlanView | null
  details: DetailRow[]
  dnsRecords: { type: string; name: string; value: string; purpose?: string }[]
  cleanup: { what: string; name: string; note?: string }[]
  timestamps: { createdAt: string; updatedAt: string; lifecycleAt: string | null; lastCheckAt: string | null }
  /** Other deployments of this account, for the switcher. */
  siblings: { id: string; name: string; tone: Tone; statusLabel: string }[]
}

export interface ListPayload {
  deployments: DeploymentSummary[]
  serverTime: string
}

export interface DetailPayload {
  deployment: DeploymentView
  serverTime: string
}

/** What POST /api/deployments/:id/actions/:action answers. */
export interface ActionResult {
  ok: boolean
  message: string
  deployment?: DeploymentView
}

export interface ActivityEvent {
  id: number
  at: string
  level: 'ok' | 'info' | 'wait' | 'error'
  source: string
  message: string
  deploymentId: string | null
}
