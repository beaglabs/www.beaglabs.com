import * as Effect from 'effect/Effect'
import { enqueueCreditLead } from './linear'
import * as Stripe from '@distilled.cloud/stripe'
import { CreateBillingCreditGrant, CreateCustomer, GetCheckoutSession, GetSubscription, GetBillingCreditGrants } from '@distilled.cloud/stripe/stripe'
import { decryptJson, encryptJson, randomToken, sha256Hex } from './crypto'
import { Env, UserError, first, newId, nowIso, run, type Account } from './services'
import { stripeLayer } from './billing'
import { catalogPrices } from './catalog'

export const COMPUTE_CREDIT_USD = 1000
interface Offer { email: string; code_hash: string; code_ciphertext: string; reserved_deployment_id: string | null; redeemed_deployment_id: string | null; stripe_customer_id: string | null; stripe_grant_id: string | null; stripe_session_id: string | null }
const normalize = (email: string) => email.trim().toLowerCase()
const stripeError = (cause: unknown) => new UserError({ message: `Stripe compute credit: ${(cause as { message?: string })?.message ?? 'request failed'}`, status: 502 })

/** A code is email-bound: possession alone cannot redeem it for another account. */
export const requestComputeCredit = (email: string) => Effect.gen(function* () {
  const normalized = normalize(email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) return yield* new UserError({ message: 'Enter a valid work email.', status: 400 })
  const env = yield* Env
  const code = `PAPYRUS-${randomToken(18)}`
  yield* run('INSERT OR IGNORE INTO compute_credit_offers (email, code_hash, code_ciphertext, issued_at) VALUES (?, ?, ?, ?)', normalized, yield* sha256Hex(code), yield* encryptJson(env.CREDENTIALS_KEY, `credit:${normalized}`, { code }), nowIso())
  const offer = (yield* first<Offer>('SELECT * FROM compute_credit_offers WHERE email = ?', normalized))!
  yield* enqueueCreditLead(normalized)
  if (offer.redeemed_deployment_id) return { redeemed: true, code: null, redeemUrl: `${env.BASE_URL}/billing` }
  const stored = yield* decryptJson<{ code: string }>(env.CREDENTIALS_KEY, `credit:${normalized}`, offer.code_ciphertext)
  return { redeemed: false, code: stored.code, redeemUrl: `${env.BASE_URL}/credits/redeem?code=${encodeURIComponent(stored.code)}` }
})

export const accountCredit = (account: Account) => Effect.gen(function* () {
  const offer = yield* first<Offer>('SELECT * FROM compute_credit_offers WHERE email = ?', normalize(account.email))
  if (!offer) return null
  const env = yield* Env
  const stored = offer.redeemed_deployment_id ? null : yield* decryptJson<{ code: string }>(env.CREDENTIALS_KEY, `credit:${offer.email}`, offer.code_ciphertext)
  return { amount: COMPUTE_CREDIT_USD, code: stored?.code ?? null, deploymentId: offer.redeemed_deployment_id, grantId: offer.stripe_grant_id }
})

/** Reserve an exclusive deployment/customer for the offer. Stripe idempotency handles concurrent form submissions. */
export const reserveComputeCredit = (account: Account, code: string, existingId?: string, existingCustomerId?: string | null) => Effect.gen(function* () {
  const hash = yield* sha256Hex(code.trim())
  const offer = yield* first<Offer>('SELECT * FROM compute_credit_offers WHERE code_hash = ? AND email = ?', hash, normalize(account.email))
  if (!offer) return yield* new UserError({ message: 'That credit code does not belong to your verified email.', status: 400 })
  if (offer.redeemed_deployment_id) return yield* new UserError({ message: 'This credit has already been redeemed for one deployment.', status: 409 })
  let id = existingId ?? offer.reserved_deployment_id ?? newId('dep')
  yield* run('UPDATE compute_credit_offers SET reserved_deployment_id = ? WHERE code_hash = ? AND reserved_deployment_id IS NULL', id, hash)
  const reserved = (yield* first<Offer>('SELECT * FROM compute_credit_offers WHERE code_hash = ?', hash))!
  if (!existingId) id = reserved.reserved_deployment_id!
  if (reserved.reserved_deployment_id !== id) return yield* new UserError({ message: 'This credit is reserved for a different deployment.', status: 409 })
  const env = yield* Env
  let customerId = reserved.stripe_customer_id ?? existingCustomerId
  if (existingCustomerId && reserved.stripe_customer_id && existingCustomerId !== reserved.stripe_customer_id) return yield* new UserError({message:'Credit is reserved for a different subscription.',status:409})
  if (customerId && !reserved.stripe_customer_id) yield* run('UPDATE compute_credit_offers SET stripe_customer_id = ? WHERE code_hash = ?', customerId, hash)
  if (!customerId) {
    const customer = yield* CreateCustomer({ email: account.email, metadata: { account_id: account.id, deployment_id: id, compute_credit_offer: hash } }).pipe(Stripe.withRequestOptions({ idempotencyKey: `papyrus-credit-customer:${hash}` }), Effect.provide(stripeLayer(env)), Effect.mapError(stripeError))
    customerId = customer.id
    yield* run('UPDATE compute_credit_offers SET stripe_customer_id = ? WHERE code_hash = ?', customerId, hash)
  }
  if (reserved.stripe_session_id) {
    const session = yield* GetCheckoutSession({ session: reserved.stripe_session_id }).pipe(Effect.provide(stripeLayer(env)), Effect.mapError(stripeError))
    if (session.status === 'open' && session.url) return { id, stripe_customer_id: customerId, hash, checkoutUrl: session.url, key: '' }
    if (session.status === 'complete') return { id, stripe_customer_id: customerId, hash, checkoutUrl: `${env.BASE_URL}/billing/complete?session_id=${encodeURIComponent(session.id)}`, key: '' }
  }
  return { id, stripe_customer_id: customerId, hash, checkoutUrl: null, key: `papyrus-credit-checkout:${hash}:${reserved.stripe_session_id ?? 'first'}` }
})

