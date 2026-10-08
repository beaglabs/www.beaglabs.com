import { defineConfig, defineWorker } from 'cf/config'

// The previous configuration had static assets but no executable entrypoint.
// vinext supplies its own Fetch handler; let the Cloudflare build bundle it.
export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-web-preview',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
    assets: { runWorkerFirst: true },
  }),
})
