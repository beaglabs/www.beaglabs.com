import { createHmac, randomBytes } from 'node:crypto'
import { Hono, type Context } from 'hono'
import type { Database } from './db'
import type { Bindings, Mode } from './env'
import type { StripeGateway, VerifiedEvent } from './gateway'
import { deploymentIdOf, IdentityError, verifyLicense, verifyRequest } from './identity'
import { PlaidError, type PlaidGateway } from './plaid'

/**
 * Beag Labs' Stripe Connect service for Papyrus installs.
 *
 * Papyrus never holds the Stripe platform key: installs ask this Worker, which holds it (from Key Vault) and acts only
 * on the Stripe accounts of the license owner that signed the request. Each city's account is a V2 account with the
 * full Stripe dashboard; Stripe collects fees and carries losses; charges are direct charges on the city's account with
 * Beag Labs' application fee.
 *
 * Routes (JSON):
 *   POST /v1/installs                  register with { license, publicKeyPem, origin } → { installId, webhookSecret }
 *   POST /v1/accounts                  create (or return) the owner's account for a mode → status
 *   GET  /v1/accounts?mode=            the owner's account status, or null
 *   POST /v1/accounts/link             a single-use Stripe onboarding link
 *   POST /v1/checkout                  a hosted Checkout session for an amount owed
 *   POST /v1/refunds                   refund a payment on the owner's account
 *   GET  /v1/payouts/:id/transactions  what a payout carried, with each payment's metadata
 *   GET  /v1/events?after=             events for the owner, for installs that poll
 *   GET  /v1/plan?mode=                the Papyrus Payments plan on the owner's account, or null
 *   POST /v1/plan/checkout             Stripe Checkout to subscribe the owner's account to the plan
 *   POST /v1/plan/portal               Stripe's billing portal for the plan (payment method, invoices, cancel)
 *   POST /v1/plaid/link-token          a Plaid Link token (Auth, and Identity Match where the bank offers it)
 *   POST /v1/plaid/account             exchange Link's token for one account's details and name match; nothing kept
 *   POST /stripe/webhook/:mode/:kind   Stripe event destinations (kind: snapshot | thin)
 */

export interface ConnectEvent { id: string; type: string; mode: Mode; account: string; created: string; data: Record<string, unknown> }
type Install = { id: string; owner_key: string; license_id: string; public_key_pem: string; origin: string; webhook_secret: string; license_expires_at: string | null }
type Env = { Bindings: Bindings; Variables: { install: Install } }

export interface AppDeps {
  database: (env: Bindings) => Database
  gateway: (env: Bindings) => StripeGateway
  plaid?: (env: Bindings) => PlaidGateway
  now?: () => Date
  /** Pushes an event to an install; returns the HTTP status. Tests pass their own. */
  push?: (url: string, init: RequestInit) => Promise<number>
  /** A Marketplace VM claimed in Beag Labs provisioning (license service `managed_deployments`), by Papyrus deployment id. */
  managedDeployment?: (env: Bindings, deploymentId: string) => Promise<{ organizationId: string; status: string; publicOrigin?: string | undefined } | undefined>
}

class ApiError extends Error { constructor(readonly status: number, readonly code: string, message: string) { super(message) } }
const MODES: Mode[] = ['test', 'live']
const PUSH_SCHEDULE_MS = [0, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 3 * 3_600_000, 6 * 3_600_000, 12 * 3_600_000, 24 * 3_600_000]

