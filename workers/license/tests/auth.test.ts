import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import { getDb, resetDb } from './helpers/fake-db'
import {
  ADMIN_CLIENT, PAPYRUS_CLIENT, TENANT_A, TENANT_B, call, customerIdToken, customerSession, installFetch, makeEnv, managerToken, seedDeployment, staffToken, type TestEnv,
} from './helpers/harness'
import { signHs256 } from '../src/jwt'

let env: TestEnv
beforeEach(async () => {
  await resetDb()
  installFetch()
  env = makeEnv()
})

describe('staff Entra token validation', () => {
  it('accepts a valid owner token and upserts the account manager', async () => {
    const response = await call(env, 'GET', '/api/admin/me', { token: await staffToken() })
    expect(response.status).toBe(200)
    expect(response.json).toMatchObject({ oid: 'owner-oid', name: 'Olivia Owner', email: 'olivia@beaglabs.com', role: 'owner' })
    const row = (await getDb().execute('SELECT COUNT(*) AS n FROM account_managers')).rows[0]
    expect(row.n).toBe(1)
  })

  it('accepts the bare client id audience and maps the manager role', async () => {
    const response = await call(env, 'GET', '/api/admin/me', { token: await staffToken({ aud: ADMIN_CLIENT, roles: ['Papyrus.Account.Manager'] }) })
    expect(response.status).toBe(200)
    expect(response.json.role).toBe('manager')
  })

  it('rejects an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 7200
    const response = await call(env, 'GET', '/api/admin/me', { token: await staffToken({ iat: past - 3600, exp: past }) })
    expect(response.status).toBe(401)
    expect(response.json.error).toBe('token_expired')
  })

  it('rejects a token for another audience', async () => {
    const response = await call(env, 'GET', '/api/admin/me', { token: await staffToken({ aud: 'api://someone-else' }) })
    expect(response.status).toBe(401)
    expect(response.json.error).toBe('invalid_audience')
  })

  it('rejects a token from another tenant (issuer)', async () => {
    const response = await call(env, 'GET', '/api/admin/me', { token: await staffToken({ iss: `https://login.microsoftonline.com/${TENANT_A}/v2.0` }) })
    expect(response.status).toBe(401)
  })

  it('rejects a token without either app role', async () => {
    const response = await call(env, 'GET', '/api/admin/me', { token: await staffToken({ roles: ['Something.Else'] }) })
    expect(response.status).toBe(403)
    expect(response.json.error).toBe('forbidden_role')
  })

  it('rejects a tampered signature', async () => {
    const token = await staffToken()
    const [h, p, s] = token.split('.')
    const forged = `${h}.${p.slice(0, -2)}${p.slice(-2) === 'AA' ? 'AB' : 'AA'}.${s}`
    const response = await call(env, 'GET', '/api/admin/me', { token: forged })
    expect(response.status).toBe(401)
  })

  it('managers cannot use owner-only routes', async () => {
    const response = await call(env, 'GET', '/api/admin/assign', { token: await managerToken() })
    expect(response.status).toBe(403)
    expect(response.json.error).toBe('owner_required')
  })

  it('a chat session token is not accepted as a staff token', async () => {
    const session = await signHs256({ sub: 'x', tid: TENANT_A, dep: 'd', kind: 'customer', exp: Math.floor(Date.now() / 1000) + 60 }, env.CHAT_SESSION_SECRET)
    const response = await call(env, 'GET', '/api/admin/me', { token: session })
    expect(response.status).toBe(401)
  })
})

describe('Papyrus session + tenant binding', () => {
  it('binds the deployment to the first tenant and rejects a different tenant later', async () => {
    const { key, deploymentId } = await seedDeployment()
    const first = await call(env, 'POST', '/api/papyrus/session', { deploymentKey: key, body: { idToken: await customerIdToken(TENANT_A, 'user-1') } })
    expect(first.status).toBe(200)
    expect(first.json).toMatchObject({ tenantId: TENANT_A, user: { oid: 'user-1', name: 'User user-1' } })
    expect(Date.parse(first.json.expiresAt) - Date.now()).toBeGreaterThan(55 * 60_000)
    const bound = (await getDb().execute({ sql: 'SELECT tenant_id FROM papyrus_deployments WHERE id=?', args: [deploymentId] })).rows[0]
    expect(bound.tenant_id).toBe(TENANT_A)
    const inbox = (await getDb().execute("SELECT kind FROM inbox_items WHERE kind='tenant.bound'")).rows
    expect(inbox).toHaveLength(1)

    const other = await call(env, 'POST', '/api/papyrus/session', { deploymentKey: key, body: { idToken: await customerIdToken(TENANT_B, 'user-2') } })
    expect(other.status).toBe(403)
    expect(other.json.error).toBe('tenant_mismatch')
  })

  it('requires the ID token audience to match the deployment entraClientId', async () => {
    const { key } = await seedDeployment({ entraClientId: PAPYRUS_CLIENT })
    const response = await call(env, 'POST', '/api/papyrus/session', { deploymentKey: key, body: { idToken: await customerIdToken(TENANT_A, 'u', { aud: 'other-app' }) } })
    expect(response.status).toBe(401)
    expect(response.json.error).toBe('invalid_audience')
  })

  it('rejects an ID token whose issuer does not match its tid', async () => {
    const { key } = await seedDeployment()
    const token = await customerIdToken(TENANT_A, 'u', { iss: `https://login.microsoftonline.com/${TENANT_B}/v2.0` })
    const response = await call(env, 'POST', '/api/papyrus/session', { deploymentKey: key, body: { idToken: token } })
    expect(response.status).toBe(401)
  })

  it('rejects an unknown deployment key', async () => {
    const response = await call(env, 'POST', '/api/papyrus/session', { deploymentKey: `pdk_${'x'.repeat(43)}`, body: { idToken: await customerIdToken(TENANT_A, 'u') } })
    expect(response.status).toBe(401)
    expect(response.json.error).toBe('invalid_deployment_key')
  })

  it('flags a subscription that Partner Center reports for another customer', async () => {
    const t = new Date().toISOString()
    await getDb().execute({
      sql: `INSERT INTO marketplace_vm_customers (id, observation_key, marketplace_subscription_id, customer_id, first_seen_at, last_seen_at, raw_json, created_at, updated_at)
            VALUES ('mvc1','obs1','sub-x',?, ?, ?, '{}', ?, ?)`,
      args: [TENANT_B, t, t, t, t],
    })
    const { key } = await seedDeployment({ subscriptionId: 'sub-x' })
    await customerSession(env, key, TENANT_A, 'u')
    const kinds = (await getDb().execute('SELECT kind FROM inbox_items ORDER BY kind')).rows.map((row) => row.kind)
    expect(kinds).toEqual(['tenant.bound', 'tenant.subscription_mismatch'])
  })

  it('chat session tokens expire after an hour', async () => {
    const { key } = await seedDeployment()
    const token = await customerSession(env, key, TENANT_A, 'u')
    const { verifyChatSession } = await import('../src/auth')
    await expect(verifyChatSession(env, token, Math.floor(Date.now() / 1000) + 3601)).rejects.toMatchObject({ code: 'token_expired' })
  })
})
