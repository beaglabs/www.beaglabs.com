/** Registration, control-plane exchange, event pipe and Sentry routes. */
import { Hono } from 'hono'
import { handleControlPlaneExchange } from './control-plane'
import type { Bindings } from './env'
import { handleBootstrap } from './registration'
import { handleSentryWebhook } from './sentry'
import { handleTrack } from './track'
import { errorResponse, type WaitUntil } from './util'

const api = new Hono<{ Bindings: Bindings }>()

/** Hono throws when executionCtx is read outside a Worker (tests); fall back to no background work. */
function waitUntilOf(c: { executionCtx: unknown }): WaitUntil | undefined {
  try { return c.executionCtx as WaitUntil } catch { return undefined }
}

api.onError((error) => errorResponse(error))
api.notFound(() => Response.json({ error: 'not_found', message: 'Not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } }))

api.post('/api/provision/bootstrap', (c) => handleBootstrap(c.req.raw, c.env))
api.post('/api/provision/control-plane/exchange', (c) => handleControlPlaneExchange(c.req.raw, c.env))
api.post('/api/v1/track', (c) => handleTrack(c.req.raw, c.env, waitUntilOf(c)))
api.post('/api/sentry/webhook', (c) => handleSentryWebhook(c.req.raw, c.env))

/** Paths served by `api`. */
export const API_PREFIXES = ['/api/provision/bootstrap', '/api/provision/control-plane/exchange', '/api/v1/track', '/api/sentry/']

/** Deployment-header API (no cookies) that Papyrus calls cross-origin: any origin is allowed. */
export const OPEN_CORS_PREFIXES = ['/api/v1/track']

export function isApiPath(path: string): boolean {
  return API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

export function isOpenCorsPath(path: string): boolean {
  return OPEN_CORS_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

export default api
