import posthog from 'posthog-js'
import { customerIo, customerIoLoaded } from '@/lib/customerio-browser'

type Placement = 'hero' | 'final' | 'nav' | 'page-hero' | 'section'
type TrialProperties = { placement: Placement; page: string; destination: string }

function capture(event: string, properties: Record<string, unknown>) {
  try {
    if ((window as Window & { __posthogInitialized?: boolean }).__posthogInitialized) posthog.capture(event, properties)
  } catch { /* analytics never blocks the visitor */ }
}

// Keep click tracking and notification delivery in the same .track() call.
export const analytics = {
  /** A click on any "Start a trial" button. */
  track(event: 'trial.cta.clicked', properties: TrialProperties) {
    capture(event, properties)
    if (customerIoLoaded()) customerIo()?.track('Trial CTA Clicked', properties)

    const endpoint = 'https://license.beaglabs.com/api/events/trial-click'
    const body = JSON.stringify({ event, ...properties })
    try {
      if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'text/plain' }))) return
      void fetch(endpoint, {
        method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true,
      }).catch(() => {})
    } catch { /* tracking must not block trial navigation */ }
  },

  creditEmailSubmitted(email: string, properties: { placement: 'nav' | 'page-hero' | 'section'; page: string; destination: string }) {
    capture('hero.email.submitted', { ...properties, offer: 'papyrus-compute-credit' })
    capture('compute_credit.requested', { ...properties, offer: 'papyrus-compute-credit' })
    const cio = customerIo()
    cio?.identify(email, { email, source: properties.page, compute_credit_requested: true })
    cio?.track('Compute Credit Requested', { ...properties, offer: '$1k Papyrus compute credit' })
  },
  /** The homepage hero: someone gave us their work email to get Papyrus compute credit. */
  heroEmailSubmitted(email: string, properties: { page: string; destination: string }) {
    capture('hero.email.submitted', properties)
    const cio = customerIo()
    cio?.identify(email, { email, source: 'beaglabs.com/hero', compute_credit_requested: true })
    cio?.track('Compute Credit Requested', { placement: 'hero', offer: '$1k Papyrus compute credit', ...properties })
  },
}
