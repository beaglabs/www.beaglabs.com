/** /api/chat/* and /api/huddles/* — customer session or staff tokens. */
import { Hono, type Context } from 'hono'
import { requireChatActor, type ChatActor } from './auth'
import { createAttachment, downloadAttachment, getManagerPhoto, uploadAttachment } from './attachments'
import { createPrivateConversation, ensureTeamConversation, listConversations, listMessages, loadHuddle, liveHuddleId, senderFor, toConversation } from './chat-store'
import type { RoomMember } from './conversation-room'
import { first, getDb } from './db'
import type { Bindings } from './env'
import { heartbeatHuddle, joinHuddle, leaveHuddle, roomBroadcaster, startHuddle } from './huddles'
import { createInboxItem } from './inbox'
import { requireConversation } from './visibility'
import { ApiError, background, readJsonObject, type WaitUntil } from './util'

type AppEnv = { Bindings: Bindings }
type Ctx = Context<AppEnv>

export function waitUntilOf(c: { executionCtx: WaitUntil }): WaitUntil | undefined {
  try { return c.executionCtx } catch { return undefined }
}

const app = new Hono<AppEnv>()

function requireCustomer(actor: ChatActor): asserts actor is Extract<ChatActor, { kind: 'customer' }> {
  if (actor.kind !== 'customer') throw new ApiError(403, 'customer_only', 'Only Papyrus users can do this.')
}

app.get('/api/chat/conversations', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  if (actor.kind === 'customer') await ensureTeamConversation(c.env, actor.tenantId)
  const tenantId = actor.kind === 'staff' ? c.req.query('tenantId') ?? null : null
  return c.json(await listConversations(c.env, actor, tenantId))
})

app.post('/api/chat/conversations', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  requireCustomer(actor)
  const body = await readJsonObject(c.req.raw)
  if (body.kind !== 'private') throw new ApiError(422, 'validation_error', 'kind must be "private".')
  const row = await createPrivateConversation(c.env, actor)
  return c.json(toConversation(row as unknown as Record<string, unknown>), 201)
})

app.get('/api/chat/conversations/:id/messages', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  const conversation = await requireConversation(c.env, actor, c.req.param('id'))
  const limit = Number(c.req.query('limit') ?? 50)
  return c.json(await listMessages(c.env, conversation.id, c.req.query('before') ?? null, Number.isFinite(limit) ? limit : 50))
})

app.get('/api/chat/conversations/:id/ws', async (c) => {
  if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') throw new ApiError(400, 'websocket_required', 'Expected a WebSocket upgrade.')
  const actor = await requireChatActor(c.env, c.req.raw, true)
  const conversation = await requireConversation(c.env, actor, c.req.param('id'))
  const member: RoomMember = {
    conversationId: conversation.id,
    tenantId: conversation.tenant_id,
    sender: await senderFor(c.env, actor),
    oid: actor.oid,
  }
  const headers = new Headers(c.req.raw.headers)
  headers.delete('authorization')
  headers.set('x-chat-member', JSON.stringify(member))
  const stub = c.env.CONVERSATION_ROOM.get(c.env.CONVERSATION_ROOM.idFromName(conversation.id))
  return stub.fetch(new Request('https://room/ws', { headers }))
})

app.post('/api/chat/conversations/:id/support', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  const conversation = await requireConversation(c.env, actor, c.req.param('id'))
  const body = await readJsonObject(c.req.raw)
  const status = body.status
  if (status !== 'open' && status !== 'resolved') throw new ApiError(422, 'validation_error', 'status must be "open" or "resolved".')
  if (actor.kind === 'customer' && status !== 'open') throw new ApiError(403, 'forbidden', 'Customers can only open support requests.')
  await getDb(c.env).execute({ sql: 'UPDATE conversations SET support=? WHERE id=?', args: [status, conversation.id] })
  await roomBroadcaster(c.env, conversation.id)({ type: 'support', status })
  if (actor.kind === 'customer' && conversation.support !== 'open') {
    background(waitUntilOf(c), 'support.requested inbox', createInboxItem(c.env, {
      kind: 'support.requested',
      title: `${actor.name} asked for help`,
      body: 'Support request opened from Papyrus.',
      tenantId: conversation.tenant_id,
      conversationId: conversation.id,
    }, { audience: 'assigned', coalesceMinutes: 10 }))
  }
  const huddleId = await liveHuddleId(c.env, conversation.id)
  return c.json(toConversation({ ...conversation, support: status }, 0, huddleId ? await loadHuddle(c.env, huddleId) : null))
})

app.post('/api/chat/conversations/:id/huddle', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  const conversation = await requireConversation(c.env, actor, c.req.param('id'))
  return c.json(await startHuddle(c.env, actor, conversation, waitUntilOf(c)))
})

app.post('/api/huddles/:id/join', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  return c.json(await joinHuddle(c.env, actor, c.req.param('id'), waitUntilOf(c)))
})

app.post('/api/huddles/:id/leave', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  return c.json(await leaveHuddle(c.env, actor, c.req.param('id')))
})

app.post('/api/huddles/:id/heartbeat', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  return c.json(await heartbeatHuddle(c.env, actor, c.req.param('id')))
})

app.post('/api/chat/attachments', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  const result = await createAttachment(c.env, actor, await readJsonObject(c.req.raw))
  return c.json(result, 201)
})

app.put('/api/chat/attachments/:id', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  return c.json(await uploadAttachment(c.env, actor, c.req.param('id'), c.req.raw))
})

app.get('/api/chat/attachments/:id', async (c) => {
  // ?token= is accepted so <img>/<video> elements can load attachments directly.
  const actor = await requireChatActor(c.env, c.req.raw, true)
  return downloadAttachment(c.env, actor, c.req.param('id'), c.req.raw)
})

app.get('/api/chat/account-manager', async (c) => {
  const actor = await requireChatActor(c.env, c.req.raw)
  requireCustomer(actor)
  const row = first<Record<string, unknown>>(await getDb(c.env).execute({
    sql: `SELECT am.display_name, am.title, am.avatar_url FROM tenants t
          JOIN organization_account_managers oam ON oam.organization_id = t.organization_id
          JOIN account_managers am ON am.id = oam.account_manager_id AND am.active = 1
          WHERE t.tenant_id = ?
          ORDER BY CASE oam.role WHEN 'primary' THEN 0 WHEN 'technical' THEN 1 ELSE 2 END LIMIT 1`,
    args: [actor.tenantId],
  }))
  return c.json(row ? { name: String(row.display_name), title: row.title ? String(row.title) : null, photoUrl: row.avatar_url ? String(row.avatar_url) : null } : null)
})

app.get('/api/chat/account-managers/:id/photo', (c) => getManagerPhoto(c.env, c.req.param('id')))

export default app
