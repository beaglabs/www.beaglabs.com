/** Chat persistence + API shapes shared by the REST routes and the ConversationRoom DO. */
import type { ChatActor } from './auth'
import { first, getDb, rows } from './db'
import type { Bindings } from './env'
import type { ConversationRow } from './visibility'
import { MANAGER_TENANTS_SQL } from './visibility'
import { ApiError, id, now } from './util'

export type Sender = { type: 'customer' | 'staff' | 'system'; id: string; name: string; photoUrl: string | null }

export type Attachment = { id: string; kind: 'image' | 'video' | 'document'; name: string; contentType: string; size: number; url: string }

export type Huddle = {
  id: string
  conversationId: string
  meetingId: string
  startedBy: Sender
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  participants: Sender[]
}

export type Message = {
  id: string
  conversationId: string
  sender: Sender
  body: string
  attachments: Attachment[]
  huddle: Huddle | null
  createdAt: string
}

export type Conversation = {
  id: string
  tenantId: string
  kind: 'team' | 'private'
  ownerOid: string | null
  ownerName: string | null
  support: 'none' | 'open' | 'resolved'
  lastMessageAt: string | null
  unread: number
  huddle: Huddle | null
}

type Row = Record<string, unknown>

export const SYSTEM_SENDER: Sender = { type: 'system', id: 'system', name: 'Beag Labs', photoUrl: null }
export const MAX_MESSAGE_BODY = 8000
export const MAX_MESSAGE_ATTACHMENTS = 10

export function baseUrl(env: Bindings): string {
  return (env.BASE_URL || 'https://license.beaglabs.com').replace(/\/+$/, '')
}

export function attachmentUrl(env: Bindings, attachmentId: string): string {
  return `${baseUrl(env)}/api/chat/attachments/${attachmentId}`
}

/** Identity used for messages, typing and huddle participants. */
export async function senderFor(env: Bindings, actor: ChatActor): Promise<Sender> {
  if (actor.kind === 'customer') return { type: 'customer', id: actor.oid, name: actor.name, photoUrl: null }
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT avatar_url FROM account_managers WHERE id=?', args: [actor.accountManagerId] }))
  return { type: 'staff', id: actor.accountManagerId, name: actor.name, photoUrl: row?.avatar_url ? String(row.avatar_url) : null }
}

async function staffPhotos(env: Bindings, ids: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids)]
  if (!unique.length) return new Map()
  const result = rows<Row>(await getDb(env).execute({
    sql: `SELECT id, avatar_url FROM account_managers WHERE id IN (${unique.map(() => '?').join(',')})`,
    args: unique,
  }))
  return new Map(result.map((row) => [String(row.id), row.avatar_url ? String(row.avatar_url) : null]))
}

function makeSender(type: string, senderId: string, name: string, photos: Map<string, string | null>): Sender {
  if (type === 'system') return { ...SYSTEM_SENDER, name: name || SYSTEM_SENDER.name }
  return { type: type as Sender['type'], id: senderId, name, photoUrl: type === 'staff' ? photos.get(senderId) ?? null : null }
}

// ---------------------------------------------------------------------------
// Huddles

export async function loadHuddles(env: Bindings, huddleIds: string[]): Promise<Map<string, Huddle>> {
  const unique = [...new Set(huddleIds.filter(Boolean))]
  if (!unique.length) return new Map()
  const placeholders = unique.map(() => '?').join(',')
  const db = getDb(env)
  const huddleRows = rows<Row>(await db.execute({ sql: `SELECT * FROM huddles WHERE id IN (${placeholders})`, args: unique }))
  const participantRows = rows<Row>(await db.execute({
    sql: `SELECT * FROM huddle_participants WHERE huddle_id IN (${placeholders}) AND left_at IS NULL ORDER BY joined_at`,
    args: unique,
  }))
  const photos = await staffPhotos(env, [
    ...huddleRows.filter((row) => row.started_by_type === 'staff').map((row) => String(row.started_by_id)),
    ...participantRows.filter((row) => row.participant_type === 'staff').map((row) => String(row.participant_id)),
  ])
  const result = new Map<string, Huddle>()
  for (const row of huddleRows) {
    result.set(String(row.id), {
      id: String(row.id),
      conversationId: String(row.conversation_id),
      meetingId: String(row.meeting_id),
      startedBy: makeSender(String(row.started_by_type), String(row.started_by_id), String(row.started_by_name), photos),
      startedAt: String(row.started_at),
      endedAt: row.ended_at ? String(row.ended_at) : null,
      durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
      participants: participantRows
        .filter((participant) => participant.huddle_id === row.id)
        .map((participant) => makeSender(String(participant.participant_type), String(participant.participant_id), String(participant.name), photos)),
    })
  }
  return result
}

export async function loadHuddle(env: Bindings, huddleId: string): Promise<Huddle | null> {
  return (await loadHuddles(env, [huddleId])).get(huddleId) ?? null
}