export function createConnectApp(deps: AppDeps) {
  const app = new Hono<Env>()
  const now = () => deps.now?.() ?? new Date()
  const db = (c: Context<Env>) => deps.database(c.env)
  const one = async <T>(c: Context<Env>, sql: string, args: unknown[]) => ((await db(c).execute({ sql, args })).rows[0] as unknown as T | undefined)

  app.onError((error, c) => {
    if (error instanceof ApiError) return c.json({ error: error.message, code: error.code }, error.status as 400)
    if (error instanceof IdentityError) return c.json({ error: error.message, code: error.code }, 401)
    if (error instanceof PlaidError) return c.json({ error: error.message, code: error.code }, error.status as 400)
    const stripe = error as { type?: string; code?: string; message?: string; statusCode?: number }
    if (stripe.type?.startsWith('Stripe')) return c.json({ error: stripe.message ?? 'Stripe refused the request', code: stripe.code ?? 'STRIPE_ERROR' }, (stripe.statusCode && stripe.statusCode < 500 ? 400 : 502) as 400)
    console.error(JSON.stringify({ event: 'connect.error', path: c.req.path, error: error instanceof Error ? error.message : String(error) }))
    return c.json({ error: 'The Beag Labs service failed. Details are in its log.', code: 'CONNECT_FAILED' }, 500)
  })

  // Registration: the license proves who the install belongs to; the key it sends signs everything after.
  app.post('/v1/installs', async c => {
    const body = await c.req.json().catch(() => ({})) as { license?: unknown; publicKeyPem?: unknown; origin?: unknown }
    if (typeof body.publicKeyPem !== 'string' || !body.publicKeyPem.includes('BEGIN PUBLIC KEY')) throw new ApiError(400, 'KEY_REQUIRED', 'The install public key (PEM) is required')
    const origin = checkOrigin(c.env, body.origin)
    const id = deploymentIdOf(body.publicKeyPem), secret = randomBytes(32).toString('hex'), stamp = now().toISOString()
    const owner = body.license !== undefined && body.license !== null
      ? verifyLicense(body.license, JSON.parse(c.env.LICENSE_AUTHORITIES || '{}') as Record<string, string>, body.publicKeyPem, now())
      : await marketplaceOwner(c.env, id, origin)
    // Registering again rotates the webhook secret (a rebuilt VM, a new license).
    await db(c).execute({ sql: `INSERT INTO connect_installs(id, owner_key, license_id, license_expires_at, public_key_pem, origin, webhook_secret, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET owner_key=excluded.owner_key, license_id=excluded.license_id, license_expires_at=excluded.license_expires_at, public_key_pem=excluded.public_key_pem,
      origin=excluded.origin, webhook_secret=excluded.webhook_secret, updated_at=excluded.updated_at`, args: [id, owner.ownerKey, owner.licenseId, owner.expiresAt, body.publicKeyPem, origin, secret, stamp, stamp] })
    return c.json({ installId: id, webhookSecret: secret })
  })

  // Every other /v1 route is signed by a registered install whose license has not expired.
  app.use('/v1/*', async (c, next) => {
    if (c.req.path === '/v1/installs') return next()
    const installId = c.req.header('x-papyrus-install')
    const install = installId ? await one<Install>(c, 'SELECT * FROM connect_installs WHERE id=?', [installId]) : undefined
    if (!install) throw new ApiError(401, 'INSTALL_UNKNOWN', 'This install is not registered')
    const body = c.req.method === 'GET' ? '' : await c.req.raw.clone().text()
    const url = new URL(c.req.url)
    verifyRequest({ method: c.req.method, path: url.pathname + url.search, timestamp: c.req.header('x-papyrus-timestamp') ?? null, signature: c.req.header('x-papyrus-signature') ?? null, body, publicKeyPem: install.public_key_pem, now: now() })
    if (install.license_expires_at && Date.parse(install.license_expires_at) <= now().getTime()) throw new ApiError(401, 'INSTALL_UNKNOWN', 'The license this install registered with has expired; register again with the new one')
    // A Marketplace VM stays entitled only while its managed deployment is not retired (or moved to another organization).
    if (install.license_id.startsWith('marketplace:')) {
      const managed = await deps.managedDeployment?.(c.env, install.id)
      if (!managed || managed.status === 'retired' || `org:${managed.organizationId}` !== install.owner_key) throw new ApiError(401, 'INSTALL_UNKNOWN', 'This Marketplace deployment is no longer linked to the organization')
    }
    c.set('install', install)
    return next()
  })

  /**
   * An install with no signed license: an Azure Marketplace VM, entitled by its Marketplace plan. It is accepted once the
   * customer has claimed it in Beag Labs provisioning, which links the deployment id (the hash of the key it sent) to
   * an organization: the same organization id an organization license carries, so either way reaches the same accounts.
   */
  const marketplaceOwner = async (env: Bindings, deploymentId: string, origin: string) => {
    const managed = await deps.managedDeployment?.(env, deploymentId)
    if (!managed) throw new IdentityError('LICENSE_REQUIRED', 'This deployment has no signed license and is not a claimed Azure Marketplace deployment. Activate a license, or finish Marketplace onboarding at beaglabs.com.')
    if (managed.status === 'retired') throw new IdentityError('DEPLOYMENT_RETIRED', 'This Marketplace deployment is retired')
    if (managed.publicOrigin && new URL(managed.publicOrigin).origin !== origin) throw new IdentityError('ORIGIN_MISMATCH', 'The origin does not match the one recorded for this Marketplace deployment')
    return { ownerKey: `org:${managed.organizationId}`, licenseId: `marketplace:${deploymentId}`, expiresAt: null }
  }

  const accountFor = async (c: Context<Env>, mode: Mode) =>
    (await one<{ account_id: string }>(c, 'SELECT account_id FROM connect_accounts WHERE owner_key=? AND mode=?', [c.get('install').owner_key, mode]))?.account_id

  app.post('/v1/accounts', async c => {
    const body = await json(c)
    const mode = modeOf(body.mode)
    const existing = await accountFor(c, mode)
    if (existing) return c.json(await deps.gateway(c.env).accountStatus(mode, existing))
    const displayName = text(body.displayName, 'Display name', 100)
    const accountId = await deps.gateway(c.env).createAccount(mode, { displayName, contactEmail: optional(body.contactEmail, 254), supportUrl: optional(body.supportUrl, 500),
      statementDescriptor: optional(body.statementDescriptor, 22), metadata: { beag_owner: c.get('install').owner_key } })
    await db(c).execute({ sql: 'INSERT INTO connect_accounts(owner_key, mode, account_id, created_at) VALUES(?,?,?,?) ON CONFLICT(owner_key, mode) DO NOTHING', args: [c.get('install').owner_key, mode, accountId, now().toISOString()] })
    // A concurrent request may have created one first: use whichever was stored.
    return c.json(await deps.gateway(c.env).accountStatus(mode, (await accountFor(c, mode))!))
  })

  app.get('/v1/accounts', async c => {
    const mode = modeOf(c.req.query('mode'))
    const accountId = await accountFor(c, mode)
    return c.json({ account: accountId ? await deps.gateway(c.env).accountStatus(mode, accountId) : null })
  })

  app.post('/v1/accounts/link', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const accountId = await accountFor(c, mode)
    if (!accountId) throw new ApiError(409, 'NO_ACCOUNT', 'Create the account first')
    const url = await deps.gateway(c.env).onboardingLink(mode, accountId, ownUrl(install, body.refreshUrl), ownUrl(install, body.returnUrl))
    return c.json({ url })
  })

  app.post('/v1/checkout', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const accountId = await accountFor(c, mode)
    if (!accountId || body.accountId !== accountId) throw new ApiError(403, 'ACCOUNT_NOT_YOURS', 'That Stripe account does not belong to this license')
    const amount = Number(body.amount)
    if (!Number.isSafeInteger(amount) || amount < 50 || amount > 99_999_999) throw new ApiError(400, 'AMOUNT_INVALID', 'The amount is whole cents, at least 50')
    const currency = text(body.currency, 'Currency', 3).toLowerCase()
    if (currency !== 'usd') throw new ApiError(400, 'CURRENCY_UNSUPPORTED', 'Only USD is supported')
    const status = await deps.gateway(c.env).accountStatus(mode, accountId)
    if (!status.readyToProcessPayments) throw new ApiError(409, 'ACCOUNT_NOT_READY', 'The Stripe account cannot take payments yet')
    const metadata = Object.fromEntries(Object.entries((body.metadata ?? {}) as Record<string, unknown>).filter(([key, value]) => /^[\w.-]{1,40}$/.test(key) && typeof value === 'string').slice(0, 20).map(([key, value]) => [key, String(value).slice(0, 500)]))
    const session = await deps.gateway(c.env).checkout(mode, accountId, { amount, currency, name: text(body.name, 'Name', 200), description: optional(body.description, 500), reference: text(body.reference, 'Reference', 100),
      applicationFee: applicationFee(c.env, amount), successUrl: ownUrl(install, body.successUrl), cancelUrl: ownUrl(install, body.cancelUrl), customerEmail: optional(body.customerEmail, 254),
      metadata, bankAccounts: status.achDebitPayments === 'active' })
    return c.json({ url: session.url, sessionId: session.id })
  })

  app.post('/v1/refunds', async c => {
    const body = await json(c), mode = modeOf(body.mode)
    const accountId = await accountFor(c, mode)
    if (!accountId) throw new ApiError(409, 'NO_ACCOUNT', 'No Stripe account for this license')
    const intent = text(body.paymentIntentId, 'Payment', 100)
    // Retrieving it on the owner's account proves the payment is theirs.
    await deps.gateway(c.env).payment(mode, accountId, intent)
    const amount = body.amount === undefined ? undefined : Number(body.amount)
    if (amount !== undefined && (!Number.isSafeInteger(amount) || amount <= 0)) throw new ApiError(400, 'AMOUNT_INVALID', 'The refund amount is positive whole cents')
    return c.json(await deps.gateway(c.env).refund(mode, accountId, intent, amount, optional(body.reason, 500)))
  })

  // Plaid: bank account details from the account holder's own bank. Each call names the install's owner as the Plaid
  // user, and nothing is stored: the details go back once, signed, to the install that asked.
  const plaid = (c: Context<Env>) => { if (!deps.plaid) throw new ApiError(503, 'PLAID_UNAVAILABLE', 'Bank linking is not set up on this service'); return deps.plaid(c.env) }
  app.post('/v1/plaid/link-token', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const purpose = body.purpose === 'city' ? 'city' : 'payee'
    // Plaid's client user id: stable per owner and purpose, never anyone's name or email.
    const clientUserId = `${install.owner_key}:${purpose}:${typeof body.reference === 'string' ? body.reference.slice(0, 64) : 'setup'}`
    const result = await plaid(c).linkToken(mode, { clientUserId, clientName: optional(body.clientName, 30) ?? 'Papyrus' })
    console.log(JSON.stringify({ event: 'plaid.link_token', install: install.id, owner: install.owner_key, mode, purpose }))
    return c.json(result)
  })
  app.post('/v1/plaid/account', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const details = await plaid(c).accountDetails(mode, { publicToken: text(body.publicToken, 'Public token', 200), accountId: text(body.accountId, 'Account', 200),
      legalName: optional(body.legalName, 200), institutionName: optional(body.institutionName, 100) })
    console.log(JSON.stringify({ event: 'plaid.account', install: install.id, owner: install.owner_key, mode, tokenized: details.tokenized, nameMatch: details.nameMatch?.score ?? null }))
    return c.json(details)
  })

  // The Papyrus Payments plan, billed to the city's own Stripe account.
  app.get('/v1/plan', async c => {
    const mode = modeOf(c.req.query('mode'))
    const accountId = await accountFor(c, mode)
    return c.json({ plan: accountId ? await deps.gateway(c.env).plan(mode, accountId) ?? null : null, monthlyCents: planCents(c.env) })
  })
  app.post('/v1/plan/checkout', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const accountId = await accountFor(c, mode)
    if (!accountId) throw new ApiError(409, 'NO_ACCOUNT', 'Set up the city\'s Stripe account first')
    const current = await deps.gateway(c.env).plan(mode, accountId)
    if (current?.active) throw new ApiError(409, 'PLAN_ACTIVE', 'The plan is already active')
    return c.json(await deps.gateway(c.env).planCheckout(mode, accountId, { monthlyCents: planCents(c.env), successUrl: ownUrl(install, body.successUrl), cancelUrl: ownUrl(install, body.cancelUrl) }))
  })
  app.post('/v1/plan/portal', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const accountId = await accountFor(c, mode)
    if (!accountId) throw new ApiError(409, 'NO_ACCOUNT', 'Set up the city\'s Stripe account first')
    return c.json({ url: await deps.gateway(c.env).planPortal(mode, accountId, ownUrl(install, body.returnUrl)) })
  })

  app.get('/v1/payouts/:id/transactions', async c => {
    const mode = modeOf(c.req.query('mode'))
    const accountId = await accountFor(c, mode)
    if (!accountId) throw new ApiError(409, 'NO_ACCOUNT', 'No Stripe account for this license')
    return c.json({ transactions: await deps.gateway(c.env).payoutTransactions(mode, accountId, c.req.param('id')) })
  })

  app.get('/v1/events', async c => {
    const after = Number(c.req.query('after') ?? 0)
    const rows = (await db(c).execute({ sql: 'SELECT seq, payload FROM connect_events WHERE owner_key=? AND seq>? ORDER BY seq LIMIT 100', args: [c.get('install').owner_key, Number.isSafeInteger(after) ? after : 0] })).rows as unknown as Array<{ seq: number; payload: string }>
    return c.json({ events: rows.map(row => JSON.parse(row.payload) as ConnectEvent), ...(rows.length ? { cursor: String(rows.at(-1)!.seq) } : {}) })
  })

  // Stripe → Worker. Verified with the destination's signing secret, normalized, stored once, pushed to the owner's installs.
  app.post('/stripe/webhook/:mode/:kind', async c => {
    const mode = modeOf(c.req.param('mode')), kind = c.req.param('kind')
    if (kind !== 'snapshot' && kind !== 'thin') throw new ApiError(404, 'NOT_FOUND', 'Unknown destination')
    const raw = await c.req.text(), signature = c.req.header('stripe-signature') ?? ''
    let verified: VerifiedEvent
    try { verified = kind === 'thin' ? await deps.gateway(c.env).verifyThin(mode, raw, signature) : await deps.gateway(c.env).verifySnapshot(mode, raw, signature) }
    catch (error) { console.warn(JSON.stringify({ event: 'connect.webhook.rejected', mode, kind, error: error instanceof Error ? error.message : String(error) })); return c.json({ error: 'Signature check failed' }, 400) }
    if (!verified.account) return c.json({ received: true, ignored: 'platform event' })
    const owner = (await one<{ owner_key: string }>(c, 'SELECT owner_key FROM connect_accounts WHERE account_id=? AND mode=?', [verified.account, mode]))?.owner_key
    if (!owner) return c.json({ received: true, ignored: 'unknown account' })
    const event = await normalize(deps.gateway(c.env), mode, verified)
    if (!event) return c.json({ received: true, ignored: verified.type })
    const inserted = await db(c).execute({ sql: 'INSERT INTO connect_events(id, owner_key, mode, type, payload, created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING', args: [event.id, owner, mode, event.type, JSON.stringify(event), now().toISOString()] })
    if (inserted.rowsAffected) {
      const seq = (await one<{ seq: number }>(c, 'SELECT seq FROM connect_events WHERE id=?', [event.id]))!.seq
      const installs = (await db(c).execute({ sql: 'SELECT id FROM connect_installs WHERE owner_key=?', args: [owner] })).rows as unknown as Array<{ id: string }>
      await db(c).batch(installs.map(install => ({ sql: 'INSERT INTO connect_deliveries(event_seq, install_id, next_attempt_at) VALUES(?,?,?) ON CONFLICT DO NOTHING', args: [seq, install.id, now().toISOString()] })))
      c.executionCtx.waitUntil(deliverDue(c.env, deps, seq).catch(() => undefined))
    }
    return c.json({ received: true })
  })

  return app
}

