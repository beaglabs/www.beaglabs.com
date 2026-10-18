import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import { getDb, resetDb } from './helpers/fake-db'
import { installFetch, makeCtx, makeEnv, seedDeployment, type TestEnv } from './helpers/harness'
import worker from '../src/entry'
import { resetTrackRateLimit } from '../src/track'

let env: TestEnv
beforeEach(async () => {
  await resetDb()
  installFetch()
  resetTrackRateLimit()
  env = makeEnv()
})

async function hit(method: string, path: string, headers: Record<string, string> = {}, body?: unknown) {
  const init: RequestInit = { method, headers: { 'content-type': 'application/json', ...headers } }
  if (body !== undefined) init.body = JSON.stringify(body)
  return worker.fetch(new Request(`https://license.test${path}`, init), env, makeCtx())
}

describe('chat and admin API removed (2026-10-17)', () => {
  it.each([
    ['GET', '/api/chat/conversations'],
    ['POST', '/api/chat/conversations'],
    ['GET', '/api/chat/conversations/cnv_1/socket'],
    ['POST', '/api/huddles/hud_1/join'],
    ['POST', '/api/papyrus/session'],
    ['GET', '/api/admin/me'],
    ['GET', '/api/admin/customers'],
    ['GET', '/api/admin/inbox'],
    ['POST', '/api/admin/devices'],
  ])('%s %s is 404', async (method, path) => {
    const response = await hit(method, path, { authorization: 'Bearer x' }, method === 'POST' ? {} : undefined)
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'not_found' })
  })

  it('analytics /api/v1/track still accepts deployment events, with open CORS', async () => {
    const { key } = await seedDeployment()
    const response = await hit('POST', '/api/v1/track', { authorization: `Deployment ${key}`, origin: 'https://papyrus.contoso.com' }, {
      batch: [{ type: 'track', event: 'document.created', userId: 'u1' }],
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ accepted: 1 })
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect((await getDb().execute('SELECT event, source FROM tenant_events')).rows[0]).toMatchObject({ event: 'document.created', source: 'papyrus' })
  })
})

describe('wrangler.jsonc', () => {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
  const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, '')) as Record<string, any>

  it('deletes the ConversationRoom Durable Object with a migration after the one that created it', () => {
    const tags = config.migrations.map((migration: { tag: string }) => migration.tag)
    expect(tags).toEqual(['v1-conversation-room', 'v2-remove-conversation-room'])
    expect(config.migrations[1].deleted_classes).toEqual(['ConversationRoom'])
    expect(config.durable_objects).toBeUndefined()
  })

  it('drops the chat bindings, vars and secrets', () => {
    expect(config.r2_buckets).toBeUndefined()
    expect(Object.keys(config.vars)).not.toEqual(expect.arrayContaining(['ADMIN_API_CLIENT_ID']))
    for (const name of Object.keys(config.vars)) expect(name).not.toMatch(/^(ADMIN_API_|APNS_|REALTIMEKIT_)/)
    expect(config.secrets.required).not.toContain('CHAT_SESSION_SECRET')
  })
})
