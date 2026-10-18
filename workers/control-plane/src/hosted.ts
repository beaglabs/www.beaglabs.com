import * as Effect from 'effect/Effect'
import type { Bindings } from './env'
import type { ProviderContext } from './providers/types'
import { Env, UserError, first, nowIso, run, type Account } from './services'

/**
 * "Hosted by Beag Labs": the default flow. Sign up → pay → pick an org name → Papyrus goes live at
 * `<org>.papyrus.beaglabs.com` in Beag Labs' own AWS account → Connect Microsoft → registration.
 *
 * Bring-your-own-cloud (the provider dropdown, Connect AWS, credential forms) is kept but off: on for everyone when the
 * Worker var `BYOC_ENABLED` is "true", otherwise only for accounts with `account_flags.byoc_enabled = 1`.
 */

export const HOSTED_PROVIDER = 'hosted'
export const HOSTED_DOMAIN = 'papyrus.beaglabs.com'

export const hostedHostname = (org: string) => `${org}.${HOSTED_DOMAIN}`

/** Names a customer can never claim (infrastructure, brand, and anything that reads as Beag Labs). */
export const RESERVED_ORG_NAMES: ReadonlySet<string> = new Set([
  'www', 'api', 'admin', 'app', 'mail', 'license', 'connect', 'status', 'papyrus', 'beaglabs', 'beag', 'beag-labs',
  'smtp', 'imap', 'pop', 'mx', 'ns', 'ns1', 'ns2', 'dns', 'ftp', 'webmail', 'autodiscover', 'autoconfig',
  'cdn', 'static', 'assets', 'media', 'files', 'img', 'auth', 'login', 'logout', 'signup', 'sso', 'oauth', 'id', 'identity',
  'account', 'accounts', 'billing', 'pay', 'payments', 'invoice', 'invoices', 'support', 'help', 'docs', 'blog', 'news',
  'dashboard', 'console', 'portal', 'control', 'control-plane', 'cp', 'deploy', 'provision', 'setup', 'hosted', 'health',
  'metrics', 'monitor', 'grafana', 'vpn', 'internal', 'staging', 'stage', 'dev', 'test', 'demo', 'sandbox', 'preview',
  'security', 'abuse', 'postmaster', 'hostmaster', 'webmaster', 'root', 'chat', 'huddle', 'admin-app',
])

const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export type OrgNameCheck = { ok: true; name: string } | { ok: false; name: string; reason: string }

/** Syntax and reserved-name check (not uniqueness). Input is trimmed and lowercased first. */
export const validateOrgName = (input: string): OrgNameCheck => {
  const name = input.trim().toLowerCase()
  if (name.length < 3) return { ok: false, name, reason: 'Use at least 3 characters.' }
  if (name.length > 40) return { ok: false, name, reason: 'Use at most 40 characters.' }
  if (!LABEL.test(name)) return { ok: false, name, reason: 'Use lowercase letters, numbers and hyphens, starting and ending with a letter or number.' }
  if (name.startsWith('xn--') || name.includes('--')) return { ok: false, name, reason: 'Two hyphens in a row are not allowed.' }
  if (RESERVED_ORG_NAMES.has(name)) return { ok: false, name, reason: `${name} is reserved.` }
  return { ok: true, name }
}

/** Syntax, reserved list and uniqueness: what the live check on the form shows. */
export const orgNameAvailability = (input: string) =>
  Effect.gen(function* () {
    const check = validateOrgName(input)
    if (!check.ok) return { name: check.name, available: false, reason: check.reason }
    const taken = yield* first<{ org_name: string }>('SELECT org_name FROM hosted_orgs WHERE org_name = ?', check.name)
    if (taken) return { name: check.name, available: false, reason: `${check.name} is taken.` }
    return { name: check.name, available: true, reason: `${hostedHostname(check.name)} is available.` }
  })

/**
 * Claim an org name for a deployment. The primary key makes it unique even under a race. Each claim gets a
 * `slot` (1, 2, …): it is the listener rule priority and, offset, the POSIX uid/gid of the customer's EFS access point.
 */
export const claimOrgName = (accountId: string, deploymentId: string, input: string) =>
  Effect.gen(function* () {
    const check = validateOrgName(input)
    if (!check.ok) return yield* new UserError({ message: check.reason, status: 400 })
    const changes = yield* run(
      `INSERT OR IGNORE INTO hosted_orgs (org_name, deployment_id, account_id, slot, created_at)
       SELECT ?, ?, ?, COALESCE(MAX(slot), 0) + 1, ? FROM hosted_orgs`,
      check.name,
      deploymentId,
      accountId,
      nowIso(),
    ).pipe(Effect.catch(() => Effect.succeed(0)))
    if (changes === 0) return yield* new UserError({ message: `${check.name} is taken. Choose another name.`, status: 409 })
    return check.name
  })

export interface HostedOrg {
  org_name: string
  deployment_id: string
  account_id: string
  slot: number
}

export const hostedOrgFor = (deploymentId: string) => first<HostedOrg>('SELECT * FROM hosted_orgs WHERE deployment_id = ?', deploymentId)

/** BYOC is off unless the Worker var turns it on for everyone, or Beag Labs turned it on for this account. */
export const byocEnabled = (account: Pick<Account, 'id'> | null | undefined) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (env.BYOC_ENABLED === 'true') return true
    if (!account) return false
    const flag = yield* first<{ byoc_enabled: number }>('SELECT byoc_enabled FROM account_flags WHERE account_id = ?', account.id)
    return flag?.byoc_enabled === 1
  })

/** Beag Labs' own account, reached through the same Connect AWS role the customers use (ExternalId held as a secret). */
export const hostedProviderContext = (env: Bindings): ProviderContext => ({
  credentials: { roleArn: env.HOSTED_AWS_ROLE_ARN, region: env.HOSTED_AWS_REGION || 'us-east-2' },
  externalId: env.HOSTED_AWS_EXTERNAL_ID || null,
  aws: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, principalArn: env.AWS_PRINCIPAL_ARN },
})

/** Shared hosted infrastructure ids, written by the bootstrap. */
export interface HostedInfra {
  vpcId?: string
  subnetIds?: string[]
  albSecurityGroup?: string
  taskSecurityGroup?: string
  efsSecurityGroup?: string
  securityRules?: boolean
  clusterArn?: string
  fileSystemId?: string
  mountTargets?: boolean
  certificateArn?: string
  loadBalancerArn?: string
  loadBalancerDns?: string
  httpListenerArn?: string
  httpsListenerArn?: string
  [key: string]: unknown
}

export const loadHostedInfra = () =>
  first<{ data: string }>("SELECT data FROM hosted_infra WHERE id = 'aws'").pipe(
    Effect.map((row) => {
      try {
        return (row ? JSON.parse(row.data) : {}) as HostedInfra
      } catch {
        return {} as HostedInfra
      }
    }),
  )

/** Serialized when it runs (not when built), so it saves what the bootstrap wrote. */
export const saveHostedInfra = (infra: HostedInfra) =>
  Effect.suspend(() =>
    run(
    "INSERT INTO hosted_infra (id, data, updated_at) VALUES ('aws', ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      JSON.stringify(infra),
      nowIso(),
    ),
  )

/** Ready for customer deploys once the HTTPS listener (with the issued wildcard certificate) exists. */
export const infraReady = (infra: HostedInfra) => Boolean(infra.httpsListenerArn && infra.clusterArn && infra.fileSystemId && infra.mountTargets && infra.taskSecurityGroup && infra.subnetIds?.length)
