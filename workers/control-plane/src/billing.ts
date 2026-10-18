import * as Stripe from '@distilled.cloud/stripe'
import { CreateBillingPortalSession, CreateCheckoutSession, DeleteSubscription, GetCheckoutSession, GetSubscription } from '@distilled.cloud/stripe/stripe'
import { constructEvent, type StripeEvent } from '@distilled.cloud/stripe/Webhooks'
import * as Effect from 'effect/Effect'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import { logEvent } from './events'
import { PLATFORM_MONTHLY_USD, TRIAL_DAYS } from './pricing'
import { initialSteps } from './setup'
import { Env, UserError, first, newId, nowIso, run, type Account, type BillingState, type Deployment } from './services'

/**
 * One subscription per deployment, three items on one Stripe product: the $250/month platform price (licensed) and two
 * metered prices (VM hours, agent-seconds) fed by Billing Meter events (src/metering.ts). 14-day trial, card at signup.
 */
export const checkoutLineItems = (env: { STRIPE_PRICE_PLATFORM: string; STRIPE_PRICE_COMPUTE: string; STRIPE_PRICE_EXECUTION: string }) => [
  { price: env.STRIPE_PRICE_PLATFORM, quantity: 1 },
  // Metered prices take no quantity: usage comes from meter events.
  { price: env.STRIPE_PRICE_COMPUTE },
  { price: env.STRIPE_PRICE_EXECUTION },
]

/** Stripe subscription status → the deployment's billing state. */
export const billingStateFor = (status: string | null | undefined): Exclude<BillingState, 'none'> =>
  status === 'trialing' || status === 'active' ? 'active' : 'suspended'

export const stripeLayer = (env: { STRIPE_SECRET_KEY: string }) =>
  Layer.mergeAll(Stripe.credentials({ apiKey: Redacted.make(env.STRIPE_SECRET_KEY) }), FetchHttpClient.layer)

const stripeFailure = (cause: unknown) => new UserError({ message: `Stripe: ${cause instanceof Error ? cause.message : 'request failed'}`, status: 502 })

/** Start (or restart) the subscription for one deployment through Stripe Checkout. Returns the Checkout URL. */
export const startCheckout = (account: Account, existing?: Pick<Deployment, 'id' | 'stripe_customer_id'>) =>
  Effect.gen(function* () {
    const env = yield* Env
    const deployment = existing ?? { id: newId('dep'), stripe_customer_id: null }
    yield* pruneCheckoutIntents()
    const session = yield* CreateCheckoutSession({
      mode: 'subscription',
      client_reference_id: deployment.id,
      ...(deployment.stripe_customer_id ? { customer: deployment.stripe_customer_id } : { customer_email: account.email }),
      payment_method_collection: 'always',
      billing_address_collection: 'required',
      line_items: checkoutLineItems(env),
      subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { deployment_id: deployment.id, account_id: account.id } },
      metadata: { deployment_id: deployment.id, account_id: account.id },
      success_url: `${env.BASE_URL}/billing/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BASE_URL}/billing`,
    }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))
    if (!session.url || !session.id) return yield* new UserError({ message: 'Stripe did not return a Checkout URL', status: 502 })
    yield* run('INSERT INTO checkout_intents (stripe_session_id, deployment_id, account_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)', session.id, deployment.id, account.id, nowIso(), new Date(Date.now() + 7 * 86_400_000).toISOString())
    return session.url
  })

/** Stripe customer portal for cards and invoices. */
export const portalUrl = (deployment: Deployment) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (!deployment.stripe_customer_id) return yield* new UserError({ message: 'No subscription yet for this deployment', status: 400 })
    const session = yield* CreateBillingPortalSession({ customer: deployment.stripe_customer_id, return_url: `${env.BASE_URL}/billing` }).pipe(
      Effect.provide(stripeLayer(env)),
      Effect.mapError(stripeFailure),
    )
    return session.url
  })

/**
 * Delete a deployment: cancel its subscription now (one subscription per deployment, so the whole subscription goes).
 * `prorate` credits the unused part of the platform fee; `invoice_now` bills un-invoiced metered usage with that
 * credit on a final invoice. Already canceled (or gone) counts as done.
 */
export const cancelSubscription = (deployment: Pick<Deployment, 'stripe_subscription_id' | 'stripe_status'>) =>
  Effect.gen(function* () {
    if (!deployment.stripe_subscription_id || deployment.stripe_status === 'canceled') return 'none' as const
    const env = yield* Env
    yield* DeleteSubscription({ subscription_exposed_id: deployment.stripe_subscription_id, prorate: true, invoice_now: true }).pipe(
      Effect.provide(stripeLayer(env)),
      Effect.asVoid,
      Effect.catch((cause) => {
        const text = `${(cause as { _tag?: string })?._tag ?? ''} ${(cause as { message?: string })?.message ?? ''}`
        return /No such subscription|already (been )?cancel|canceled subscription/i.test(text) ? Effect.void : Effect.fail(stripeFailure(cause))
      }),
    )
    return 'canceled' as const
  })

