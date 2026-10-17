import { postTrialWebhook } from './trial-webhook'
import marketplaceLeadApp from './marketplace-leads'
import { syncMarketplaceVmUsageScheduled } from './marketplace-reports'
import type { Bindings } from './env'
import api, { isApiPath, isOpenCorsPath } from './api'

export { ConversationRoom } from './conversation-room'

const WWW_ORIGIN = 'https://beaglabs.com'
const ALLOWED_BROWSER_ORIGINS = new Set([
  WWW_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  return origin && ALLOWED_BROWSER_ORIGINS.has(origin) ? origin : null
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get('Vary')
  if (!current) {
    headers.set('Vary', value)
    return
  }
  if (!current.split(',').map((item) => item.trim().toLowerCase()).includes(value.toLowerCase())) {
    headers.set('Vary', `${current}, ${value}`)
  }
}

const OPEN_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
  'Access-Control-Expose-Headers': 'Content-Disposition, Content-Range, Content-Length, Accept-Ranges',
  'Access-Control-Max-Age': '86400',
}

/** Header-authenticated APIs (chat, session, track, admin): any origin, never credentials. */
function withOpenCors(response: Response): Response {
  if (response.status === 101) return response // WebSocket upgrades must pass through untouched
  const wrapped = new Response(response.body, response)
  for (const [name, value] of Object.entries(OPEN_CORS_HEADERS)) wrapped.headers.set(name, value)
  return wrapped
}

function withCors(request: Request, response: Response): Response {
  if (isOpenCorsPath(new URL(request.url).pathname)) return withOpenCors(response)
  if (response.status === 101) return response
  const origin = allowedOrigin(request)
  if (!origin) return response

  const wrapped = new Response(response.body, response)
  wrapped.headers.set('Access-Control-Allow-Origin', origin)
  wrapped.headers.set('Access-Control-Allow-Credentials', 'true')
  wrapped.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  wrapped.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Beag-Signature, X-Beag-Timestamp')
  wrapped.headers.set('Access-Control-Expose-Headers', 'Content-Disposition')
  appendVary(wrapped.headers, 'Origin')
  return wrapped
}

const recentTrialClicks = new Map<string, number>()
async function notifyTrialClick(request: Request, env: Bindings): Promise<Response> {
  const origin = request.headers.get('origin')
  if (!origin || !ALLOWED_BROWSER_ORIGINS.has(origin)) {
    console.warn('trial click rejected: origin', { origin })
    return new Response(null, {status:403})
  }
  if (request.headers.get('sec-fetch-site') && !['same-site','cross-site'].includes(request.headers.get('sec-fetch-site')!)) {
    console.warn('trial click rejected: fetch site', { site: request.headers.get('sec-fetch-site') })
    return new Response(null, {status:403})
  }
  if (Number(request.headers.get('content-length') || 0) > 1024) return new Response(null, {status:413})
  const raw = await request.text()
  if (raw.length > 1024) return new Response(null, {status:413})
  let input: Record<string,unknown>
  try { input = JSON.parse(raw) } catch { return new Response(null, {status:400}) }
  if (input.event !== 'trial.cta.clicked' || (input.placement !== 'hero' && input.placement !== 'final')) return new Response(null, {status:400})
  if (!env.TRIAL_NOTIFICATIONS_WEBHOOK_URL) {
    console.error('trial click notification missing webhook configuration')
    return new Response(null, {status:503})
  }
  const now = Date.now()
  const key = (request.headers.get('cf-connecting-ip') || 'anonymous') + '|' + input.placement
  if (recentTrialClicks.size > 1500) for (const [id, last] of recentTrialClicks) if (now-last > 3600000) recentTrialClicks.delete(id)
  if (now-(recentTrialClicks.get(key) || 0) < 3600000) {
    console.info('trial click notification suppressed: hourly limit', { placement: input.placement })
    return new Response(null, {status:204})
  }
  recentTrialClicks.set(key, now)
  console.info('trial click notification sending', { placement: input.placement })
  try {
    const page = typeof input.page === 'string' && input.page.startsWith('/') && input.page.length <= 200
      ? input.page.split('?')[0] : '/'
    await postTrialWebhook(env, 'trial.cta.clicked', 'Papyrus — Free Trial button clicked', {
      Placement: String(input.placement),
      Page: page,
      Time: new Date(now).toISOString(),
      Destination: 'Azure Marketplace listing',
      Note: 'Anonymous button click; not a confirmed Azure trial.',
    })
    return new Response(null, {status:204})
  } catch (error) {
    recentTrialClicks.delete(key)
    // Fetch failures may include the secret URL; log only our own HTTP errors.
    const message = error instanceof Error && error.message.startsWith('Trial webhook returned HTTP ')
      ? error.message : 'Webhook request failed or timed out'
    console.error('trial click webhook failed', { message })
    return new Response(null, {status:503})
  }
}

async function route(request: Request, env: Bindings, ctx: any): Promise<Response> {
  const path = new URL(request.url).pathname

  if (path === '/health' && request.method === 'GET') {
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (path === '/api/events/trial-click' && request.method === 'POST') {
    return notifyTrialClick(request, env)
  }

  // Lead ingestion enforces Microsoft ActionCode semantics.
  if (path === '/api/marketplace/leads' && request.method === 'POST') {
    return marketplaceLeadApp.fetch(request, env, ctx)
  }

  if (isApiPath(path)) {
    return api.fetch(request, env, ctx)
  }

  return Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
}

export default {
  async fetch(request: Request, env: Bindings, ctx: any): Promise<Response> {
    if (request.method === 'OPTIONS' && isOpenCorsPath(new URL(request.url).pathname)) {
      return withOpenCors(new Response(null, { status: 204 }))
    }
    if (request.method === 'OPTIONS' && allowedOrigin(request)) {
      return withCors(request, new Response(null, { status: 204 }))
    }
    try {
      return withCors(request, await route(request, env, ctx))
    } catch (error) {
      console.error('license-worker unhandled request error', error)
      return withCors(request, Response.json(
        { error: 'internal_error', message: 'Internal server error.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      ))
    }
  },

  async scheduled(_controller: any, env: Bindings, ctx: any): Promise<void> {
    ctx.waitUntil(
      syncMarketplaceVmUsageScheduled(env).catch((error) => {
        console.error('scheduled Marketplace VM usage sync failed', error)
      }),
    )
  },
}
