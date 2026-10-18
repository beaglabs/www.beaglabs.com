import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SUPPORT_COPY, SUPPORT_PHOTO_PATH, supportMailto } from '../src/support'
import { harness } from './helpers/harness'

const TOKEN = 'session-token'
const COPY = 'Stuck? Email James and get support within 48 hours'

function signedIn() {
  const h = harness()
  h.insertAccount('acct_1', 'owner@example.com')
  h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update(TOKEN).digest('hex'), 'acct_1', '2999-01-01T00:00:00.000Z')
  h.insertDeployment({ id: 'dep_abc', billing_state: 'active' })
  h.sql.prepare('UPDATE deployments SET provider = ?, hostname = ? WHERE id = ?').run('hosted', 'acme.papyrus.beaglabs.com', 'dep_abc')
  const get = (path: string) => h.call(path, { headers: { cookie: `cp_session=${TOKEN}` } })
  return { h, get }
}

const decodeHref = (html: string) => {
  const href = /<a class="support-link" href="([^"]+)"/.exec(html)?.[1]
  return href ? decodeURIComponent(href.replace(/&amp;/g, '&')) : null
}

describe('support card', () => {
  it('uses the exact copy and a mailto with the subject, hostname and account', () => {
    expect(SUPPORT_COPY).toBe(COPY)
    const href = supportMailto({ id: 'acct_1', email: 'owner@example.com', hostnames: ['acme.papyrus.beaglabs.com'] })
    expect(href.startsWith('mailto:james@beaglabs.com?subject=Papyrus%20support&body=')).toBe(true)
    const body = decodeURIComponent(href.split('&body=')[1]!)
    expect(body).toContain('Deployment: acme.papyrus.beaglabs.com')
    expect(body).toContain('Account: owner@example.com (acct_1)')
  })

  it('renders bottom-right on every signed-in console page with the exact copy, photo and mailto', async () => {
    const { get } = signedIn()
    for (const path of ['/deploy/dep_abc', '/billing', '/team', '/support', '/settings']) {
      const html = await (await get(path)).text()
      expect(html, path).toContain('<aside class="support-card" id="support-card"')
      expect(html, path).toContain(`<span>${COPY}</span>`)
      expect(html, path).toContain(`src="${SUPPORT_PHOTO_PATH}"`)
      expect(html, path).toContain('<script src="/assets/support-card.js" defer></script>')
      const mailto = decodeHref(html)!
      expect(mailto).toContain('mailto:james@beaglabs.com?subject=Papyrus support')
      expect(mailto).toContain('acme.papyrus.beaglabs.com')
      expect(mailto).toContain('owner@example.com')
      expect(html).not.toMatch(/beag-chat|chat-bubble|data-open-chat|Message Beag Labs|Need a hand/)
    }
  })

  it('the Support page shows the larger card with the same photo, copy and address', async () => {
    const { get } = signedIn()
    const html = await (await get('/support')).text()
    expect(html).toContain('class="card support-page-card"')
    expect(html).toContain(`<img src="${SUPPORT_PHOTO_PATH}" width="96" height="96"`)
    expect(html).toContain(`<p class="support-page-copy">${COPY}</p>`)
    expect(html).toContain('>Email james@beaglabs.com</a>')
  })

  it('is not on signed-out pages', async () => {
    const { h } = signedIn()
    for (const path of ['/login', '/signup']) expect(await (await h.call(path)).text()).not.toContain('support-card')
  })

  it('serves the collapse script, which guards localStorage and collapses on phones by default', async () => {
    const { h, get } = signedIn()
    const response = await h.call('/assets/support-card.js')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('javascript')
    const js = await response.text()
    expect(js).toContain('try { return window.localStorage.getItem(KEY) } catch')
    expect(js).toContain('try { window.localStorage.setItem(KEY, value) } catch')
    const html = await (await get('/billing')).text()
    const media = html.slice(html.indexOf('@media (max-width:640px){'))
    expect(media).toContain('.support-card:not([data-collapsed="false"]) .support-full{display:none}')
  })

  it('keeps the CSP to this site: no chat API origin, no inline scripts', async () => {
    const { get } = signedIn()
    const csp = (await get('/billing')).headers.get('content-security-policy')!
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("img-src 'self' data:")
    expect(csp).toContain("connect-src 'self' wss://papyrus.beaglabs.test")
    expect(csp).not.toContain('license.beaglabs')
  })

  it('removed the chat session route', async () => {
    const { h } = signedIn()
    const response = await h.call('/chat/session', { method: 'POST', headers: { cookie: `cp_session=${TOKEN}`, origin: h.env.BASE_URL } })
    expect(response.status).toBe(404)
    expect((await h.call('/assets/chat-bubble.js')).status).toBe(404)
  })

  it('ships the photo as a static asset of at most 25 KB, 96px', () => {
    const file = new URL('../public/assets/james-support-96.jpg', import.meta.url)
    expect(statSync(file).size).toBeLessThanOrEqual(25 * 1024)
    const bytes = readFileSync(file)
    expect(bytes.subarray(0, 2).toString('hex')).toBe('ffd8')
    // Find the SOF0/SOF2 marker: height and width are big-endian at offsets 5 and 7.
    let i = 2
    while (i < bytes.length && !(bytes[i] === 0xff && (bytes[i + 1] === 0xc0 || bytes[i + 1] === 0xc2))) i += 2 + bytes.readUInt16BE(i + 2)
    expect([bytes.readUInt16BE(i + 5), bytes.readUInt16BE(i + 7)]).toEqual([96, 96])
    const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
    expect(config).toMatch(/"assets": \{ "directory": "\.\/public" \}/)
    expect(config).not.toContain('CHAT_API_ORIGIN')
  })
})
