/** Huddles: at most one live RealtimeKit meeting per conversation. */
import type { ChatActor } from './auth'
import { insertMessage, loadHuddle, liveHuddleId, senderFor, SYSTEM_SENDER, type Huddle } from './chat-store'
import { first, getDb } from './db'
import type { Bindings } from './env'
import { recordEvent } from './events'
import { createInboxItem } from './inbox'
import { addParticipant, createMeeting, deactivateMeeting } from './realtimekit'
import { requireConversation, type ConversationRow } from './visibility'
import { ApiError, background, id, now, type WaitUntil } from './util'

export const HEARTBEAT_TIMEOUT_MS = 60_000
export const SWEEP_INTERVAL_MS = 20_000

export type Broadcast = (frame: Record<string, unknown>) => Promise<void>

type Row = Record<string, unknown>

/** Sends a frame to every socket in the conversation's ConversationRoom. */
export function roomBroadcaster(env: Bindings, conversationId: string): Broadcast {
  return async (frame) => {
    try {
      const stub = env.CONVERSATION_ROOM.get(env.CONVERSATION_ROOM.idFromName(conversationId))
      await stub.fetch('https://room/broadcast', { method: 'POST', body: JSON.stringify(frame), headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      console.error('room broadcast failed', error instanceof Error ? error.message : error)
    }
  }
}

async function watchRoom(env: Bindings, conversationId: string): Promise<void> {
  try {
    const stub = env.CONVERSATION_ROOM.get(env.CONVERSATION_ROOM.idFromName(conversationId))
    await stub.fetch('https://room/huddle-watch', { method: 'POST', headers: { 'x-conversation-id': conversationId } })
  } catch (error) {
    console.error('room huddle-watch failed', error instanceof Error ? error.message : error)
  }
}

function participantKey(actor: ChatActor): { type: 'customer' | 'staff'; id: string } {
  return actor.kind === 'customer' ? { type: 'customer', id: actor.oid } : { type: 'staff', id: actor.accountManagerId }
}

export async function startHuddle(env: Bindings, actor: ChatActor, conversation: ConversationRow, ctx?: WaitUntil, broadcast: Broadcast = roomBroadcaster(env, conversation.id)): Promise<Huddle> {
  const existing = await liveHuddleId(env, conversation.id)
  if (existing) return (await loadHuddle(env, existing))!

  const meeting = await createMeeting(env, `Huddle ${conversation.id}`)
  const sender = await senderFor(env, actor)
  const huddleId = id('hdl')
  const startedAt = now()
  const insert = await getDb(env).execute({
    sql: `INSERT INTO huddles (id, conversation_id, meeting_id, started_by_type, started_by_id, started_by_name, started_at, last_heartbeat_at)
          VALUES (?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`,
    args: [huddleId, conversation.id, meeting.id, sender.type, sender.id, sender.name, startedAt, startedAt],
  })
  if (!insert.rowsAffected) {
    // Lost a race with a concurrent start: return the winner, drop our meeting.
    background(ctx, 'deactivate duplicate meeting', deactivateMeeting(env, meeting.id))
    const winner = await liveHuddleId(env, conversation.id)
    if (winner) return (await loadHuddle(env, winner))!
    throw new ApiError(409, 'huddle_conflict', 'Another huddle start is in progress; retry.')
  }

  const message = await insertMessage(env, { conversationId: conversation.id, sender: { ...SYSTEM_SENDER }, body: 'huddle.started', huddleId })
  const huddle = (await loadHuddle(env, huddleId))!
  await broadcast({ type: 'message', message })
  await broadcast({ type: 'huddle', huddle })
  await watchRoom(env, conversation.id)

  if (actor.kind === 'customer') {
    background(ctx, 'huddle.started inbox', createInboxItem(env, {
      kind: 'huddle.started',
      title: `${actor.name} started a huddle`,
      body: 'Join from the conversation.',
      tenantId: conversation.tenant_id,
      conversationId: conversation.id,
    }, { audience: 'assigned' }))
  } else {
    background(ctx, 'huddle.started event', recordEvent(env, {
      tenantId: conversation.tenant_id, source: 'admin', type: 'track', event: 'huddle.started', userId: actor.oid,
      properties: { conversationId: conversation.id, huddleId },
    }))
  }
  return huddle
}

async function requireHuddle(env: Bindings, actor: ChatActor, huddleId: string): Promise<{ row: Row; conversation: ConversationRow }> {
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT * FROM huddles WHERE id=?', args: [huddleId] }))
  if (!row) throw new ApiError(404, 'not_found', 'Huddle was not found.')
  const conversation = await requireConversation(env, actor, String(row.conversation_id))
  return { row, conversation }
}

export async function joinHuddle(env: Bindings, actor: ChatActor, huddleId: string, ctx?: WaitUntil): Promise<{ authToken: string; meetingId: string; huddle: Huddle }> {
  const { row, conversation } = await requireHuddle(env, actor, huddleId)
  if (row.ended_at) throw new ApiError(410, 'huddle_ended', 'This huddle has ended.')
  const sender = await senderFor(env, actor)
  const participant = await addParticipant(env, String(row.meeting_id), { customId: `${sender.type}:${sender.id}`, name: sender.name, picture: sender.photoUrl })
  const timestamp = now()
  await getDb(env).batch([
    {
      sql: `INSERT INTO huddle_participants (huddle_id, participant_type, participant_id, name, joined_at, last_heartbeat_at) VALUES (?,?,?,?,?,?)
            ON CONFLICT(huddle_id, participant_type, participant_id) DO UPDATE SET left_at=NULL, last_heartbeat_at=excluded.last_heartbeat_at, name=excluded.name`,
      args: [huddleId, sender.type, sender.id, sender.name, timestamp, timestamp],
    },
    { sql: 'UPDATE huddles SET last_heartbeat_at=? WHERE id=?', args: [timestamp, huddleId] },
  ])
  const huddle = (await loadHuddle(env, huddleId))!
  await roomBroadcaster(env, conversation.id)({ type: 'huddle', huddle })
  await watchRoom(env, conversation.id)
  background(ctx, 'huddle.joined event', recordEvent(env, {
    tenantId: conversation.tenant_id,
    source: actor.kind === 'staff' ? 'admin' : 'papyrus',
    type: 'track',
    event: 'huddle.joined',
    userId: actor.oid,
    properties: { conversationId: conversation.id, huddleId },
  }))
  return { authToken: participant.token, meetingId: String(row.meeting_id), huddle }
}

export async function heartbeatHuddle(env: Bindings, actor: ChatActor, huddleId: string): Promise<{ ok: true; huddle: Huddle }> {
  const { row } = await requireHuddle(env, actor, huddleId)
  if (row.ended_at) throw new ApiError(410, 'huddle_ended', 'This huddle has ended.')
  const key = participantKey(actor)
  const timestamp = now()
  const updated = await getDb(env).execute({
    sql: 'UPDATE huddle_participants SET last_heartbeat_at=? WHERE huddle_id=? AND participant_type=? AND participant_id=? AND left_at IS NULL',
    args: [timestamp, huddleId, key.type, key.id],
  })
  if (!updated.rowsAffected) throw new ApiError(409, 'not_in_huddle', 'Join the huddle before sending heartbeats.')
  await getDb(env).execute({ sql: 'UPDATE huddles SET last_heartbeat_at=? WHERE id=?', args: [timestamp, huddleId] })
  return { ok: true, huddle: (await loadHuddle(env, huddleId))! }
}

export async function leaveHuddle(env: Bindings, actor: ChatActor, huddleId: string, broadcastOverride?: Broadcast): Promise<{ huddle: Huddle }> {
  const { row, conversation } = await requireHuddle(env, actor, huddleId)
  const broadcast = broadcastOverride ?? roomBroadcaster(env, conversation.id)
  if (row.ended_at) return { huddle: (await loadHuddle(env, huddleId))! }
  const key = participantKey(actor)
  await getDb(env).execute({
    sql: 'UPDATE huddle_participants SET left_at=? WHERE huddle_id=? AND participant_type=? AND participant_id=? AND left_at IS NULL',
    args: [now(), huddleId, key.type, key.id],
  })
  if ((await activeParticipants(env, huddleId)) === 0) return { huddle: await endHuddle(env, huddleId, broadcast) }
  const huddle = (await loadHuddle(env, huddleId))!
  await broadcast({ type: 'huddle', huddle })
  return { huddle }
}

async function activeParticipants(env: Bindings, huddleId: string): Promise<number> {
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT COUNT(*) AS n FROM huddle_participants WHERE huddle_id=? AND left_at IS NULL', args: [huddleId] }))
  return Number(row?.n ?? 0)
}

/** Ends a live huddle (idempotent), records huddle.ended on the timeline and broadcasts it. */
export async function endHuddle(env: Bindings, huddleId: string, broadcast: Broadcast, endedAtMs = Date.now()): Promise<Huddle> {
  const db = getDb(env)
  const row = first<Row>(await db.execute({ sql: 'SELECT h.*, c.tenant_id FROM huddles h JOIN conversations c ON c.id = h.conversation_id WHERE h.id=?', args: [huddleId] }))
  if (!row) throw new ApiError(404, 'not_found', 'Huddle was not found.')
  if (!row.ended_at) {
    const endedAt = new Date(endedAtMs).toISOString()
    const durationSeconds = Math.max(0, Math.round((endedAtMs - Date.parse(String(row.started_at))) / 1000))
    const updated = await db.execute({
      sql: 'UPDATE huddles SET ended_at=?, duration_seconds=? WHERE id=? AND ended_at IS NULL',
      args: [endedAt, durationSeconds, huddleId],
    })
    if (updated.rowsAffected) {
      await db.execute({ sql: 'UPDATE huddle_participants SET left_at=? WHERE huddle_id=? AND left_at IS NULL', args: [endedAt, huddleId] })
      await deactivateMeeting(env, String(row.meeting_id))
      await recordEvent(env, {
        tenantId: String(row.tenant_id), source: 'system', type: 'track', event: 'huddle.ended',
        properties: { conversationId: String(row.conversation_id), huddleId, durationSeconds },
        timestamp: endedAt,
      })
      const huddle = (await loadHuddle(env, huddleId))!
      await broadcast({ type: 'huddle', huddle })
      return huddle
    }
  }
  return (await loadHuddle(env, huddleId))!
}

/**
 * Called from the ConversationRoom alarm. Drops participants without a heartbeat
 * for 60 s and ends the huddle when nobody is left or nothing has heartbeated for 60 s.
 * Returns true while a huddle is still live (so the alarm reschedules).
 */
export async function sweepHuddle(env: Bindings, conversationId: string, broadcast: Broadcast, nowMs = Date.now()): Promise<boolean> {
  const huddleId = await liveHuddleId(env, conversationId)
  if (!huddleId) return false
  const db = getDb(env)
  const cutoff = new Date(nowMs - HEARTBEAT_TIMEOUT_MS).toISOString()
  const pruned = await db.execute({
    sql: 'UPDATE huddle_participants SET left_at=? WHERE huddle_id=? AND left_at IS NULL AND last_heartbeat_at < ?',
    args: [new Date(nowMs).toISOString(), huddleId, cutoff],
  })
  const row = first<Row>(await db.execute({
    sql: `SELECT last_heartbeat_at, (SELECT COUNT(*) FROM huddle_participants p WHERE p.huddle_id = h.id) AS ever,
            (SELECT COUNT(*) FROM huddle_participants p WHERE p.huddle_id = h.id AND p.left_at IS NULL) AS active
          FROM huddles h WHERE id=?`,
    args: [huddleId],
  }))
  const stale = String(row?.last_heartbeat_at ?? '') < cutoff
  const empty = Number(row?.ever ?? 0) > 0 && Number(row?.active ?? 0) === 0
  if (stale || empty) {
    await endHuddle(env, huddleId, broadcast, nowMs)
    return false
  }
  if (pruned.rowsAffected) await broadcast({ type: 'huddle', huddle: (await loadHuddle(env, huddleId))! })
  return true
}
