import Stripe from 'stripe'
import type { Bindings, Mode } from './env'
import { secretNames, vaultSecret } from './vault'

/** What the Worker reports about a connected account, read from Stripe each time. */
export interface AccountStatus {
  id: string; mode: Mode; displayName?: string | undefined
  cardPayments: string; achDebitPayments: string; payouts: string; requirementsStatus?: string | undefined
  onboardingComplete: boolean; readyToProcessPayments: boolean
  /** What Stripe still needs now (currently or past due), in its words; `from` is who must act (user or stripe). */
  needs?: Array<{ description: string; from: string; error?: string }>
}
export interface PaymentDetails {
  id: string; status: string; amount: number; currency: string; metadata: Record<string, string>
  chargeId?: string | undefined; method?: string | undefined; last4?: string | undefined; stripeFee: number; applicationFee: number
}
/** The city's plan subscription, read from Stripe each time. */
export interface PlanStatus { subscriptionId: string; status: string; amount: number; currentPeriodEnd?: string | undefined; cancelAtPeriodEnd: boolean; active: boolean }
export const PLAN_LOOKUP_KEY = 'papyrus_payments_monthly'

/** A verified Stripe event: snapshot events carry their object; thin (v2) events carry only what changed. */
export interface VerifiedEvent { id: string; type: string; account?: string | undefined; created: string; object?: Record<string, unknown> | undefined }

/** Everything the Worker asks of Stripe. Tests pass their own; production uses the Stripe SDK with keys from Key Vault. */
export interface StripeGateway {
  createAccount(mode: Mode, input: { displayName: string; contactEmail?: string | undefined; supportUrl?: string | undefined; statementDescriptor?: string | undefined; metadata: Record<string, string> }): Promise<string>
  accountStatus(mode: Mode, accountId: string): Promise<AccountStatus>
  onboardingLink(mode: Mode, accountId: string, refreshUrl: string, returnUrl: string): Promise<string>
  checkout(mode: Mode, accountId: string, input: { amount: number; currency: string; name: string; description?: string | undefined; reference: string; applicationFee: number
    successUrl: string; cancelUrl: string; customerEmail?: string | undefined; metadata: Record<string, string>; bankAccounts: boolean }): Promise<{ url: string; id: string }>
  payment(mode: Mode, accountId: string, paymentIntentId: string): Promise<PaymentDetails>
  refund(mode: Mode, accountId: string, paymentIntentId: string, amount?: number, reason?: string): Promise<{ refundId: string; status: string }>
  payoutTransactions(mode: Mode, accountId: string, payoutId: string): Promise<Array<{ id: string; type: string; amount: number; fee: number; net: number; paymentIntentId?: string | undefined; metadata: Record<string, string> }>>
  /** The Papyrus Payments plan: a subscription Beag Labs bills to the city's own Stripe account (the V2 account as customer). */
  plan(mode: Mode, accountId: string): Promise<PlanStatus | undefined>
  planCheckout(mode: Mode, accountId: string, input: { monthlyCents: number; successUrl: string; cancelUrl: string }): Promise<{ url: string; id: string }>
  planPortal(mode: Mode, accountId: string, returnUrl: string): Promise<string>
  verifySnapshot(mode: Mode, raw: string, signature: string): Promise<VerifiedEvent>
  verifyThin(mode: Mode, raw: string, signature: string): Promise<VerifiedEvent>
}

const clients = new Map<string, Stripe>()

