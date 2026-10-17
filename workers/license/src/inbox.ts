import { first, getDb, rows } from './db'
import type { Bindings } from './env'
import type { StaffActor } from './auth'
import { sendPush } from './push'
import { MANAGER_LEADS_SQL, MANAGER_TENANTS_SQL, managersForLead, managersForTenant, ownerIds } from './visibility'
import { ApiError, id, now } from './util'

export const INBOX_KINDS = [
  'lead.new', 'chat.message', 'support.requested', 'huddle.started', 'error.new', 'error.spike',
  'deployment.registered', 'tenant.bound', 'tenant.subscription_mismatch',
] as const
export type InboxKind = (typeof INBOX_KINDS)[number]

export type InboxInput = {
  kind: InboxKind
  title: string
  body?: string
  tenantId?: string | null
  leadId?: string | null
  conversationId?: string | null
}

/**
 * Push audience:
 * - 'assigned'  → the tenant's / lead's account managers, or owners when nobody is assigned
 * - 'owners'    → system owners only
 * - 'owners+assigned' → owners plus any assigned managers
 */
export type Audience = 'assigned' | 'owners' | 'owners+assigned'

export type InboxItem = {
  id: string
  kind: string
  title: string
  body: string
  tenantId?: string
  leadId?: string
  conversationId?: string
  createdAt: string
  doneAt?: string
}

type InboxRow = {
  id: string
  kind: string
  title: string
  body: string
  tenant_id: string | null
  lead_id: string | null
  conversation_id: string | null
  created_at: string
  done_at?: string | null
}

export function toInboxItem(row: InboxRow): InboxItem {
  const item: InboxItem = { id: row.id, kind: row.kind, title: row.title, body: row.body, createdAt: row.created_at }
  if (row.tenant_id) item.tenantId = row.tenant_id
  if (row.lead_id) item.leadId = row.lead_id
  if (row.conversation_id) item.conversationId = row.conversation_id
  if (row.done_at) item.doneAt = row.done_at
  return item
}

export async function recipientsFor(env: Bindings, input: InboxInput, audience: Audience): Promise<string[]> {
  const assigned = [...await managersForTenant(env, input.tenantId), ...await managersForLead(env, input.leadId)]
  if (audience === 'owners') return ownerIds(env)
  if (audience === 'owners+assigned') return [...new Set([...(await ownerIds(env)), ...assigned])]
  return assigned.length ? [...new Set(assigned)] : ownerIds(env)
}

/**
 * Creates an Inbox item and pushes it. With `coalesceMinutes`, an item of the same
 * kind for the same conversation (or tenant) created within that window is reused
 * (no new row) but the push still goes out. Never throws on push failure.
 */
export async function createInboxItem(
  env: Bindings,
  input: InboxInput,
  options: { audience: Audience; coalesceMinutes?: number; push?: boolean } ,
): Promise<InboxItem> {
  const db = getDb(env)
  let row: InboxRow | null = null
  if (options.coalesceMinutes) {
    const since = new Date(Date.now() - options.coalesceMinutes * 60_000).toISOString()
    row = first<InboxRow>(await db.execute({
      sql: `SELECT * FROM inbox_items WHERE kind=? AND COALESCE(conversation_id,'')=COALESCE(?, '') AND COALESCE(tenant_id,'')=COALESCE(?, '')
            AND created_at >= ? ORDER BY created_at DESC LIMIT 1`,
      args: [input.kind, input.conversationId ?? null, input.tenantId ?? null, since],
    }))
  }
  if (!row) {
    row = {
      id: id('inb'),
      kind: input.kind,
      title: input.title.slice(0, 200),
      body: (input.body ?? '').slice(0, 1000),
      tenant_id: input.tenantId ?? null,
      lead_id: input.leadId ?? null,
      conversation_id: input.conversationId ?? null,
      created_at: now(),
    }
    await db.execute({
      sql: 'INSERT INTO inbox_items (id, kind, title, body, tenant_id, lead_id, conversation_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
      args: [row.id, row.kind, row.title, row.body, row.tenant_id, row.lead_id, row.conversation_id, row.created_at],
    })
  }
  if (options.push !== false) {
    try {
      const recipients = await recipientsFor(env, input, options.audience)
      await sendPush(env, recipients, {
        title: input.title,
        body: input.body ?? '',
        data: { kind: input.kind, inboxId: row.id, conversationId: input.conversationId, leadId: input.leadId, tenantId: input.tenantId },
      })
    } catch (error) {
      console.error('inbox push failed', error instanceof Error ? error.message : error)
    }
  }
  return toInboxItem(row)
}

async function resolveBefore(env: Bindings, before: string | null): Promise<string | null> {
  if (!before) return null
  if (/^\d{4}-\d{2}-\d{2}T/.test(before)) return before
  const row = first<{ created_at: string }>(await getDb(env).execute({ sql: 'SELECT created_at FROM inbox_items WHERE id=?', args: [before] }))
  return row ? row.created_at : null
}

export async function listInbox(env: Bindings, actor: StaffActor, before: string | null, limit = 50): Promise<InboxItem[]> {
  const beforeAt = await resolveBefore(env, before)
  const where: string[] = []
  const args: unknown[] = [actor.accountManagerId]
  if (actor.role !== 'owner') {
    where.push(`(i.tenant_id IN (${MANAGER_TENANTS_SQL}) OR i.lead_id IN (${MANAGER_LEADS_SQL}))`)
    args.push(actor.accountManagerId, actor.accountManagerId)
  }
  if (beforeAt) { where.push('i.created_at < ?'); args.push(beforeAt) }
  args.push(Math.min(Math.max(limit, 1), 100))
  const result = rows<InboxRow>(await getDb(env).execute({
    sql: `SELECT i.*, d.done_at FROM inbox_items i
          LEFT JOIN inbox_item_done d ON d.item_id = i.id AND d.account_manager_id = ?
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY i.created_at DESC, i.id DESC LIMIT ?`,
    args,
  }))
  return result.map(toInboxItem)
}

export async function markInboxDone(env: Bindings, actor: StaffActor, itemId: string): Promise<InboxItem> {
  const db = getDb(env)
  const row = first<InboxRow>(await db.execute({ sql: 'SELECT * FROM inbox_items WHERE id=?', args: [itemId] }))
  if (!row) throw new ApiError(404, 'not_found', 'Inbox item was not found.')
  if (actor.role !== 'owner') {
    const visible = first(await db.execute({
      sql: `SELECT 1 AS ok WHERE ? IN (${MANAGER_TENANTS_SQL}) OR ? IN (${MANAGER_LEADS_SQL})`,
      args: [row.tenant_id, actor.accountManagerId, row.lead_id, actor.accountManagerId],
    }))
    if (!visible) throw new ApiError(404, 'not_found', 'Inbox item was not found.')
  }
  const doneAt = now()
  await db.execute({
    sql: 'INSERT INTO inbox_item_done (item_id, account_manager_id, done_at) VALUES (?,?,?) ON CONFLICT(item_id, account_manager_id) DO NOTHING',
    args: [itemId, actor.accountManagerId, doneAt],
  })
  const done = first<{ done_at: string }>(await db.execute({ sql: 'SELECT done_at FROM inbox_item_done WHERE item_id=? AND account_manager_id=?', args: [itemId, actor.accountManagerId] }))
  return toInboxItem({ ...row, done_at: done?.done_at ?? doneAt })
}
