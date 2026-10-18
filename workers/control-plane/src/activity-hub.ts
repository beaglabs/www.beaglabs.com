/**
 * ActivityHub: one Durable Object per account (`idFromName(accountId)`) holding that account's open Activity sockets.
 * Hibernatable WebSockets: the object sleeps between events and wakes for each broadcast or socket message.
 *
 * - The Worker authenticates `GET /api/events/live` (session cookie, same origin) and forwards the upgrade here with
 *   `x-account-id`; each socket is tagged with that account id.
 * - Every event insert (`logEvent`) POSTs the event to `/broadcast` on the account's object, which sends it to the
 *   sockets tagged with that same account only.
 * - Clients send "ping"; the runtime answers "pong" without waking the object.
 */

export const LIVE_PATH = '/api/events/live'

/** What a broadcast carries: the account it belongs to and the event in GET /api/events' shape. */
export interface LiveEvent {
  accountId: string
  event: { id: number; at: string; level: string; source: string; message: string; deploymentId: string | null }
}

/** The subset of DurableObjectState this class uses (so tests can pass a fake). */
export interface HubState {
  acceptWebSocket(ws: WebSocket, tags?: string[]): void
  getWebSockets(tag?: string): WebSocket[]
  setWebSocketAutoResponse?(pair?: WebSocketRequestResponsePair): void
}

export class ActivityHub {
  constructor(
    private readonly state: HubState,
    _env?: unknown,
  ) {
    if (typeof WebSocketRequestResponsePair !== 'undefined') state.setWebSocketAutoResponse?.(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const body = (await request.json()) as LiveEvent
      return Response.json({ sent: this.broadcast(body) })
    }
    const accountId = request.headers.get('x-account-id')
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket' || !accountId) return new Response('Expected a WebSocket upgrade', { status: 426 })
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
    this.state.acceptWebSocket(server, [accountId])
    server.send(JSON.stringify({ type: 'hello' }))
    return new Response(null, { status: 101, webSocket: client })
  }

  /** Send one event to this account's sockets. Returns how many got it. */
  broadcast(live: LiveEvent): number {
    if (!live?.accountId || !live.event) return 0
    const message = JSON.stringify({ type: 'event', event: live.event })
    let sent = 0
    for (const ws of this.state.getWebSockets(live.accountId)) {
      try {
        ws.send(message)
        sent++
      } catch {
        // a socket closing mid-send is dropped by the runtime
      }
    }
    return sent
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (message === 'ping') ws.send('pong')
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try {
      ws.close(code, reason)
    } catch {
      // already closed
    }
  }

  async webSocketError(ws: WebSocket) {
    try {
      ws.close(1011, 'error')
    } catch {
      // already closed
    }
  }
}

/** Minimal namespace shape (DurableObjectNamespace in production, a fake in tests). */
export interface HubNamespace {
  idFromName(name: string): DurableObjectId
  get(id: DurableObjectId): { fetch(input: RequestInfo, init?: RequestInit): Promise<Response> }
}

/** Tell the account's hub about a new event. Never throws: Activity streaming is best effort, polling catches up. */
export const notifyHub = async (namespace: HubNamespace | undefined, live: LiveEvent) => {
  if (!namespace) return
  try {
    const stub = namespace.get(namespace.idFromName(live.accountId))
    await stub.fetch('https://activity-hub/broadcast', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(live) })
  } catch {
    // the page's polling fallback picks the event up
  }
}
