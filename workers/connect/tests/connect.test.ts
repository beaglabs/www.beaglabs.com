import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { createHash, createHmac, generateKeyPairSync, sign } from 'node:crypto'
import { applicationFee, createConnectApp, deliverDue } from '../src/app'
import { canonical, deploymentIdOf } from '../src/identity'
import type { Database, LooseStatement } from '../src/db'
import type { Bindings } from '../src/env'
import type { AccountStatus, PlanStatus, StripeGateway, VerifiedEvent } from '../src/gateway'
import type { PlaidGateway } from '../src/plaid'

const authority = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const authorityPem = authority.publicKey.export({ type: 'spki', format: 'pem' }).toString()
const signLicense = (payload: Record<string, unknown>) => ({ ...payload, keyId: 'beag-1', signature: sign('sha256', Buffer.from(canonical(payload)), authority.privateKey).toString('base64') })
const orgLicense = (organizationId = 'org_city', expiresAt = new Date(Date.now() + 86_400_000).toISOString()) =>
  signLicense({ scope: 'organization', organizationId, entitlementId: 'ent', licenseId: `lic_${organizationId}`, licensee: 'City', profiles: ['commercial'], features: ['core'], issuedAt: new Date().toISOString(), expiresAt, allowedTenantIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] })

function installKey() {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  return { pem: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString(), sign: (payload: unknown) => sign('sha256', Buffer.from(canonical(payload)), pair.privateKey).toString('base64') }
}

