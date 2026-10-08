import { bindings, defineConfig, defineWorker } from 'cf/config'

// Run the Worker for page requests; allow Cloudflare to serve immutable
// _next assets. Without worker-first routing, '/' falls through to
// the static assets layer and returns the empty 404 seen in production.
export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-web-preview',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
    assets: { runWorkerFirst: true },
    env: { ASSETS: bindings.assets() },
  }),
})
