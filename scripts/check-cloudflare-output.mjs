import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
const root = path.resolve('.cloudflare/output/v0')
const manifest = path.join(root, 'config.json')
const worker = path.join(root, 'workers/default/worker.config.json')
for (const file of [manifest, worker]) {
 if (!existsSync(file)) {
  console.error('Missing Cloudflare Build Output:', file)
  console.error('Vite emitted SSR files but not a deployable Cloudflare Worker.')
  console.error('Check npm ls @cloudflare/vite-plugin; v2 is required by vinext Cloudflare deployment.')
  process.exitCode = 1
 } else {
  try { const parsed=JSON.parse(readFileSync(file,'utf8')); console.log('Cloudflare output OK:',file, 'keys:',Object.keys(parsed).join(', ')) }
  catch(err) { console.error('Invalid Cloudflare output:',file,err); process.exitCode=1 }
 }
}
