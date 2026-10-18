/**
 * Customer.io Data Pipelines in the browser (Analytics.js, the `cioanalytics` global), loaded with Customer.io's own
 * JavaScript source snippet: calls made before the library arrives are queued and replayed.
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

type WithCio = Window & { cioanalytics?: CustomerIoAnalytics }

const WRITE_KEY = process.env.NEXT_PUBLIC_CUSTOMERIO_CDP_WRITE_KEY
const GLOBAL = 'cioanalytics'
const EDGE_URL = 'https://cdp.customer.io'

/**
 * Customer.io's JavaScript source snippet, exactly as `GET /cdp/api/workspaces/{id}/available_sources` serves it
 * (fetched 2026-10-18). Only its three placeholders are filled in below; refetch it rather than editing it by hand.
 * It loads the library once and sends the initial page view itself.
 */
const SNIPPET = `  !function(){var i="\${analyticsKey}", analytics=(window[i]=window[i]||[]);if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute('data-global-customerio-analytics-key', i);t.src="\${edgeUrl}/v1/analytics-js/snippet/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._writeKey=key;analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.15.3";
    analytics.load(
      "\${apiKey}",
      // Optional: enable anonymous in-app. See https://docs.customer.io/journeys/anonymous-in-app/#enable-anonymous-in-app-messaging.
      // {
      //   "integrations": {
      //     "Customer.io In-App Plugin": {
      //       anonymousInApp: true
      //     }
      //   }
      // }
    );
    analytics.page();
  }}();`

export function customerIo(): CustomerIoAnalytics | undefined {
  if (typeof window === 'undefined' || !WRITE_KEY) return undefined
  const w = window as WithCio
  if (!w.cioanalytics) {
    const script = document.createElement('script')
    script.textContent = SNIPPET
      .replace('${analyticsKey}', GLOBAL)
      .replace('${edgeUrl}', EDGE_URL)
      .replace('${apiKey}', WRITE_KEY.replace(/[^A-Za-z0-9_-]/g, ''))
    document.head.appendChild(script)
    lastPageViewPath = window.location.pathname
  }
  return w.cioanalytics
}

/** The path of the last page view sent, so route changes don't double-count the snippet's own initial view. */
let lastPageViewPath: string | undefined

/** One page view per client-side navigation, once Customer.io is loaded. */
export function customerIoPageView(path: string) {
  if (!customerIoLoaded() || path === lastPageViewPath) return
  lastPageViewPath = path
  customerIo()?.page()
}

/** Only once the visitor has accepted cookies (or acted, see above) — never on first paint. */
export const customerIoLoaded = () => typeof window !== 'undefined' && Boolean((window as WithCio).cioanalytics)