export async function liveHuddleId(env: Bindings, conversationId: string): Promise<string | null> {
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT id FROM huddles WHERE conversation_id=? AND ended_at IS NULL', args: [conversationId] }))
  return row ? String(row.id) : null
}

// ---------------------------------------------------------------------------
// Conversations

export async function ensureTeamConversation(env: Bindings, tenantId: string): Promise<void> {
  await getDb(env).execute({
    sql: "INSERT INTO conversations (id, tenant_id, kind, support, created_at) VALUES (?,?,'team','none',?) ON CONFLICT DO NOTHING",
    args: [id('cnv'), tenantId, now()],
  })
}

export async function createPrivateConversation(env: Bindings, actor: Extract<ChatActor, { kind: 'customer' }>): Promise<ConversationRow> {
  const row: ConversationRow = {
    id: id('cnv'),
    tenant_id: actor.tenantId,
    kind: 'private',
    owner_oid: actor.oid,
    owner_name: actor.name,
    support: 'none',
    last_message_at: null,
    created_at: now(),
  }
  await getDb(env).execute({
    sql: "INSERT INTO conversations (id, tenant_id, kind, owner_oid, owner_name, support, created_at) VALUES (?,?,'private',?,?,'none',?)",
    args: [row.id, row.tenant_id, row.owner_oid, row.owner_name, row.created_at],
  })
  return row
}

function readerKey(actor: ChatActor): { type: 'customer' | 'staff'; id: string } {
  return actor.kind === 'customer' ? { type: 'customer', id: actor.oid } : { type: 'staff', id: actor.accountManagerId }
}