export const linkCreditCheckout = (hash: string, sessionId: string) => run('UPDATE compute_credit_offers SET stripe_session_id = ? WHERE code_hash = ?', sessionId, hash)

/** The grant is scoped to the deployment's exclusive Stripe customer and its two metered prices. */
export const redeemComputeCredit = (accountId: string, deploymentId: string, customerId: string) => Effect.gen(function* () {
  const offer = yield* first<Offer>('SELECT * FROM compute_credit_offers WHERE reserved_deployment_id = ?', deploymentId)
  if (!offer) return null
  const owner = yield* first<{ email: string }>('SELECT email FROM accounts WHERE id = ?', accountId)
  if (!owner || normalize(owner.email) !== offer.email || offer.stripe_customer_id !== customerId || (offer.redeemed_deployment_id && offer.redeemed_deployment_id !== deploymentId)) return yield* new UserError({ message: 'Credit ownership does not match this deployment.', status: 403 })
  if (offer.stripe_grant_id) return offer.stripe_grant_id
  const env = yield* Env
  // Recover a grant if Stripe succeeded but the database write failed, including after Stripe's idempotency window.
  let cursor: string | undefined
  do {
    const grants = yield* GetBillingCreditGrants({customer:customerId,limit:100,...(cursor?{starting_after:cursor}:{})}).pipe(Effect.provide(stripeLayer(env)),Effect.mapError(stripeError))
    const existing = grants.data.find(grant => grant.metadata?.code_hash === offer.code_hash && grant.metadata?.deployment_id === deploymentId)
    if (existing) {
      yield* run('UPDATE compute_credit_offers SET redeemed_deployment_id = ?, stripe_grant_id = ?, redeemed_at = ? WHERE code_hash = ?',deploymentId,existing.id,nowIso(),offer.code_hash)
      return existing.id
    }
    cursor = grants.has_more ? grants.data.at(-1)?.id : undefined
  } while(cursor)
  const prices = yield* catalogPrices()
  const deployment = yield* first<{stripe_subscription_id:string|null}>('SELECT stripe_subscription_id FROM deployments WHERE id = ?', deploymentId)
  let eligible = [prices.compute, prices.execution]
  if (deployment?.stripe_subscription_id) {
    const subscription = yield* GetSubscription({subscription_exposed_id:deployment.stripe_subscription_id}).pipe(Effect.provide(stripeLayer(env)),Effect.mapError(stripeError))
    eligible = subscription.items.data.filter(item => item.price.recurring?.usage_type === 'metered').map(item => item.price.id)
    if (!eligible.length) return yield* new UserError({message:'This subscription has no eligible metered compute prices.',status:409})
  }
  const grant = yield* CreateBillingCreditGrant({ customer: customerId, name: '$1,000 Papyrus compute credit', category: 'promotional', amount: { type: 'monetary', monetary: { currency: 'usd', value: COMPUTE_CREDIT_USD * 100 } }, applicability_config: { scope: { prices: eligible.map(id => ({id})) } }, metadata: { account_id: accountId, deployment_id: deploymentId, offer: 'homepage_compute_credit', code_hash: offer.code_hash } }).pipe(Stripe.withRequestOptions({ idempotencyKey: `papyrus-credit-grant:${offer.code_hash}` }), Effect.provide(stripeLayer(env)), Effect.mapError(stripeError))
  yield* run('UPDATE compute_credit_offers SET redeemed_deployment_id = ?, stripe_grant_id = ?, redeemed_at = ? WHERE code_hash = ?', deploymentId, grant.id, nowIso(), offer.code_hash)
  return grant.id
})
