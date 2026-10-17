import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { createHmac, randomBytes } from 'node:crypto'
import { vi } from 'vitest'
import { createApp } from '../../src/app'
import type { Bindings } from '../../src/env'
import type { LicenseRpcApi, SignedStatus } from '../../src/license-rpc'

/** D1 over node:sqlite with the real schema. */
export function fakeD1() {
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('../../schema.sql', import.meta.url), 'utf8'))
  const prepare = (query: string) => {
    let args: unknown[] = []
    const statement = {
      bind(...values: unknown[]) {
        args = values.map((value) => (value === undefined ? null : value))
        return statement
      },
      async all() {
        return { results: sql.prepare(query).all(...(args as never[])) }
      },
      async first() {
        return sql.prepare(query).get(...(args as never[])) ?? null
      },
      async run() {
        return { meta: { changes: Number(sql.prepare(query).run(...(args as never[])).changes) } }
      },
    }
    return statement
  }
  return { sql, db: { prepare } as unknown as D1Database }
}

/** A mocked LicenseRpc: signs statuses with a fake signature, one valid key. */
export function fakeLicense(validKeys: Record<string, string> = { 'pd_123': 'good-key' }) {
  const license = {
    createDeployment: vi.fn(async (input: { hostname: string }) => ({
      deploymentId: 'pd_new',
      bootstrapToken: 'boot-token',
      license: { scope: 'deployment', publicOrigin: `https://${input.hostname}`, keyId: 'k1', signature: 'sig' },
    })),
    verifyDeploymentKey: vi.fn(async (id: string, key: string) => validKeys[id] === key),
    signStatus: vi.fn(async (input: { deploymentId: string; state: 'active' | 'suspended' }): Promise<SignedStatus> => ({
      payload: { deploymentId: input.deploymentId, state: input.state, issuedAt: '2026-10-17T00:00:00.000Z', expiresAt: '2026-10-24T00:00:00.000Z' },
      keyId: 'beag-kv-1',
      signature: `signed:${input.deploymentId}:${input.state}`,
    })),
    registrationState: vi.fn(async () => 'pending' as const),
    chatSession: vi.fn(async (input: { userId: string; name: string; deploymentId?: string }) => ({
      token: 'chat-token',
      expiresAt: '2999-01-01T00:00:00.000Z',
      tenantId: input.deploymentId ? 'tenant-guid' : 'cp:acct_1',
      user: { oid: input.userId, name: input.name },
    })),
  } satisfies LicenseRpcApi
  return license
}

export function harness(options: { fetch?: typeof fetch; license?: LicenseRpcApi; env?: Partial<Bindings> } = {}) {
  const { sql, db } = fakeD1()
  const license = options.license ?? fakeLicense()
  const env = {
    DB: db,
    LICENSE: license,
    BASE_URL: 'https://papyrus.beaglabs.test',
    CHAT_API_ORIGIN: 'https://license.beaglabs.test',
    PAPYRUS_IMAGE: 'ghcr.io/beaglabs/papyrus/papyrus',
    PAPYRUS_IMAGE_DIGEST: 'sha256:abc',
    MAGIC_LINK_FROM_EMAIL: 'Papyrus <papyrus@mail.beaglabs.com>',
    AWS_PRINCIPAL_ARN: 'arn:aws:iam::111111111111:user/control-plane',
    AWS_CONNECT_TEMPLATE_URL: 'https://example-bucket.s3.amazonaws.com/connect-aws.yaml',
    CREDENTIALS_KEY: randomBytes(32).toString('base64'),
    SESSION_SECRET: 'session-secret',
    STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    MICROSOFT_CLIENT_ID: 'ms-client',
    MICROSOFT_CLIENT_SECRET: 'ms-secret',
    GOOGLE_CLIENT_ID: 'g-client',
    GOOGLE_CLIENT_SECRET: 'g-secret',
    RESEND_API_KEY: 're_x',
    AWS_ACCESS_KEY_ID: 'AKIA',
    AWS_SECRET_ACCESS_KEY: 'secret',
    BYOC_ENABLED: 'false',
    HOSTED_AWS_ROLE_ARN: 'arn:aws:iam::222222222222:role/BeagLabsPapyrusControlPlane',
    HOSTED_AWS_REGION: 'us-east-2',
    HOSTED_AWS_EXTERNAL_ID: 'hosted-external-id',
    ADMIN_TOKEN: 'admin-token',
    ...options.env,
  } satisfies Bindings
  const app = createApp({ fetch: options.fetch ?? (async () => new Response('unexpected fetch', { status: 599 })) })
  const call = (path: string, init: RequestInit = {}) => app.request(`https://papyrus.beaglabs.test${path}`, init, env)
  const insertAccount = (id = 'acct_1', email = 'owner@example.com') =>
    sql.prepare('INSERT INTO accounts (id, email, created_at) VALUES (?, ?, ?)').run(id, email, '2026-10-17T00:00:00.000Z')
  const insertDeployment = (row: { id: string; account_id?: string; billing_state?: string; license_deployment_id?: string | null; stripe_subscription_id?: string | null }) =>
    sql
      .prepare('INSERT INTO deployments (id, account_id, billing_state, license_deployment_id, stripe_subscription_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(row.id, row.account_id ?? 'acct_1', row.billing_state ?? 'none', row.license_deployment_id ?? null, row.stripe_subscription_id ?? null, 'now', 'now')
  const deployment = (id: string) => sql.prepare('SELECT * FROM deployments WHERE id = ?').get(id) as Record<string, unknown>
  /** POST a Stripe event with a valid Stripe-Signature. */
  const stripeEvent = (event: Record<string, unknown>) => {
    const body = JSON.stringify(event)
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = createHmac('sha256', env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest('hex')
    return call('/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${timestamp},v1=${signature}` }, body })
  }
  return { sql, env, license, app, call, insertAccount, insertDeployment, deployment, stripeEvent }
}
