import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import { getDb, resetDb } from './helpers/fake-db'
import { TENANT_A, TENANT_B, call, customerSession, installFetch, makeEnv, managerToken, seedDeployment, seedOrgWithTenant, staffToken, type TestEnv } from './helpers/harness'
import { classifyAttachment, LIMITS } from '../src/attachments'
import { insertMessage } from '../src/chat-store'

let env: TestEnv
let a1: string // tenant A, user 1
let a2: string // tenant A, user 2
let b1: string // tenant B, user 1

beforeEach(async () => {
  await resetDb()
  installFetch()
  env = makeEnv()
  const depA = await seedDeployment()
  const depB = await seedDeployment()
  a1 = await customerSession(env, depA.key, TENANT_A, 'a-user-1')
  a2 = await customerSession(env, depA.key, TENANT_A, 'a-user-2')
  b1 = await customerSession(env, depB.key, TENANT_B, 'b-user-1')
})

async function teamOf(token: string) {
  const list = await call(env, 'GET', '/api/chat/conversations', { token })
  return list.json.find((conversation: any) => conversation.kind === 'team')
}

describe('conversation visibility', () => {
  it('customers see their tenant team thread and only their own private conversations', async () => {
    const teamA = await teamOf(a1)
    expect(teamA).toMatchObject({ tenantId: TENANT_A, kind: 'team', support: 'none', unread: 0, huddle: null })
    const created = await call(env, 'POST', '/api/chat/conversations', { token: a1, body: { kind: 'private' } })
    expect(created.status).toBe(201)
    expect(created.json).toMatchObject({ kind: 'private', ownerOid: 'a-user-1', ownerName: 'User a-user-1' })
    const privateId = created.json.id

    const a1List = await call(env, 'GET', '/api/chat/conversations', { token: a1 })
    expect(a1List.json.map((c: any) => c.kind)).toEqual(['team', 'private'])

    const a2List = await call(env, 'GET', '/api/chat/conversations', { token: a2 })
    expect(a2List.json.map((c: any) => c.id)).toEqual([teamA.id])

    // Same tenant, other user: private conversation is invisible.
    expect((await call(env, 'GET', `/api/chat/conversations/${privateId}/messages`, { token: a2 })).status).toBe(404)
    // Other tenant: neither the team thread nor the private conversation.
    expect((await call(env, 'GET', `/api/chat/conversations/${teamA.id}/messages`, { token: b1 })).status).toBe(404)
    expect((await call(env, 'GET', `/api/chat/conversations/${privateId}/messages`, { token: b1 })).status).toBe(404)
    const teamB = await teamOf(b1)
    expect(teamB.id).not.toBe(teamA.id)
  })

  it('managers see only assigned tenants; owners see all', async () => {
    const teamA = await teamOf(a1)
    await teamOf(b1)
    const manager = await managerToken()
    expect((await call(env, 'GET', '/api/chat/conversations', { token: manager })).json).toEqual([])
    expect((await call(env, 'GET', `/api/chat/conversations/${teamA.id}/messages`, { token: manager })).status).toBe(404)

    const owner = await staffToken()
    const all = await call(env, 'GET', '/api/chat/conversations', { token: owner })
    expect(all.json.map((c: any) => c.tenantId).sort()).toEqual([TENANT_A, TENANT_B])

    // Owner assigns tenant A's organization to the manager.
    const orgA = await seedOrgWithTenant(TENANT_A)
    const managerId = (await call(env, 'GET', '/api/admin/me', { token: manager })).json.id
    const assigned = await call(env, 'PUT', `/api/admin/organizations/${orgA}/account-manager`, { token: owner, body: { accountManagerId: managerId } })
    expect(assigned.status).toBe(200)

    const visible = await call(env, 'GET', '/api/chat/conversations', { token: manager })
    expect(visible.json.map((c: any) => c.tenantId)).toEqual([TENANT_A])
    expect((await call(env, 'GET', `/api/chat/conversations/${teamA.id}/messages`, { token: manager })).status).toBe(200)

    // Customer header shows the assigned manager.
    const header = await call(env, 'GET', '/api/chat/account-manager', { token: a1 })
    expect(header.json).toMatchObject({ name: 'Manny Manager', photoUrl: null })
    expect((await call(env, 'GET', '/api/chat/account-manager', { token: b1 })).json).toBeNull()

    // Manager customer list + timeline are scoped too.
    expect((await call(env, 'GET', '/api/admin/customers', { token: manager })).json.map((c: any) => c.tenantId)).toEqual([TENANT_A])
    expect((await call(env, 'GET', `/api/admin/customers/${TENANT_B}/timeline`, { token: manager })).status).toBe(404)
  })

  it('pages messages oldest-first with before=', async () => {
    const team = await teamOf(a1)
    const sender = { type: 'customer' as const, id: 'a-user-1', name: 'A1', photoUrl: null }
    const ids: string[] = []
    for (let i = 0; i < 5; i += 1) ids.push((await insertMessage(env, { conversationId: team.id, sender, body: `m${i}` })).id)
    const page = await call(env, 'GET', `/api/chat/conversations/${team.id}/messages?limit=2&before=${ids[4]}`, { token: a2 })
    expect(page.json.map((m: any) => m.body)).toEqual(['m2', 'm3'])
    const unread = await teamOf(a2)
    expect(unread.unread).toBe(5)
    expect((await teamOf(a1)).unread).toBe(0)
  })

  it('customers can open but not resolve support; staff can resolve', async () => {
    const team = await teamOf(a1)
    expect((await call(env, 'POST', `/api/chat/conversations/${team.id}/support`, { token: a1, body: { status: 'resolved' } })).status).toBe(403)
    const opened = await call(env, 'POST', `/api/chat/conversations/${team.id}/support`, { token: a1, body: { status: 'open' } })
    expect(opened.json.support).toBe('open')
    expect(env.CONVERSATION_ROOM.broadcasts.at(-1)?.frame).toEqual({ type: 'support', status: 'open' })
    const inbox = (await getDb().execute("SELECT kind, conversation_id FROM inbox_items WHERE kind='support.requested'")).rows
    expect(inbox).toHaveLength(1)
    const resolved = await call(env, 'POST', `/api/chat/conversations/${team.id}/support`, { token: await staffToken(), body: { status: 'resolved' } })
    expect(resolved.json.support).toBe('resolved')
  })
})

