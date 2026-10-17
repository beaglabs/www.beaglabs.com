/**
 * Who can see what. Owners see everything; managers see tenants (and leads)
 * whose organization is assigned to them in organization_account_managers;
 * customers see their tenant's team thread plus their own private conversations.
 */
import { first, getDb, rows } from './db'
import type { Bindings } from './env'
import type { ChatActor, StaffActor } from './auth'
import { ApiError } from './util'

/** Subquery of tenant ids assigned to a manager (one `?` = account manager id). */
export const MANAGER_TENANTS_SQL = `SELECT t.tenant_id FROM tenants t
  JOIN organization_account_managers oam ON oam.organization_id = t.organization_id
  WHERE oam.account_manager_id = ?`

/** Subquery of lead ids assigned to a manager (one `?` = account manager id). */
export const MANAGER_LEADS_SQL = `SELECT l.id FROM marketplace_leads l
  JOIN organization_account_managers oam ON oam.organization_id = l.organization_id
  WHERE oam.account_manager_id = ?`

export type ConversationRow = {
  id: string
  tenant_id: string
  kind: 'team' | 'private'
  owner_oid: string | null
  owner_name: string | null
  support: 'none' | 'open' | 'resolved'
  last_message_at: string | null
  created_at: string
}

export async function staffCanSeeTenant(env: Bindings, actor: StaffActor, tenantId: string): Promise<boolean> {
  if (actor.role === 'owner') return true
  const row = first(await getDb(env).execute({
    sql: `SELECT 1 AS ok WHERE ? IN (${MANAGER_TENANTS_SQL})`,
    args: [tenantId, actor.accountManagerId],
  }))
  return Boolean(row)
}

export async function staffCanSeeLead(env: Bindings, actor: StaffActor, leadId: string): Promise<boolean> {
  if (actor.role === 'owner') return true
  const row = first(await getDb(env).execute({
    sql: `SELECT 1 AS ok WHERE ? IN (${MANAGER_LEADS_SQL})`,
    args: [leadId, actor.accountManagerId],
  }))
  return Boolean(row)
}

export function customerCanSee(actor: { tenantId: string; oid: string }, conversation: ConversationRow): boolean {
  return conversation.tenant_id === actor.tenantId && (conversation.kind === 'team' || conversation.owner_oid === actor.oid)
}

export async function canSeeConversation(env: Bindings, actor: ChatActor, conversation: ConversationRow): Promise<boolean> {
  if (actor.kind === 'customer') return customerCanSee(actor, conversation)
  return staffCanSeeTenant(env, actor, conversation.tenant_id)
}

/** Loads a conversation the actor may see, or 404s (never reveals that it exists). */
export async function requireConversation(env: Bindings, actor: ChatActor, conversationId: string): Promise<ConversationRow> {
  const conversation = first<ConversationRow>(await getDb(env).execute({ sql: 'SELECT * FROM conversations WHERE id=?', args: [conversationId] }))
  if (!conversation || !(await canSeeConversation(env, actor, conversation))) {
    throw new ApiError(404, 'not_found', 'Conversation was not found.')
  }
  return conversation
}

/** Account managers assigned to a tenant's organization. */
export async function managersForTenant(env: Bindings, tenantId: string | null | undefined): Promise<string[]> {
  if (!tenantId) return []
  const result = rows<{ id: string }>(await getDb(env).execute({
    sql: `SELECT DISTINCT oam.account_manager_id AS id FROM tenants t
          JOIN organization_account_managers oam ON oam.organization_id = t.organization_id
          JOIN account_managers am ON am.id = oam.account_manager_id AND am.active = 1
          WHERE t.tenant_id = ?`,
    args: [tenantId],
  }))
  return result.map((row) => String(row.id))
}

export async function managersForLead(env: Bindings, leadId: string | null | undefined): Promise<string[]> {
  if (!leadId) return []
  const result = rows<{ id: string }>(await getDb(env).execute({
    sql: `SELECT DISTINCT oam.account_manager_id AS id FROM marketplace_leads l
          JOIN organization_account_managers oam ON oam.organization_id = l.organization_id
          JOIN account_managers am ON am.id = oam.account_manager_id AND am.active = 1
          WHERE l.id = ?`,
    args: [leadId],
  }))
  return result.map((row) => String(row.id))
}

export async function ownerIds(env: Bindings): Promise<string[]> {
  const result = rows<{ id: string }>(await getDb(env).execute(
    "SELECT sr.account_manager_id AS id FROM staff_roles sr JOIN account_managers am ON am.id = sr.account_manager_id AND am.active = 1 WHERE sr.role = 'owner'",
  ))
  return result.map((row) => String(row.id))
}