/** Pushes due deliveries (one event, or everything due from the cron), with backoff; installs that never answer can poll. */
export async function deliverDue(env: Bindings, deps: AppDeps, seq?: number): Promise<number> {
  const db = deps.database(env), now = deps.now?.() ?? new Date()
  const due = (await db.execute({ sql: `SELECT d.event_seq, d.install_id, d.attempts, e.payload, i.origin, i.webhook_secret FROM connect_deliveries d JOIN connect_events e ON e.seq=d.event_seq
    JOIN connect_installs i ON i.id=d.install_id WHERE d.delivered_at IS NULL AND d.next_attempt_at<=? AND d.attempts<? ${seq ? 'AND d.event_seq=?' : ''} ORDER BY d.event_seq LIMIT 200`,
    args: [now.toISOString(), PUSH_SCHEDULE_MS.length, ...(seq ? [seq] : [])] })).rows as unknown as Array<{ event_seq: number; install_id: string; attempts: number; payload: string; origin: string; webhook_secret: string }>
  let delivered = 0
  for (const row of due) {
    const timestamp = String(Math.floor(now.getTime() / 1000))
    const signature = createHmac('sha256', row.webhook_secret).update(`${timestamp}.${row.payload}`).digest('hex')
    let status = 0, error = ''
    try {
      status = await (deps.push ?? defaultPush)(`${row.origin}/ledger/webhooks/stripe`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-beag-timestamp': timestamp, 'x-beag-signature': signature }, body: row.payload })
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause) }
    const ok = status >= 200 && status < 300
    const attempts = row.attempts + 1
    await db.execute({ sql: 'UPDATE connect_deliveries SET delivered_at=?, attempts=?, next_attempt_at=?, last_error=? WHERE event_seq=? AND install_id=?',
      args: [ok ? now.toISOString() : null, attempts, new Date(now.getTime() + (PUSH_SCHEDULE_MS[attempts] ?? PUSH_SCHEDULE_MS.at(-1)!)).toISOString(), ok ? null : (error || `HTTP ${status}`).slice(0, 300), row.event_seq, row.install_id] })
    if (ok) delivered++
  }
  return delivered
}

