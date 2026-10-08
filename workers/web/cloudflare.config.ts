import { defineConfig, defineWorker } from 'cf/config'

// Isolated preview only. No production domains or route bindings.
export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-web-preview',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
  }),
})
