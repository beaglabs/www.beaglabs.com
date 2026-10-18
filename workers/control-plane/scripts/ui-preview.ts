/**
 * Local preview of the deployment pages with fixture deployments in every state, for design work and screenshots.
 * Not part of the Worker. Run: npm run build:client && npx vite-node scripts/ui-preview.ts  →  http://localhost:8790
 * Signed in as owner@acme.example; no network (health and DNS checks get 503s); screenshots come from PREVIEW_IMAGE.
 */
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { createApp } from '../src/app'
import type { Bindings } from '../src/env'

const root = new URL('..', import.meta.url)
const PORT = Number(process.env.PORT ?? 8790)
const PREVIEW_IMAGE = process.env.PREVIEW_IMAGE ?? new URL('screenshots/.papyrus-signin.jpg', root).pathname

const sql = new DatabaseSync(':memory:')
sql.exec(readFileSync(new URL('schema.sql', root), 'utf8'))
const db = {
  prepare(query: string) {
    let args: unknown[] = []
    const statement = {
      bind(...values: unknown[]) {
        args = values.map((v) => (v === undefined ? null : v))
        return statement
      },
      async all() {
        return { results: sql.prepare(query).all(...(args as never[])) }
      },
      async first() {
        return sql.prepare(query).get(...(args as never[])) ?? null
      },
      async run() {
        const r = sql.prepare(query).run(...(args as never[]))
        return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }
      },
    }
    return statement
  },
} as unknown as D1Database

const objects = new Map<string, Uint8Array>()
const PREVIEWS = {
  put: async (key: string, value: Uint8Array) => void objects.set(key, value),
  get: async (key: string) => (objects.has(key) ? { body: new Blob([objects.get(key)!]).stream() } : null),
  delete: async (key: string) => void objects.delete(key),
} as unknown as R2Bucket

const env = {
  DB: db,
  LICENSE: {
    createDeployment: async () => ({ deploymentId: 'pd_new', bootstrapToken: 'x', license: {} }),
    verifyDeploymentKey: async () => false,
    signStatus: async () => ({}),
    registrationState: async () => 'pending',
    revokeDeployment: async () => true,
  } as unknown as Bindings['LICENSE'],
  BASE_URL: `http://localhost:${PORT}`,
  PAPYRUS_IMAGE: 'ghcr.io/beaglabs/papyrus/papyrus',
  PAPYRUS_IMAGE_DIGEST: 'sha256:408b8d29a860efe3684cea3360ecb427ad027b1dbe0aa6a01b104719de74048b',
  MAGIC_LINK_FROM_EMAIL: 'x',
  AWS_PRINCIPAL_ARN: 'x',
  AWS_CONNECT_TEMPLATE_URL: 'x',
  CREDENTIALS_KEY: randomBytes(32).toString('base64'),
  SESSION_SECRET: 'x',
  STRIPE_SECRET_KEY: 'sk_test_x',
  STRIPE_WEBHOOK_SECRET: 'x',
  MICROSOFT_CLIENT_ID: 'x',
  MICROSOFT_CLIENT_SECRET: 'x',
  GOOGLE_CLIENT_ID: 'x',
  GOOGLE_CLIENT_SECRET: 'x',
  RESEND_API_KEY: 'x',
  AWS_ACCESS_KEY_ID: 'x',
  AWS_SECRET_ACCESS_KEY: 'x',
  BYOC_ENABLED: 'false',
  HOSTED_AWS_ROLE_ARN: 'x',
  HOSTED_AWS_REGION: 'us-east-2',
  HOSTED_AWS_EXTERNAL_ID: 'x',
  ADMIN_TOKEN: 'x',
  STRIPE_PRODUCT: 'prod_x',
  STRIPE_PRICE_PLATFORM: 'p',
  STRIPE_PRICE_COMPUTE: 'p',
  STRIPE_PRICE_EXECUTION: 'p',
  BROWSER: process.env.NO_BROWSER ? undefined : ({} as Fetcher),
  PREVIEWS: process.env.NO_BROWSER ? undefined : PREVIEWS,
} satisfies Bindings

// Fixtures -------------------------------------------------------------------------------------------------------------

