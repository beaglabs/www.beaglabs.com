import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import { getDb, resetDb } from './helpers/fake-db'
import { TENANT_A, TENANT_B, call, customerSession, fetchCalls, installFetch, makeEnv, seedDeployment, staffToken, type TestEnv } from './helpers/harness'
import { HEARTBEAT_TIMEOUT_MS, sweepHuddle } from '../src/huddles'
import { ConversationRoom, type RoomMember } from '../src/conversation-room'
import type { DurableObjectStateLike, HibernatableWebSocket } from '../src/cf-types'

let env: TestEnv
let a1: string
let b1: string
let teamId: string

beforeEach(async () => {
  await resetDb()
  installFetch()
  env = makeEnv()
  const depA = await seedDeployment()
  const depB = await seedDeployment()
  a1 = await customerSession(env, depA.key, TENANT_A, 'a-user-1')
  b1 = await customerSession(env, depB.key, TENANT_B, 'b-user-1')
  teamId = (await call(env, 'GET', '/api/chat/conversations', { token: a1 })).json[0].id
})

describe('huddles', () => {
  it('starts once per conversation, joins via RealtimeKit and ends when the last participant leaves', async () => {
    const started = await call(env, 'POST', `/api/chat/conversations/${teamId}/huddle`, { token: a1 })
    expect(started.status).toBe(200)
    const huddle = started.json
    expect(huddle).toMatchObject({ conversationId: teamId, startedBy: { type: 'customer', id: 'a-user-1' }, endedAt: null, participants: [] })
    expect(fetchCalls.some((c) => c.url === 'https://api.cloudflare.com/client/v4/accounts/acct/realtime/kit/app/meetings' && c.method === 'POST')).toBe(true)
    // Second start returns the live huddle, no second meeting.
    const again = await call(env, 'POST', `/api/chat/conversations/${teamId}/huddle`, { token: await staffToken() })
    expect(again.json.id).toBe(huddle.id)
    expect(fetchCalls.filter((c) => c.url.endsWith('/meetings') && c.method === 'POST')).toHaveLength(1)

    const frames = env.CONVERSATION_ROOM.broadcasts.map((b) => b.frame.type)
    expect(frames).toEqual(['message', 'huddle'])
    expect((env.CONVERSATION_ROOM.broadcasts[0].frame.message as any).huddle.id).toBe(huddle.id)
    expect(env.CONVERSATION_ROOM.watched.has(teamId)).toBe(true)
    const inbox = (await getDb().execute("SELECT kind FROM inbox_items WHERE kind='huddle.started'")).rows
    expect(inbox).toHaveLength(1)

    // Other tenants cannot join.
    expect((await call(env, 'POST', `/api/huddles/${huddle.id}/join`, { token: b1 })).status).toBe(404)

    const owner = await staffToken()
    const joinA = await call(env, 'POST', `/api/huddles/${huddle.id}/join`, { token: a1 })
    expect(joinA.json).toMatchObject({ meetingId: huddle.meetingId, authToken: expect.stringMatching(/^rtk-token-/) })
    const participantCall = fetchCalls.find((c) => c.url.endsWith(`/meetings/${huddle.meetingId}/participants`))
    expect(participantCall?.body).toMatchObject({ custom_participant_id: 'customer:a-user-1', preset_name: 'group_call_participant', name: 'User a-user-1' })
    const joinStaff = await call(env, 'POST', `/api/huddles/${huddle.id}/join`, { token: owner })
    expect(joinStaff.json.huddle.participants).toHaveLength(2)
    expect((await call(env, 'POST', `/api/huddles/${huddle.id}/heartbeat`, { token: a1 })).json.ok).toBe(true)

    const leftA = await call(env, 'POST', `/api/huddles/${huddle.id}/leave`, { token: a1 })
    expect(leftA.json.huddle.endedAt).toBeNull()
    const leftStaff = await call(env, 'POST', `/api/huddles/${huddle.id}/leave`, { token: owner })
    expect(leftStaff.json.huddle.endedAt).not.toBeNull()
    expect(typeof leftStaff.json.huddle.durationSeconds).toBe('number')
    expect(env.CONVERSATION_ROOM.broadcasts.at(-1)?.frame).toMatchObject({ type: 'huddle', huddle: { id: huddle.id, endedAt: expect.any(String) } })
    const ended = (await getDb().execute("SELECT tenant_id, source FROM tenant_events WHERE event='huddle.ended'")).rows
    expect(ended).toEqual([expect.objectContaining({ tenant_id: TENANT_A, source: 'system' })])
    expect(fetchCalls.some((c) => c.method === 'PATCH' && (c.body as any)?.status === 'INACTIVE')).toBe(true)
    // Ended huddles cannot be joined; a new start creates a new huddle.
    expect((await call(env, 'POST', `/api/huddles/${huddle.id}/join`, { token: a1 })).status).toBe(410)
    const next = await call(env, 'POST', `/api/chat/conversations/${teamId}/huddle`, { token: a1 })
    expect(next.json.id).not.toBe(huddle.id)
  })

  it('the watchdog ends huddles with no heartbeat for 60 s', async () => {
    const huddle = (await call(env, 'POST', `/api/chat/conversations/${teamId}/huddle`, { token: a1 })).json
    await call(env, 'POST', `/api/huddles/${huddle.id}/join`, { token: a1 })
    const frames: Record<string, unknown>[] = []
    expect(await sweepHuddle(env, teamId, async (frame) => { frames.push(frame) }, Date.now() + 10_000)).toBe(true)
    expect(await sweepHuddle(env, teamId, async (frame) => { frames.push(frame) }, Date.now() + HEARTBEAT_TIMEOUT_MS + 5_000)).toBe(false)
    const row = (await getDb().execute({ sql: 'SELECT ended_at, duration_seconds FROM huddles WHERE id=?', args: [huddle.id] })).rows[0]
    expect(row.ended_at).not.toBeNull()
    expect(frames.at(-1)).toMatchObject({ type: 'huddle', huddle: { endedAt: expect.any(String) } })
  })
})

