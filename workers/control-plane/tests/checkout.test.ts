import { describe, expect, it } from 'vitest'
import { signedIn } from './helpers/session'
import { fakeStripe } from './helpers/stripe'

const setup = (options: Parameters<typeof fakeStripe>[0] = {}) => {
  const stripe = fakeStripe(options)
  return { ...signedIn({ fetch: stripe.fetch }), stripe }
}

describe('billing before deployment creation', () => {
  it('requires a payment method and billing address, but creates nothing on start, cancel, or incomplete return', async () => {
    const { h, post, get, stripe } = setup()
    expect((await post('/billing/checkout')).status).toBe(303)
    const form = stripe.calls.find(c => c.path === '/v1/checkout/sessions')!.form
    expect(form.get('payment_method_collection')).toBe('always')
    expect(form.get('billing_address_collection')).toBe('required')
    expect(form.has('subscription_data[trial_period_days]')).toBe(false)
    expect(form.get('line_items[0][price]')).toBe('price_platform')
    expect(form.get('success_url')).toBe(`${h.env.BASE_URL}/billing/complete?session_id={CHECKOUT_SESSION_ID}`)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
    await get('/billing')
    const response = await get('/billing/complete?session_id=cs_1')
    expect(response.headers.get('location')).toContain('/billing?error=')
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
  })

  it('creates canonical prices by lookup key when old configured IDs are missing, then reuses them', async () => {
    const {post,stripe} = setup({missingCatalog:true})
    expect((await post('/billing/checkout')).status).toBe(303)
    const prices = stripe.calls.filter(c => c.path === '/v1/prices' && c.method === 'POST')
    expect(prices).toHaveLength(3)
    expect(prices.map(c => c.form.get('lookup_key'))).toEqual(['papyrus_platform_v1','papyrus_vm_compute_v1','papyrus_agent_execution_v1'])
    expect(prices.map(c => c.form.get('unit_amount_decimal'))).toEqual(['25000','50','0.194444'])
    expect(prices.every(c => c.headers.get('idempotency-key'))).toBe(true)
    expect((await post('/billing/checkout')).status).toBe(303)
    expect(stripe.calls.filter(c => c.path === '/v1/prices' && c.method === 'POST')).toHaveLength(3)
  })

  it('a Stripe error leaves no deployment or checkout reference', async () => {
    const { h, post } = setup({ failCheckout: true })
    expect((await post('/billing/checkout')).status).toBe(502)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM checkout_intents').get()!.n).toBe(0)
  })

  it('creates exactly one active subscription after completion, including when subscription events arrive first', async () => {
    const end = Math.floor((Date.now() + 14 * 86_400_000) / 1000)
    const { h, post, get, stripe } = setup({ trialEnd: end })
    await post('/billing/checkout')
    const session = stripe.completeCheckout()
    const subscription = stripe.subscriptions.get(String(session.subscription))!
    expect((await h.stripeEvent({ id: 'evt_sub_first', type: 'customer.subscription.created', data: { object: subscription } })).status).toBe(200)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
    const completed = { id: 'evt_checkout', type: 'checkout.session.completed', data: { object: session } }
    expect((await h.stripeEvent(completed)).status).toBe(200)
    const id = String(session.client_reference_id)
    expect(h.deployment(id)).toMatchObject({ billing_state: 'active', stripe_status: 'active', stripe_customer_id: session.customer, stripe_subscription_id: session.subscription })
    expect(h.sql.prepare('SELECT trial_end FROM billing_periods WHERE deployment_id = ?').get(id)!.trial_end).toBe(new Date(end * 1000).toISOString())
    expect((await get('/billing/complete?session_id=cs_1')).headers.get('location')).toBe(`/deploy/${id}`)
    await h.stripeEvent(completed)
    await h.stripeEvent({ ...completed, id: 'evt_checkout_again' })
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(1)
    expect(h.sql.prepare("SELECT COUNT(*) AS n FROM events WHERE message = 'Billing setup completed · deployment created'").get()!.n).toBe(1)
  })

  it('the verified return creates the deployment before a delayed webhook, and the webhook does not duplicate it', async () => {
    const { h, post, get, stripe } = setup()
    await post('/billing/checkout')
    const session = stripe.completeCheckout()
    const response = await get('/billing/complete?session_id=cs_1')
    expect(response.headers.get('location')).toBe(`/deploy/${session.client_reference_id}`)
    expect((await h.stripeEvent({ id: 'evt_late', type: 'checkout.session.completed', data: { object: session } })).status).toBe(200)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(1)
  })

  it('rejects a checkout owned by another account and ignores unrecognized webhook metadata', async () => {
    const { h, post, get, stripe } = setup()
    await post('/billing/checkout')
    const session = stripe.completeCheckout()
    h.insertAccount('acct_other', 'other@example.com')
    h.sql.prepare("UPDATE checkout_intents SET account_id = 'acct_other'").run()
    expect((await get('/billing/complete?session_id=cs_1')).headers.get('location')).toContain('/billing?error=')
    h.sql.prepare('DELETE FROM checkout_intents').run()
    expect((await h.stripeEvent({ id: 'evt_unknown', type: 'checkout.session.completed', data: { object: session } })).status).toBe(200)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
  })

  it('rejects mismatched subscription ownership and unpaid subscriptions without creating a deployment', async () => {
    const { h, post, get, stripe } = setup()
    await post('/billing/checkout')
    const session = stripe.completeCheckout('cs_1', 'incomplete')
    expect((await get('/billing/complete?session_id=cs_1')).headers.get('location')).toContain('/billing?error=')
    const subscription = stripe.subscriptions.get(String(session.subscription))!
    subscription.status = 'active'
    subscription.metadata.account_id = 'another-account'
    expect((await get('/billing/complete?session_id=cs_1')).headers.get('location')).toContain('/billing?error=')
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
  })

  it('waits for asynchronous payment success and handles concurrent completion requests once', async () => {
    const { h, post, get, stripe } = setup()
    await post('/billing/checkout')
    const session = stripe.completeCheckout()
    session.payment_status = 'unpaid'
    expect((await h.stripeEvent({ id: 'evt_unpaid', type: 'checkout.session.completed', data: { object: session } })).status).toBe(200)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
    session.payment_status = 'paid'
    const responses = await Promise.all([
      get('/billing/complete?session_id=cs_1'),
      get('/billing/complete?session_id=cs_1'),
      h.stripeEvent({ id: 'evt_async', type: 'checkout.session.async_payment_succeeded', data: { object: session } }),
    ])
    expect(responses.map(r => r.status)).toEqual([303, 303, 200])
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(1)
  })

  it('prunes expired abandoned checkouts without creating deployments', async () => {
    const { h, post } = setup()
    await post('/billing/checkout')
    h.sql.prepare("UPDATE checkout_intents SET expires_at = '2000-01-01T00:00:00.000Z'").run()
    await post('/billing/checkout')
    expect(h.sql.prepare('SELECT stripe_session_id FROM checkout_intents').all()).toEqual([{ stripe_session_id: 'cs_2' }])
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
  })

})