const NOW = Date.now()
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString()
const TOKEN = 'preview-session'
sql.prepare("INSERT INTO accounts (id, email, name, organization, created_at) VALUES ('acct_1', 'jordan@acme.example', 'Jordan Lee', 'Acme Corp', ?)").run(ago(60 * 24 * 9))
sql.prepare("INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, 'acct_1', '2999-01-01T00:00:00.000Z')").run(createHash('sha256').update(TOKEN).digest('hex'))
sql
  .prepare("INSERT INTO hosted_infra (id, data, updated_at) VALUES ('aws', ?, 'now')")
  .run(JSON.stringify({ loadBalancerDns: 'papyrus-hosted-1.us-east-2.elb.amazonaws.com', httpsListenerArn: 'x', clusterArn: 'x', fileSystemId: 'x', mountTargets: true, taskSecurityGroup: 'x', subnetIds: ['a'] }))

type S = 'pass' | 'pending' | 'fail'
const steps = (spec: Partial<Record<string, [S, number?, string?]>>) =>
  JSON.stringify(
    Object.fromEntries(
      ['connect', 'deploy', 'dns', 'health', 'microsoft', 'registration'].map((id) => {
        const [status, minutes, reason] = spec[id] ?? ['pending']
        return [id, { status, ...(minutes !== undefined ? { at: ago(minutes) } : {}), ...(reason ? { reason } : {}) }]
      }),
    ),
  )
const LIVE = { connect: ['pass', 9000], deploy: ['pass', 8990], dns: ['pass', 8988], health: ['pass', 8985], microsoft: ['pass', 8900], registration: ['pass', 8899] } as const

const deployment = (id: string, org: string, created: number, stepSpec: string, extra: Record<string, unknown> = {}) => {
  sql
    .prepare(
      "INSERT INTO deployments (id, account_id, license_deployment_id, provider, hostname, billing_state, stripe_customer_id, stripe_subscription_id, stripe_status, resources, steps, created_at, updated_at) VALUES (?, 'acct_1', ?, 'hosted', ?, 'active', ?, ?, 'trialing', ?, ?, ?, ?)",
    )
    .run(id, `pd_${id.slice(4)}`, `${org}.papyrus.beaglabs.com`, `cus_${id}`, `sub_${id}`, JSON.stringify({ serviceArn: `arn:aws:ecs:us-east-2:615583899145:service/papyrus-hosted/papyrus-${id.slice(4)}`, ...extra }), stepSpec, ago(created), ago(created))
  sql.prepare("INSERT INTO hosted_orgs (org_name, deployment_id, account_id, slot, created_at) VALUES (?, ?, 'acct_1', ?, 'now')").run(org, id, sql.prepare('SELECT COUNT(*) AS n FROM hosted_orgs').get()!.n as number)
  sql.prepare("INSERT INTO billing_periods (deployment_id, trial_end, updated_at) VALUES (?, ?, 'now')").run(id, new Date(NOW + 9 * 86_400_000).toISOString())
}

deployment('dep_acme', 'acme', 60 * 24 * 6.3, steps(LIVE as never))
deployment('dep_northwind', 'northwind', 4, steps({ connect: ['pass', 4], deploy: ['pass', 1.5], dns: ['pending', 0.2, 'northwind.papyrus.beaglabs.com does not resolve yet. Retry in a minute.'] }))
deployment('dep_contoso', 'contoso', 30, steps({ connect: ['pass', 30], deploy: ['pass', 3], dns: ['pass', 2.5], health: ['pending', 0.1, 'GET https://contoso.papyrus.beaglabs.com/api/config/public → 503; Papyrus is still starting.'] }))
const LONG_ERROR = `GET https://fabrikam.papyrus.beaglabs.com/api/config/public → no answer over valid TLS. Retry, or email james@beaglabs.com if it keeps failing.
ECS service papyrus-fabrikam: (task 6f2c1d) stopped: ResourceInitializationError: unable to pull secrets or registry auth: execution resource retrieval failed: unable to retrieve secret from asm: service call has been retried 5 time(s): failed to fetch secret arn:aws:secretsmanager:us-east-2:615583899145:secret:papyrus/pd_fabrikam/license-Xy12 from secrets manager: AccessDeniedException: User is not authorized to perform secretsmanager:GetSecretValue
  at TaskDefinition papyrus-fabrikam:4 (container papyrus)`
