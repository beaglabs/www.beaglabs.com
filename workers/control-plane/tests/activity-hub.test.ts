import { describe, expect, it } from 'vitest'
import { ActivityHub, type HubNamespace, type HubState } from '../src/activity-hub'
import { signedIn } from './helpers/session'

class FakeSocket {
  sent: string[] = []
  send(message: string) {
    this.sent.push(message)
  }
  close() {}
}

/** A DurableObjectState stand-in: sockets with tags, as acceptWebSocket stores them. */
function fakeState() {
  const sockets: Array<{ ws: FakeSocket; tags: string[] }> = []
  const state: HubState = {
    acceptWebSocket: (ws, tags = []) => void sockets.push({ ws: ws as unknown as FakeSocket, tags }),
    getWebSockets: (tag) => sockets.filter((s) => !tag || s.tags.includes(tag)).map((s) => s.ws as unknown as WebSocket),
  }
  const connect = (accountId: string) => {
    const ws = new FakeSocket()
    state.acceptWebSocket(ws as unknown as WebSocket, [accountId])
    return ws
  }
  return { state, connect }
}

/** idFromName → one hub per name, like a DurableObjectNamespace. */
function fakeNamespace() {
  const hubs = new Map<string, { hub: ActivityHub; connect: (accountId: string) => FakeSocket }>()
  const hubFor = (name: string) => {
    if (!hubs.has(name)) {
      const { state, connect } = fakeState()
      hubs.set(name, { hub: new ActivityHub(state), connect })
    }
    return hubs.get(name)!
  }
  const namespace: HubNamespace = {
    idFromName: (name) => ({ name, toString: () => name, equals: () => false }) as unknown as DurableObjectId,
    get: (id) => ({ fetch: (input, init) => hubFor((id as unknown as { name: string }).name).hub.fetch(new Request(input as RequestInfo, init)) }),
  }
  return { namespace, hubFor }
}

describe('ActivityHub', () => {
  it('broadcasts only to sockets of the event’s account', () => {
    const { state, connect } = fakeState()
    const hub = new ActivityHub(state)
    const mine = connect('acct_1')
    const theirs = connect('acct_2')
    const event = { id: 7, at: '2026-10-17T14:00:00.000Z', level: 'ok', source: 'deploy', message: 'deployed', deploymentId: 'dep_1' }
    expect(hub.broadcast({ accountId: 'acct_1', event })).toBe(1)
    expect(mine.sent.map((m) => JSON.parse(m))).toEqual([{ type: 'event', event }])
    expect(theirs.sent).toEqual([])
  })

  it('every event insert reaches the account’s hub, and no other account’s', async () => {
    const { namespace, hubFor } = fakeNamespace()
    const { h, post } = signedIn({ env: { ACTIVITY: namespace } })
    h.insertAccount('acct_2', 'other@example.com')
    const mine = hubFor('acct_1').connect('acct_1')
    const theirs = hubFor('acct_2').connect('acct_2')
    await post('/settings', { name: 'Jordan' })
    expect(mine.sent).toHaveLength(1)
    const message = JSON.parse(mine.sent[0]!)
    expect(message).toMatchObject({ type: 'event', event: { source: 'account', level: 'info', message: 'Account settings updated', deploymentId: null } })
    const row = h.sql.prepare('SELECT id FROM events ORDER BY id DESC LIMIT 1').get() as { id: number }
    expect(message.event.id).toBe(row.id)
    expect(theirs.sent).toEqual([])
  })
})

describe('GET /api/events/live', () => {
  it('needs a WebSocket upgrade, the same origin and a session', async () => {
    const { namespace } = fakeNamespace()
    const { h, get } = signedIn({ env: { ACTIVITY: namespace } })
    expect((await get('/api/events/live')).status).toBe(426)
    expect((await get('/api/events/live', { upgrade: 'websocket', origin: 'https://evil.example' })).status).toBe(403)
    expect((await get('/api/events/live', { upgrade: 'websocket' })).status).toBe(403)
    expect((await h.call('/api/events/live', { headers: { upgrade: 'websocket', origin: h.env.BASE_URL } })).status).toBe(401)
  })

  it('the Activity card points at the live socket and the CSP allows it', async () => {
    const { h, get } = signedIn()
    h.insertDeployment({ id: 'dep_1', billing_state: 'active' })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = 'acme.papyrus.beaglabs.com' WHERE id = 'dep_1'").run()
    const response = await get('/deploy/dep_1')
    const html = await response.text()
    expect(html).toContain('data-live-url="/api/events/live"')
    expect(html).toContain('<script src="/assets/deploy-ui.js" defer></script>')
    expect(html).toContain('<section class="term" aria-labelledby="activity-h">')
    expect(response.headers.get('content-security-policy')).toContain('wss://papyrus.beaglabs.test')
    // The data island is JSON, not script, so script-src 'self' still holds.
    expect(html).toMatch(/<script type="application\/json" id="dp-data">\{"page":"detail"/)
  })
})
