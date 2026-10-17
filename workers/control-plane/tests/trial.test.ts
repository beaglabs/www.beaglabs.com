import { describe, expect, it } from 'vitest'
import { trialDaysLeft, trialStatus } from '../src/billing'
import { signedIn } from './helpers/session'
import { fakeStripe } from './helpers/stripe'

const NOW = Date.parse('2026-10-19T09:00:00.000Z')

describe('trial formatting', () => {
  it('shows days left (rounded up) and the end date', () => {
    expect(trialStatus('2026-10-31T12:00:00.000Z', NOW)).toBe('Trial · 13 days left · ends Oct 31')
    expect(trialStatus('2026-10-20T08:00:00.000Z', NOW)).toBe('Trial · 1 day left · ends Oct 20')
    expect(trialStatus('2026-10-19T08:00:00.000Z', NOW)).toBe('Trial · ends today')
    expect(trialStatus(null, NOW)).toBe('Trial')
    expect(trialDaysLeft('2026-11-02T09:00:00.000Z', NOW)).toBe(14)
  })
})

describe('trial banner and Plan card', () => {
  const inFuture = (days: number) => new Date(Date.now() + days * 86_400_000 - 3_600_000).toISOString()

  it('shows only while a deployment is trialing', async () => {
    const { h, get } = signedIn()
    h.insertDeployment({ id: 'dep_1', billing_state: 'active' })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = 'acme.papyrus.beaglabs.com', stripe_customer_id = 'cus_1', stripe_subscription_id = 'sub_1', stripe_status = 'trialing' WHERE id = 'dep_1'").run()
    h.sql.prepare("INSERT INTO billing_periods (deployment_id, trial_end, updated_at) VALUES ('dep_1', ?, 'now')").run(inFuture(12))
    for (const path of ['/deploy/dep_1', '/billing', '/team', '/settings']) {
      const html = await (await get(path)).text()
      expect(html, path).toMatch(/<div class="trialbar" role="status" data-trial-banner><strong>Trial<\/strong><span>12 days left · ends [A-Z][a-z]{2} \d{1,2}<\/span>/)
    }
    const deploy = await (await get('/deploy/dep_1')).text()
    expect(deploy).toMatch(/data-trial>Trial · 12 days left · ends [A-Z][a-z]{2} \d{1,2}</)
    expect(await (await get('/billing')).text()).toMatch(/data-trial>Trial · 12 days left/)

    h.sql.prepare("UPDATE deployments SET stripe_status = 'active' WHERE id = 'dep_1'").run()
    for (const path of ['/deploy/dep_1', '/billing']) expect(await (await get(path)).text()).not.toContain('data-trial')
    h.sql.prepare("UPDATE deployments SET stripe_status = 'trialing', billing_state = 'suspended' WHERE id = 'dep_1'").run()
    expect(await (await get('/billing')).text()).not.toContain('data-trial-banner')
  })

  it('backfills a missing trial end from the Stripe subscription', async () => {
    const trialEnd = Math.floor((Date.now() + 5 * 86_400_000) / 1000)
    const stripe = fakeStripe({ trialEnd })
    const { h, get } = signedIn({ fetch: stripe.fetch })
    h.insertDeployment({ id: 'dep_1', billing_state: 'active' })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', stripe_customer_id = 'cus_1', stripe_subscription_id = 'sub_1', stripe_status = 'trialing' WHERE id = 'dep_1'").run()
    const html = await (await get('/billing')).text()
    expect(html).toContain('5 days left')
    expect(stripe.calls.map((c) => c.path)).toEqual(['/v1/subscriptions/sub_1'])
    expect(h.sql.prepare('SELECT trial_end FROM billing_periods WHERE deployment_id = ?').get('dep_1')).toEqual({ trial_end: new Date(trialEnd * 1000).toISOString() })
    await get('/billing')
    expect(stripe.calls).toHaveLength(1)
  })
})
