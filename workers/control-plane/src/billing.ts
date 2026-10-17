import * as Stripe from '@distilled.cloud/stripe'
import { CreateBillingPortalSession, CreateCheckoutSession } from '@distilled.cloud/stripe/stripe'
import { constructEvent, type StripeEvent } from '@distilled.cloud/stripe/Webhooks'
import * as Effect from 'effect/Effect'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import { Env, UserError, first, nowIso, run, type Account, type BillingState, type Deployment } from './services'

/** One plan: $13,000/month flat per deployment, unlimited users, 14-day free trial, card collected at signup. */
export const PLAN = { amountCents: 1_300_000, currency: 'usd', interval: 'month', trialDays: 14, name: 'Papyrus deployment' } as const

/** Stripe subscription status → the deployment's billing state. */
export const billingStateFor = (status: string | null | undefined): Exclude<BillingState, 'none'> =>
  status === 'trialing' || status === 'active' ? 'active' : 'suspended'

export const stripeLayer = (env: { STRIPE_SECRET_KEY: string }) =>
  Layer.mergeAll(Stripe.credentials({ apiKey: Redacted.make(env.STRIPE_SECRET_KEY) }), FetchHttpClient.layer)

const stripeFailure = (cause: unknown) => new UserError({ message: `Stripe: ${cause instanceof Error ? cause.message : 'request failed'}`, status: 502 })

/** Start (or restart) the subscription for one deployment through Stripe Checkout. Returns the Checkout URL. */
export const startCheckout = (account: Account, deployment: Deployment) =>
  Effect.gen(function* () {
    const env = yield* Env
    const lineItem = env.STRIPE_PRICE_ID
      ? { price: env.STRIPE_PRICE_ID, quantity: 1 }
      : {
          quantity: 1,
          price_data: { currency: PLAN.currency, unit_amount: PLAN.amountCents, recurring: { interval: PLAN.interval }, product_data: { name: PLAN.name } },
        }
    const session = yield* CreateCheckoutSession({
      mode: 'subscription',
      client_reference_id: deployment.id,
      ...(deployment.stripe_customer_id ? { customer: deployment.stripe_customer_id } : { customer_email: account.email }),
      payment_method_collection: 'always',
      line_items: [lineItem],
      subscription_data: { trial_period_days: PLAN.trialDays, metadata: { deployment_id: deployment.id, account_id: account.id } },
      metadata: { deployment_id: deployment.id },
      success_url: `${env.BASE_URL}/provision?deployment=${deployment.id}`,
      cancel_url: `${env.BASE_URL}/billing`,
    }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeFailure))
    if (!session.url) return yield* new UserError({ message: 'Stripe did not return a Checkout URL', status: 502 })
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

interface SubscriptionObject {
  id: string
  status: string
  customer: string | { id: string }
  metadata?: Record<string, string>
}

interface CheckoutObject {
  client_reference_id?: string | null
  customer?: string | { id: string } | null
  subscription?: string | { id: string } | null
  metadata?: Record<string, string>
}

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === 'string' ? value : value?.id ?? null)

/** What a webhook event changes, if anything. Pure, so the mapping is testable without a database. */
export type BillingUpdate =
  | { kind: 'link'; deploymentId: string; customerId: string | null; subscriptionId: string | null }
  | { kind: 'status'; deploymentId: string | null; subscriptionId: string; customerId: string | null; stripeStatus: string; billingState: 'active' | 'suspended' }
  | { kind: 'ignore' }

export const billingUpdateFor = (event: StripeEvent): BillingUpdate => {
  const object = (event.data as { object?: unknown } | undefined)?.object
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = object as CheckoutObject
      const deploymentId = session.client_reference_id ?? session.metadata?.deployment_id
      if (!deploymentId) return { kind: 'ignore' }
      return { kind: 'link', deploymentId, customerId: idOf(session.customer), subscriptionId: idOf(session.subscription) }
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

export const applyBillingUpdate = (update: BillingUpdate) =>
  Effect.gen(function* () {
    if (update.kind === 'ignore') return
    if (update.kind === 'link') {
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
    if (!deploymentId) return
    yield* run(
      'UPDATE deployments SET stripe_subscription_id = ?, stripe_customer_id = COALESCE(?, stripe_customer_id), stripe_status = ?, billing_state = ?, updated_at = ? WHERE id = ?',
      update.subscriptionId,
      update.customerId,
      update.stripeStatus,
      update.billingState,
      nowIso(),
      deploymentId,
    )
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