export function stripeGateway(env: Bindings): StripeGateway {
  // One Stripe client per mode and key; the SDK uses the API version it ships with (2026-09-30.endive for v23).
  const client = async (mode: Mode) => {
    const key = await vaultSecret(env, secretNames(env, mode).apiKey)
    if (mode === 'live' ? !key.startsWith('sk_live_') && !key.startsWith('rk_live_') : !key.startsWith('sk_test_') && !key.startsWith('rk_test_')) throw new Error(`The ${mode} Stripe key in Key Vault is not a ${mode} key`)
    const cacheKey = `${mode}:${key.slice(-8)}`
    let stripe = clients.get(cacheKey)
    if (!stripe) { stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 2 }); clients.set(cacheKey, stripe) }
    return stripe
  }
  const crypto = Stripe.createSubtleCryptoProvider()

  return {
    async createAccount(mode, input) {
      const stripe = await client(mode)
      // V2 accounts: the city gets the full Stripe dashboard, and Stripe (not Beag Labs) collects fees and carries losses.
      const account = await stripe.v2.core.accounts.create({
        display_name: input.displayName,
        ...(input.contactEmail ? { contact_email: input.contactEmail } : {}),
        identity: { country: 'us' },
        dashboard: 'full',
        defaults: { responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
        configuration: {
          customer: {},
          merchant: {
            mcc: '9399', // Government services, not elsewhere classified
            capabilities: { card_payments: { requested: true }, ach_debit_payments: { requested: true } },
            ...(input.statementDescriptor ? { statement_descriptor: { descriptor: input.statementDescriptor.slice(0, 22) } } : {}),
            ...(input.supportUrl ? { support: { url: input.supportUrl } } : {}),
          },
        },
        metadata: input.metadata,
      })
      return account.id
    },

    async accountStatus(mode, accountId) {
      const stripe = await client(mode)
      const account = await stripe.v2.core.accounts.retrieve(accountId, { include: ['configuration.merchant', 'requirements'] }) as unknown as {
        id: string; display_name?: string
        configuration?: { merchant?: { capabilities?: { card_payments?: { status?: string }; ach_debit_payments?: { status?: string }; stripe_balance?: { payouts?: { status?: string } } } } }
        requirements?: { summary?: { minimum_deadline?: { status?: string } }
          entries?: Array<{ description: string; awaiting_action_from: string; minimum_deadline?: { status?: string }; errors?: Array<{ description?: string }> }> }
      }
      const capabilities = account.configuration?.merchant?.capabilities
      const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status
      const cardPayments = capabilities?.card_payments?.status ?? 'inactive'
      return { id: account.id, mode, displayName: account.display_name, cardPayments, achDebitPayments: capabilities?.ach_debit_payments?.status ?? 'inactive',
        payouts: capabilities?.stripe_balance?.payouts?.status ?? 'inactive', requirementsStatus,
        // What Stripe still needs now, in its words, so the city sees it without opening Stripe.
        needs: (account.requirements?.entries ?? []).filter(entry => ['currently_due', 'past_due'].includes(entry.minimum_deadline?.status ?? ''))
          .map(entry => ({ description: entry.description, from: entry.awaiting_action_from, ...(entry.errors?.[0]?.description ? { error: entry.errors[0].description } : {}) })).slice(0, 20),
        onboardingComplete: requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due', readyToProcessPayments: cardPayments === 'active' }
    },

    async onboardingLink(mode, accountId, refreshUrl, returnUrl) {
      const stripe = await client(mode)
      // The account's configurations (merchant, customer) decide what onboarding collects; the link only says where to return.
      const link = await stripe.v2.core.accountLinks.create({
        account: accountId,
        use_case: { type: 'account_onboarding', account_onboarding: { collection_options: { fields: 'currently_due' }, refresh_url: refreshUrl, return_url: returnUrl } },
      })
      return link.url
    },

    async checkout(mode, accountId, input) {
      const stripe = await client(mode)
      // A direct charge on the city's account (the city is merchant of record) through Stripe-hosted Checkout, with the
      // platform's application fee. Bank accounts use Financial Connections for instant verification.
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ quantity: 1, price_data: { currency: input.currency, unit_amount: input.amount, product_data: { name: input.name, ...(input.description ? { description: input.description } : {}) } } }],
        // A filter on the methods the city's account has on: cards (and wallets), plus bank accounts once ACH is active.
        allowed_payment_method_types: input.bankAccounts ? ['card', 'link', 'us_bank_account'] : ['card', 'link'],
        ...(input.bankAccounts ? { payment_method_options: { us_bank_account: { verification_method: 'automatic', financial_connections: { permissions: ['payment_method'] } } } } : {}),
        payment_intent_data: { application_fee_amount: input.applicationFee, description: `${input.name} (${input.reference})`.slice(0, 1000), metadata: input.metadata },
        metadata: input.metadata,
        client_reference_id: input.reference.slice(0, 200),
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      }, { stripeAccount: accountId })
      if (!session.url) throw new Error('Stripe returned no Checkout URL')
      return { url: session.url, id: session.id }
    },

    async payment(mode, accountId, paymentIntentId) {
      const stripe = await client(mode)
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge.balance_transaction'] }, { stripeAccount: accountId })
      const charge = intent.latest_charge && typeof intent.latest_charge === 'object' ? intent.latest_charge : undefined
      const balance = charge?.balance_transaction && typeof charge.balance_transaction === 'object' ? charge.balance_transaction : undefined
      const fee = (type: string) => (balance?.fee_details ?? []).filter(detail => detail.type === type).reduce((sum, detail) => sum + detail.amount, 0)
      const details = charge?.payment_method_details
      return { id: intent.id, status: intent.status, amount: intent.amount, currency: intent.currency, metadata: intent.metadata ?? {}, chargeId: charge?.id, method: details?.type,
        last4: details?.card?.last4 ?? details?.us_bank_account?.last4 ?? undefined,
        stripeFee: fee('stripe_fee'), applicationFee: fee('application_fee') || (typeof intent.application_fee_amount === 'number' ? intent.application_fee_amount : 0) }
    },

    async refund(mode, accountId, paymentIntentId, amount, reason) {
      const stripe = await client(mode)
      const refund = await stripe.refunds.create({ payment_intent: paymentIntentId, ...(amount ? { amount } : {}), ...(reason ? { metadata: { reason: reason.slice(0, 500) } } : {}) }, { stripeAccount: accountId })
      return { refundId: refund.id, status: refund.status ?? 'pending' }
    },

    async payoutTransactions(mode, accountId, payoutId) {
      const stripe = await client(mode)
      const out = []
      // Every balance transaction the payout carried; payments and refunds are traced to their PaymentIntent's metadata (which names the fund).
      for await (const transaction of stripe.balanceTransactions.list({ payout: payoutId, limit: 100, expand: ['data.source'] }, { stripeAccount: accountId })) {
        const source = transaction.source && typeof transaction.source === 'object' ? transaction.source as unknown as Record<string, unknown> : undefined
        const intentId = typeof source?.payment_intent === 'string' ? source.payment_intent : undefined
        let metadata: Record<string, string> = {}
        if (intentId) metadata = (await stripe.paymentIntents.retrieve(intentId, {}, { stripeAccount: accountId })).metadata ?? {}
        out.push({ id: transaction.id, type: transaction.type, amount: transaction.amount, fee: transaction.fee, net: transaction.net, ...(intentId ? { paymentIntentId: intentId } : {}), metadata })
      }
      // The payout itself is in the list as a negative transaction; Papyrus wants what made it up.
      return out.filter(item => item.type !== 'payout')
    },

    async plan(mode, accountId) {
      const stripe = await client(mode)
      const subscriptions = await stripe.subscriptions.list({ customer_account: accountId, status: 'all', limit: 20, expand: ['data.items.data.price'] } as Stripe.SubscriptionListParams)
      const plan = subscriptions.data.filter(subscription => subscription.items.data.some(item => item.price.lookup_key === PLAN_LOOKUP_KEY))
        .sort((a, b) => Number(['active', 'trialing', 'past_due'].includes(b.status)) - Number(['active', 'trialing', 'past_due'].includes(a.status)) || b.created - a.created)[0]
      if (!plan) return undefined
      const item = plan.items.data.find(entry => entry.price.lookup_key === PLAN_LOOKUP_KEY)!
      const periodEnd = (item as unknown as { current_period_end?: number }).current_period_end
      return { subscriptionId: plan.id, status: plan.status, amount: item.price.unit_amount ?? 0, ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000).toISOString() } : {}),
        cancelAtPeriodEnd: plan.cancel_at_period_end, active: ['active', 'trialing'].includes(plan.status) }
    },

    async planCheckout(mode, accountId, input) {
      const stripe = await client(mode)
      // One price, found by lookup key; created the first time in each mode.
      let price = (await stripe.prices.list({ lookup_keys: [PLAN_LOOKUP_KEY], active: true, limit: 1 })).data[0]
      if (!price || price.unit_amount !== input.monthlyCents) {
        price = await stripe.prices.create({ currency: 'usd', unit_amount: input.monthlyCents, recurring: { interval: 'month' }, lookup_key: PLAN_LOOKUP_KEY, transfer_lookup_key: true,
          product_data: { name: 'Papyrus Payments', statement_descriptor: 'PAPYRUS PAYMENTS' } })
      }
      // Billed on the platform, to the city's own Stripe account as the customer; paid by card or bank account.
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription', customer_account: accountId, line_items: [{ price: price.id, quantity: 1 }],
        allowed_payment_method_types: ['card', 'us_bank_account'], success_url: input.successUrl, cancel_url: input.cancelUrl,
        subscription_data: { metadata: { beag_account: accountId } },
      })
      if (!session.url) throw new Error('Stripe returned no Checkout URL')
      return { url: session.url, id: session.id }
    },

    async planPortal(mode, accountId, returnUrl) {
      const stripe = await client(mode)
      const session = await stripe.billingPortal.sessions.create({ customer_account: accountId, return_url: returnUrl })
      return session.url
    },

    async verifySnapshot(mode, raw, signature) {
      const stripe = await client(mode)
      const event = await stripe.webhooks.constructEventAsync(raw, signature, await vaultSecret(env, secretNames(env, mode).webhook), undefined, crypto)
      return { id: event.id, type: event.type, account: event.account ?? undefined, created: new Date(event.created * 1000).toISOString(), object: event.data.object as unknown as Record<string, unknown> }
    },

    async verifyThin(mode, raw, signature) {
      const stripe = await client(mode)
      // Thin events say only that something changed; the full event is fetched from Stripe.
      const notification = await stripe.parseEventNotificationAsync(raw, signature, await vaultSecret(env, secretNames(env, mode).thin), undefined, crypto)
      const event = await notification.fetchEvent() as unknown as { id: string; type: string; created: string; context?: string }
      const context = notification.context ? String(notification.context) : event.context
      return { id: event.id, type: event.type, account: context, created: event.created }
    },
  }
}
