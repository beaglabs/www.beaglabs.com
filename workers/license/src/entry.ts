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

const WWW_ORIGIN = 'https://www.beaglabs.com'
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

async function route(request: Request, env: Bindings, ctx: any): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method === 'GET') {
    const redirect = uiRedirect(url)
    if (redirect) return redirect
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
