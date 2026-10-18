import { constants, generateKeyPairSync, privateEncrypt, verify } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import { getDb, resetDb } from './helpers/fake-db'
import { call, installFetch, makeEnv, type TestEnv } from './helpers/harness'
import { CONTROL_PLANE_FEATURES } from '../src/control-plane'
import { canonical } from '../src/license'
import { LicenseRpc } from '../src/license-rpc'

const KEY_ID = 'https://beag-test.vault.azure.net/keys/papyrus-license/0123456789abcdef'
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const SHA256_DIGEST_INFO = Buffer.from('3031300d060960864801650304020105000420', 'hex')

/** Fake Entra token + Key Vault `sign` endpoints: RS256 over the digest Key Vault receives, like the real vault. */
function keyVault(url: string, init?: RequestInit): Response | undefined {
  if (url.endsWith('/oauth2/v2.0/token')) return Response.json({ access_token: 'kv-token', expires_in: 3600 })
  if (url.startsWith(`${KEY_ID}/sign`)) {
    const digest = Buffer.from(JSON.parse(String(init?.body)).value, 'base64url')
    const signature = privateEncrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.concat([SHA256_DIGEST_INFO, digest]))
    return Response.json({ kid: KEY_ID, value: signature.toString('base64url') })
  }
}

function verifies(payload: unknown, signature: string): boolean {
  return verify('sha256', Buffer.from(canonical(payload)), publicKey, Buffer.from(signature, 'base64'))
}

let env: TestEnv
let rpc: LicenseRpc
beforeEach(async () => {
  await resetDb()
  installFetch(keyVault)
  env = makeEnv({
    AZURE_KEY_VAULT_TENANT_ID: 'kv-tenant', AZURE_KEY_VAULT_CLIENT_ID: 'kv-client', AZURE_KEY_VAULT_CLIENT_SECRET: 'kv-secret', AZURE_KEY_VAULT_KEY_ID: KEY_ID,
  })
  rpc = new LicenseRpc({}, env)
})

const create = () => rpc.createDeployment({ accountId: 'acct_1', hostname: 'Papyrus.Contoso.com', provider: 'aws', organization: 'Contoso' })
const exchange = (body: Record<string, unknown>) => call(env, 'POST', '/api/provision/control-plane/exchange', { body })

describe('LicenseRpc.createDeployment', () => {
  it('creates a pending deployment row and a signed commercial license bound to the hostname', async () => {
    const created = await create()
    expect(created.deploymentId).toMatch(/^dep_/)
    expect(created.bootstrapToken).toMatch(/^pbt_/)
    const { keyId, signature, ...payload } = created.license
    expect(payload).toMatchObject({
      scope: 'deployment', deploymentId: created.deploymentId, licensee: 'Contoso', profiles: ['commercial'],
      features: CONTROL_PLANE_FEATURES, publicOrigin: 'https://papyrus.contoso.com', expiresAt: null,
    })
    expect(keyId).toBe(KEY_ID)
    expect(verifies(payload, signature)).toBe(true)

    expect((await getDb().execute('SELECT * FROM papyrus_deployments')).rows[0]).toMatchObject({ id: created.deploymentId, public_origin: 'https://papyrus.contoso.com' })
    const cp = (await getDb().execute('SELECT * FROM control_plane_deployments')).rows[0]
    expect(cp).toMatchObject({ deployment_id: created.deploymentId, account_id: 'acct_1', hostname: 'papyrus.contoso.com', provider: 'aws', exchanged_at: null })
    expect(String(cp.bootstrap_sha256)).not.toContain(created.bootstrapToken)
    expect(Date.parse(String(cp.bootstrap_expires_at)) - Date.now()).toBeGreaterThan(7 * 86400_000 - 60_000)
    expect(await rpc.registrationState(created.deploymentId)).toBe('pending')
  })

  it('rejects a hostname that is not a DNS name', async () => {
    await expect(rpc.createDeployment({ accountId: 'a', hostname: 'https://x.com/', provider: 'aws', organization: 'C' })).rejects.toMatchObject({ status: 422 })
  })
})

