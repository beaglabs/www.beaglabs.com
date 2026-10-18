import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/db', () => import('./helpers/fake-db'))

import fixture from './fixtures/attested.json'
import { getDb, resetDb } from './helpers/fake-db'
import { call, installFetch, makeEnv, type TestEnv } from './helpers/harness'
import { handleBootstrap } from '../src/registration'
import { base64Decode } from '../src/util'

let env: TestEnv
beforeEach(async () => {
  await resetDb()
  installFetch()
  env = makeEnv()
})

const attestation = {
  now: new Date(fixture.verifyAt),
  trustedRoots: [base64Decode(fixture.root)],
  fetchCertificate: async () => base64Decode(fixture.intermediate),
}

function bootstrap(body: Record<string, unknown> = {}, testEnv = env) {
  const request = new Request('https://license.test/api/provision/bootstrap', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      papyrusDeploymentId: 'papyrus-123',
      attested: { encoding: 'pkcs7', signature: fixture.signature },
      nonce: fixture.nonce,
      publicOrigin: 'https://papyrus.contoso.com/app',
      version: '2.4.0',
      entraClientId: null,
      region: 'eastus',
      ...body,
    }),
  })
  return handleBootstrap(request, testEnv, undefined, attestation)
}

describe('POST /api/provision/bootstrap', () => {
  it('registers a verified VM and issues a key (stored hashed)', async () => {
    const response = await bootstrap()
    expect(response.status).toBe(201)
    const body = await response.json() as { deploymentId: string; deploymentKey: string }
    expect(body.deploymentId).toMatch(/^dep_/)
    expect(body.deploymentKey).toMatch(/^pdk_/)
    const row = (await getDb().execute('SELECT * FROM papyrus_deployments')).rows[0]
    expect(row).toMatchObject({ vm_id: '02aab8a4-74ef-476e-8182-f6d2ba4166a6', subscription_id: '8d10da13-8125-4ba9-a717-bf7490507b3d', plan_product: 'papyrus', public_origin: 'https://papyrus.contoso.com', region: 'eastus' })
    expect(String(row.key_sha256)).not.toContain(body.deploymentKey)

    // The key authenticates Papyrus.
    const tracked = await call(env, 'POST', '/api/v1/track', { deploymentKey: body.deploymentKey, body: { batch: [{ type: 'track', event: 'app.started' }] } })
    expect(tracked.status).toBe(200)
  })

  it('refuses a replayed attested document, and re-registration rotates the key', async () => {
    const firstKey = (await (await bootstrap()).json() as any).deploymentKey
    const replay = await bootstrap().catch((error) => error)
    expect(replay).toMatchObject({ status: 409, code: 'nonce_reused' })
    await getDb().execute('DELETE FROM attested_nonces') // simulate a fresh IMDS document for the same VM
    const second = await (await bootstrap()).json() as any
    expect(second.deploymentKey).not.toBe(firstKey)
    expect((await getDb().execute('SELECT COUNT(*) AS n FROM papyrus_deployments')).rows[0].n).toBe(1)
    const stale = await call(env, 'POST', '/api/v1/track', { deploymentKey: firstKey, body: { batch: [] } })
    expect(stale.status).toBe(401)
  })

  it('enforces the Marketplace plan when configured', async () => {
    await expect(bootstrap({}, makeEnv({ PAPYRUS_MARKETPLACE_PUBLISHER: 'beaglabs', PAPYRUS_MARKETPLACE_PRODUCT: 'not-papyrus' }))).rejects.toMatchObject({ status: 403, code: 'plan_not_allowed' })
    expect((await bootstrap({}, makeEnv({ PAPYRUS_MARKETPLACE_PUBLISHER: 'BeagLabs', PAPYRUS_MARKETPLACE_PRODUCT: 'papyrus' }))).status).toBe(201)
  })

  it('rejects a wrong nonce and malformed bodies', async () => {
    await expect(bootstrap({ nonce: '9999999999' })).rejects.toMatchObject({ code: 'nonce_mismatch' })
    await expect(bootstrap({ attested: { encoding: 'json', signature: 'x' } })).rejects.toMatchObject({ status: 422 })
    await expect(bootstrap({ publicOrigin: 'http://insecure.example.com' })).rejects.toMatchObject({ code: 'invalid_public_origin' })
  })

  it('through the router, unsigned garbage is a 401 JSON error with CORS-free registration', async () => {
    const response = await call(env, 'POST', '/api/provision/bootstrap', { body: { papyrusDeploymentId: 'x', nonce: '1', attested: { encoding: 'pkcs7', signature: btoa('x'.repeat(100)) } } })
    expect(response.status).toBe(401)
    expect(response.json.error).toBe('attestation_invalid')
  })
})