deployment('dep_fabrikam', 'fabrikam', 120, steps({ connect: ['pass', 120], deploy: ['pass', 40], dns: ['pass', 39], health: ['fail', 6, LONG_ERROR] }))
deployment('dep_globex', 'globex', 60 * 24 * 3, steps(LIVE as never))
sql.prepare("INSERT INTO deployment_lifecycle (deployment_id, state, changed_at, teardown) VALUES ('dep_globex', 'stopped', ?, '{}')").run(ago(95))
deployment('dep_initech', 'initech', 50, steps({ connect: ['pass', 50], deploy: ['pass', 22], dns: ['pass', 21], health: ['pass', 18], microsoft: ['pending', 0.3, 'A system owner needs to open https://initech.papyrus.beaglabs.com/ and complete Connect Microsoft.'] }))
deployment('dep_umbrella', 'umbrella', 60 * 24 * 20, steps(LIVE as never))
sql
  .prepare("INSERT INTO deployment_lifecycle (deployment_id, state, changed_at, teardown) VALUES ('dep_umbrella', 'deleting', ?, ?)")
  .run(
    ago(4),
    JSON.stringify({
      billing: { status: 'pass', reason: 'Subscription canceled now, prorated; usage so far is on a final invoice.', at: ago(4) },
      license: { status: 'pass', reason: 'License revoked: Papyrus shows suspended and its deployment key no longer works.', at: ago(4) },
      service: { status: 'pass', reason: 'Service scaled to 0 and deleted.', at: ago(3.8) },
      taskDefinitions: { status: 'pass', reason: '2 revisions deregistered.', at: ago(3.7) },
      routing: { status: 'pass', reason: 'Listener rule and target group removed.', at: ago(3.5) },
      // Far future: the preview server never auto-advances this (it would call AWS).
      data: { status: 'pending', reason: 'Deleting the data directory (cleanup task running).', at: new Date(NOW + 3_600_000).toISOString() },
    }),
  )

const event = (deploymentId: string | null, minutes: number, level: string, source: string, message: string) =>
  sql.prepare("INSERT INTO events (account_id, deployment_id, at, level, source, message) VALUES ('acct_1', ?, ?, ?, ?, ?)").run(deploymentId, ago(minutes), level, source, message)

