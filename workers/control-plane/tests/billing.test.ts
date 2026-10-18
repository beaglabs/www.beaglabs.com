import { describe, expect, it } from 'vitest'
import { billingStateFor, billingUpdateFor } from '../src/billing'
import { harness } from './helpers/harness'

const subscriptionEvent = (id: string, type: string, status: string, deploymentId?: string) => ({
  id,
  type,
  data: { object: { id: 'sub_1', status, customer: 'cus_1', metadata: deploymentId ? { deployment_id: deploymentId } : {} } },
})

describe('Stripe webhook → billing state', () => {
  it('maps subscription statuses', () => {
    expect(billingStateFor('trialing')).toBe('active')
    expect(billingStateFor('active')).toBe('active')
    for (const status of ['past_due', 'unpaid', 'canceled', 'incomplete_expired', 'paused']) expect(billingStateFor(status)).toBe('suspended')
  })

  it('treats subscription.deleted as canceled whatever the status field says', () => {
    expect(billingUpdateFor(subscriptionEvent('evt', 'customer.subscription.deleted', 'active', 'dep_1') as never)).toMatchObject({ kind: 'status', stripeStatus: 'canceled', billingState: 'suspended' })
    expect(billingUpdateFor({ type: 'invoice.paid', data: { object: {} } })).toEqual({ kind: 'ignore' })
  })

  it('applies signed events to the deployment and ignores replays', async () => {
    const h = harness()
    h.insertAccount()
    h.insertDeployment({ id: 'dep_1' })

    const checkout = await h.stripeEvent({ id: 'evt_0', type: 'checkout.session.completed', data: { object: { client_reference_id: 'dep_1', customer: 'cus_1', subscription: 'sub_1' } } })
    expect(checkout.status).toBe(200)
    expect(h.deployment('dep_1')).toMatchObject({ stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1', billing_state: 'none' })

    await h.stripeEvent(subscriptionEvent('evt_1', 'customer.subscription.created', 'trialing', 'dep_1'))
    expect(h.deployment('dep_1')).toMatchObject({ billing_state: 'active', stripe_status: 'trialing' })

    // No metadata: found by subscription id.
    await h.stripeEvent(subscriptionEvent('evt_2', 'customer.subscription.updated', 'past_due'))
    expect(h.deployment('dep_1')).toMatchObject({ billing_state: 'suspended', stripe_status: 'past_due' })

    await h.stripeEvent(subscriptionEvent('evt_3', 'customer.subscription.updated', 'active', 'dep_1'))
    expect(h.deployment('dep_1').billing_state).toBe('active')

    for (const status of ['unpaid', 'canceled']) {
      await h.stripeEvent(subscriptionEvent(`evt_${status}`, 'customer.subscription.updated', status, 'dep_1'))
      expect(h.deployment('dep_1').billing_state).toBe('suspended')
    }

    // Replaying an already-applied event changes nothing.
    const replay = await h.stripeEvent(subscriptionEvent('evt_3', 'customer.subscription.updated', 'active', 'dep_1'))
    expect(await replay.json()).toMatchObject({ duplicate: true })
    expect(h.deployment('dep_1').billing_state).toBe('suspended')
  })

  it('rejects unsigned or mis-signed webhooks', async () => {
    const h = harness()
    const response = await h.call('/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 't=1,v1=00' }, body: '{}' })
    expect(response.status).toBe(400)
  })
})