// ---------------------------------------------------------------------------
// ConversationRoom (hibernation API) with fake sockets

class FakeSocket implements HibernatableWebSocket {
  sent: any[] = []
  constructor(private attachment: RoomMember, readonly tag: string) {}
  send(message: string) { this.sent.push(JSON.parse(message)) }
  close() {}
  serializeAttachment(value: unknown) { this.attachment = value as RoomMember }
  deserializeAttachment() { return this.attachment }
}

function fakeState(sockets: FakeSocket[]): DurableObjectStateLike {
  const store = new Map<string, unknown>()
  let alarm: number | null = null
  return {
    acceptWebSocket() {},
    getWebSockets: (tag?: string) => sockets.filter((socket) => !tag || socket.tag === tag),
    storage: {
      get: async <T>(key: string) => store.get(key) as T | undefined,
      put: async (key: string, value: unknown) => { store.set(key, value) },
      getAlarm: async () => alarm,
      setAlarm: async (time: number) => { alarm = time },
      deleteAlarm: async () => { alarm = null },
    },
  }
}

describe('ConversationRoom', () => {
  const customer = (): RoomMember => ({ conversationId: teamId, tenantId: TENANT_A, oid: 'a-user-1', sender: { type: 'customer', id: 'a-user-1', name: 'A One', photoUrl: null } })

  it('persists and broadcasts messages; notifies the account manager when no staff is connected', async () => {
    const socketA = new FakeSocket(customer(), 'customer')
    const room = new ConversationRoom(fakeState([socketA]), env)
    await room.webSocketMessage(socketA, JSON.stringify({ type: 'message', clientId: 'c-1', body: 'hello 👋', attachmentIds: [] }))
    expect(socketA.sent[0]).toMatchObject({ type: 'message', clientId: 'c-1', message: { body: 'hello 👋', sender: { type: 'customer' }, attachments: [], huddle: null } })
    const inbox = (await getDb().execute("SELECT kind, conversation_id FROM inbox_items WHERE kind='chat.message'")).rows
    expect(inbox).toEqual([expect.objectContaining({ conversation_id: teamId })])
    const messages = await call(env, 'GET', `/api/chat/conversations/${teamId}/messages`, { token: a1 })
    expect(messages.json.map((m: any) => m.body)).toEqual(['hello 👋'])
  })

  it('does not notify when staff is connected; relays typing and read to others only', async () => {
    const owner = await staffToken()
    const me = (await call(env, 'GET', '/api/admin/me', { token: owner })).json
    const socketA = new FakeSocket(customer(), 'customer')
    const socketStaff = new FakeSocket({ conversationId: teamId, tenantId: TENANT_A, oid: me.oid, sender: { type: 'staff', id: me.id, name: me.name, photoUrl: null } }, 'staff')
    const room = new ConversationRoom(fakeState([socketA, socketStaff]), env)
    await room.webSocketMessage(socketA, JSON.stringify({ type: 'message', body: 'hi' }))
    expect((await getDb().execute("SELECT COUNT(*) AS n FROM inbox_items WHERE kind='chat.message'")).rows[0].n).toBe(0)
    const messageId = socketStaff.sent[0].message.id

    await room.webSocketMessage(socketA, JSON.stringify({ type: 'typing' }))
    expect(socketStaff.sent.at(-1)).toEqual({ type: 'typing', sender: customer().sender })
    expect(socketA.sent.filter((frame) => frame.type === 'typing')).toHaveLength(0)

    await room.webSocketMessage(socketStaff, JSON.stringify({ type: 'read', messageId }))
    expect(socketA.sent.at(-1)).toMatchObject({ type: 'read', messageId, sender: { type: 'staff', id: me.id } })

    await room.webSocketMessage(socketStaff, JSON.stringify({ type: 'message', body: 'Hello from Beag Labs' }))
    const staffEvent = (await getDb().execute("SELECT source, event FROM tenant_events WHERE event='chat.message_sent'")).rows
    expect(staffEvent).toEqual([expect.objectContaining({ source: 'admin' })])
  })

  it('rejects attachments that belong to someone else and reports errors to the sender', async () => {
    const socketA = new FakeSocket(customer(), 'customer')
    const room = new ConversationRoom(fakeState([socketA]), env)
    await room.webSocketMessage(socketA, JSON.stringify({ type: 'message', clientId: 'c-2', body: 'x', attachmentIds: ['att_missing'] }))
    expect(socketA.sent.at(-1)).toMatchObject({ type: 'error', error: 'invalid_attachment', clientId: 'c-2' })
    await room.webSocketMessage(socketA, 'not json')
    expect(socketA.sent.at(-1)).toMatchObject({ type: 'error', error: 'invalid_frame' })
  })

  it('alarm sweeps the conversation stored by huddle-watch', async () => {
    const state = fakeState([])
    const room = new ConversationRoom(state, env)
    const response = await room.fetch(new Request('https://room/huddle-watch', { method: 'POST', headers: { 'x-conversation-id': teamId } }))
    expect(response.status).toBe(204)
    expect(await state.storage.getAlarm()).not.toBeNull()
    await room.alarm() // no live huddle: nothing to do, no reschedule needed
    expect(await state.storage.get('conversationId')).toBe(teamId)
  })
})
