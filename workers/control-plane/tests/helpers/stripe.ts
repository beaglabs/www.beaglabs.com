/** A fake api.stripe.com: prices with meters, meters, meter events, Checkout, subscriptions. Records every call. */
export function fakeStripe(options: { meters?: Record<string, { meterId: string; eventName: string }>; trialEnd?: number; failMeterEvents?: boolean; failCheckout?: boolean; missingCatalog?: boolean } = {}) {
  const meters = options.meters ?? {
    price_compute: { meterId: 'mtr_compute', eventName: 'papyrus_vm_hours' },
    price_execution: { meterId: 'mtr_exec', eventName: 'papyrus_agent_seconds' },
  }
  const calls: Array<{ method: string; path: string; form: URLSearchParams; headers: Headers }> = []
  const createdPrices: any[] = []
  const grants = new Map<string, any>()
  const sessions = new Map<string, Record<string, any>>()
  const subscriptions = new Map<string, Record<string, any>>()
  const completeCheckout = (id = 'cs_1', status = 'active') => {
    const session = sessions.get(id)!
    const subscription = { id: `sub_${id}`, object: 'subscription', status, customer: session.customer ?? `cus_${id}`, metadata: session.metadata, trial_end: options.trialEnd ?? null }
    subscriptions.set(subscription.id, subscription)
    Object.assign(session, { status: 'complete', payment_status: 'no_payment_required', subscription: subscription.id, customer: subscription.customer })
    return session
  }
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as RequestInfo, init)
    const url = new URL(request.url)
    const form = new URLSearchParams(request.method === 'GET' ? url.search : await request.text())
    calls.push({ method: request.method, path: url.pathname, form, headers: request.headers })
    if (url.pathname === '/v1/products/prod_test') return Response.json({id:'prod_test',object:'product',active:true})
    if (url.pathname === '/v1/billing/meters') return Response.json({object:'list',has_more:false,data:Object.values(meters).map(m => ({id:m.meterId,event_name:m.eventName,status:'active'}))})
    if (url.pathname === '/v1/prices' && request.method === 'POST') {
      const kind = form.get('metadata[kind]')!
      const created = {id:`price_${kind}`,object:'price',lookup_key:form.get('lookup_key'),currency:form.get('currency'),unit_amount_decimal:form.get('unit_amount_decimal'),recurring:{interval:'month',usage_type:form.get('recurring[usage_type]'),meter:form.get('recurring[meter]')}}
      createdPrices.push(created)
      return Response.json(created)
    }
    if (url.pathname === '/v1/prices') return Response.json({object:'list', has_more:false, data: options.missingCatalog ? createdPrices : [
      {id:'price_platform',object:'price',lookup_key:'papyrus_platform_v1',currency:'usd',unit_amount_decimal:'25000',recurring:{interval:'month',usage_type:'licensed'}},
      {id:'price_compute',object:'price',lookup_key:'papyrus_vm_compute_v1',currency:'usd',unit_amount_decimal:'50',recurring:{interval:'month',usage_type:'metered',meter:'mtr_compute'}},
      {id:'price_execution',object:'price',lookup_key:'papyrus_agent_execution_v1',currency:'usd',unit_amount_decimal:'0.194444',recurring:{interval:'month',usage_type:'metered',meter:'mtr_exec'}}
    ]})
    if (url.pathname === '/v1/customers') return Response.json({id:'cus_credit',object:'customer'})
    if (url.pathname === '/v1/billing/credit_grants' && request.method === 'GET') return Response.json({object:'list',data:[...grants.values()],has_more:false})
    if (url.pathname === '/v1/billing/credit_grants') {
      const grant = {id:'credgr_1',object:'billing.credit_grant',metadata:{code_hash:form.get('metadata[code_hash]'),deployment_id:form.get('metadata[deployment_id]')}}
      grants.set(grant.id,grant)
      return Response.json(grant)
    }
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
    if (url.pathname === '/v1/checkout/sessions') {
      if (options.failCheckout) return Response.json({ error: { type: 'invalid_request_error', message: 'Checkout unavailable' } }, { status: 400 })
      const id = `cs_${sessions.size + 1}`
      const session = { id, object: 'checkout.session', mode: 'subscription', status: 'open', client_reference_id: form.get('client_reference_id'), metadata: { deployment_id: form.get('metadata[deployment_id]'), account_id: form.get('metadata[account_id]') }, url: `https://checkout.stripe.com/c/pay/${id}`, customer: form.get('customer'), subscription: null }
      sessions.set(id, session)
      return Response.json(session)
    }
    const checkout = /^\/v1\/checkout\/sessions\/([^/]+)$/.exec(url.pathname)
    if (checkout) return Response.json(sessions.get(checkout[1]!) ?? {})
    const subscription = /^\/v1\/subscriptions\/([^/]+)$/.exec(url.pathname)
    if (subscription) return Response.json(subscriptions.get(subscription[1]!) ?? { id: subscription[1], object: 'subscription', status: 'trialing', trial_end: options.trialEnd ?? null })
    return new Response('unexpected fetch', { status: 599 })
  }) as typeof globalThis.fetch
  const meterEvents = () => calls.filter((c) => c.path === '/v1/billing/meter_events')
  return { fetch, calls, meterEvents, sessions, subscriptions, grants, completeCheckout }
}
