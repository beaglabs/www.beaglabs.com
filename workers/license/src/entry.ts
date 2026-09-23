import licenseApp from './index'
import portalApp from './portal'
import { buildAuth } from './auth'
import type { Bindings } from './env'

type ExecutionContextLike = ExecutionContext

function usePortal(path: string): boolean {
  return path === '/' ||
    path === '/login' ||
    path === '/admin' ||
    path.startsWith('/partners/') ||
    path.startsWith('/partner/') ||
    path === '/portal' ||
    path.startsWith('/api/partner/') ||
    path.startsWith('/oauth/')
}

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContextLike): Promise<Response> {
    const path = new URL(request.url).pathname

    // OAuth/OIDC discovery lives at the origin root rather than under
    // Better Auth's /api/auth base path.
    if (path.startsWith('/.well-known/')) {
      return buildAuth(env).handler(request)
    }

    if (usePortal(path)) {
      return portalApp.fetch(request, env, ctx)
    }

    return licenseApp.fetch(request, env, ctx)
  },
}
