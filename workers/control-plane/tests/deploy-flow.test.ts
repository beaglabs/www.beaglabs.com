import { createHash } from 'node:crypto'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'
import { encryptJson } from '../src/crypto'
import { initialSteps, record } from '../src/setup'
import { harness } from './helpers/harness'

interface Call { method: string; url: string; body: any }

/** Fake Fly Machines API + DoH + Papyrus host. */
const fakeNetwork = (calls: Call[]) =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    const url = new URL(request.url)
    const text = request.method === 'GET' ? '' : await request.text()
    calls.push({ method: request.method, url: url.toString(), body: text ? JSON.parse(text) : null })
    if (url.hostname === 'api.machines.dev') {
      const path = url.pathname
      if (request.method === 'POST' && path === '/v1/apps') return Response.json({ id: 'app_1', created_at: 1 })
      if (path.endsWith('/secrets')) return Response.json({ version: 2 })
      if (request.method === 'GET' && path.endsWith('/volumes')) return Response.json([])
      if (request.method === 'POST' && path.endsWith('/volumes')) return Response.json({ id: 'vol_1', name: 'papyrus_data', state: 'created' })
      if (path.endsWith('/ip_assignments')) return Response.json({ ip: '1.2.3.4', type: 'shared_v4' })
      if (request.method === 'POST' && path.endsWith('/machines')) return Response.json({ id: 'm_1', name: 'papyrus' })
      if (request.method === 'POST' && /\/machines\/m_1$/.test(path)) return Response.json({ id: 'm_1', name: 'papyrus' })
      if (path.endsWith('/certificates/acme')) return Response.json({ hostname: 'papyrus.example.com' })
      return Response.json({ error: 'unexpected' }, { status: 404 })
    }
    return Response.json({ error: 'unexpected host' }, { status: 599 })
  }) as typeof fetch

async function signedInWithDeployment(billing: 'active' | 'none') {
  const calls: Call[] = []
  const h = harness({ fetch: fakeNetwork(calls), env: { BYOC_ENABLED: 'true' } })
  h.insertAccount('acct_1')
  const token = 'session-token'
  h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update(token).digest('hex'), 'acct_1', '2999-01-01T00:00:00.000Z')
  h.insertDeployment({ id: 'dep_abc', billing_state: billing })
  const sealed = await Effect.runPromise(encryptJson(h.env.CREDENTIALS_KEY, 'acct_1', { apiKey: 'fo1_secret', orgSlug: 'acme', region: 'ord' }))
  h.sql
    .prepare('UPDATE deployments SET provider = ?, hostname = ?, credentials_ciphertext = ?, steps = ? WHERE id = ?')
    .run('fly-io', 'papyrus.example.com', sealed, JSON.stringify(record(initialSteps(), 'connect', { status: 'pass' })), 'dep_abc')
  const post = (path: string) => h.call(path, { method: 'POST', headers: { cookie: `cp_session=${token}`, origin: h.env.BASE_URL } })
  return { h, calls, post }
}