function fixture(options: { ready?: boolean; push?: (url: string, init: RequestInit) => Promise<number>; managed?: Map<string, { organizationId: string; status: string; publicOrigin?: string }> } = {}) {
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'))
  const execute = (statement: LooseStatement) => {
    const { sql: query, args = [] } = typeof statement === 'string' ? { sql: statement } : statement
    const prepared = sql.prepare(query)
    if (/^\s*SELECT/i.test(query)) return { rows: prepared.all(...args as any[]) }
    return { rows: [], rowsAffected: Number(prepared.run(...args as any[]).changes) }
  }
  const db = { execute: async (s: LooseStatement) => execute(s), batch: async (ss: readonly LooseStatement[]) => ss.map(execute) } as unknown as Database
  const calls: Array<{ name: string; args: unknown[] }> = []
  let ready = options.ready ?? true
  let account = 0
  const status = (id: string, mode: 'test' | 'live'): AccountStatus => ({ id, mode, cardPayments: ready ? 'active' : 'inactive', achDebitPayments: ready ? 'active' : 'inactive', payouts: 'active',
    requirementsStatus: ready ? 'eventually_due' : 'currently_due', onboardingComplete: ready, readyToProcessPayments: ready })
  const events = new Map<string, VerifiedEvent>()
  const plans = new Map<string, PlanStatus>()
  const gateway: StripeGateway = {
    async createAccount(mode, input) { calls.push({ name: 'createAccount', args: [mode, input] }); return `acct_${++account}` },
    async accountStatus(mode, id) { return status(id, mode) },
    async onboardingLink(mode, id, refresh, back) { calls.push({ name: 'onboardingLink', args: [mode, id, refresh, back] }); return 'https://connect.stripe.com/setup/x' },
    async checkout(mode, id, input) { calls.push({ name: 'checkout', args: [mode, id, input] }); return { url: 'https://checkout.stripe.com/c/pay/cs_1', id: 'cs_1' } },
    async payment(_mode, id, intent) {
      if (id !== 'acct_1') throw Object.assign(new Error('No such payment_intent'), { type: 'StripeInvalidRequestError', statusCode: 404, code: 'resource_missing' })
      return { id: intent, status: 'succeeded', amount: 10_000, currency: 'usd', metadata: { papyrus_target: 'invoice:inv_1', papyrus_fund: 'fund_1' }, chargeId: 'ch_1', method: 'card', last4: '4242', stripeFee: 320, applicationFee: 100 }
    },
    async refund() { return { refundId: 're_1', status: 'succeeded' } },
    async payoutTransactions() { return [{ id: 'txn_1', type: 'charge', amount: 10_000, fee: 420, net: 9_580, paymentIntentId: 'pi_1', metadata: { papyrus_fund: 'fund_1' } }] },
    async plan(_mode, id) { return plans.get(id) },
    async planCheckout(mode, id, input) { calls.push({ name: 'planCheckout', args: [mode, id, input] }); return { url: 'https://checkout.stripe.com/c/pay/cs_plan', id: 'cs_plan' } },
    async planPortal(mode, id, back) { calls.push({ name: 'planPortal', args: [mode, id, back] }); return 'https://billing.stripe.com/p/session/x' },
    async verifySnapshot(_mode, raw, signature) { if (signature !== 'good') throw new Error('bad signature'); return events.get(raw)! },
    async verifyThin(_mode, raw, signature) { if (signature !== 'good') throw new Error('bad signature'); return events.get(raw)! },
  }
  const pushes: Array<{ url: string; init: RequestInit }> = []
  const plaid: PlaidGateway = {
    async linkToken(mode, input) { calls.push({ name: 'plaidLinkToken', args: [mode, input] }); return { linkToken: 'link-sandbox-1', expiration: '2026-10-16T16:00:00Z' } },
    async accountDetails(mode, input) {
      calls.push({ name: 'plaidAccount', args: [mode, input] })
      return { routingNumber: '011401533', accountNumber: '1111222233330000', accountType: 'checking', mask: '0000', institutionName: input.institutionName, tokenized: false,
        ...(input.legalName ? { nameMatch: { score: input.legalName === 'Acme Paving LLC' ? 92 : 31, matched: input.legalName === 'Acme Paving LLC' } } : {}) }
    },
  }
  const deps = { database: () => db, gateway: () => gateway, plaid: () => plaid, managedDeployment: async (_env: Bindings, id: string) => options.managed?.get(id), push: options.push ?? (async (url: string, init: RequestInit) => { pushes.push({ url, init }); return 200 }) }
  const app = createConnectApp(deps)
  const env = { LICENSE_AUTHORITIES: JSON.stringify({ 'beag-1': authorityPem }), APPLICATION_FEE_BPS: '100', APPLICATION_FEE_FIXED_CENTS: '0' } as Bindings
  const waits: Promise<unknown>[] = []
  const ctx = { waitUntil: (promise: Promise<unknown>) => { waits.push(promise) }, passThroughOnException() {}, props: {} }
  const call = (path: string, init: RequestInit = {}) => app.request(`https://connect.beaglabs.test${path}`, init, env, ctx as never)
  /** A signed call, exactly as Papyrus's ConnectClient makes it. */
  const signed = (key: ReturnType<typeof installKey>, installId: string, method: 'GET' | 'POST', path: string, body?: unknown, timestamp = String(Math.floor(Date.now() / 1000))) => {
    const text = body === undefined ? '' : JSON.stringify(body)
    const signature = key.sign({ method, path, timestamp, bodySha256: createHash('sha256').update(text).digest('hex') })
    return call(path, { method, headers: { 'content-type': 'application/json', 'x-papyrus-install': installId, 'x-papyrus-timestamp': timestamp, 'x-papyrus-signature': signature }, ...(text ? { body: text } : {}) })
  }
  const register = async (key = installKey(), license: unknown = orgLicense(), origin = 'https://papyrus.springfield.gov') => {
    const response = await call('/v1/installs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ license, publicKeyPem: key.pem, origin }) })
    return { response, key, body: await response.json() as { installId: string; webhookSecret: string; code?: string } }
  }
  const stripeEvent = (event: VerifiedEvent, kind = 'snapshot', signature = 'good') => {
    const raw = JSON.stringify({ id: event.id }); events.set(raw, event)
    return call(`/stripe/webhook/test/${kind}`, { method: 'POST', headers: { 'stripe-signature': signature }, body: raw })
  }
  return { sql, app, env, deps, calls, plans, pushes, waits, call, signed, register, stripeEvent, setReady: (value: boolean) => { ready = value } }
}

test('registers an install with a valid license and binds it to the organization', async () => {
  const f = fixture()
  const { response, key, body } = await f.register()
  assert.equal(response.status, 200)
  assert.equal(body.installId, deploymentIdOf(key.pem))
  assert.match(body.webhookSecret, /^[0-9a-f]{64}$/)
  assert.equal((f.sql.prepare('SELECT owner_key FROM connect_installs').get() as { owner_key: string }).owner_key, 'org:org_city')
  const tampered = { ...orgLicense(), organizationId: 'org_other' }
  assert.equal((await f.register(installKey(), tampered)).response.status, 401)
  assert.equal((await f.register(installKey(), orgLicense('org_city', new Date(Date.now() - 1000).toISOString()))).body.code, 'LICENSE_EXPIRED')
  const deploymentLicense = signLicense({ scope: 'deployment', deploymentId: 'someone-else', licenseId: 'lic_dep', licensee: 'City', profiles: ['commercial'], features: [], issuedAt: new Date().toISOString(), expiresAt: null })
  assert.equal((await f.register(installKey(), deploymentLicense)).body.code, 'LICENSE_MISMATCH')
  assert.equal((await f.register(installKey(), orgLicense(), 'http://papyrus.springfield.gov')).response.status, 400)
})

test('every other call must be signed by a registered install, recently', async () => {
  const f = fixture()
  const { key, body } = await f.register()
  assert.equal((await f.call('/v1/accounts?mode=test')).status, 401)
  assert.equal((await f.signed(installKey(), body.installId, 'GET', '/v1/accounts?mode=test')).status, 401)
  assert.equal((await f.signed(key, body.installId, 'GET', '/v1/accounts?mode=test', undefined, String(Math.floor(Date.now() / 1000) - 900))).status, 401)
  const unknown = await f.signed(key, 'nobody', 'GET', '/v1/accounts?mode=test')
  assert.equal((await unknown.json() as { code: string }).code, 'INSTALL_UNKNOWN')
  const ok = await f.signed(key, body.installId, 'GET', '/v1/accounts?mode=test')
  assert.deepEqual(await ok.json(), { account: null })
})

test('one account per organization and mode, shared by its installs, invisible to others', async () => {
  const f = fixture()
  const city = await f.register(), replica = await f.register(), other = await f.register(installKey(), orgLicense('org_other'))
  const created = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'City of Springfield', contactEmail: 'finance@springfield.gov' })).json() as AccountStatus
  assert.equal(created.id, 'acct_1')
  assert.deepEqual(f.calls[0], { name: 'createAccount', args: ['test', { displayName: 'City of Springfield', contactEmail: 'finance@springfield.gov', supportUrl: undefined, statementDescriptor: undefined, metadata: { beag_owner: 'org:org_city' } }] })
  assert.equal((await (await f.signed(replica.key, replica.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'Again' })).json() as AccountStatus).id, 'acct_1')
  assert.equal(f.calls.filter(item => item.name === 'createAccount').length, 1)
  assert.deepEqual(await (await f.signed(other.key, other.body.installId, 'GET', '/v1/accounts?mode=test')).json(), { account: null })
  const link = await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts/link', { mode: 'test', refreshUrl: 'https://papyrus.springfield.gov/api/payments-setup/stripe/onboard', returnUrl: 'https://papyrus.springfield.gov/portal/bank-setup?stripe=return' })
  assert.equal((await link.json() as { url: string }).url, 'https://connect.stripe.com/setup/x')
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts/link', { mode: 'test', refreshUrl: 'https://evil.example/x', returnUrl: 'https://papyrus.springfield.gov/' })).status, 400)
})

