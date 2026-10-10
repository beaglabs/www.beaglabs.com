import { defineConfig, defineWorker } from 'cf/config'

// Staging only: never bind the production domain until the full app is tested.
export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-web-preview-v2',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
    // Cloudflare serves existing static files from public/ and _next before SSR.
    assets: { runWorkerFirst: false },
  }),
})
