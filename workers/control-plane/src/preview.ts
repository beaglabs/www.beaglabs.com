import * as Effect from 'effect/Effect'
import type { Bindings } from './env'
import { Env, UserError, first, nowIso, run, type Deployment } from './services'
import { PREVIEW_RATE_MS, isCredentialFree, previewUrl, type PreviewCapture } from './ui/preview-model'

/**
 * Browser preview screenshots. Papyrus sends `frame-ancestors 'self'`, so the control plane never frames it: once the
 * health check passes, Cloudflare Browser Rendering opens the public page (the sign-in or setup screen, no
 * credentials) and the JPEG is kept in R2 with its capture time. One capture per deployment per minute.
 */

/** Takes a JPEG of a public URL. Tests pass a fake; production uses Browser Rendering. */
export type CaptureFn = (env: Bindings, url: string) => Promise<Uint8Array>

export const screenshotsEnabled = (env: Pick<Bindings, 'BROWSER' | 'PREVIEWS'>) => Boolean(env.BROWSER && env.PREVIEWS)

const objectKey = (deploymentId: string) => `previews/${deploymentId}.jpg`

export const browserCapture: CaptureFn = async (env, url) => {
  if (!env.BROWSER) throw new Error('Browser Rendering is not bound')
  const { default: puppeteer } = await import('@cloudflare/puppeteer')
  const browser = await puppeteer.launch(env.BROWSER)
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 25_000 })
    const shot = await page.screenshot({ type: 'jpeg', quality: 72 })
    return shot instanceof Uint8Array ? shot : new Uint8Array(shot as ArrayBuffer)
  } finally {
    await browser.close()
  }
}

export const loadCapture = (deploymentId: string) =>
  first<{ captured_at: string | null; attempted_at: string | null; error: string | null }>('SELECT captured_at, attempted_at, error FROM preview_captures WHERE deployment_id = ?', deploymentId).pipe(
    Effect.map((row): PreviewCapture | null => (row ? { capturedAt: row.captured_at, attemptedAt: row.attempted_at, error: row.error } : null)),
  )

/** Claim the next capture slot; false while the last attempt is under a minute old. */
export const claimCapture = (deploymentId: string, now = Date.now()) =>
  run(
    `INSERT INTO preview_captures (deployment_id, attempted_at) VALUES (?, ?)
     ON CONFLICT(deployment_id) DO UPDATE SET attempted_at = excluded.attempted_at
     WHERE preview_captures.attempted_at IS NULL OR preview_captures.attempted_at < ?`,
    deploymentId,
    new Date(now).toISOString(),
    new Date(now - PREVIEW_RATE_MS).toISOString(),
  ).pipe(Effect.map((changes) => changes > 0))

/** Seconds until the next capture is allowed. */
export const retryAfter = (capture: PreviewCapture | null, now = Date.now()) => {
  const attempted = Date.parse(capture?.attemptedAt ?? '')
  return Number.isFinite(attempted) ? Math.max(1, Math.ceil((attempted + PREVIEW_RATE_MS - now) / 1000)) : 0
}

/** Whether this deployment may be captured at all: running, healthy, with a plain public address. */
export const capturable = (deployment: Deployment) => deployment.lifecycle === 'running' && deployment.steps.health.status === 'pass' && previewUrl(deployment.hostname) !== null

/** Capture and store (the slot must already be claimed). Errors are recorded, not thrown. */
export const captureAndStore = (deployment: Deployment, capture: CaptureFn) =>
  Effect.gen(function* () {
    const env = yield* Env
    const url = previewUrl(deployment.hostname)
    if (!url || !isCredentialFree(url) || !env.PREVIEWS) return false
    const result = yield* Effect.tryPromise({ try: () => capture(env, url), catch: (cause) => (cause instanceof Error ? cause.message : 'capture failed') }).pipe(Effect.result)
    if (result._tag === 'Failure') {
      yield* run('UPDATE preview_captures SET error = ? WHERE deployment_id = ?', result.failure.slice(0, 160), deployment.id)
      return false
    }
    const capturedAt = nowIso()
    const stored = yield* Effect.tryPromise({
      try: () => env.PREVIEWS!.put(objectKey(deployment.id), result.success, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { capturedAt, url } }),
      catch: () => 'storing the screenshot failed',
    }).pipe(Effect.result)
    if (stored._tag === 'Failure') {
      yield* run('UPDATE preview_captures SET error = ? WHERE deployment_id = ?', stored.failure, deployment.id)
      return false
    }
    yield* run('UPDATE preview_captures SET url = ?, captured_at = ?, error = NULL WHERE deployment_id = ?', url, capturedAt, deployment.id)
    return true
  })

/** POST /api/deployments/:id/preview: claim a slot (429 when rate-limited) and capture. */
export const requestCapture = (deployment: Deployment) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (!screenshotsEnabled(env)) return yield* new UserError({ message: 'Screenshot previews are not enabled here.', status: 503 })
    if (!capturable(deployment)) return yield* new UserError({ message: 'The preview is captured once Papyrus answers its health check.', status: 409 })
    if (!(yield* claimCapture(deployment.id))) {
      const wait = retryAfter(yield* loadCapture(deployment.id))
      return yield* new UserError({ message: `A preview was just taken. Try again in ${wait}s.`, status: 429 })
    }
    return true
  })

/** The stored JPEG, or null. */
export const previewObject = (deploymentId: string) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (!env.PREVIEWS) return null
    return yield* Effect.promise(() => env.PREVIEWS!.get(objectKey(deploymentId)))
  })

export const deletePreview = (deploymentId: string) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (env.PREVIEWS) yield* Effect.promise(() => env.PREVIEWS!.delete(objectKey(deploymentId)).catch(() => undefined))
    yield* run('DELETE FROM preview_captures WHERE deployment_id = ?', deploymentId)
  })