test('checkout: only on the owner account, once it is ready, with the platform fee and own return URLs', async () => {
  const f = fixture({ ready: false })
  const city = await f.register(), other = await f.register(installKey(), orgLicense('org_other'))
  await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'City' })
  await f.signed(other.key, other.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'Other' })
  const request = { mode: 'test', accountId: 'acct_1', amount: 10_000, currency: 'usd', name: 'Invoice INV-1', reference: 'INV-1', successUrl: 'https://papyrus.springfield.gov/pay/t?paid=1', cancelUrl: 'https://papyrus.springfield.gov/pay/t', metadata: { papyrus_target: 'invoice:inv_1', 'bad key!': 'x' } }
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/checkout', request)).status, 409)
  f.setReady(true)
  assert.equal((await f.signed(other.key, other.body.installId, 'POST', '/v1/checkout', request)).status, 403)
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/checkout', { ...request, successUrl: 'https://evil.example/' })).status, 400)
  const session = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/checkout', request)).json() as { url: string }
  assert.equal(session.url, 'https://checkout.stripe.com/c/pay/cs_1')
  const checkout = f.calls.find(item => item.name === 'checkout')!.args[2] as Record<string, unknown>
  assert.equal(checkout.applicationFee, 100)
  assert.equal(checkout.bankAccounts, true)
  assert.deepEqual(checkout.metadata, { papyrus_target: 'invoice:inv_1' })
  assert.equal(applicationFee({ APPLICATION_FEE_BPS: '250', APPLICATION_FEE_FIXED_CENTS: '30' } as Bindings, 1_000), 55)
  assert.equal(applicationFee({ APPLICATION_FEE_FIXED_CENTS: '500' } as Bindings, 100), 99)
})

