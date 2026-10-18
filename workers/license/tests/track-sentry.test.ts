import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import { getDb, resetDb } from './helpers/fake-db'
import { TENANT_A, call, fetchCalls, installFetch, makeEnv, seedDeployment, type TestEnv } from './helpers/harness'
import { ANONYMOUS_BATCHES_PER_MINUTE, MAX_BATCH_BYTES, resetTrackRateLimit } from '../src/track'
import { customerIoBatchItem } from '../src/events'
import { handleSentryWebhook, readTag, SPIKE_ALERT_WINDOW_MS, verifySentrySignature } from '../src/sentry'
import { hmacSha256, toHex } from '../src/util'

let env: TestEnv
beforeEach(async () => {
  await resetDb()
  installFetch()
  resetTrackRateLimit()
  env = makeEnv({ CUSTOMERIO_SITE_ID: 'site', CUSTOMERIO_API_KEY: 'key' })
})

const item = (event = 'document.created', extra: Record<string, unknown> = {}) => ({ type: 'track', event, userId: 'u1', properties: { a: 1 }, timestamp: new Date().toISOString(), ...extra })

describe('POST /api/v1/track', () => {
  it('stores deployment events under the bound tenant and forwards to Customer.io', async () => {
    const { key } = await seedDeployment({ tenantId: TENANT_A })
    fetchCalls.length = 0
    const response = await call(env, 'POST', '/api/v1/track', { deploymentKey: key, body: { batch: [item(), item('workflow.run'), { type: 'identify', userId: 'u1', traits: { plan: 'x' } }, { type: 'track', event: 'Bad Name' }] } })
    expect(response.json).toEqual({ accepted: 3 })
    const stored = (await getDb().execute('SELECT tenant_id, source, type, event FROM tenant_events ORDER BY event')).rows
    expect(stored.every((row) => row.tenant_id === TENANT_A && row.source === 'papyrus')).toBe(true)
    const cio = fetchCalls.find((call) => call.url === 'https://track.customer.io/api/v2/batch')
    expect(cio?.method).toBe('POST')
    expect((cio?.body as any).batch).toHaveLength(3)
    expect((cio?.body as any).batch[0]).toMatchObject({ type: 'person', action: 'event', identifiers: { id: 'u1' }, name: 'document.created', attributes: { a: 1, tenant_id: TENANT_A, source: 'papyrus' } })
  })

  it('rejects more than 100 items and bodies over 256 KB', async () => {
    const { key } = await seedDeployment()
    const many = await call(env, 'POST', '/api/v1/track', { deploymentKey: key, body: { batch: Array.from({ length: 101 }, () => item()) } })
    expect(many.status).toBe(413)
    expect(many.json.error).toBe('batch_too_large')
    const big = await call(env, 'POST', '/api/v1/track', { deploymentKey: key, body: { batch: [item('a.b', { properties: { blob: 'x'.repeat(MAX_BATCH_BYTES) } })] } })
    expect(big.status).toBe(413)
    const hundred = await call(env, 'POST', '/api/v1/track', { deploymentKey: key, body: { batch: Array.from({ length: 100 }, () => item()) } })
    expect(hundred.json.accepted).toBe(100)
  })

  it('anonymous web events are tenantless, ≤ 1 KB each and rate-limited per IP', async () => {
    const headers = { 'cf-connecting-ip': '203.0.113.9' }
    const response = await call(env, 'POST', '/api/v1/track', { headers, body: { batch: [item('page.cta', { context: { tenantId: TENANT_A } }), item('page.big', { properties: { blob: 'x'.repeat(1100) } })] } })
    expect(response.json).toEqual({ accepted: 1 })
    const stored = (await getDb().execute('SELECT tenant_id, source FROM tenant_events')).rows
    expect(stored).toEqual([expect.objectContaining({ tenant_id: null, source: 'web' })])
    for (let i = 1; i < ANONYMOUS_BATCHES_PER_MINUTE; i += 1) await call(env, 'POST', '/api/v1/track', { headers, body: { batch: [] } })
    const limited = await call(env, 'POST', '/api/v1/track', { headers, body: { batch: [] } })
    expect(limited.status).toBe(429)
    expect((await call(env, 'POST', '/api/v1/track', { headers: { 'cf-connecting-ip': '203.0.113.10' }, body: { batch: [] } })).status).toBe(200)
  })

  it('rejects bearer tokens (staff and chat sessions are gone)', async () => {
    const response = await call(env, 'POST', '/api/v1/track', { token: 'eyJhbGciOiJIUzI1NiJ9.e30.x', body: { batch: [item()] } })
    expect(response.status).toBe(401)
    expect((await getDb().execute('SELECT COUNT(*) AS n FROM tenant_events')).rows[0].n).toBe(0)
  })

  it('maps page and anonymous events for Customer.io', () => {
    expect(customerIoBatchItem({ tenantId: null, source: 'web', type: 'page', event: null, anonymousId: 'anon', properties: { url: 'https://beaglabs.com/' } }))
      .toMatchObject({ action: 'page', anonymous_id: 'anon', name: 'https://beaglabs.com/' })
    expect(customerIoBatchItem({ tenantId: null, source: 'web', type: 'track', event: 'a.b' })).toBeNull()
  })
})

