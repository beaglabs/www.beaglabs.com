import { bindings, defineConfig, defineWorker } from 'cf/config'

export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-homepage',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
    workersDev: true,
    previewUrls: true,
    domains: ['www.beaglabs.com'],
    env: {
      HYGRAPH_ENDPOINT: bindings.text('https://us-west-2.cdn.hygraph.com/content/cmq44llwh02u708w6rc1atyy7/master'),
    },
    observability: { enabled: true, logs: { enabled: true } },
    // Cloudflare serves existing static files from public/ and _next before SSR.
    assets: { runWorkerFirst: false },
  }),
})