interface SubscriptionObject {
  id: string
  status: string
  customer: string | { id: string }
  metadata?: Record<string, string>
  trial_end?: number | null
}

interface CheckoutObject {
  id?: string
  status?: string | null
  mode?: string | null
  payment_status?: string | null
  client_reference_id?: string | null
  customer?: string | { id: string } | null
  subscription?: string | { id: string } | null
  metadata?: Record<string, string | undefined> | null
}

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === 'string' ? value : value?.id ?? null)

/** What a webhook event changes, if anything. Pure, so the mapping is testable without a database. */
export type BillingUpdate =
  | { kind: 'link'; deploymentId: string; customerId: string | null; subscriptionId: string | null; session: CheckoutObject }
  | {
      kind: 'status'
      eventType: string
      deploymentId: string | null
      subscriptionId: string
      customerId: string | null
      stripeStatus: string
      billingState: 'active' | 'suspended'
      /** ISO time the trial ends, when Stripe says. */
      trialEnd: string | null
    }
  | { kind: 'ignore' }

export const billingUpdateFor = (event: StripeEvent): BillingUpdate => {
  const object = (event.data as { object?: unknown } | undefined)?.object
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = object as CheckoutObject
      const deploymentId = session.client_reference_id ?? session.metadata?.deployment_id
      if (!deploymentId) return { kind: 'ignore' }
      return { kind: 'link', deploymentId, customerId: idOf(session.customer), subscriptionId: idOf(session.subscription), session }
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed': {
      const subscription = object as SubscriptionObject
      const stripeStatus = event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status
      return {
        kind: 'status',
        eventType: event.type,
        trialEnd: typeof subscription.trial_end === 'number' ? new Date(subscription.trial_end * 1000).toISOString() : null,
        deploymentId: subscription.metadata?.deployment_id ?? null,
        subscriptionId: subscription.id,
        customerId: idOf(subscription.customer),
        stripeStatus,
        billingState: billingStateFor(stripeStatus),
      }
    }
    default:
      return { kind: 'ignore' }
  }
}

/** Abandoned checkouts expire without ever appearing in the deployment list. */
export const pruneCheckoutIntents = () => run('DELETE FROM checkout_intents WHERE expires_at < ?', nowIso())

interface CheckoutIntent { stripe_session_id: string; deployment_id: string; account_id: string }

/** Both the signed webhook and the return page use the same idempotent completion path. */
const completeCheckoutSession = (session: CheckoutObject, intent: CheckoutIntent) =>
  Effect.gen(function* () {
    const customerId = idOf(session.customer)
    const subscriptionId = idOf(session.subscription)
    if (session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status ?? '') || session.mode !== 'subscription' || session.client_reference_id !== intent.deployment_id || !customerId || !subscriptionId)
      return yield* new UserError({ message: 'Complete billing setup in Stripe before creating a deployment.', status: 409 })
    const env = yield* Env
    // Read current Stripe state: subscription webhooks may arrive before Checkout completion, or out of order.
    const subscription = yield* GetSubscription({ subscription_exposed_id: subscriptionId }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))
    if (subscription.metadata?.deployment_id !== intent.deployment_id || subscription.metadata?.account_id !== intent.account_id || idOf(subscription.customer) !== customerId)
      return yield* new UserError({ message: 'Checkout does not match this account.', status: 403 })
    const existing = yield* first<{ account_id: string }>('SELECT account_id FROM deployments WHERE id = ?', intent.deployment_id)
    if (existing && existing.account_id !== intent.account_id) return yield* new UserError({ message: 'Checkout does not match this account.', status: 403 })
    const lifecycle = yield* first<{ state: string }>('SELECT state FROM deployment_lifecycle WHERE deployment_id = ?', intent.deployment_id)
    if (lifecycle?.state === 'deleted' || lifecycle?.state === 'deleting') {
      yield* cancelSubscription({ stripe_subscription_id: subscriptionId, stripe_status: subscription.status })
      return intent.deployment_id
    }
    if (subscription.status !== 'trialing' && subscription.status !== 'active') return yield* new UserError({ message: 'Billing setup is not active yet. Finish checkout or try again shortly.', status: 409 })
    const created = yield* run('INSERT OR IGNORE INTO deployments (id, account_id, steps, stripe_customer_id, stripe_subscription_id, stripe_status, billing_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', intent.deployment_id, intent.account_id, JSON.stringify(initialSteps()), customerId, subscriptionId, subscription.status, 'active', nowIso(), nowIso())
    if (!created) yield* run("UPDATE deployments SET stripe_customer_id = ?, stripe_subscription_id = ?, stripe_status = ?, billing_state = 'active', updated_at = ? WHERE id = ? AND account_id = ?", customerId, subscriptionId, subscription.status, nowIso(), intent.deployment_id, intent.account_id)
    if (typeof subscription.trial_end === 'number') yield* saveTrialEnd(intent.deployment_id, new Date(subscription.trial_end * 1000).toISOString())
    if (created) yield* logEvent({ accountId: intent.account_id, deploymentId: intent.deployment_id, level: 'ok', source: 'billing', message: 'Billing setup completed · deployment created' })
    return intent.deployment_id
  })

