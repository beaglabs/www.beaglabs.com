/**
 * Customer.io Data Pipelines in the browser (Analytics.js, the `cioanalytics` global). Loaded with Customer.io's
 * JavaScript snippet rather than an npm package: calls made before the library arrives are queued and replayed.
 * Event names and properties follow the Track spec: https://docs.customer.io/integrations/data-in/source-spec/track-spec/
 *
 * Loaded only after cookie consent, or when someone hands us their email (an explicit action).
 * Needs NEXT_PUBLIC_CUSTOMERIO_CDP_WRITE_KEY (the JavaScript source's write key); without it every call is a no-op.
 */

type Properties = Record<string, string | number | boolean | null | undefined>
export interface CustomerIoAnalytics {
  track(event: string, properties?: Properties): void
  identify(userId: string, traits?: Properties): void
  page(): void
}

type Buffered = unknown[][] & Record<string, unknown> & CustomerIoAnalytics
type WithCio = Window & { cioanalytics?: Buffered }

const WRITE_KEY = process.env.NEXT_PUBLIC_CUSTOMERIO_CDP_WRITE_KEY
const METHODS = ['trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview', 'identify', 'reset', 'group', 'track', 'ready', 'alias', 'debug', 'page', 'screen', 'once', 'off', 'on', 'addSourceMiddleware', 'addIntegrationMiddleware', 'setAnonymousId', 'addDestinationMiddleware', 'register']

export function customerIo(): CustomerIoAnalytics | undefined {
  if (typeof window === 'undefined' || !WRITE_KEY) return undefined
  const w = window as WithCio
  if (w.cioanalytics) return w.cioanalytics
  const queue = Object.assign([], { invoked: true, _writeKey: WRITE_KEY, SNIPPET_VERSION: '4.15.3' }) as unknown as Buffered
  for (const method of METHODS) queue[method] = (...args: unknown[]) => { queue.push([method, ...args]); return queue }
  w.cioanalytics = queue
  const script = document.createElement('script')
  script.async = true
  script.setAttribute('data-global-customerio-analytics', 'cioanalytics')
  script.src = `https://cdp.customer.io/v1/analytics-js/snippet/${encodeURIComponent(WRITE_KEY)}/analytics.min.js`
  document.head.appendChild(script)
  queue.page()
  return queue
}

/** Only once the visitor has accepted cookies (or acted, see above) — never on first paint. */
export const customerIoLoaded = () => typeof window !== 'undefined' && Boolean((window as WithCio).cioanalytics)
