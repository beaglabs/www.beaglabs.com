import posthog from 'posthog-js'

type TrialProperties = { placement: 'hero' | 'final'; page: string; destination: string }

// Keep click tracking and notification delivery in the same .track() call.
export const analytics = {
  track(event: 'trial.cta.clicked', properties: TrialProperties) {
    try {
      if ((window as Window & { __posthogInitialized?: boolean }).__posthogInitialized) {
        posthog.capture(event, properties)
      }
    } catch { /* notification delivery is independent of analytics availability */ }

    const endpoint = 'https://license.beaglabs.com/api/events/trial-click'
    const body = JSON.stringify({ event, ...properties })
    try {
      if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'text/plain' }))) return
      void fetch(endpoint, {
        method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true,
      }).catch(() => {})
    } catch { /* tracking must not block trial navigation */ }
  },
}