test('verified Stripe events are normalized, stored once, pushed signed to every install, and can be polled', async () => {
  const f = fixture()
  const city = await f.register(), replica = await f.register()
  await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'City' })
  const event: VerifiedEvent = { id: 'evt_1', type: 'checkout.session.completed', account: 'acct_1', created: '2026-10-16T12:00:00.000Z', object: { id: 'cs_1', payment_intent: 'pi_1', payment_status: 'paid' } }
  assert.equal((await f.stripeEvent(event, 'snapshot', 'forged')).status, 400)
  assert.equal((await f.stripeEvent(event)).status, 200)
  assert.equal((await f.stripeEvent(event)).status, 200)
  await Promise.all(f.waits)
  assert.equal(f.pushes.length, 2)
  const push = f.pushes[0]!, headers = push.init.headers as Record<string, string>
  assert.equal(push.url, 'https://papyrus.springfield.gov/ledger/webhooks/stripe')
  const secret = [city.body, replica.body].find(item => createHmac('sha256', item.webhookSecret).update(`${headers['x-beag-timestamp']}.${push.init.body}`).digest('hex') === headers['x-beag-signature'])
  assert.ok(secret, 'signed with the install webhook secret')
  const delivered = JSON.parse(String(push.init.body))
  assert.deepEqual(delivered.data, { checkoutSessionId: 'cs_1', paymentIntentId: 'pi_1', chargeId: 'ch_1', paymentStatus: 'paid', amount: 10_000, currency: 'usd', stripeFee: 320, applicationFee: 100, method: 'card', last4: '4242',
    metadata: { papyrus_target: 'invoice:inv_1', papyrus_fund: 'fund_1' } })
  const polled = await (await f.signed(city.key, city.body.installId, 'GET', '/v1/events')).json() as { events: Array<{ id: string }>; cursor: string }
  assert.deepEqual(polled.events.map(item => item.id), ['evt_1'])
  assert.deepEqual((await (await f.signed(city.key, city.body.installId, 'GET', `/v1/events?after=${polled.cursor}`)).json() as { events: unknown[] }).events, [])
  assert.equal((await (await f.stripeEvent({ ...event, id: 'evt_2', account: 'acct_unknown' })).json() as { ignored: string }).ignored, 'unknown account')
})

test('a failed push is retried later with backoff', async () => {
  let up = false
  const f = fixture({ push: async () => (up ? 200 : 503) })
  const city = await f.register()
  await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'City' })
  await f.stripeEvent({ id: 'evt_3', type: 'payout.paid', account: 'acct_1', created: '2026-10-16T12:00:00.000Z', object: { id: 'po_1', amount: 9_580, arrival_date: 1_792_000_000, status: 'paid' } })
  await Promise.all(f.waits)
  const row = () => f.sql.prepare('SELECT attempts, delivered_at, last_error FROM connect_deliveries').get() as { attempts: number; delivered_at: string | null; last_error: string }
  assert.deepEqual({ ...row() }, { attempts: 1, delivered_at: null, last_error: 'HTTP 503' })
  up = true
  assert.equal(await deliverDue(f.env, f.deps), 0)
  assert.equal(await deliverDue(f.env, { ...f.deps, now: () => new Date(Date.now() + 120_000) }), 1)
  assert.ok(row().delivered_at)
})