/** A success URL is not proof of payment: read the session from Stripe and verify its stored owner. */
export const completeCheckoutForAccount = (account: Account, sessionId: string) =>
  Effect.gen(function* () {
    const intent = yield* first<CheckoutIntent>('SELECT stripe_session_id, deployment_id, account_id FROM checkout_intents WHERE stripe_session_id = ? AND account_id = ?', sessionId, account.id)
    if (!intent) return yield* new UserError({ message: 'Checkout not found for this account.', status: 404 })
    const env = yield* Env
    const session = yield* GetCheckoutSession({ session: sessionId }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))
    return yield* completeCheckoutSession(session, intent)
  })

const price = `$${PLATFORM_MONTHLY_USD}/month platform + usage`

/** "Oct 31" (UTC). */
export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''

const DAY_MS = 86_400_000

/** Whole days until the trial ends, rounded up; 0 once it has ended. Null when the end is unknown. */
export const trialDaysLeft = (trialEnd: string | null | undefined, now = Date.now()) => {
  const end = Date.parse(trialEnd ?? '')
  return Number.isNaN(end) ? null : Math.max(0, Math.ceil((end - now) / DAY_MS))
}

/** "Trial · 12 days left · ends Oct 31" (or "Trial" while Stripe has not said when it ends). */
export const trialStatus = (trialEnd: string | null | undefined, now = Date.now()) => {
  const days = trialDaysLeft(trialEnd, now)
  if (days === null) return 'Trial'
  if (days === 0) return `Trial · ends today`
  return `Trial · ${days} day${days === 1 ? '' : 's'} left · ends ${shortDate(trialEnd)}`
}

/** A deployment whose subscription is in its free trial. */
export const isTrialing = (deployment: Pick<Deployment, 'billing_state' | 'stripe_status'>) => deployment.billing_state === 'active' && deployment.stripe_status === 'trialing'

const saveTrialEnd = (deploymentId: string, trialEnd: string) =>
  run(
    'INSERT INTO billing_periods (deployment_id, trial_end, updated_at) VALUES (?, ?, ?) ON CONFLICT(deployment_id) DO UPDATE SET trial_end = excluded.trial_end, updated_at = excluded.updated_at',
    deploymentId,
    trialEnd,
    nowIso(),
  )

/**
 * Trial ends normally arrive with customer.subscription.* webhooks. For a trialing deployment that has none stored
 * (e.g. subscribed before trial_end was recorded), read the subscription from Stripe once and store it. Best effort.
 */
export const backfillTrialEnds = (deployments: Deployment[]) =>
  Effect.gen(function* () {
    const missing = deployments.filter((d) => isTrialing(d) && !d.trial_end && d.stripe_subscription_id)
    if (!missing.length) return
    const env = yield* Env
    for (const deployment of missing) {
      const subscription = yield* GetSubscription({ subscription_exposed_id: deployment.stripe_subscription_id! }).pipe(Effect.provide(stripeLayer(env)), Effect.orElseSucceed(() => null))
      const trialEnd = (subscription as { trial_end?: number | null } | null)?.trial_end
      if (typeof trialEnd !== 'number') continue
      deployment.trial_end = new Date(trialEnd * 1000).toISOString()
      yield* saveTrialEnd(deployment.id, deployment.trial_end).pipe(Effect.ignore)
    }
  })

/** The earliest trial end among an account's trialing deployments, for the trial banner; null when none is trialing. */
export const accountTrial = (deployments: Deployment[]) => {
  const trialing = deployments.filter(isTrialing)
  if (!trialing.length) return null
  const ends = trialing.map((d) => d.trial_end).filter((end): end is string => Boolean(end)).sort()
  return { trialEnd: ends[0] ?? null }
}

