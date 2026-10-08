const target = process.argv[2] || process.env.WORKER_URL || 'https://beaglabs-web-preview.beag-labs.workers.dev/'
const pageUrl = new URL(target)
let failures = 0

function verify(ok, description) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${description}`)
  if (!ok) failures++
}

const page = await fetch(pageUrl, { redirect: 'manual' })
const html = await page.text()
console.log(`GET ${pageUrl} => ${page.status} (${html.length} bytes)`)
verify(page.status === 200 && html.includes('Solving the boring problems.'), 'Homepage returns its actual content')

const staticAssets = [...new Set(
  [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)]
    .map(m => new URL(m[1], pageUrl))
    .filter(url => url.origin === pageUrl.origin && url.pathname.startsWith('/_next/'))
    .map(url => url.href)
)]
const css = staticAssets.filter(url => new URL(url).pathname.endsWith('.css'))
const js = staticAssets.filter(url => new URL(url).pathname.endsWith('.js'))
verify(css.length > 0, 'HTML references production CSS')
verify(js.length > 0, 'HTML references production JavaScript')

for (const url of staticAssets) {
  const response = await fetch(url)
  const type = response.headers.get('content-type') || ''
  const isCss = new URL(url).pathname.endsWith('.css')
  const correctType = isCss ? type.includes('text/css') : /javascript|ecmascript/.test(type)
  const body = await response.text()
  console.log(`GET ${new URL(url).pathname} => ${response.status} [${type}] (${body.length} bytes)`)
  verify(response.ok && correctType && body.length > 0, `${isCss ? 'CSS' : 'JavaScript'} asset reachable with correct MIME type`)
}

if (failures) {
  console.error(`Deployment verification failed: ${failures} check(s)`)
  process.exitCode = 1
} else console.log('Deployment HTML, CSS, and JavaScript checks passed')
