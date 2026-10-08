import { defineConfig, defineWorker } from 'cf/config'
import { createWorkersResponseStoreServiceBindingConfig } from '@vinext/cloudflare/cache/config'

// Preview-only Workers; no custom domains or production routes.
const responseStore = await createWorkersResponseStoreServiceBindingConfig({
  worker: {
    name: 'beaglabs-web-preview-response-store',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
  },
  bucket: 'beaglabs-web-preview-response-store-cache-bodies',
})

export const responseStoreServiceBinding = responseStore.serviceBindingWorker

export default defineConfig({
  worker: defineWorker({
    name: 'beaglabs-web-preview',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
    ...responseStore.applicationWorker,
    env: {
      ...responseStore.applicationWorker.env,
    },
  }),
})