const defaultPush = async (url: string, init: RequestInit) => (await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) })).status

/** Turns a Stripe event into what Papyrus reads: the money details it needs, nothing else. */
export async function normalize(gateway: StripeGateway, mode: Mode, event: VerifiedEvent): Promise<ConnectEvent | undefined> {
  const base = { id: event.id, type: event.type, mode, account: event.account!, created: event.created }
  const object = event.object ?? {}
  const str = (value: unknown) => typeof value === 'string' ? value : undefined
  if (event.type.startsWith('v2.')) return { ...base, data: {} }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded' || event.type === 'checkout.session.async_payment_failed') {
    const intentId = str(object.payment_intent)
    if (!intentId) return undefined
    const payment = await gateway.payment(mode, event.account!, intentId)
    return { ...base, data: { checkoutSessionId: str(object.id), paymentIntentId: intentId, chargeId: payment.chargeId, paymentStatus: str(object.payment_status), amount: payment.amount, currency: payment.currency,
      stripeFee: payment.stripeFee, applicationFee: payment.applicationFee, method: payment.method, last4: payment.last4, metadata: payment.metadata } }
  }
  if (event.type === 'charge.refunded') return { ...base, data: { paymentIntentId: str(object.payment_intent), chargeId: str(object.id), refundedAmount: object.amount_refunded } }
  if (event.type === 'charge.dispute.created' || event.type === 'charge.dispute.closed') return { ...base, data: { paymentIntentId: str(object.payment_intent), disputeId: str(object.id), disputeStatus: str(object.status), disputeAmount: object.amount } }
  if (event.type === 'payout.paid' || event.type === 'payout.failed') {
    const arrival = typeof object.arrival_date === 'number' ? new Date(object.arrival_date * 1000).toISOString().slice(0, 10) : undefined
    return { ...base, data: { payoutId: str(object.id), payoutStatus: str(object.status), amount: object.amount, ...(arrival ? { arrivalDate: arrival } : {}) } }
  }
  return undefined
}

