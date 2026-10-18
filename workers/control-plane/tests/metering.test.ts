import { describe, expect, it } from 'vitest'
import { scheduled } from '../src/app'
import { parseUsageReport } from '../src/metering'
import { initialSteps, record } from '../src/setup'
import { harness } from './helpers/harness'
import { signedIn } from './helpers/session'
import { fakeStripe } from './helpers/stripe'

const NOW = Date.parse('2026-10-17T15:05:00.000Z')
const deployed = (at = '2026-10-17T10:00:00.000Z') => {
  const steps = record(initialSteps(), 'connect', { status: 'pass' })
  return { ...steps, deploy: { status: 'pass' as const, at } }
}

function setup(options: { failMeterEvents?: boolean } = {}) {
  const stripe = fakeStripe(options)
  const h = harness({ fetch: stripe.fetch })
  h.insertAccount()
  /** A deployment on Hosted with a running Papyrus. */
  const running = (id: string, status: 'active' | 'trialing', extra: { license?: string; deployedAt?: string; billing?: string } = {}) => {
    h.insertDeployment({ id, billing_state: extra.billing ?? 'active', license_deployment_id: extra.license ?? null })
    h.sql
      .prepare("UPDATE deployments SET provider = 'hosted', hostname = ?, steps = ?, stripe_customer_id = ?, stripe_subscription_id = ?, stripe_status = ? WHERE id = ?")
      .run(`${id}.papyrus.beaglabs.com`, JSON.stringify(deployed(extra.deployedAt)), `cus_${id}`, `sub_${id}`, status, id)
  }
  const billingEvents = () => h.sql.prepare("SELECT level, message, deployment_id FROM events WHERE source = 'billing' ORDER BY id").all() as Array<{ level: string; message: string; deployment_id: string }>
  return { h, stripe, running, billingEvents }
}

describe('meter event names', () => {
  it('are resolved from the price’s meter and cached in D1', async () => {
    const { h, stripe, running } = setup()
    running('dep_a', 'active', { license: 'pd_a' })
    await scheduled(h.env, NOW, { fetch: stripe.fetch })
    expect(stripe.calls.filter((c) => c.method === 'GET').map((c) => c.path)).toEqual(['/v1/prices/price_compute', '/v1/prices/price_compute', '/v1/billing/meters/mtr_compute'])
    expect(stripe.meterEvents()[0]!.form.get('event_name')).toBe('papyrus_vm_hours')
    expect(h.sql.prepare('SELECT price_id, meter_id, event_name FROM stripe_meters').all()).toEqual([{ price_id: 'price_compute', meter_id: 'mtr_compute', event_name: 'papyrus_vm_hours' }])
    // The next hour uses the cache.
    await scheduled(h.env, NOW + 3_600_000, { fetch: stripe.fetch })
    expect(stripe.calls.filter((c) => c.method === 'GET')).toHaveLength(3)
    expect(stripe.meterEvents()).toHaveLength(2)
  })
})

describe('hourly compute cron', () => {
  it('sends idempotent usage for each running subscription; Stripe applies credits and legacy subscription terms', async () => {
    const { h, stripe, running, billingEvents } = setup()
    running('dep_a', 'active', { license: 'pd_a' })
    running('dep_t', 'trialing', { license: 'pd_t' })
    running('dep_new', 'active', { license: 'pd_new', deployedAt: '2026-10-17T15:01:00.000Z' }) // deployed after the hour
    h.insertDeployment({ id: 'dep_none' }) // never deployed

    await scheduled(h.env, NOW, { fetch: stripe.fetch })
    await scheduled(h.env, NOW + 60_000, { fetch: stripe.fetch }) // a cron retry in the same hour

    const events = stripe.meterEvents()
    expect(events).toHaveLength(2)
    const sent = events[0]!
    expect(sent.form.get('identifier')).toBe('pd_a:2026-10-17T14:00:00.000Z')
    expect(sent.headers.get('idempotency-key')).toBe('pd_a:2026-10-17T14:00:00.000Z')
    expect(sent.form.get('payload[value]')).toBe('1')
    expect(sent.form.get('payload[stripe_customer_id]')).toBe('cus_dep_a')

    expect(billingEvents()).toEqual([
      { level: 'ok', deployment_id: 'dep_a', message: 'Usage sent to Stripe · 1 VM hour · 14:00–15:00 UTC' },
      { level: 'ok', deployment_id: 'dep_t', message: 'Usage sent to Stripe · 1 VM hour · 14:00–15:00 UTC' },
    ])
    for (const row of billingEvents()) expect(row.message).not.toMatch(/cus_|sk_test|sub_/)
  })

  it('retries a send Stripe refused on the next run', async () => {
    const failing = setup({ failMeterEvents: true })
    failing.running('dep_a', 'active', { license: 'pd_a' })
    await scheduled(failing.h.env, NOW, { fetch: failing.stripe.fetch })
    expect(failing.billingEvents().at(-1)).toMatchObject({ level: 'error', message: expect.stringContaining('will retry') })
    expect(failing.h.sql.prepare('SELECT status FROM meter_pushes').get()).toEqual({ status: 'failed' })
    const ok = fakeStripe()
    await scheduled(failing.h.env, NOW + 3_600_000, { fetch: ok.fetch })
    expect(ok.meterEvents().map((e) => e.form.get('identifier')).sort()).toEqual(['pd_a:2026-10-17T14:00:00.000Z', 'pd_a:2026-10-17T15:00:00.000Z'])
  })
})

