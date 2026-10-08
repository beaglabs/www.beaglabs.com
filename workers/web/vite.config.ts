import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { responseStoreAdapter } from '@vinext/cloudflare/cache/response-store-adapter'
import { responseStoreServiceBinding } from './cloudflare.config'

export default defineConfig({
  plugins: [
    vinext({ cache: responseStoreAdapter() }),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      auxiliaryWorkers: [{ config: responseStoreServiceBinding }],
    }),
  ],
})