describe('deploy step (Fly.io recipe)', () => {
  it('refuses to deploy without active billing', async () => {
    const { h, calls, post } = await signedInWithDeployment('none')
    expect((await post('/deploy/dep_abc/steps/deploy')).status).toBe(303)
    const steps = JSON.parse(h.deployment('dep_abc').steps as string)
    expect(steps.deploy).toMatchObject({ status: 'fail', reason: expect.stringMatching(/Billing is not active/) })
    expect(h.license.createDeployment).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })

  it('registers once, runs the signed image with the contract env and a read-only master key file, and lists DNS', async () => {
    const { h, calls, post } = await signedInWithDeployment('active')
    expect((await post('/deploy/dep_abc/steps/deploy')).status).toBe(303)

    const row = h.deployment('dep_abc')
    expect(JSON.parse(row.steps as string).deploy.status).toBe('pass')
    expect(row.license_deployment_id).toBe('pd_new')
    expect(h.license.createDeployment).toHaveBeenCalledWith({ accountId: 'acct_1', hostname: 'papyrus.example.com', provider: 'fly-io', organization: 'owner@example.com' })
    expect(String(row.deploy_secrets_ciphertext)).not.toContain('boot-token')

    const secrets = calls.find((c) => c.url.endsWith('/secrets'))!.body.values
    expect(secrets.PAPYRUS_BOOTSTRAP_TOKEN).toBe('boot-token')
    expect(JSON.parse(secrets.PAPYRUS_LICENSE)).toMatchObject({ publicOrigin: 'https://papyrus.example.com' })
    expect(Buffer.from(secrets.PAPYRUS_MASTER_KEY_B64, 'base64')).toHaveLength(32)

    const machine = calls.find((c) => c.method === 'POST' && c.url.endsWith('/machines'))!.body
    expect(machine.region).toBe('ord')
    expect(machine.config.image).toBe('ghcr.io/beaglabs/papyrus/papyrus@sha256:abc')
    expect(machine.config.env).toEqual({
      PAPYRUS_CONTROL_PLANE_URL: 'https://papyrus.beaglabs.test',
      PAPYRUS_DEPLOYMENT_ID: 'pd_new',
      PAPYRUS_PUBLIC_ORIGIN: 'https://papyrus.example.com',
      PAPYRUS_SECRET_KEY_FILE: '/run/secrets/papyrus/master.key',
    })
    expect(machine.config.env).not.toHaveProperty('PAPYRUS_BOOTSTRAP_TOKEN')
    expect(machine.config.files).toEqual([{ guest_path: '/run/secrets/papyrus/master.key', secret_name: 'PAPYRUS_MASTER_KEY_B64', mode: 0o444 }])
    expect(machine.config.mounts).toEqual([{ volume: 'vol_1', path: '/var/lib/papyrus' }])

    expect(JSON.parse(row.dns_records as string)).toEqual([expect.objectContaining({ type: 'CNAME', name: 'papyrus.example.com', value: 'papyrus-abc.fly.dev' })])
    expect(JSON.parse(row.resources as string)).toMatchObject({ flyApp: 'papyrus-abc', flyVolume: 'vol_1', flyMachine: 'm_1', masterKeySet: true })

    // Redeploy: same registration, machine updated, master key not regenerated.
    calls.length = 0
    await post('/deploy/dep_abc/steps/deploy')
    expect(h.license.createDeployment).toHaveBeenCalledTimes(1)
    expect(calls.find((c) => c.url.endsWith('/secrets'))!.body.values).not.toHaveProperty('PAPYRUS_MASTER_KEY_B64')
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/v1/apps'))).toBe(false)
    expect(calls.some((c) => c.url.endsWith('/machines/m_1'))).toBe(true)
    expect(JSON.parse(h.deployment('dep_abc').steps as string).deploy.status).toBe('pass')
    // The rollout is new, so its health is checked again.
    expect(JSON.parse(h.deployment('dep_abc').steps as string).health.status).toBe('pending')
    const page = await (await h.call('/deploy/dep_abc', { headers: { cookie: 'cp_session=session-token' } })).text()
    expect(page).toContain('action="/deploy/dep_abc/steps/deploy"')
    expect(page).toContain('>Redeploy</button>')
  })

  it('renders the setup and provision pages', async () => {
    const { h } = await signedInWithDeployment('active')
    const get = (path: string) => h.call(path, { headers: { cookie: 'cp_session=session-token' } })
    const setup = await get('/deploy/dep_abc')
    expect(setup.status).toBe(200)
    const html = await setup.text()
    for (const label of ['Connect cloud account', 'Deploy Papyrus', 'DNS', 'Container health', 'Connect Microsoft', 'Registration']) expect(html).toContain(label)
    const aws = await (await get('/provision?deployment=dep_abc&provider=aws')).text()
    expect(aws).toContain('Connect AWS')
    const externalId = h.deployment('dep_abc').aws_external_id as string
    expect(externalId).toMatch(/^beag-/)
    expect(aws).toContain(encodeURIComponent(externalId))
    expect(aws).not.toContain('fo1_secret')
    const fly = await (await get('/provision?deployment=dep_abc&provider=fly-io')).text()
    expect(fly).toContain('Saved — leave blank to keep')
    expect(fly).not.toContain('fo1_secret')
    expect((await get('/billing')).status).toBe(200)
    expect((await get('/deploy')).status).toBe(200)
    expect((await h.call('/signup')).status).toBe(200)
  })

  it('needs a session', async () => {
    const { h } = await signedInWithDeployment('active')
    const response = await h.call('/deploy/dep_abc/steps/deploy', { method: 'POST', headers: { origin: h.env.BASE_URL } })
    expect(response.headers.get('location')).toBe('/login')
  })
})
