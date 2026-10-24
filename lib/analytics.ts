import posthog from 'posthog-js'

function capture(event: string, properties: Record<string, unknown>) {
  try {
    if ((window as Window & { __posthogInitialized?: boolean }).__posthogInitialized) posthog.capture(event, properties)
  } catch { /* analytics never blocks the visitor */ }
}

export const analytics = {
  /** PostHog only: the server sends the Customer.io event, which starts the brief campaign exactly once. */
  briefRequested(properties: { placement: 'hero' | 'nav' | 'page-hero'; briefType: 'papyrus' | 'services'; marketingOptIn: boolean; ccOptIn: boolean; page: string }) {
    capture('solution_brief.requested', properties)
  },
}
