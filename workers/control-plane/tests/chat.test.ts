import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { harness } from './helpers/harness'

const TOKEN = 'session-token'

function signedIn() {
  const h = harness()
  h.insertAccount('acct_1', 'owner@example.com')
  h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update(TOKEN).digest('hex'), 'acct_1', '2999-01-01T00:00:00.000Z')
  const openSession = (headers: Record<string, string> = { cookie: `cp_session=${TOKEN}`, origin: h.env.BASE_URL }) => h.call('/chat/session', { method: 'POST', headers })
  return { h, openSession }
}

describe('POST /chat/session', () => {
  it('needs a signed-in user', async () => {
    const { h, openSession } = signedIn()
    const response = await openSession({ origin: h.env.BASE_URL })
    expect(response.status).toBe(401)
    expect((await openSession({ cookie: 'cp_session=wrong', origin: h.env.BASE_URL })).status).toBe(401)
    expect(h.license.chatSession).not.toHaveBeenCalled()
  })

  it('refuses cross-origin and origin-less requests', async () => {
    const { h, openSession } = signedIn()
    expect((await openSession({ cookie: `cp_session=${TOKEN}`, origin: 'https://evil.example' })).status).toBe(403)
    expect((await openSession({ cookie: `cp_session=${TOKEN}` })).status).toBe(403)
    expect(h.license.chatSession).not.toHaveBeenCalled()
  })

  it('mints an account-scoped session before any deployment exists', async () => {
    const { h, openSession } = signedIn()
    const response = await openSession()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      token: 'chat-token', expiresAt: '2999-01-01T00:00:00.000Z', tenantId: 'cp:acct_1', user: { oid: 'acct_1', name: 'owner@example.com' }, apiOrigin: 'https://license.beaglabs.test',
    })
    expect(h.license.chatSession).toHaveBeenCalledWith({ accountId: 'acct_1', userId: 'acct_1', email: 'owner@example.com', name: 'owner@example.com' })
  })

  it("passes the account's registered deployment so chat joins its team thread", async () => {
    const { h, openSession } = signedIn()
    h.insertDeployment({ id: 'dep_draft' })
    h.insertDeployment({ id: 'dep_live', license_deployment_id: 'pd_123' })
    expect(((await (await openSession()).json()) as { tenantId: string }).tenantId).toBe('tenant-guid')
    expect(h.license.chatSession).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'acct_1', deploymentId: 'pd_123' }))
  })
})

describe('chat bubble markup', () => {
  it('renders on signed-in pages only, with a CSP that allows the chat API', async () => {
    const { h } = signedIn()
    h.insertDeployment({ id: 'dep_abc' })
    for (const path of ['/deploy', '/deploy/dep_abc', '/billing']) {
      const response = await h.call(path, { headers: { cookie: `cp_session=${TOKEN}` } })
      const html = await response.text()
      expect(html).toContain('<div id="beag-chat" class="beag-chat pcu-root" data-session="/chat/session"></div>')
      expect(html).toContain('<script src="/assets/chat-bubble.js" defer></script>')
      const csp = response.headers.get('content-security-policy')!
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("connect-src 'self' https://license.beaglabs.test wss://papyrus.beaglabs.test wss://license.beaglabs.test")
    }
    for (const path of ['/login', '/signup']) {
      const html = await (await h.call(path)).text()
      expect(html).not.toContain('beag-chat')
      expect(html).not.toContain('chat-bubble.js')
    }
  })

  it('serves a bubble script that parses', async () => {
    const { h } = signedIn()
    const response = await h.call('/assets/chat-bubble.js')
    expect(response.headers.get('content-type')).toContain('text/javascript')
    const source = await response.text()
    expect(() => new Function(source)).not.toThrow()
    expect(source).not.toContain('innerHTML')
  })
})
