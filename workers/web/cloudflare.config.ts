import { defineConfig } from 'cf/config'

// Intentionally no custom domain: this isolated homepage preview
// must not replace the production Vercel deployment.
export default defineConfig({
  worker: {
    name: 'beaglabs-web-preview',
    compatibilityDate: '2026-10-08',
    compatibilityFlags: ['nodejs_compat'],
  },
})