function checkOrigin(env: Bindings, value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(400, 'ORIGIN_REQUIRED', 'The install origin is required')
  let url: URL
  try { url = new URL(value) } catch { throw new ApiError(400, 'ORIGIN_INVALID', 'The install origin is not a URL') }
  const local = env.ALLOW_LOCALHOST_ORIGINS === 'true' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !local) || url.pathname !== '/' || url.search || url.hash || url.username) throw new ApiError(400, 'ORIGIN_INVALID', `The install origin must be an https origin, like https://papyrus.city.gov (got ${url.origin})`)
  return url.origin
}
/** Return and redirect URLs must point back at the install that asked, so links cannot send payers or owners elsewhere. */
function ownUrl(install: Install, value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(400, 'URL_REQUIRED', 'Return URLs are required')
  let url: URL
  try { url = new URL(value) } catch { throw new ApiError(400, 'URL_INVALID', 'Not a URL') }
  if (url.origin !== install.origin) throw new ApiError(400, 'URL_NOT_OWN', 'Return URLs must be on the install\'s own origin')
  return value
}
export function planCents(env: Bindings): number {
  const cents = Number(env.PLAN_MONTHLY_CENTS ?? 250_000)
  return Number.isSafeInteger(cents) && cents >= 100 ? cents : 250_000
}
export function applicationFee(env: Bindings, amount: number): number {
  const bps = Number(env.APPLICATION_FEE_BPS ?? 0), fixed = Number(env.APPLICATION_FEE_FIXED_CENTS ?? 0)
  const fee = Math.round(amount * (Number.isFinite(bps) ? bps : 0) / 10_000) + (Number.isFinite(fixed) ? fixed : 0)
  return Math.max(0, Math.min(fee, amount - 1))
}
const modeOf = (value: unknown): Mode => { if (!MODES.includes(value as Mode)) throw new ApiError(400, 'MODE_INVALID', 'mode is test or live'); return value as Mode }
const text = (value: unknown, name: string, max: number) => { if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, 'INPUT_INVALID', `${name} is required (up to ${max} characters)`); return value.trim() }
const optional = (value: unknown, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined
const json = async (c: Context<Env>) => await c.req.json().catch(() => ({})) as Record<string, unknown>