/** The Activity line for a subscription change. Never includes Stripe ids beyond what the customer already sees. */
export const billingEventFor = (update: Extract<BillingUpdate, { kind: 'status' }>) => {
  const level = update.billingState === 'active' ? ('ok' as const) : ('error' as const)
  if (update.stripeStatus === 'trialing')
    return { level, message: update.eventType === 'customer.subscription.created' ? `Trial started · Papyrus · ${price} after ${shortDate(update.trialEnd) || 'the trial'}` : `Trial · ends ${shortDate(update.trialEnd) || 'soon'}` }
  if (update.stripeStatus === 'active') return { level, message: `Subscription active · Papyrus · ${price}` }
  if (update.stripeStatus === 'canceled') return { level, message: 'Subscription canceled · deployment suspended' }
  return { level, message: `Subscription ${update.stripeStatus.replace(/_/g, ' ')} · deployment suspended until payment is fixed` }
}

const accountOf = (deploymentId: string) => first<{ account_id: string }>('SELECT account_id FROM deployments WHERE id = ?', deploymentId).pipe(Effect.map((row) => row?.account_id ?? null))

export const applyBillingUpdate = (update: BillingUpdate) =>
  Effect.gen(function* () {
    if (update.kind === 'ignore') return
    if (update.kind === 'link') {
      const intent = update.session.id ? yield* first<CheckoutIntent>('SELECT stripe_session_id, deployment_id, account_id FROM checkout_intents WHERE stripe_session_id = ?', update.session.id) : null
      if (intent) {
        const env = yield* Env
        const session = yield* GetCheckoutSession({ session: intent.stripe_session_id }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))
        if (session.payment_status === 'unpaid') return
        yield* completeCheckoutSession(session, intent)
        return
      }
      // Legacy Checkouts already have a deployment row. Never create one from unrecognized metadata.
      const accountId = yield* accountOf(update.deploymentId)
      if (accountId) yield* logEvent({ accountId, deploymentId: update.deploymentId, level: 'info', source: 'billing', message: 'Checkout completed · card on file' })
      yield* run(
        'UPDATE deployments SET stripe_customer_id = COALESCE(?, stripe_customer_id), stripe_subscription_id = COALESCE(?, stripe_subscription_id), updated_at = ? WHERE id = ?',
        update.customerId,
        update.subscriptionId,
        nowIso(),
        update.deploymentId,
      )
      return
    }
    const deploymentId =
      update.deploymentId ?? (yield* first<{ id: string }>('SELECT id FROM deployments WHERE stripe_subscription_id = ?', update.subscriptionId))?.id
    if (!deploymentId || !(yield* accountOf(deploymentId))) return
    yield* run(
      'UPDATE deployments SET stripe_subscription_id = ?, stripe_customer_id = COALESCE(?, stripe_customer_id), stripe_status = ?, billing_state = ?, updated_at = ? WHERE id = ?',
      update.subscriptionId,
      update.customerId,
      update.stripeStatus,
      update.billingState,
      nowIso(),
      deploymentId,
    )
    if (update.trialEnd) yield* saveTrialEnd(deploymentId, update.trialEnd)
    const accountId = yield* accountOf(deploymentId)
    // A deleted deployment's subscription was canceled on purpose: not a suspension.
    const lifecycle = yield* first<{ state: string }>('SELECT state FROM deployment_lifecycle WHERE deployment_id = ?', deploymentId)
    const deleting = lifecycle?.state === 'deleting' || lifecycle?.state === 'deleted'
    const line = deleting && update.stripeStatus === 'canceled' ? { level: 'info' as const, message: 'Subscription canceled · deployment deleted' } : billingEventFor(update)
    if (accountId) yield* logEvent({ accountId, deploymentId, source: 'billing', ...line })
  })

/** POST /api/stripe/webhook: verify the signature over the raw body, apply each event once. */
export const handleWebhook = (rawBody: string, signature: string | null) =>
  Effect.gen(function* () {
    const env = yield* Env
    const event = yield* constructEvent({ payload: rawBody, signature, secret: Redacted.make(env.STRIPE_WEBHOOK_SECRET) }).pipe(
      Effect.mapError(() => new UserError({ message: 'Invalid Stripe signature', status: 400 })),
    )
    if (event.id && (yield* first('SELECT id FROM stripe_events WHERE id = ?', event.id))) return { received: true, duplicate: true }
    yield* applyBillingUpdate(billingUpdateFor(event))
    // Recorded after applying, so a failed apply is retried by Stripe instead of being dropped.
    if (event.id) yield* run('INSERT OR IGNORE INTO stripe_events (id, received_at) VALUES (?, ?)', event.id, nowIso())
    return { received: true, duplicate: false }
  })
