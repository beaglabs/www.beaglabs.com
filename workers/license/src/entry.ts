import { postTrialWebhook } from './trial-webhook'
import licenseApp from './index'
import portalApp from './portal'
import applicationApp from './application'
import oauthPagesApp from './oauth-pages'
import publicApp from './public-api'
import organizationLicensingApp from './organization-licensing'
import entitlementAddonsApp from './entitlement-addons'
import provisioningBrandingApp from './provisioning-branding'
import marketplaceApp from './marketplace'
import marketplaceLeadApp from './marketplace-leads'
import marketplaceReportApp, { syncMarketplaceVmUsageScheduled } from './marketplace-reports'
import provisionApp from './provision'
import provisionAdminApp from './provision-admin'
import { buildAuth } from './auth'
import type { Bindings } from './env'

const WWW_ORIGIN = 'https://beaglabs.com'
const ALLOWED_BROWSER_ORIGINS = new Set([
  WWW_ORIGIN,
  'https://beaglabs.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

const UI_REDIRECTS = new Map<string, string>([
  ['/', '/crm'],
  ['/login', '/crm'],
  ['/admin', '/crm'],
  ['/partners/apply', '/partners/apply'],
  ['/partner/login', '/partners/login'],
  ['/partner/invite', '/partners/invite'],
  ['/partner-application/review', '/partners/review'],
  ['/portal', '/partners/portal'],
  ['/oauth/consent', '/partners/oauth/consent'],
])

function usePortal(path: string): boolean {
  return path === '/' ||
    path === '/login' ||
    path === '/admin' ||
    path.startsWith('/partner/') ||
    path.startsWith('/partner-application/') ||
    path === '/portal' ||
    path.startsWith('/api/partner/') ||
    path.startsWith('/oauth/')
}

function useProvisioningBranding(path: string, method: string): boolean {
  return (path === '/api/v1/deployments' && method === 'POST') ||
    (/^\/api\/v1\/deployments\/[^/]+\/branding\/?$/.test(path) && (method === 'PUT' || method === 'PATCH')) ||
    (/^\/api\/v1\/deployments\/[^/]+\/licenses\/?$/.test(path) && method === 'POST')
}

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

function withCors(request: Request, response: Response): Response {
  const origin = allowedOrigin(request)
  if (!origin) return response

  const wrapped = new Response(response.body, response)
  wrapped.headers.set('Access-Control-Allow-Origin', origin)
  wrapped.headers.set('Access-Control-Allow-Credentials', 'true')
  wrapped.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  wrapped.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Beag-Signature, X-Beag-Timestamp')
  wrapped.headers.set('Access-Control-Expose-Headers', 'Content-Disposition')
  appendVary(wrapped.headers, 'Origin')
  return wrapped
}

function uiRedirect(url: URL): Response | null {
  const destination = UI_REDIRECTS.get(url.pathname.replace(/\/$/, '') || '/')
  if (!destination) return null
  const target = new URL(destination, WWW_ORIGIN)
  target.search = url.search
  return Response.redirect(target.toString(), 302)
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
      Destination: '/provision/commercial',
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
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method === 'GET') {
    const redirect = uiRedirect(url)
    if (redirect) return redirect
  }

  if (path === '/api/events/trial-click' && request.method === 'POST') {
    return notifyTrialClick(request, env)
  }

  if (path.startsWith('/.well-known/')) {
    return buildAuth(env).handler(request)
  }

  // These two routes intentionally override the legacy Marketplace handlers:
  // lead ingestion enforces Microsoft ActionCode semantics, while VM analytics
  // uses Partner Center's production Scheduled Reports API instead of the
  // testQueryResult endpoint.
  if (path === '/api/marketplace/leads' && request.method === 'POST') {
    return marketplaceLeadApp.fetch(request, env, ctx)
  }
  if (path === '/api/v1/marketplace/sync' && request.method === 'POST') {
    return marketplaceReportApp.fetch(request, env, ctx)
  }

  if (path.startsWith('/api/marketplace/') || path.startsWith('/api/v1/marketplace/')) {
    return marketplaceApp.fetch(request, env, ctx)
  }

  if (path.startsWith('/api/public/')) {
    return publicApp.fetch(request, env, ctx)
  }

  if (path.startsWith('/api/provision/')) {
    return provisionApp.fetch(request, env, ctx)
  }

  if (path.startsWith('/api/v1/provisioned-accounts')) {
    return provisionAdminApp.fetch(request, env, ctx)
  }

  if (path === '/partners/apply' || path === '/partners/apply/') {
    return applicationApp.fetch(request, env, ctx)
  }

  if (path === '/partner/login' || path === '/oauth/consent') {
    return oauthPagesApp.fetch(request, env, ctx)
  }

  if (/^\/api\/v1\/entitlements\/[^/]+\/(?:license-scope|licenses)\/?$/.test(path)) {
    return organizationLicensingApp.fetch(request, env, ctx)
  }

  if (/^\/api\/v1\/entitlements\/[^/]+\/addons(?:\/[^/]+\/revoke)?\/?$/.test(path)) {
    return entitlementAddonsApp.fetch(request, env, ctx)
  }

  if (useProvisioningBranding(path, request.method)) {
    return provisioningBrandingApp.fetch(request, env, ctx)
  }

  if (usePortal(path)) {
    return portalApp.fetch(request, env, ctx)
  }

  return licenseApp.fetch(request, env, ctx)
}

export default {
  async fetch(request: Request, env: Bindings, ctx: any): Promise<Response> {
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
