import type { Bindings } from './env'
import { postTrialWebhook } from './trial-webhook'

type Facts = Record<string, string | number | null | undefined>

export type MarketplaceEvent =
  | { type: 'marketplace.lead.received'; test: boolean; facts: Facts }
  | { type: 'marketplace.vm.detected'; facts: Facts }
  | { type: 'marketplace.deployment.claimed'; facts: Facts }
  | { type: 'marketplace.customer.new'; facts: Facts }
  | { type: 'marketplace.onboarding.completed'; facts: Facts }

const TITLES: Record<MarketplaceEvent['type'], string> = {
  'marketplace.lead.received': 'Papyrus — New Azure Marketplace lead',
  'marketplace.vm.detected': 'Papyrus — Marketplace VM detected',
  'marketplace.deployment.claimed': 'Papyrus — Deployment claimed',
  'marketplace.customer.new': 'Papyrus — New Marketplace customer',
  'marketplace.onboarding.completed': 'Papyrus — Customer onboarding completed',
}

const MAX_FACT_LENGTH = 300

export function marketplaceCard(event: MarketplaceEvent): { title: string; details: Record<string, string> } {
  const details: Record<string, string> = {}
  for (const [name, value] of Object.entries(event.facts)) {
    if (value == null) continue
    const text = String(value).trim()
    if (text) details[name] = text.slice(0, MAX_FACT_LENGTH)
  }
  const test = event.type === 'marketplace.lead.received' && event.test
  return { title: test ? `${TITLES[event.type]} (Microsoft test lead)` : TITLES[event.type], details }
}

/** Minimal slice of ExecutionContext so callers and tests do not need the Workers runtime types. */
export interface WaitUntil { waitUntil(promise: Promise<unknown>): void }

export function executionContext(c: { executionCtx: WaitUntil }): WaitUntil | undefined {
  try { return c.executionCtx } catch { return undefined }
}

/**
 * Post a Marketplace event card to Teams. Never throws and never blocks the caller's
 * response when an execution context is supplied. Only the event name and our own HTTP
 * status are logged: fetch failures can embed the signed webhook URL.
 */
export function notifyMarketplaceEvent(env: Bindings, event: MarketplaceEvent, ctx?: WaitUntil): Promise<void> {
  const url = env.MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL || env.TRIAL_NOTIFICATIONS_WEBHOOK_URL
  if (!url) return Promise.resolve()
  const { title, details } = marketplaceCard(event)
  const sent = postTrialWebhook({ ...env, TRIAL_NOTIFICATIONS_WEBHOOK_URL: url }, event.type, title, details)
    .catch((error) => {
      const message = error instanceof Error && error.message.startsWith('Trial webhook returned HTTP ')
        ? error.message : 'Webhook request failed or timed out'
      console.error('marketplace notification failed', { event: event.type, message })
    })
  if (ctx) { ctx.waitUntil(sent); return Promise.resolve() }
  return sent
}
