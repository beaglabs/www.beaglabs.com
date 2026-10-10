#!/usr/bin/env node
/**
 * Apply Workers observability to the website's generated deployment config.
 *
 * Wrangler's .wrangler/deploy/config.json points at dist/client/wrangler.json.
 * Editing a root wrangler.jsonc would not change that deployment.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const redirectPath = resolve(root, '.wrangler/deploy/config.json')
if (!existsSync(redirectPath)) {
  console.error('Missing .wrangler/deploy/config.json. Run your Cloudflare adapter build first.')
  process.exit(1)
}
let redirect
try { redirect = JSON.parse(readFileSync(redirectPath, 'utf8')) }
catch { console.error('Invalid Wrangler deployment redirect config.'); process.exit(1) }
if (typeof redirect.configPath !== 'string' || !redirect.configPath.endsWith('/wrangler.json')) {
  console.error('Unexpected Wrangler deployment target; refusing to edit unknown config:', redirect.configPath)
  process.exit(1)
}
const target = resolve(dirname(redirectPath), redirect.configPath)
if (!target.startsWith(root + '/')) {
  console.error('Refusing to edit a deployment config outside the project:', target)
  process.exit(1)
}
if (!existsSync(target)) {
  console.error('Generated Cloudflare deployment config is missing:', target)
  console.error('Run the website Cloudflare adapter build to generate it before deploying.')
  process.exit(1)
}
let config
try { config = JSON.parse(readFileSync(target, 'utf8')) }
catch { console.error('Generated Cloudflare deployment config is not valid JSON:', target); process.exit(1) }
config.observability = {
  ...config.observability,
  enabled: true,
  logs: {
    ...config.observability?.logs,
    enabled: true,
    invocation_logs: true,
  },
}
writeFileSync(target, JSON.stringify(config, null, 2) + '\n')
console.log('Enabled Cloudflare website Worker logs in:', target)