test('an Azure Marketplace VM with no signed license registers once its customer claimed it, as that organization', async () => {
  const claimed = installKey(), unclaimed = installKey(), retired = installKey()
  const managed = new Map([[deploymentIdOf(claimed.pem), { organizationId: 'org_city', status: 'running', publicOrigin: 'https://papyrus.springfield.gov' }],
    [deploymentIdOf(retired.pem), { organizationId: 'org_city', status: 'retired' }]])
  const f = fixture({ managed })
  assert.equal((await f.register(unclaimed, null)).body.code, 'LICENSE_REQUIRED')
  assert.equal((await f.register(retired, null)).body.code, 'DEPLOYMENT_RETIRED')
  assert.equal((await f.register(claimed, null, 'https://elsewhere.example')).body.code, 'ORIGIN_MISMATCH')
  const marketplace = await f.register(claimed, null)
  assert.equal(marketplace.response.status, 200)
  assert.deepEqual({ ...f.sql.prepare('SELECT owner_key, license_id FROM connect_installs WHERE id=?').get(marketplace.body.installId) as object }, { owner_key: 'org:org_city', license_id: `marketplace:${deploymentIdOf(claimed.pem)}` })
  // The same city with an organization license on another VM reaches the same Stripe account.
  const licensed = await f.register()
  await f.signed(licensed.key, licensed.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'City' })
  assert.equal((await (await f.signed(claimed, marketplace.body.installId, 'GET', '/v1/accounts?mode=test')).json() as { account: { id: string } }).account.id, 'acct_1')
  // Retiring the deployment (or moving it to another organization) cuts it off.
  managed.set(deploymentIdOf(claimed.pem), { organizationId: 'org_city', status: 'retired' })
  assert.equal((await (await f.signed(claimed, marketplace.body.installId, 'GET', '/v1/accounts?mode=test')).json() as { code: string }).code, 'INSTALL_UNKNOWN')
})

test('the Papyrus Payments plan is billed to the owner\'s own Stripe account', async () => {
  const f = fixture()
  const city = await f.register(), other = await f.register(installKey(), orgLicense('org_other'))
  const back = { mode: 'test', successUrl: 'https://papyrus.springfield.gov/portal/bank-setup?stripe=plan', cancelUrl: 'https://papyrus.springfield.gov/portal/bank-setup' }
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/plan/checkout', back)).status, 409)
  await f.signed(city.key, city.body.installId, 'POST', '/v1/accounts', { mode: 'test', displayName: 'City' })
  assert.deepEqual(await (await f.signed(city.key, city.body.installId, 'GET', '/v1/plan?mode=test')).json(), { plan: null, monthlyCents: 250_000 })
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/plan/checkout', { ...back, successUrl: 'https://evil.example/' })).status, 400)
  const session = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/plan/checkout', back)).json() as { url: string }
  assert.equal(session.url, 'https://checkout.stripe.com/c/pay/cs_plan')
  assert.deepEqual(f.calls.find(item => item.name === 'planCheckout')!.args.slice(0, 2), ['test', 'acct_1'])
  f.plans.set('acct_1', { subscriptionId: 'sub_1', status: 'active', amount: 25_000, cancelAtPeriodEnd: false, active: true })
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/plan/checkout', back)).status, 409)
  assert.equal(((await (await f.signed(city.key, city.body.installId, 'GET', '/v1/plan?mode=test')).json()) as { plan: PlanStatus }).plan.status, 'active')
  assert.deepEqual(await (await f.signed(other.key, other.body.installId, 'GET', '/v1/plan?mode=test')).json(), { plan: null, monthlyCents: 250_000 })
  const portal = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/plan/portal', { mode: 'test', returnUrl: 'https://papyrus.springfield.gov/portal/bank-setup' })).json() as { url: string }
  assert.equal(portal.url, 'https://billing.stripe.com/p/session/x')
})

test('Plaid: link tokens and account details only for registered installs, keyed to the owner, nothing kept', async () => {
  const f = fixture()
  const city = await f.register()
  assert.equal((await f.call('/v1/plaid/link-token', { method: 'POST', body: JSON.stringify({ mode: 'test' }) })).status, 401)
  const token = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/plaid/link-token', { mode: 'test', purpose: 'payee', reference: 'req-1' })).json() as { linkToken: string }
  assert.equal(token.linkToken, 'link-sandbox-1')
  assert.deepEqual(f.calls.find(item => item.name === 'plaidLinkToken')!.args, ['test', { clientUserId: 'org:org_city:payee:req-1', clientName: 'Papyrus' }])
  const details = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/plaid/account', { mode: 'test', publicToken: 'public-sandbox-1', accountId: 'acc-1', legalName: 'Acme Paving LLC', institutionName: 'First Platypus Bank' })).json() as Record<string, unknown>
  assert.deepEqual(details, { routingNumber: '011401533', accountNumber: '1111222233330000', accountType: 'checking', mask: '0000', institutionName: 'First Platypus Bank', tokenized: false, nameMatch: { score: 92, matched: true } })
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/plaid/account', { mode: 'test', accountId: 'acc-1' })).status, 400)
  assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE '%plaid%'").get()!.n, 0)
})
