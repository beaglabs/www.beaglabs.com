import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'

// Run the real repository-root app/, pages/, components/, and public/.
// Do not set root to workers/web: that prototype is being retired.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } }),
  ],
})
