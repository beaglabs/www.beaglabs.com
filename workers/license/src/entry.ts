import licenseApp from './index'
import portalApp from './portal'
import applicationApp from './application'
import oauthPagesApp from './oauth-pages'
import { buildAuth } from './auth'
import type { Bindings } from './env'

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

export default {
  async fetch(request: Request, env: Bindings, ctx: any): Promise<Response> {
    const path = new URL(request.url).pathname

    // OAuth/OIDC discovery lives at the origin root rather than under
    // Better Auth's /api/auth base path.
    if (path.startsWith('/.well-known/')) {
      return buildAuth(env).handler(request)
    }

    if (path === '/partners/apply' || path === '/partners/apply/') {
      return applicationApp.fetch(request, env, ctx)
    }

    if (path === '/partner/login' || path === '/oauth/consent') {
      return oauthPagesApp.fetch(request, env, ctx)
    }

    if (usePortal(path)) {
      return portalApp.fetch(request, env, ctx)
    }

    return licenseApp.fetch(request, env, ctx)
  },
}
