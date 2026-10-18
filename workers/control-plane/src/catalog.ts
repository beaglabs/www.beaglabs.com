import * as Effect from 'effect/Effect'
import * as Stripe from '@distilled.cloud/stripe'
import { CreateBillingMeter, CreatePrice, CreateProduct, GetBillingMeters, GetPrice, GetPrices, GetProduct } from '@distilled.cloud/stripe/stripe'
import { Env, UserError, first } from './services'
import { AGENT_SECOND_USD, PLATFORM_MONTHLY_USD, VM_HOUR_USD, type PriceKind } from './pricing'
import { stripeLayer } from './billing'

export const PRICE_LOOKUPS: Record<PriceKind, string> = { platform: 'papyrus_platform_v1', compute: 'papyrus_vm_compute_v1', execution: 'papyrus_agent_execution_v1' }
const CENTS: Record<PriceKind, string> = { platform: String(PLATFORM_MONTHLY_USD * 100), compute: String(VM_HOUR_USD * 100), execution: (AGENT_SECOND_USD * 100).toFixed(6) }
const EVENTS = { compute: 'papyrus_vm_hours', execution: 'papyrus_agent_seconds' }
const missing = (cause: unknown) => /No such (price|product)|resource_missing/i.test(String((cause as {message?:string})?.message ?? ''))
const error = (cause: unknown) => new UserError({ message: `Stripe billing configuration: ${(cause as { message?: string })?.message ?? 'request failed'}`, status: 502 })

/** Lookup keys are stable across deployments; deleted or test-account price IDs never leak into Checkout. */
export const catalogPrices = () => Effect.gen(function* () {
  const env = yield* Env
  const layer = stripeLayer(env)
  const found = yield* GetPrices({ active: true, lookup_keys: Object.values(PRICE_LOOKUPS), limit: 100 }).pipe(Effect.provide(layer), Effect.mapError(error))
  const result: Record<PriceKind, string> = { platform: '', compute: '', execution: '' }
  for (const kind of ['platform', 'compute', 'execution'] as const) {
    const existing = found.data.find(p => p.lookup_key === PRICE_LOOKUPS[kind])
    if (existing) {
      const amount = existing.unit_amount_decimal ?? String(existing.unit_amount)
      if (existing.currency !== 'usd' || Number(amount) !== Number(CENTS[kind]) || existing.recurring?.interval !== 'month' || (kind !== 'platform' ? !existing.recurring?.meter || existing.recurring.usage_type !== 'metered' : existing.recurring.usage_type !== 'licensed'))
        return yield* new UserError({ message: `Stripe price ${PRICE_LOOKUPS[kind]} does not match Papyrus pricing.`, status: 502 })
      result[kind] = existing.id
    }
  }
  if (Object.values(result).every(Boolean)) return result
  const configured = env.STRIPE_PRODUCT ? yield* GetProduct({ id: env.STRIPE_PRODUCT }).pipe(Effect.provide(layer), Effect.catch(cause => missing(cause) ? Effect.succeed(null) : Effect.fail(error(cause)))) : null
  const product = configured && !('deleted' in configured) && configured.active ? configured : yield* CreateProduct({ id: 'papyrus_control_plane_v1', name: 'Papyrus', metadata: { application: 'papyrus-control-plane' } }).pipe(
    Stripe.withRequestOptions({ idempotencyKey: 'papyrus-product-v1' }), Effect.provide(layer),
    Effect.catch(() => GetProduct({ id: 'papyrus_control_plane_v1' }).pipe(Effect.provide(layer))), Effect.mapError(error))
  for (const kind of ['platform', 'compute', 'execution'] as const) {
    if (result[kind]) continue
    let meterId: string | undefined
    if (kind !== 'platform') {
      let cursor: string | undefined
      do {
        const meters = yield* GetBillingMeters({ status: 'active', limit: 100, ...(cursor ? { starting_after: cursor } : {}) }).pipe(Effect.provide(layer), Effect.mapError(error))
        meterId = meters.data.find(m => m.event_name === EVENTS[kind])?.id
        cursor = !meterId && meters.has_more ? meters.data.at(-1)?.id : undefined
      } while (cursor)
      if (!meterId) {
        const meter = yield* CreateBillingMeter({ display_name: kind === 'compute' ? 'Papyrus VM hours' : 'Papyrus agent seconds', event_name: EVENTS[kind], default_aggregation: { formula: 'sum' }, customer_mapping: { type: 'by_id', event_payload_key: 'stripe_customer_id' }, value_settings: { event_payload_key: 'value' } }).pipe(Stripe.withRequestOptions({ idempotencyKey: `papyrus-meter-${kind}-v1` }), Effect.provide(layer), Effect.mapError(error))
        meterId = meter.id
      }
    }
    const created = yield* CreatePrice({ product: product.id, currency: 'usd', lookup_key: PRICE_LOOKUPS[kind], unit_amount_decimal: CENTS[kind], recurring: { interval: 'month', usage_type: kind === 'platform' ? 'licensed' : 'metered', ...(meterId ? { meter: meterId } : {}) }, metadata: { application: 'papyrus-control-plane', kind } }).pipe(
      Stripe.withRequestOptions({ idempotencyKey: `papyrus-price-${kind}-v1` }), Effect.provide(layer), Effect.mapError(error))
    result[kind] = created.id
  }
  return result
})

/** Existing subscriptions retain their meter. New deployments use the current catalog. */
export const configuredMeterPrice = (kind: 'compute' | 'execution') => Effect.gen(function* () {
  const env = yield* Env
  const id = kind === 'compute' ? env.STRIPE_PRICE_COMPUTE : env.STRIPE_PRICE_EXECUTION
  if (id && (yield* first<{event_name:string}>('SELECT event_name FROM stripe_meters WHERE price_id = ?', id))) return id
  const existing = id ? yield* GetPrice({ price: id }).pipe(Effect.provide(stripeLayer(env)), Effect.catch(cause => missing(cause) ? Effect.succeed(null) : Effect.fail(error(cause)))) : null
  return existing?.recurring?.meter ? id : (yield* catalogPrices())[kind]
})