const story = (id: string, org: string, start: number) => {
  event(id, start, 'ok', 'address', `Claimed "${org}" · ${org}.papyrus.beaglabs.com`)
  event(id, start - 0.2, 'ok', 'billing', 'Trial started · Papyrus · 14 days free, then $250/month platform + usage')
  event(id, start - 0.3, 'info', 'deploy', `Deploying ${org}.papyrus.beaglabs.com`)
  event(id, start - 2.1, 'ok', 'deploy', 'Service papyrus-' + org + ' created · Fargate ARM64 · 2 vCPU / 8 GB · us-east-2b')
  event(id, start - 2.6, 'ok', 'address', `${org}.papyrus.beaglabs.com resolves (checked with 1.1.1.1).`)
}
event(null, 60 * 24 * 6.4, 'info', 'account', 'jordan@acme.example signed in with Microsoft')
story('dep_acme', 'acme', 60 * 24 * 6.3)
event('dep_acme', 60 * 24 * 6.3 - 3, 'wait', 'health', 'GET https://acme.papyrus.beaglabs.com/api/config/public → 503; Papyrus is still starting.')
event('dep_acme', 60 * 24 * 6.3 - 5, 'ok', 'health', 'GET https://acme.papyrus.beaglabs.com/api/config/public → 200 · healthy.')
event('dep_acme', 60 * 24 * 6.3 - 40, 'ok', 'microsoft', 'Microsoft Entra sign-in is connected.')
event('dep_acme', 60 * 24 * 6.3 - 41, 'ok', 'registration', 'Papyrus exchanged its bootstrap token and is registered.')
for (let h = 30; h >= 1; h--) {
  const end = new Date(Math.floor(NOW / 3_600_000) * 3_600_000 - (h - 1) * 3_600_000)
  const start = new Date(end.getTime() - 3_600_000)
  event('dep_acme', (NOW - end.getTime()) / 60_000 - 5, 'info', 'billing', `Usage not billed during trial · 1 VM hour · ${start.toISOString().slice(11, 16)}–${end.toISOString().slice(11, 16)} UTC`)
  if (h === 12) {
    event('dep_acme', (NOW - end.getTime()) / 60_000 - 10, 'info', 'deploy', 'Deploying acme.papyrus.beaglabs.com')
    event('dep_acme', (NOW - end.getTime()) / 60_000 - 12, 'ok', 'deploy', 'Rolled out task definition papyrus-acme:7 (image sha256:408b8d29a860).')
    event('dep_acme', (NOW - end.getTime()) / 60_000 - 14, 'ok', 'health', 'GET https://acme.papyrus.beaglabs.com/api/config/public → 200 · healthy.')
  }
}
story('dep_northwind', 'northwind', 4)
story('dep_contoso', 'contoso', 30)
event('dep_contoso', 3.2, 'info', 'deploy', 'Deploying contoso.papyrus.beaglabs.com (redeploy)')
event('dep_contoso', 3, 'ok', 'deploy', 'Rolled out task definition papyrus-contoso:3.')
for (let i = 0; i < 9; i++) event('dep_contoso', 2.4 - i * 0.25, 'wait', 'health', `GET https://contoso.papyrus.beaglabs.com/api/config/public → 503; Papyrus is still starting.${i ? ` (attempt ${i + 1})` : ''}`)
story('dep_fabrikam', 'fabrikam', 120)
for (let i = 0; i < 5; i++) event('dep_fabrikam', 30 - i * 3, 'wait', 'health', `GET https://fabrikam.papyrus.beaglabs.com/api/config/public → no answer over valid TLS; Papyrus is still starting.${i ? ` (attempt ${i + 1})` : ''}`)
event('dep_fabrikam', 6, 'error', 'health', LONG_ERROR)
story('dep_globex', 'globex', 60 * 24 * 3)
event('dep_globex', 95, 'info', 'lifecycle', 'Stopped · scaled to 0. Data, address and registration are kept; VM hours stop, the $250/month platform fee continues.')
story('dep_initech', 'initech', 50)
event('dep_initech', 18, 'ok', 'health', 'GET https://initech.papyrus.beaglabs.com/api/config/public → 200 · healthy.')
event('dep_initech', 17.5, 'wait', 'microsoft', 'A system owner needs to open https://initech.papyrus.beaglabs.com/ and complete Connect Microsoft.')
story('dep_umbrella', 'umbrella', 60 * 24 * 20)
event('dep_umbrella', 4.1, 'info', 'lifecycle', 'Deleting umbrella.papyrus.beaglabs.com')
event('dep_umbrella', 4, 'ok', 'lifecycle', 'Cancel the subscription (prorated): Subscription canceled now, prorated; usage so far is on a final invoice.')
event('dep_umbrella', 3.5, 'ok', 'lifecycle', 'Remove the listener rule and target group: Listener rule and target group removed.')
event('dep_umbrella', 3.4, 'wait', 'lifecycle', 'Delete the data (EFS access point, then the data directory): Deleting the data directory (cleanup task running).')

// A screenshot already taken for acme (the others capture on demand).
if (existsSync(PREVIEW_IMAGE) && !process.env.NO_BROWSER) {
  objects.set('previews/dep_acme.jpg', readFileSync(PREVIEW_IMAGE))
  sql.prepare("INSERT INTO preview_captures (deployment_id, url, captured_at, attempted_at) VALUES ('dep_acme', 'https://acme.papyrus.beaglabs.com/', ?, ?)").run(ago(7), ago(7))
}

// Server ---------------------------------------------------------------------------------------------------------------

const app = createApp({
  fetch: async () => new Response('starting', { status: 503 }),
  capture: async () => {
    await new Promise((r) => setTimeout(r, 2500))
    return readFileSync(PREVIEW_IMAGE)
  },
})

const ctx = { waitUntil: (p: Promise<unknown>) => void p.catch(() => {}), passThroughOnException() {} } as unknown as ExecutionContext

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', env.BASE_URL)
  const asset = new URL(`public${url.pathname}`, root)
  if (url.pathname.startsWith('/assets/') && existsSync(asset)) {
    res.writeHead(200, { 'content-type': url.pathname.endsWith('.js') ? 'text/javascript' : 'image/jpeg', 'cache-control': 'no-store' })
    return res.end(readFileSync(asset))
  }
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
  headers.set('cookie', `cp_session=${TOKEN}`)
  const response = await app.fetch(new Request(url, { method: req.method, headers, body: chunks.length && req.method !== 'GET' ? Buffer.concat(chunks) : undefined }), env, ctx)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(PORT, () => console.log(`UI preview on http://localhost:${PORT}/deploy`))
