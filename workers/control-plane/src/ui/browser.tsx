import { IconAlert, IconExternal, IconLock, IconPower, IconRefresh } from './icons'
import { relative } from './format'
import { LoadingCarousel, Spinner, type Tip } from './primitives'
import type { PreviewView } from './types'

/**
 * The browser preview frame. Never an iframe (Papyrus sends frame-ancestors 'self'): a clearly labelled screenshot of
 * the public page, or an "Open environment" card. Stays mounted across polls; only its state changes.
 */

export const SETUP_TIPS: Tip[] = [
  { title: 'Connect Microsoft next', body: 'Once Papyrus answers, a Microsoft 365 admin opens it and connects Entra. After that your whole team signs in with Microsoft.' },
  { title: 'Your address is yours', body: 'The address in the bar above is permanent. Bookmark it and share it with your team once setup finishes.' },
  { title: 'Unlimited users', body: 'Invite everyone. Papyrus is priced per deployment, not per seat.' },
  { title: 'Start with one workflow', body: 'Describe a process you run every week. Papyrus agents draft the steps for you to review before anything runs.' },
  { title: 'Compute credit', body: 'Redeem your $1,000 compute credit in Billing for one deployment. Platform fees are billed separately.' },
  { title: 'Stuck?', body: 'Email James at Beag Labs. Support answers within 48 hours, usually much sooner.' },
]

export interface BrowserFrameProps {
  preview: PreviewView
  statusLabel: string
  operation: string | null
  now: number
  mounted: boolean
  refreshing: boolean
  onRefresh: () => void
}

export const BrowserFrame = ({ preview, statusLabel, operation, now, mounted, refreshing, onRefresh }: BrowserFrameProps) => {
  const live = preview.state === 'running' || preview.state === 'loading'
  const host = preview.url?.replace(/^https:\/\//, '').replace(/\/$/, '')
  return (
    <section class="bf" aria-labelledby="preview-h" data-state={preview.state}>
      <h2 id="preview-h" class="sr-only">
        Preview
      </h2>
      <div class="bf-bar">
        <span class="bf-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div class="bf-url" title={preview.url ?? undefined}>
          <IconLock />
          {host ? (
            <span>
              <span class="bf-scheme">https://</span>
              {host}
            </span>
          ) : (
            <span class="bf-none">No address yet</span>
          )}
        </div>
        <button type="button" class="bf-btn" onClick={onRefresh} disabled={!preview.canRefresh || refreshing} aria-label="Retake screenshot" title={preview.canRefresh ? 'Retake screenshot' : 'Available once Papyrus is running (at most once a minute)'}>
          {refreshing ? <Spinner /> : <IconRefresh />}
        </button>
        {preview.url && live ? (
          <a class="bf-open" href={preview.url} target="_blank" rel="noopener noreferrer">
            Open <IconExternal />
            <span class="sr-only"> environment in a new tab</span>
          </a>
        ) : (
          <span class="bf-open" aria-disabled="true">
            Open <IconExternal />
          </span>
        )}
      </div>
      <div class="bf-view">
        {preview.state === 'provisioning' ? (
          <div class="bf-prov grid-bg">
            <div class="bf-state" role="status">
              <Spinner />
              <span>
                {statusLabel}
                {operation ? ` · ${operation}` : ''}
              </span>
            </div>
            <LoadingCarousel tips={SETUP_TIPS} label="Setup tips while Papyrus is provisioned" />
            <p class="bf-hint">The preview appears once Papyrus answers its health check.</p>
          </div>
        ) : preview.state === 'loading' ? (
          <div class="bf-loading" role="status">
            <div class="sk" aria-hidden="true">
              <div class="sk-nav" />
              <div class="sk-panel">
                <div class="sk-line w60" />
                <div class="sk-line w40" />
                <div class="sk-box" />
                <div class="sk-line w30" />
              </div>
            </div>
            <div class="bf-overlay">
              <Spinner />
              <span>{preview.title}…</span>
              <small>{preview.reason}</small>
            </div>
          </div>
        ) : preview.state === 'running' && preview.mode === 'screenshot' && preview.image ? (
          <figure class="bf-shot">
            <img src={preview.image} alt={`Screenshot of the Papyrus sign-in page at ${host}`} width={1280} height={800} />
            <figcaption>
              <span class="bf-tag">Screenshot</span>
              <span>
                Captured {mounted && preview.capturedAt ? relative(preview.capturedAt, now) : preview.capturedAt?.slice(11, 16) + ' UTC'} · not live
              </span>
            </figcaption>
          </figure>
        ) : preview.state === 'running' ? (
          <div class="bf-card grid-bg">
            <div class="bf-card-in">
              <span class="pill" data-tone="ok">
                <span class="pill-dot" aria-hidden="true" />
                Running
              </span>
              <h3 class="disp">Papyrus is up</h3>
              <p class="mono bf-host">{host}</p>
              {preview.url ? (
                <a class="btn primary lg" href={preview.url} target="_blank" rel="noopener noreferrer">
                  Open environment <IconExternal />
                </a>
              ) : null}
              <p class="bf-why">{preview.reason}</p>
            </div>
          </div>
        ) : (
          <div class={`bf-off bf-off-${preview.state}`}>
            <div class="bf-off-in">
              <span class="bf-off-icon" aria-hidden="true">
                {preview.state === 'stopped' ? <IconPower /> : <IconAlert />}
              </span>
              <h3 class="disp">{preview.title}</h3>
              <p>{preview.reason}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
