/** A fake api.stripe.com: prices with meters, meters, meter events, Checkout, subscriptions. Records every call. */
export function fakeStripe(options: { meters?: Record<string, { meterId: string; eventName: string }>; trialEnd?: number; failMeterEvents?: boolean } = {}) {
  const meters = options.meters ?? {
    price_compute: { meterId: 'mtr_compute', eventName: 'papyrus_vm_hours' },
    price_execution: { meterId: 'mtr_exec', eventName: 'papyrus_agent_seconds' },
  }
  const calls: Array<{ method: string; path: string; form: URLSearchParams; headers: Headers }> = []
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as RequestInfo, init)
    const url = new URL(request.url)
    const form = new URLSearchParams(request.method === 'GET' ? url.search : await request.text())
    calls.push({ method: request.method, path: url.pathname, form, headers: request.headers })
    const price = /^\/v1\/prices\/([^/]+)$/.exec(url.pathname)
    if (price) {
      const meter = meters[price[1]!]
      return Response.json({ id: price[1], object: 'price', product: 'prod_test', recurring: meter ? { interval: 'month', meter: meter.meterId, usage_type: 'metered' } : { interval: 'month', meter: null, usage_type: 'licensed' } })
    }
    const meter = /^\/v1\/billing\/meters\/([^/]+)$/.exec(url.pathname)
    if (meter) {
      const found = Object.values(meters).find((m) => m.meterId === meter[1])
      return found ? Response.json({ id: meter[1], object: 'billing.meter', event_name: found.eventName }) : Response.json({ error: { type: 'invalid_request_error', message: 'No such meter' } }, { status: 404 })
    }
    if (url.pathname === '/v1/billing/meter_events') {
      if (options.failMeterEvents) return Response.json({ error: { type: 'invalid_request_error', message: 'Meter is inactive' } }, { status: 400 })
      return Response.json({ object: 'billing.meter_event', event_name: form.get('event_name'), identifier: form.get('identifier') })
    }
    if (url.pathname === '/v1/checkout/sessions') return Response.json({ id: 'cs_1', object: 'checkout.session', url: 'https://checkout.stripe.com/c/pay/cs_1' })
    const subscription = /^\/v1\/subscriptions\/([^/]+)$/.exec(url.pathname)
    if (subscription) return Response.json({ id: subscription[1], object: 'subscription', status: 'trialing', trial_end: options.trialEnd ?? null })
    return new Response('unexpected fetch', { status: 599 })
  }) as typeof globalThis.fetch
  const meterEvents = () => calls.filter((c) => c.path === '/v1/billing/meter_events')
  return { fetch, calls, meterEvents }
}
