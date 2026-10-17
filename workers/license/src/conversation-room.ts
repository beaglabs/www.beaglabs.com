/**
 * ConversationRoom Durable Object: one per conversation id. Holds hibernatable
 * WebSockets from the admin app and Papyrus users, persists messages to libSQL,
 * relays typing/read signals and watches live huddles' heartbeats via alarms.
 *
 * Only the Worker talks to this object. The Worker authenticates the caller and
 * checks visibility before forwarding the WebSocket upgrade with X-Chat-Member.
 */
import type { DurableObjectStateLike, HibernatableWebSocket } from './cf-types'
import { insertMessage, markRead, type Sender } from './chat-store'
import type { Bindings } from './env'
import { recordEvent } from './events'
import { SWEEP_INTERVAL_MS, sweepHuddle } from './huddles'
import { createInboxItem } from './inbox'
import { ApiError, isObject } from './util'

/** Identity attached to each socket (survives hibernation). */
export type RoomMember = {
  conversationId: string
  tenantId: string
  sender: Sender
  /** Entra oid, for analytics userId. */
  oid: string
}

declare const WebSocketPair: { new (): { 0: WebSocket; 1: WebSocket } }

const TYPING_MIN_INTERVAL_MS = 1500
const MAX_FRAME_BYTES = 32 * 1024

export class ConversationRoom {
  private lastTyping = new Map<string, number>()

