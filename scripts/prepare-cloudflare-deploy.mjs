import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// cf beta hardcodes strict uploads. Deploy the same Vite Build Output with
// Wrangler until cf supports applying intentional configuration changes.
const root = resolve('.cloudflare/output/v0/workers/default')
const worker = JSON.parse(readFileSync(resolve(root, 'worker.config.json'), 'utf8'))
const supported = new Set([
  'name', 'compatibilityDate', 'compatibilityFlags', 'assets', 'domains',
  'observability', 'workersDev', 'previewUrls', 'env', 'manifest',
])
for (const key of Object.keys(worker)) {
  if (!supported.has(key)) throw new Error(`Unsupported Worker setting: ${key}; update the deployment adapter before deploying.`)
}
const vars = {}
for (const [name, binding] of Object.entries(worker.env ?? {})) {
  if (binding.type !== 'text') throw new Error(`Unsupported binding: ${name}; update the deployment adapter before deploying.`)
  vars[name] = binding.value
}
const main = `bundle/${worker.manifest.mainModule}`
if (!existsSync(resolve(root, main))) throw new Error('Missing built Worker entrypoint')
const config = {
  name: worker.name,
  main,
  compatibility_date: worker.compatibilityDate,
  compatibility_flags: worker.compatibilityFlags,
  workers_dev: worker.workersDev,
  preview_urls: worker.previewUrls,
  routes: (worker.domains ?? []).map(domain => ({ pattern: domain, custom_domain: true })),
  vars,
  keep_vars: true,
  assets: {
    directory: './assets',
    binding: 'ASSETS',
    run_worker_first: worker.assets?.runWorkerFirst ?? false,
  },
  observability: worker.observability,
  no_bundle: true,
  find_additional_modules: true,
  rules: [
    { type: 'ESModule', globs: ['**/*.js'], fallthrough: true },
    { type: 'CompiledWasm', globs: ['**/*.wasm'], fallthrough: true },
    { type: 'Text', globs: ['**/*.json'], fallthrough: true },
  ],
}
writeFileSync(resolve(root, 'wrangler.json'), JSON.stringify(config, null, 2) + '\n')
console.log(`Prepared Wrangler deployment for ${worker.name}`)