/** Lists conversations visible to the actor, team threads first. */
export async function listConversations(env: Bindings, actor: ChatActor, tenantFilter?: string | null): Promise<Conversation[]> {
  const reader = readerKey(actor)
  const where: string[] = []
  const args: unknown[] = [reader.type, reader.id, reader.type, reader.id]
  if (actor.kind === 'customer') {
    where.push("c.tenant_id = ? AND (c.kind = 'team' OR c.owner_oid = ?)")
    args.push(actor.tenantId, actor.oid)
  } else if (actor.role !== 'owner') {
    where.push(`c.tenant_id IN (${MANAGER_TENANTS_SQL})`)
    args.push(actor.accountManagerId)
  }
  if (tenantFilter) { where.push('c.tenant_id = ?'); args.push(tenantFilter) }
  const result = rows<Row>(await getDb(env).execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id
               AND m.seq > COALESCE((SELECT r.last_read_seq FROM conversation_reads r WHERE r.conversation_id = c.id AND r.reader_type = ? AND r.reader_id = ?), 0)
               AND NOT (m.sender_type = ? AND m.sender_id = ?)) AS unread,
            (SELECT h.id FROM huddles h WHERE h.conversation_id = c.id AND h.ended_at IS NULL) AS live_huddle_id
          FROM conversations c
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY c.tenant_id, CASE c.kind WHEN 'team' THEN 0 ELSE 1 END, COALESCE(c.last_message_at, c.created_at) DESC
          LIMIT 500`,
    args,
  }))
  const huddles = await loadHuddles(env, result.map((row) => (row.live_huddle_id ? String(row.live_huddle_id) : '')))
  return result.map((row) => toConversation(row, Number(row.unread ?? 0), row.live_huddle_id ? huddles.get(String(row.live_huddle_id)) ?? null : null))
}

export function toConversation(row: Row, unread = 0, huddle: Huddle | null = null): Conversation {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    kind: row.kind as Conversation['kind'],
    ownerOid: row.owner_oid ? String(row.owner_oid) : null,
    ownerName: row.owner_name ? String(row.owner_name) : null,
    support: (row.support as Conversation['support']) ?? 'none',
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    unread,
    huddle,
  }
}

// ---------------------------------------------------------------------------
// Messages

export async function hydrateMessages(env: Bindings, messageRows: Row[]): Promise<Message[]> {
  if (!messageRows.length) return []
  const ids = messageRows.map((row) => String(row.id))
  const attachmentRows = rows<Row>(await getDb(env).execute({
    sql: `SELECT * FROM chat_attachments WHERE message_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at`,
    args: ids,
  }))
  const photos = await staffPhotos(env, messageRows.filter((row) => row.sender_type === 'staff').map((row) => String(row.sender_id)))
  const huddles = await loadHuddles(env, messageRows.map((row) => (row.huddle_id ? String(row.huddle_id) : '')))
  return messageRows.map((row) => ({
    id: String(row.id),
    conversationId: String(row.conversation_id),
    sender: makeSender(String(row.sender_type), String(row.sender_id), String(row.sender_name), photos),
    body: String(row.body ?? ''),
    attachments: attachmentRows.filter((attachment) => attachment.message_id === row.id).map((attachment) => toAttachment(env, attachment)),
    huddle: row.huddle_id ? huddles.get(String(row.huddle_id)) ?? null : null,
    createdAt: String(row.created_at),
  }))
}

export function toAttachment(env: Bindings, row: Row): Attachment {
  return {
    id: String(row.id),
    kind: row.kind as Attachment['kind'],
    name: String(row.name),
    contentType: String(row.content_type),
    size: Number(row.size),
    url: attachmentUrl(env, String(row.id)),
  }
}

export async function listMessages(env: Bindings, conversationId: string, before: string | null, limit: number): Promise<Message[]> {
  const db = getDb(env)
  const args: unknown[] = [conversationId]
  let beforeClause = ''
  if (before) {
    const anchor = first<Row>(await db.execute({ sql: 'SELECT seq FROM messages WHERE id=? AND conversation_id=?', args: [before, conversationId] }))
    if (!anchor) throw new ApiError(404, 'not_found', 'Message was not found.')
    beforeClause = 'AND seq < ?'
    args.push(Number(anchor.seq))
  }
  args.push(Math.min(Math.max(limit, 1), 100))
  const result = rows<Row>(await db.execute({
    sql: `SELECT * FROM messages WHERE conversation_id=? ${beforeClause} ORDER BY seq DESC LIMIT ?`,
    args,
  }))
  return hydrateMessages(env, result.reverse())
}

export async function loadMessage(env: Bindings, messageId: string): Promise<Message | null> {
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT * FROM messages WHERE id=?', args: [messageId] }))
  return row ? (await hydrateMessages(env, [row]))[0] : null
}

/**
 * Persists a message. Attachments must belong to the conversation, be uploaded
 * by the same sender, be fully uploaded, and not be attached to another message.
 */
export async function insertMessage(env: Bindings, input: {
  conversationId: string
  sender: Sender
  body: string
  attachmentIds?: readonly string[]
  huddleId?: string | null
}): Promise<Message> {
  const body = input.body.trim()
  if (body.length > MAX_MESSAGE_BODY) throw new ApiError(413, 'message_too_long', `Messages must be at most ${MAX_MESSAGE_BODY} characters.`)
  const attachmentIds = [...new Set(input.attachmentIds ?? [])]
  if (attachmentIds.length > MAX_MESSAGE_ATTACHMENTS) throw new ApiError(422, 'too_many_attachments', `At most ${MAX_MESSAGE_ATTACHMENTS} attachments per message.`)
  if (!body && !attachmentIds.length && !input.huddleId) throw new ApiError(422, 'empty_message', 'Message must have text or attachments.')
  const db = getDb(env)
  if (attachmentIds.length) {
    const found = rows<Row>(await db.execute({
      sql: `SELECT id FROM chat_attachments WHERE id IN (${attachmentIds.map(() => '?').join(',')})
            AND conversation_id=? AND uploader_type=? AND uploader_id=? AND uploaded_at IS NOT NULL AND message_id IS NULL`,
      args: [...attachmentIds, input.conversationId, input.sender.type, input.sender.id],
    }))
    if (found.length !== attachmentIds.length) throw new ApiError(422, 'invalid_attachment', 'One or more attachments are missing, not uploaded, or already sent.')
  }
  const messageId = id('msg')
  const createdAt = now()
  await db.batch([
    {
      sql: `INSERT INTO messages (id, conversation_id, seq, sender_type, sender_id, sender_name, body, huddle_id, created_at)
            VALUES (?, ?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM messages WHERE conversation_id = ?), ?, ?, ?, ?, ?, ?)`,
      args: [messageId, input.conversationId, input.conversationId, input.sender.type, input.sender.id, input.sender.name, body, input.huddleId ?? null, createdAt],
    },
    ...attachmentIds.map((attachmentId) => ({ sql: 'UPDATE chat_attachments SET message_id=? WHERE id=? AND message_id IS NULL', args: [messageId, attachmentId] })),
    { sql: 'UPDATE conversations SET last_message_at=? WHERE id=?', args: [createdAt, input.conversationId] },
  ])
  const message = await loadMessage(env, messageId)
  if (!message) throw new ApiError(500, 'internal_error', 'Message was not stored.')
  return message
}

export async function markRead(env: Bindings, conversationId: string, reader: { type: 'customer' | 'staff'; id: string }, messageId: string): Promise<boolean> {
  const db = getDb(env)
  const message = first<Row>(await db.execute({ sql: 'SELECT seq FROM messages WHERE id=? AND conversation_id=?', args: [messageId, conversationId] }))
  if (!message) return false
  await db.execute({
    sql: `INSERT INTO conversation_reads (conversation_id, reader_type, reader_id, last_read_seq, updated_at) VALUES (?,?,?,?,?)
          ON CONFLICT(conversation_id, reader_type, reader_id) DO UPDATE SET last_read_seq=MAX(conversation_reads.last_read_seq, excluded.last_read_seq), updated_at=excluded.updated_at`,
    args: [conversationId, reader.type, reader.id, Number(message.seq), now()],
  })
  return true
}

export { readerKey }
