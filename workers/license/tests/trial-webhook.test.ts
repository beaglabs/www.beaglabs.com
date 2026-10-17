import assert from 'node:assert/strict'
import { test } from 'vitest'
import { postTrialWebhook } from '../src/trial-webhook'
import type { Bindings } from '../src/env'

test('trial webhook sends the event details in a Teams Adaptive Card', async () => {
  const original = globalThis.fetch
  const env = { TRIAL_NOTIFICATIONS_WEBHOOK_URL: 'https://example.test/hook' } as Bindings
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, env.TRIAL_NOTIFICATIONS_WEBHOOK_URL)
      assert.equal(init?.method, 'POST')
      assert.equal(init?.redirect, 'error')
      const body = JSON.parse(String(init?.body))
      assert.equal(body.event, 'trial.cta.clicked')
      assert.equal(body.properties.Placement, 'hero')
      assert.equal(body.attachments[0].contentType, 'application/vnd.microsoft.card.adaptive')
      assert.deepEqual(body.attachments[0].content.body[1].facts, [{ title: 'Placement', value: 'hero' }])
      return new Response(null, { status: 202 })
    }
    await postTrialWebhook(env, 'trial.cta.clicked', 'Free Trial clicked', { Placement: 'hero' })
  } finally { globalThis.fetch = original }
})

test('webhook rejection fails rather than reporting success or logging the secret', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('secret response body', { status: 401 })
    await assert.rejects(postTrialWebhook(
      { TRIAL_NOTIFICATIONS_WEBHOOK_URL: 'https://example.test/hook?sig=secret' } as Bindings,
      'trial.cta.clicked', 'Free Trial clicked', {},
    ), { message: 'Trial webhook returned HTTP 401' })
  } finally { globalThis.fetch = original }
})

test('missing webhook configuration fails before attempting a request', async () => {
  await assert.rejects(postTrialWebhook({} as Bindings, 'trial.cta.clicked', 'Free Trial clicked', {}), {
    message: 'Trial webhook is not configured',
  })
})