describe('POST /api/provision/control-plane/exchange', () => {
  it('swaps the bootstrap token for a deployment key and registers the deployment', async () => {
    const { deploymentId, bootstrapToken } = await create()
    const response = await exchange({ deploymentId, bootstrapToken })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.json.deploymentId).toBe(deploymentId)
    expect(response.json.deploymentKey).toMatch(/^pdk_/)
    expect(await rpc.registrationState(deploymentId)).toBe('registered')
    expect(await rpc.verifyDeploymentKey(deploymentId, response.json.deploymentKey)).toBe(true)

    const tracked = await call(env, 'POST', '/api/v1/track', { deploymentKey: response.json.deploymentKey, body: { batch: [{ type: 'track', event: 'app.started' }] } })
    expect(tracked.json).toEqual({ accepted: 1 })
  })

  it('answers 410 on reuse without rotating the issued key', async () => {
    const { deploymentId, bootstrapToken } = await create()
    const firstKey = (await exchange({ deploymentId, bootstrapToken })).json.deploymentKey
    const again = await exchange({ deploymentId, bootstrapToken })
    expect(again.status).toBe(410)
    expect(again.json.error).toBe('bootstrap_used')
    expect(await rpc.verifyDeploymentKey(deploymentId, firstKey)).toBe(true)
  })

  it('answers 410 for an expired token', async () => {
    const { deploymentId, bootstrapToken } = await create()
    await getDb().execute({ sql: 'UPDATE control_plane_deployments SET bootstrap_expires_at=?', args: [new Date(Date.now() - 1000).toISOString()] })
    const response = await exchange({ deploymentId, bootstrapToken })
    expect(response.status).toBe(410)
    expect(response.json.error).toBe('bootstrap_expired')
    expect(await rpc.registrationState(deploymentId)).toBe('pending')
  })

  it('answers 404 for an unknown deployment or token', async () => {
    const { deploymentId, bootstrapToken } = await create()
    expect((await exchange({ deploymentId: 'dep_missing', bootstrapToken })).status).toBe(404)
    expect((await exchange({ deploymentId, bootstrapToken: 'pbt_wrong' })).status).toBe(404)
    expect((await exchange({ deploymentId })).status).toBe(422)
  })
})

describe('LicenseRpc.verifyDeploymentKey', () => {
  it('is true only for the key issued to that deployment', async () => {
    const a = await create()
    const b = await create()
    const keyA = (await exchange({ deploymentId: a.deploymentId, bootstrapToken: a.bootstrapToken })).json.deploymentKey
    expect(await rpc.verifyDeploymentKey(a.deploymentId, keyA)).toBe(true)
    expect(await rpc.verifyDeploymentKey(b.deploymentId, keyA)).toBe(false)
    expect(await rpc.verifyDeploymentKey(a.deploymentId, `pdk_${'x'.repeat(43)}`)).toBe(false)
    expect(await rpc.verifyDeploymentKey(a.deploymentId, 'not-a-key')).toBe(false)
  })
})

describe('LicenseRpc.signStatus', () => {
  it('signs { deploymentId, state, issuedAt, expiresAt = issuedAt + 7 days } like a license', async () => {
    const before = Date.now()
    const status = await rpc.signStatus({ deploymentId: 'dep_1', state: 'suspended' })
    expect(Object.keys(status).sort()).toEqual(['keyId', 'payload', 'signature'])
    expect(Object.keys(status.payload).sort()).toEqual(['deploymentId', 'expiresAt', 'issuedAt', 'state'])
    expect(status.payload).toMatchObject({ deploymentId: 'dep_1', state: 'suspended' })
    const issuedAt = Date.parse(status.payload.issuedAt)
    expect(issuedAt).toBeGreaterThanOrEqual(before)
    expect(Date.parse(status.payload.expiresAt) - issuedAt).toBe(7 * 86400_000)
    expect(status.keyId).toBe(KEY_ID)
    expect(verifies(status.payload, status.signature)).toBe(true)
    await expect(rpc.signStatus({ deploymentId: 'dep_1', state: 'paused' as never })).rejects.toMatchObject({ status: 422 })
  })
})

describe('LicenseRpc.registrationState', () => {
  it('treats unknown ids as pending', async () => {
    expect(await rpc.registrationState('dep_missing')).toBe('pending')
  })
})

describe('LicenseRpc surface', () => {
  it('no longer exposes chat sessions', () => {
    expect('chatSession' in rpc).toBe(false)
  })
})