describe('POST /api/deployments/usage', () => {
  const report = (overrides: Record<string, unknown> = {}) => ({
    periodStart: new Date(Date.now() - 3_600_000).toISOString(),
    periodEnd: new Date(Date.now() - 60_000).toISOString(),
    executionSeconds: 1800,
    reportId: 'r-1',
    ...overrides,
  })
  const post = (h: ReturnType<typeof harness>, body: unknown, headers: Record<string, string> = { authorization: 'Bearer good-key', 'x-papyrus-deployment-id': 'pd_123' }) =>
    h.call('/api/deployments/usage', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })

  it('401 without a valid deployment key', async () => {
    const { h, stripe, running } = setup()
    running('dep_1', 'active', { license: 'pd_123' })
    expect((await post(h, report(), {})).status).toBe(401)
    expect((await post(h, report(), { authorization: 'Bearer wrong', 'x-papyrus-deployment-id': 'pd_123' })).status).toBe(401)
    expect((await post(h, report(), { authorization: 'Bearer good-key' })).status).toBe(401)
    expect(stripe.meterEvents()).toHaveLength(0)
  })

  it('400 for invalid reports', async () => {
    const { h, stripe, running } = setup()
    running('dep_1', 'active', { license: 'pd_123' })
    const now = Date.now()
    const bad = [
      report({ executionSeconds: -1 }),
      report({ executionSeconds: 1.5 }),
      report({ executionSeconds: '60' }),
      report({ reportId: '' }),
      report({ reportId: 'has space' }),
      report({ periodStart: 'yesterday' }),
      report({ periodStart: new Date(now - 7_300_000).toISOString(), periodEnd: new Date(now - 60_000).toISOString() }), // > 1 hour
      report({ periodStart: new Date(now - 60_000).toISOString(), periodEnd: new Date(now - 120_000).toISOString() }), // end before start
      report({ periodStart: new Date(now + 600_000).toISOString(), periodEnd: new Date(now + 1_200_000).toISOString() }), // future
    ]
    for (const body of bad) expect((await post(h, body)).status, JSON.stringify(body)).toBe(400)
    expect((await h.call('/api/deployments/usage', { method: 'POST', headers: { authorization: 'Bearer good-key', 'x-papyrus-deployment-id': 'pd_123' }, body: 'not json' })).status).toBe(400)
    expect(stripe.meterEvents()).toHaveLength(0)
    expect(typeof parseUsageReport(report())).toBe('object')
  })

  it('forwards a report as one meter event; a duplicate reportId is idempotent', async () => {
    const { h, stripe, running, billingEvents } = setup()
    running('dep_1', 'active', { license: 'pd_123' })
    const first = await post(h, report())
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ accepted: true, duplicate: false, billed: true })
    const again = await post(h, report({ executionSeconds: 999 }))
    expect(again.status).toBe(200)
    expect(await again.json()).toEqual({ accepted: true, duplicate: true, billed: false })
    expect(stripe.meterEvents()).toHaveLength(1)
    const sent = stripe.meterEvents()[0]!
    expect(sent.form.get('event_name')).toBe('papyrus_agent_seconds')
    expect(sent.form.get('identifier')).toBe('pd_123:r-1')
    expect(sent.form.get('payload[value]')).toBe('1800')
    expect(billingEvents()).toHaveLength(1)
    expect(billingEvents()[0]!.message).toMatch(/^Usage sent to Stripe · 1,800 agent-seconds · /)
  })

  it('forwards usage for legacy subscription statuses instead of dropping it locally', async () => {
    const { h, stripe, running, billingEvents } = setup()
    running('dep_1', 'trialing', { license: 'pd_123' })
    const response = await post(h, report())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ accepted: true, duplicate: false, billed: true })
    expect(stripe.meterEvents()).toHaveLength(1)
    expect(billingEvents()).toEqual([expect.objectContaining({ level: 'ok', message: expect.stringMatching(/^Usage sent to Stripe · 1,800 agent-seconds/) })])
  })

  it('counts billed usage this month on the Plan card and the Billing page', async () => {
    const stripe = fakeStripe()
    const { h, get } = signedIn({ fetch: stripe.fetch })
    h.insertDeployment({ id: 'dep_1', billing_state: 'active', license_deployment_id: 'pd_123' })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = 'acme.papyrus.beaglabs.com', stripe_customer_id = 'cus_1', stripe_status = 'active' WHERE id = 'dep_1'").run()
    await post(h, report({ executionSeconds: 3600 }))
    const html = await (await get('/billing')).text()
    // $250 + 3600 × $0.00194444
    expect(html).toContain('This month so far: 0 VM hours · 60 agent minutes · $257.00 estimated')
  })
})

describe('Checkout', () => {
  it('creates one subscription with all three prices, metered ones without quantity, without a trial', async () => {
    const stripe = fakeStripe()
    const { post } = signedIn({ fetch: stripe.fetch })
    const response = await post('/billing/checkout')
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/cs_1')
    const form = stripe.calls.find((c) => c.path === '/v1/checkout/sessions')!.form
    expect(form.get('mode')).toBe('subscription')
    expect(form.get('payment_method_collection')).toBe('always')
    expect(form.has('subscription_data[trial_period_days]')).toBe(false)
    expect(form.get('line_items[0][price]')).toBe('price_platform')
    expect(form.get('line_items[0][quantity]')).toBe('1')
    expect(form.get('line_items[1][price]')).toBe('price_compute')
    expect(form.has('line_items[1][quantity]')).toBe(false)
    expect(form.get('line_items[2][price]')).toBe('price_execution')
    expect(form.has('line_items[2][quantity]')).toBe(false)
    expect(form.has('line_items[3][price]')).toBe(false)
    expect([...form.keys()].some((key) => key.includes('price_data'))).toBe(false)
  })
})
