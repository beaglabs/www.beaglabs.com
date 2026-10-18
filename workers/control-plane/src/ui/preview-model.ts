import type { PreviewView } from './types'

/**
 * Which browser preview a deployment gets. Papyrus sends `frame-ancestors 'self'`, so it is never embedded: a running
 * environment shows a screenshot captured with Cloudflare Browser Rendering (once its health check passes), or an
 * "Open environment" card when screenshots are off. The URL is always the bare public origin: no credentials.
 */

/** At most one capture per deployment per minute. */
export const PREVIEW_RATE_MS = 60_000

const HOST = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

/** https://<host>/ for a plain hostname; null for anything else. */
export const previewUrl = (hostname: string | null | undefined): string | null => (hostname && HOST.test(hostname) ? `https://${hostname}/` : null)

/** No user info, query or fragment: nothing that could carry a credential. */
export const isCredentialFree = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash
  } catch {
    return false
  }
}

export interface PreviewCapture {
  capturedAt: string | null
  attemptedAt: string | null
  error: string | null
}

export interface PreviewInput {
  hostname: string | null
  lifecycle: 'running' | 'stopped' | 'deleting' | 'deleted'
  /** The app endpoint answered (health step passed), not merely "the VM started". */
  healthPassed: boolean
  healthPassedAt: string | null
  /** A setup step failed. */
  failed: boolean
  failedReason?: string | null
  /** Browser Rendering and the preview store are both bound. */
  screenshots: boolean
  capture: PreviewCapture | null
  /** Same-origin image URL for a capture time. */
  imageUrl: (capturedAt: string) => string
  now: number
}

const base = (input: PreviewInput) => ({ url: previewUrl(input.hostname), image: null, capturedAt: null, captureDue: false, canRefresh: false })

export const selectPreview = (input: PreviewInput): PreviewView => {
  const common = base(input)
  if (input.lifecycle === 'deleting' || input.lifecycle === 'deleted')
    return { ...common, state: 'unavailable', mode: 'none', title: input.lifecycle === 'deleted' ? 'Deleted' : 'Being deleted', reason: 'This environment is being removed and no longer serves Papyrus.' }
  if (input.lifecycle === 'stopped')
    return { ...common, state: 'stopped', mode: 'none', title: 'Stopped', reason: 'Nothing is running. Start the deployment to bring Papyrus back; data and address are kept.' }
  if (input.failed)
    return { ...common, state: 'failed', mode: 'none', title: 'Setup failed', reason: input.failedReason || 'A setup step failed. See Progress for the stage and how to recover.' }
  if (!input.healthPassed || !common.url)
    return { ...common, state: 'provisioning', mode: 'none', title: 'Provisioning', reason: 'The preview appears once Papyrus answers its health check.' }

  if (!input.screenshots)
    return { ...common, state: 'running', mode: 'card', title: 'Running', reason: 'Papyrus does not allow being framed, so open it in a new tab.' }

  const attempted = Date.parse(input.capture?.attemptedAt ?? '')
  const limited = Number.isFinite(attempted) && input.now - attempted < PREVIEW_RATE_MS
  const capturedAt = input.capture?.capturedAt ?? null
  // A capture from before the latest health pass (e.g. before a redeploy or Start) is out of date.
  const fresh = Boolean(capturedAt) && !(Date.parse(capturedAt!) < Date.parse(input.healthPassedAt ?? ''))
  if (capturedAt && fresh)
    return { ...common, state: 'running', mode: 'screenshot', image: input.imageUrl(capturedAt), capturedAt, canRefresh: !limited, title: 'Running', reason: 'Screenshot of the public sign-in page. Papyrus cannot be framed here.' }

  const failedAfter = input.capture?.error && Number.isFinite(attempted) && !(attempted < Date.parse(input.healthPassedAt ?? ''))
  if (failedAfter)
    return { ...common, state: 'running', mode: 'card', capturedAt, canRefresh: !limited, title: 'Running', reason: `Screenshot unavailable (${input.capture!.error}). Open Papyrus in a new tab.` }

  return { ...common, state: 'loading', mode: 'screenshot', captureDue: !limited, title: 'Capturing preview', reason: 'Taking a screenshot of the public sign-in page.' }
}
