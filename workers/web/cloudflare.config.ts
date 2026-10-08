import { defineConfig, defineWorker } from 'cf/config'

// Serve matching static assets from Cloudflare Assets before invoking vinext.
// The Worker entrypoint handles page routes; Worker-first routing for all URLs
// would intercept _next CSS/JS requests without a working ASSETS fallback.
export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-web-preview',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
    assets: { runWorkerFirst: false },
  }),
})