  constructor(private readonly state: DurableObjectStateLike, private readonly env: Bindings) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      this.broadcast(await request.json() as Record<string, unknown>)
      return new Response(null, { status: 204 })
    }
    if (url.pathname === '/huddle-watch' && request.method === 'POST') {
      const conversationId = request.headers.get('x-conversation-id')
      if (!conversationId) return new Response('Missing conversation id', { status: 400 })
      await this.state.storage.put('conversationId', conversationId)
      await this.scheduleSweep()
      return new Response(null, { status: 204 })
    }
    if (url.pathname === '/ws') {
      if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Expected WebSocket upgrade', { status: 426 })
      let member: RoomMember
      try {
        member = JSON.parse(request.headers.get('x-chat-member') || '') as RoomMember
      } catch {
        return new Response('Missing member', { status: 400 })
      }
      const pair = new WebSocketPair()
      const server = pair[1] as unknown as HibernatableWebSocket
      this.state.acceptWebSocket(server, [member.sender.type])
      server.serializeAttachment(member)
      return new Response(null, { status: 101, webSocket: pair[0] } as ResponseInit)
    }
    return new Response('Not found', { status: 404 })
  }

  broadcast(frame: Record<string, unknown>, except?: HibernatableWebSocket): void {
    const text = JSON.stringify(frame)
    for (const socket of this.state.getWebSockets()) {
      if (socket === except) continue
      try { socket.send(text) } catch { /* closed */ }
    }
  }

  private send(socket: HibernatableWebSocket, frame: Record<string, unknown>): void {
    try { socket.send(JSON.stringify(frame)) } catch { /* closed */ }
  }

  async webSocketMessage(socket: HibernatableWebSocket, data: string | ArrayBuffer): Promise<void> {
    const member = socket.deserializeAttachment() as RoomMember | null
    if (!member) { socket.close(1008, 'unauthenticated'); return }
    if (typeof data !== 'string' || data.length > MAX_FRAME_BYTES) {
      this.send(socket, { type: 'error', error: 'invalid_frame', message: 'Frames must be JSON text up to 32 KB.' })
      return
    }
    let frame: unknown
    try { frame = JSON.parse(data) } catch {
      this.send(socket, { type: 'error', error: 'invalid_frame', message: 'Frames must be JSON.' })
      return
    }
    if (!isObject(frame)) return
    try {
      if (frame.type === 'message') await this.onMessage(socket, member, frame)
      else if (frame.type === 'typing') this.onTyping(socket, member)
      else if (frame.type === 'read') await this.onRead(socket, member, frame)
      else if (frame.type === 'ping') this.send(socket, { type: 'pong' })
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      if (!apiError) console.error('room frame failed', error instanceof Error ? error.message : error)
      this.send(socket, {
        type: 'error',
        error: apiError?.code ?? 'internal_error',
        message: apiError?.message ?? 'Message could not be processed.',
        ...(typeof frame.clientId === 'string' ? { clientId: frame.clientId } : {}),
      })
    }
  }

  private async onMessage(_socket: HibernatableWebSocket, member: RoomMember, frame: Record<string, unknown>): Promise<void> {
    const clientId = typeof frame.clientId === 'string' ? frame.clientId.slice(0, 128) : undefined
    const attachmentIds = Array.isArray(frame.attachmentIds) ? frame.attachmentIds.filter((value): value is string => typeof value === 'string') : []
    const message = await insertMessage(this.env, {
      conversationId: member.conversationId,
      sender: member.sender,
      body: typeof frame.body === 'string' ? frame.body : '',
      attachmentIds,
    })
    // Every socket (including the sender's other devices) gets the message; clientId lets the sender reconcile.
    this.broadcast({ type: 'message', message, ...(clientId ? { clientId } : {}) })

    if (member.sender.type === 'customer') {
      if (this.state.getWebSockets('staff').length === 0) {
        await createInboxItem(this.env, {
          kind: 'chat.message',
          title: `New message from ${member.sender.name}`,
          body: message.body ? message.body.slice(0, 280) : `${message.attachments.length} attachment(s)`,
          tenantId: member.tenantId,
          conversationId: member.conversationId,
        }, { audience: 'assigned', coalesceMinutes: 10 })
      }
    } else if (member.sender.type === 'staff') {
      await recordEvent(this.env, {
        tenantId: member.tenantId, source: 'admin', type: 'track', event: 'chat.message_sent', userId: member.oid,
        properties: { conversationId: member.conversationId, messageId: message.id, attachments: message.attachments.length },
      })
      if (message.attachments.length) {
        await recordEvent(this.env, {
          tenantId: member.tenantId, source: 'admin', type: 'track', event: 'chat.attachment_sent', userId: member.oid,
          properties: { conversationId: member.conversationId, messageId: message.id, kinds: message.attachments.map((attachment) => attachment.kind) },
        })
      }
    }
  }

  private onTyping(socket: HibernatableWebSocket, member: RoomMember): void {
    const key = `${member.sender.type}:${member.sender.id}`
    const current = Date.now()
    if (current - (this.lastTyping.get(key) ?? 0) < TYPING_MIN_INTERVAL_MS) return
    this.lastTyping.set(key, current)
    this.broadcast({ type: 'typing', sender: member.sender }, socket)
  }

  private async onRead(socket: HibernatableWebSocket, member: RoomMember, frame: Record<string, unknown>): Promise<void> {
    if (typeof frame.messageId !== 'string' || member.sender.type === 'system') return
    const stored = await markRead(this.env, member.conversationId, { type: member.sender.type, id: member.sender.id }, frame.messageId)
    if (stored) this.broadcast({ type: 'read', sender: member.sender, messageId: frame.messageId }, socket)
  }

  async webSocketClose(socket: HibernatableWebSocket, code: number): Promise<void> {
    try { socket.close(code === 1005 ? 1000 : code, 'closing') } catch { /* already closed */ }
  }

  async webSocketError(socket: HibernatableWebSocket): Promise<void> {
    try { socket.close(1011, 'error') } catch { /* already closed */ }
  }

  private async scheduleSweep(): Promise<void> {
    const existing = await this.state.storage.getAlarm()
    if (existing == null) await this.state.storage.setAlarm(Date.now() + SWEEP_INTERVAL_MS)
  }

  /** Huddle heartbeat watchdog: ends huddles without a heartbeat for 60 s. */
  async alarm(): Promise<void> {
    const conversationId = await this.state.storage.get<string>('conversationId')
    if (!conversationId) return
    const live = await sweepHuddle(this.env, conversationId, async (frame) => this.broadcast(frame))
    if (live) await this.state.storage.setAlarm(Date.now() + SWEEP_INTERVAL_MS)
  }
}
