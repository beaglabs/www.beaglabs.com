import { describe, expect, it } from 'vitest'
import { signedIn } from './helpers/session'
import { fakeStripe } from './helpers/stripe'

function setup() {
  const stripe = fakeStripe()
  const session = signedIn({fetch:stripe.fetch})
  const request = (email = 'owner@example.com') => session.h.call('/api/credits/request', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})})
  return {...session,stripe,request}
}

describe('$1,000 compute credit', () => {
  it('issues a stable email-bound code without creating Stripe money or a deployment', async () => {
    const {request,h,stripe,get} = setup()
    const first = await (await request('OWNER@example.com')).json() as any
    expect(first.code).toMatch(/^PAPYRUS-/)
    expect((await (await request()).json() as any).code).toBe(first.code)
    expect(stripe.calls).toHaveLength(0)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
    expect(await (await get('/deploy')).text()).toContain('data-credit-banner')
  })
  it('rejects another verified email, and does not allocate anything before successful checkout', async () => {
    const {request,post,h,stripe} = setup()
    const credit = await (await request('someone@example.com')).json() as any
    expect((await post('/billing/checkout',{credit_code:credit.code})).status).toBe(400)
    const own = await (await request()).json() as any
    expect((await post('/billing/checkout',{credit_code:own.code})).status).toBe(303)
    expect((await post('/billing/checkout',{credit_code:own.code})).headers.get('location')).toBe('https://checkout.stripe.com/c/pay/cs_1')
    expect(stripe.sessions.size).toBe(1)
    expect(stripe.calls.filter(c => c.path === '/v1/billing/credit_grants' && c.method === 'POST')).toHaveLength(0)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(0)
  })
  it('applies to the selected existing deployment and its actual metered prices, excluding the platform fee', async () => {
    const {request,post,h,stripe} = setup()
    h.insertDeployment({id:'dep_existing',billing_state:'active'})
    h.sql.prepare("UPDATE deployments SET stripe_customer_id = 'cus_existing', stripe_subscription_id = 'sub_existing' WHERE id = 'dep_existing'").run()
    stripe.subscriptions.set('sub_existing',{id:'sub_existing',status:'active',customer:'cus_existing',items:{data:[{price:{id:'legacy_compute',recurring:{usage_type:'metered'}}},{price:{id:'legacy_execution',recurring:{usage_type:'metered'}}},{price:{id:'legacy_platform',recurring:{usage_type:'licensed'}}}]}})
    const {code} = await (await request()).json() as any
    expect((await post('/billing/credit',{deployment:'dep_existing',credit_code:code})).status).toBe(303)
    const form = stripe.calls.find(c => c.path === '/v1/billing/credit_grants' && c.method === 'POST')!.form
    expect(form.get('customer')).toBe('cus_existing')
    expect(form.get('applicability_config[scope][prices][0][id]')).toBe('legacy_compute')
    expect(form.toString()).not.toContain('legacy_platform')
    expect(stripe.calls.filter(c => c.path === '/v1/customers')).toHaveLength(0)
    expect((await post('/billing/checkout',{credit_code:code})).status).toBe(409)
  })

  it('recovers a previously created Stripe grant after a database write failure without allocating it again', async () => {
    const {request,post,get,h,stripe} = setup()
    const {code} = await (await request()).json() as any
    await post('/billing/checkout',{credit_code:code})
    const session = stripe.completeCheckout()
    await get('/billing/complete?session_id=cs_1')
    h.sql.prepare('UPDATE compute_credit_offers SET stripe_grant_id = NULL, redeemed_deployment_id = NULL').run()
    // Replay completion through a new event; Stripe's existing grant must be recovered.
    await h.stripeEvent({id:'evt_recover',type:'checkout.session.completed',data:{object:session}})
    expect(stripe.calls.filter(c => c.path === '/v1/billing/credit_grants' && c.method === 'POST')).toHaveLength(1)
    expect(h.sql.prepare('SELECT stripe_grant_id FROM compute_credit_offers').get()!.stripe_grant_id).toBe('credgr_1')
  })

  it('creates exactly one promotional Stripe grant scoped to metered prices for the exclusive customer', async () => {
    const {request,post,get,h,stripe} = setup()
    const {code} = await (await request()).json() as any
    await post('/billing/checkout',{credit_code:code})
    const session = stripe.completeCheckout()
    await get('/billing/complete?session_id=cs_1')
    await get('/billing/complete?session_id=cs_1')
    await h.stripeEvent({id:'evt_credit',type:'checkout.session.completed',data:{object:session}})
    const grants = stripe.calls.filter(c => c.path === '/v1/billing/credit_grants' && c.method === 'POST')
    expect(grants).toHaveLength(1)
    const form = grants[0]!.form
    expect(form.get('amount[monetary][value]')).toBe('100000')
    expect(form.get('category')).toBe('promotional')
    expect(form.get('customer')).toBe('cus_credit')
    expect(form.get('applicability_config[scope][prices][0][id]')).toBe('price_compute')
    expect(form.get('applicability_config[scope][prices][1][id]')).toBe('price_execution')
    expect(form.toString()).not.toContain('price_platform')
    expect((await post('/billing/checkout',{credit_code:code})).status).toBe(409)
    expect(h.sql.prepare('SELECT COUNT(*) AS n FROM deployments').get()!.n).toBe(1)
    expect(await (await get('/billing')).text()).toContain('Redeemed for')
    const html = await (await get('/deploy')).text()
    expect(html).toContain('data-page="list"')
    expect(html).toContain('Add a deployment')
  })
})
