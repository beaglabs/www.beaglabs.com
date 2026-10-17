import assert from 'node:assert/strict'
import { test } from 'vitest'
import { marketplaceCard, notifyMarketplaceEvent } from '../src/marketplace-notify'
import type { Bindings } from '../src/env'

const URL_A = 'https://example.test/marketplace?sig=secret-a'
const URL_B = 'https://example.test/trial?sig=secret-b'

test('card drops empty facts, truncates long values and labels Microsoft test leads', () => {
  const card = marketplaceCard({
    type: 'marketplace.lead.received', test: true,
    facts: { Company: 'Contoso', Phone: '', Country: null, Offer: 'x'.repeat(400) },
  })
  assert.equal(card.title, 'Papyrus — New Azure Marketplace lead (Microsoft test lead)')
  assert.deepEqual(Object.keys(card.details), ['Company', 'Offer'])
  assert.equal(card.details.Offer.length, 300)
})

test('prefers the marketplace webhook, falls back to the trial webhook, and sends nothing when unset', async () => {
  const original = globalThis.fetch
  const urls: string[] = []
  try {
    globalThis.fetch = async (url) => { urls.push(String(url)); return new Response(null, { status: 202 }) }
    const event = { type: 'marketplace.vm.detected', facts: { Plan: 'beag/papyrus/std' } } as const
    await notifyMarketplaceEvent({ MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL: URL_A, TRIAL_NOTIFICATIONS_WEBHOOK_URL: URL_B } as Bindings, event)
    await notifyMarketplaceEvent({ TRIAL_NOTIFICATIONS_WEBHOOK_URL: URL_B } as Bindings, event)
    await notifyMarketplaceEvent({} as Bindings, event)
    assert.deepEqual(urls, [URL_A, URL_B])
  } finally { globalThis.fetch = original }
})

test('webhook failure never rejects, never leaks the signed URL, and runs under waitUntil', async () => {
  const original = globalThis.fetch
  const originalError = console.error
  const logged: string[] = []
  try {
    console.error = (...args: unknown[]) => { logged.push(JSON.stringify(args)) }
    globalThis.fetch = async () => { throw new TypeError(`fetch failed for ${URL_A}`) }
    const pending: Promise<unknown>[] = []
    await notifyMarketplaceEvent(
      { MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL: URL_A } as Bindings,
      { type: 'marketplace.customer.new', facts: { Company: 'Acme' } },
      { waitUntil: (p) => { pending.push(p) } },
    )
    assert.equal(pending.length, 1)
    await Promise.all(pending)
    globalThis.fetch = async () => new Response('nope', { status: 500 })
    await notifyMarketplaceEvent({ MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL: URL_A } as Bindings, { type: 'marketplace.customer.new', facts: {} })
    assert.ok(logged.length === 2)
    assert.ok(!logged.join('').includes('secret-a'))
    assert.match(logged[1], /HTTP 500/)
  } finally { globalThis.fetch = original; console.error = originalError }
})