describe('Sentry webhook', () => {
  const TENANT = TENANT_A
  async function post(resource: string, payload: unknown, opts: { secret?: string; nowMs?: number } = {}) {
    const raw = JSON.stringify(payload)
    const signature = toHex(await hmacSha256(opts.secret ?? 'sentry-secret', raw))
    const request = new Request('https://license.test/api/sentry/webhook', { method: 'POST', body: raw, headers: { 'sentry-hook-resource': resource, 'sentry-hook-signature': signature } })
    return handleSentryWebhook(request, env, undefined, opts.nowMs)
  }
  const issue = (id = '42') => ({ action: 'created', data: { issue: { id, title: 'TypeError: x is undefined', culprit: 'app.tsx', level: 'error', permalink: `https://sentry.io/issues/${id}/` } } })
  const alert = (id = '42') => ({ action: 'triggered', data: { event: { issue_id: id, title: 'TypeError: x is undefined', web_url: `https://sentry.io/issues/${id}/events/1/`, tags: [['tenant_id', TENANT], ['deployment_id', 'dep_1'], ['source', 'papyrus-web']] }, triggered_rule: 'spike' } })

  it('verifies Sentry-Hook-Signature', async () => {
    expect(await verifySentrySignature('s', 'body', toHex(await hmacSha256('s', 'body')))).toBe(true)
    expect(await verifySentrySignature('s', 'body', toHex(await hmacSha256('other', 'body')))).toBe(false)
    expect(await verifySentrySignature('s', 'body', null)).toBe(false)
    await expect(post('issue', issue(), { secret: 'wrong' })).rejects.toMatchObject({ status: 401, code: 'invalid_signature' })
    const viaRoute = await call(env, 'POST', '/api/sentry/webhook', { body: issue(), headers: { 'sentry-hook-resource': 'issue', 'sentry-hook-signature': 'deadbeef' } })
    expect(viaRoute.status).toBe(401)
  })

  it('stores issues once, alerts error.new, then at most one error.spike per window', async () => {
    const t0 = Date.now()
    expect(await (await post('issue', issue())).json()).toMatchObject({ alert: 'error.new' })
    expect(await (await post('issue', issue())).json()).toMatchObject({ alert: null })
    expect(await (await post('event_alert', alert(), { nowMs: t0 + 1000 })).json()).toMatchObject({ alert: null })
    expect(await (await post('event_alert', alert(), { nowMs: t0 + SPIKE_ALERT_WINDOW_MS + 2000 })).json()).toMatchObject({ alert: 'error.spike' })
    expect(await (await post('event_alert', alert(), { nowMs: t0 + SPIKE_ALERT_WINDOW_MS + 3000 })).json()).toMatchObject({ alert: null })
    const errors = (await getDb().execute('SELECT sentry_issue_id, tenant_id, sentry_url FROM tenant_errors')).rows
    expect(errors).toEqual([expect.objectContaining({ sentry_issue_id: '42', tenant_id: TENANT, sentry_url: 'https://sentry.io/issues/42/' })])
  })

  it('event alerts for unseen issues are error.new and keep the tenant tag and Sentry link', async () => {
    expect(await (await post('event_alert', alert('77'))).json()).toMatchObject({ alert: 'error.new' })
    const row = (await getDb().execute("SELECT tenant_id, deployment_id, sentry_url FROM tenant_errors WHERE sentry_issue_id='77'")).rows[0]
    expect(row).toMatchObject({ tenant_id: TENANT, deployment_id: 'dep_1', sentry_url: 'https://sentry.io/issues/77/events/1/' })
  })

  it('reads tags in both Sentry shapes', () => {
    expect(readTag({ tags: [['tenant_id', 'x']] }, 'tenant_id')).toBe('x')
    expect(readTag({ tags: [{ key: 'tenant_id', value: 'y' }] }, 'tenant_id')).toBe('y')
    expect(readTag({}, 'tenant_id')).toBeNull()
  })
})
