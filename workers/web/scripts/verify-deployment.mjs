const origin = process.argv[2] || process.env.WORKER_URL || 'https://beaglabs-web-real-preview.beag-labs.workers.dev/'
const base = new URL(origin)
let failures = 0
const pass = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${message}`)
  if (!ok) failures++
}
const get = async path => {
  const response = await fetch(new URL(path, base))
  const body = await response.text()
  console.log(`GET ${path} => ${response.status} [${response.headers.get('content-type') || ''}] (${body.length} bytes)`)
  return { response, body }
}
const page = await get('/')
pass(page.response.ok && /Beag Labs|Papyrus/.test(page.body), 'Real site homepage renders')
const assetPaths = [...new Set([...page.body.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)]
  .map(m => m[1]).filter(p => new URL(p, base).pathname.startsWith('/_next/')))]
pass(assetPaths.some(p => new URL(p, base).pathname.endsWith('.css')), 'Stylesheet is referenced')
pass(assetPaths.some(p => new URL(p, base).pathname.endsWith('.js')), 'JavaScript is referenced')
for (const path of assetPaths) {
  const { response, body } = await get(path)
  const isCss = new URL(path,base).pathname.endsWith('.css')
  const type = response.headers.get('content-type') || ''
  pass(response.ok && body.length > 0 && (isCss ? type.includes('css') : /javascript|ecmascript/.test(type)), `Asset ${path}`)
}
for (const [path, expected] of [['/favicon.png','image/png'], ['/robots.txt','text/plain'], ['/sitemap.xml','xml']]) {
  const { response, body } = await get(path)
  const type = response.headers.get('content-type') || ''
  pass(response.ok && type.includes(expected) && body.length > 0, `${path} is available`)
}
pass(page.body.includes('og:image'), 'Open Graph image metadata exists')
pass(page.body.includes('rel="canonical"'), 'Canonical URL exists')
pass(page.body.includes('application/ld+json'), 'Structured data exists')
console.log('Check production-only integrations separately: licensing, auth, APIs, native OG and database routes.')
if (failures) { console.error(`${failures} checks failed`); process.exitCode = 1 }
