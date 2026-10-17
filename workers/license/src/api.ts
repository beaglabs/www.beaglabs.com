/** Admin app, Papyrus chat, registration, event pipe and Sentry routes. */
import { Hono } from 'hono'
import adminRoutes from './admin-routes'
import chatRoutes, { waitUntilOf } from './chat-routes'
import type { Bindings } from './env'
import { handleBootstrap, handlePapyrusSession } from './registration'
import { handleSentryWebhook } from './sentry'
import { handleTrack } from './track'
import { errorResponse } from './util'

const api = new Hono<{ Bindings: Bindings }>()

api.onError((error) => errorResponse(error))
api.notFound(() => Response.json({ error: 'not_found', message: 'Not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } }))

api.post('/api/provision/bootstrap', (c) => handleBootstrap(c.req.raw, c.env, waitUntilOf(c)))
api.post('/api/papyrus/session', (c) => handlePapyrusSession(c.req.raw, c.env, waitUntilOf(c)))
api.post('/api/v1/track', (c) => handleTrack(c.req.raw, c.env, waitUntilOf(c)))
api.post('/api/sentry/webhook', (c) => handleSentryWebhook(c.req.raw, c.env, waitUntilOf(c)))
api.route('/', chatRoutes)
api.route('/', adminRoutes)

/** Paths served by `api`. */
export const API_PREFIXES = ['/api/provision/bootstrap', '/api/papyrus/', '/api/v1/track', '/api/sentry/', '/api/chat/', '/api/huddles/', '/api/admin/']

/**
 * Bearer/Deployment-header APIs (no cookies) that browsers on arbitrary Papyrus
 * origins and the Tauri app call cross-origin: any origin is allowed.
 */
export const OPEN_CORS_PREFIXES = ['/api/papyrus/', '/api/v1/track', '/api/chat/', '/api/huddles/', '/api/admin/']

export function isApiPath(path: string): boolean {
  return API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

export function isOpenCorsPath(path: string): boolean {
  return OPEN_CORS_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

export default api