describe('attachments', () => {
  it('enforces type and size limits', () => {
    expect(classifyAttachment('image/png', LIMITS.image)).toBe('image')
    expect(() => classifyAttachment('image/png', LIMITS.image + 1)).toThrow(expect.objectContaining({ status: 413 }))
    expect(classifyAttachment('video/mp4', 200 * 1024 * 1024)).toBe('video')
    expect(() => classifyAttachment('video/mp4', 200 * 1024 * 1024 + 1)).toThrow(expect.objectContaining({ code: 'attachment_too_large' }))
    expect(classifyAttachment('application/pdf', 50 * 1024 * 1024)).toBe('document')
    expect(() => classifyAttachment('text/csv', 50 * 1024 * 1024 + 1)).toThrow(expect.objectContaining({ status: 413 }))
    expect(() => classifyAttachment('image/svg+xml', 10)).toThrow(expect.objectContaining({ status: 415 }))
    expect(() => classifyAttachment('video/quicktime', 10)).toThrow(expect.objectContaining({ status: 415 }))
    expect(() => classifyAttachment('application/x-msdownload', 10)).toThrow(expect.objectContaining({ code: 'unsupported_type' }))
    expect(() => classifyAttachment('image/png', 0)).toThrow(expect.objectContaining({ status: 422 }))
  })

  it('uploads through the signed URL, attaches to a message and enforces access', async () => {
    const team = await teamOf(a1)
    const tooBig = await call(env, 'POST', '/api/chat/attachments', { token: a1, body: { conversationId: team.id, name: 'big.mp4', contentType: 'video/mp4', size: 300 * 1024 * 1024 } })
    expect(tooBig.status).toBe(413)
    const otherTenant = await call(env, 'POST', '/api/chat/attachments', { token: b1, body: { conversationId: team.id, name: 'x.png', contentType: 'image/png', size: 4 } })
    expect(otherTenant.status).toBe(404)

    const created = await call(env, 'POST', '/api/chat/attachments', { token: a1, body: { conversationId: team.id, name: 'notes.txt', contentType: 'text/plain', size: 5 } })
    expect(created.status).toBe(201)
    const path = new URL(created.json.uploadUrl).pathname
    expect(path).toBe(`/api/chat/attachments/${created.json.attachmentId}`)

    // Wrong length is refused, another user cannot upload, then the right upload succeeds.
    expect((await call(env, 'PUT', path, { token: a1, raw: 'toolong', headers: { 'content-type': 'text/plain' } })).status).toBe(413)
    expect((await call(env, 'PUT', path, { token: a2, raw: 'hello', headers: { 'content-type': 'text/plain' } })).status).toBe(403)
    const uploaded = await call(env, 'PUT', path, { token: a1, raw: 'hello', headers: { 'content-type': 'text/plain' } })
    expect(uploaded.status).toBe(200)
    expect(uploaded.json).toMatchObject({ kind: 'document', name: 'notes.txt', size: 5 })
    expect((await call(env, 'PUT', path, { token: a1, raw: 'hello', headers: { 'content-type': 'text/plain' } })).status).toBe(409)

    const message = await insertMessage(env, { conversationId: team.id, sender: { type: 'customer', id: 'a-user-1', name: 'A1', photoUrl: null }, body: '', attachmentIds: [created.json.attachmentId] })
    expect(message.attachments).toHaveLength(1)
    // Attachments cannot be reused by another message or another sender.
    await expect(insertMessage(env, { conversationId: team.id, sender: { type: 'customer', id: 'a-user-1', name: 'A1', photoUrl: null }, body: 'again', attachmentIds: [created.json.attachmentId] })).rejects.toMatchObject({ code: 'invalid_attachment' })

    const download = await call(env, 'GET', path, { token: a2 })
    expect(download.status).toBe(200)
    expect(download.json).toBe('hello')
    expect(download.headers.get('content-disposition')).toContain('attachment')
    expect((await call(env, 'GET', path, { token: b1 })).status).toBe(404)
    expect((await call(env, 'GET', `${path}?token=${a2}`)).status).toBe(200)
    const ranged = await call(env, 'GET', path, { token: a2, headers: { range: 'bytes=1-2' } })
    expect(ranged.status).toBe(206)
    expect(ranged.headers.get('content-range')).toBe('bytes 1-2/5')
  })

  it('stores account manager photos publicly', async () => {
    const owner = await staffToken()
    const upload = await call(env, 'PUT', '/api/admin/me/photo', { token: owner, raw: new Uint8Array([1, 2, 3]), headers: { 'content-type': 'image/png', 'content-length': '3' } })
    expect(upload.status).toBe(200)
    const photoPath = new URL(upload.json.photoUrl).pathname
    const photo = await call(env, 'GET', photoPath)
    expect(photo.status).toBe(200)
    expect(photo.headers.get('content-type')).toBe('image/png')
    const svg = await call(env, 'PUT', '/api/admin/me/photo', { token: owner, raw: '<svg/>', headers: { 'content-type': 'image/svg+xml' } })
    expect(svg.status).toBe(415)
  })
})
