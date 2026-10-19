import { createHash } from 'node:crypto'
import { SignJWT, exportJWK, generateKeyPair } from 'jose'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { describe, expect, it } from 'vitest'
import { runProgram } from '../src/app'
import type { IdentityPayload } from '../src/license-rpc'
import { runStep } from '../src/runner'
import { first, getDeployment, type Account } from '../src/services'
import type { DetailPayload } from '../src/ui/types'
import { fakeLicense } from './helpers/harness'
import { signedIn } from './helpers/session'

const TENANT = '11111111-2222-3333-4444-555555555555'
const OTHER_TENANT = '99999999-8888-7777-6666-555555555555'
const AUTHORITY = 'https://login.microsoftonline.com'
const PHOTO: Uint8Array<ArrayBuffer> = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const STEPS = ['connect', 'deploy', 'dns', 'health', 'microsoft', 'registration'] as const
const steps = (passed: readonly string[]) => JSON.stringify(Object.fromEntries(STEPS.map((id) => [id, passed.includes(id) ? { status: 'pass', at: '2026-10-18T00:00:00.000Z' } : { status: 'pending' }])))

const keys = await generateKeyPair('RS256')
const JWK = { ...(await exportJWK(keys.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }

/** A fake Microsoft: token endpoint (checks the secret and PKCE), signing keys, Graph /me and photo. */
function microsoft() {
  const state = {
    /** What the ID token says; `nonce` defaults to the transaction's own. */
    claims: { tid: TENANT, oid: 'oid-owner', name: 'Jane Doe', preferred_username: 'jane@contoso.com' } as Record<string, unknown>,
    me: { displayName: 'Jane Doe', mail: 'jane@contoso.com', userPrincipalName: 'jane@contoso.com', jobTitle: 'CFO', companyName: null } as Record<string, unknown>,
    photo: PHOTO as Uint8Array<ArrayBuffer> | null,
    challenge: '' as string,
    nonce: () => '',
    calls: [] as string[],
  }
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    state.calls.push(url)
    if (url.endsWith('/oauth2/v2.0/token')) {
      const body = new URLSearchParams(await new Response(init?.body).text())
      if (body.get('client_secret') !== 'ms-secret' || body.get('grant_type') !== 'authorization_code') return Response.json({ error: 'invalid_client' }, { status: 401 })
      if (createHash('sha256').update(body.get('code_verifier') ?? '').digest('base64url') !== state.challenge) return Response.json({ error: 'invalid_grant' }, { status: 400 })
      const tid = String(state.claims.tid)
      const idToken = await new SignJWT({ nonce: state.nonce(), ...state.claims })
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(`${AUTHORITY}/${tid}/v2.0`)
        .setAudience('ms-client')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(keys.privateKey)
      return Response.json({ id_token: idToken, access_token: 'graph-access-token', refresh_token: 'never-stored' })
    }
    if (url.endsWith('/discovery/v2.0/keys')) return Response.json({ keys: [JWK] })
    if (url.startsWith('https://graph.microsoft.com/v1.0/me?')) {
      if (new Headers(init?.headers).get('authorization') !== 'Bearer graph-access-token') return new Response('no', { status: 401 })
      return Response.json(state.me)
    }
    if (url === 'https://graph.microsoft.com/v1.0/me/photos/48x48/$value')
      return state.photo ? new Response(state.photo, { headers: { 'content-type': 'image/jpeg', 'content-length': String(state.photo.length) } }) : new Response('none', { status: 404 })
    return new Response('unexpected', { status: 599 })
  }
  return { state, fetch }
}

function setup(options: { env?: Record<string, string> } = {}) {
  const ms = microsoft()
  const license = fakeLicense({ pd_123: 'good-key', pd_456: 'other-key' })
  const session = signedIn({ fetch: ms.fetch as typeof fetch, license, env: options.env })
  const { h } = session
  ms.state.nonce = () => (h.sql.prepare("SELECT nonce FROM microsoft_transactions WHERE phase = 'redeeming'").get() as { nonce: string }).nonce
  const deployed = (id = 'dep_abc', licenseId: string | null = 'pd_123', org = 'acme', passed: readonly string[] = ['connect', 'deploy', 'dns', 'health']) => {
    h.insertDeployment({ id, billing_state: 'active', license_deployment_id: licenseId })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = ?, steps = ? WHERE id = ?").run(`${org}.papyrus.beaglabs.com`, steps(passed), id)
  }
  const accepted = (id = 'dep_abc') =>
    h.sql.prepare('INSERT INTO terms_acceptances (deployment_id, acceptance, accepted_at) VALUES (?, ?, ?)').run(id, JSON.stringify({ accepted_by_account_email: 'owner@example.com', organization: 'acme', termsVersion: '2026-10-16', privacyVersion: '2026-10-16', acceptedAt: 'now' }), 'now')
  const bound = (id = 'dep_abc', licenseId = 'pd_123', tenant = TENANT) =>
    h.sql.prepare('INSERT INTO microsoft_bindings (deployment_id, license_deployment_id, tenant_id, owner_oid, owner_name, owner_email, bound_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, licenseId, tenant, 'oid-owner', 'Jane Doe', 'jane@contoso.com', '2026-10-18T00:00:00.000Z')
  /** Follow an authorize redirect: remember the PKCE challenge, return the state. */
  const authorize = (location: string, tenant = TENANT) => {
    const url = new URL(location)
    expect(url.origin + url.pathname).toBe(`${AUTHORITY}/${tenant}/oauth2/v2.0/authorize`)
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: 'ms-client',
      response_type: 'code',
      response_mode: 'query',
      redirect_uri: 'https://papyrus.beaglabs.test/microsoft/callback',
      scope: 'openid profile email https://graph.microsoft.com/User.Read',
      code_challenge_method: 'S256',
    })
    expect(url.searchParams.get('nonce')).toBeTruthy()
    expect(url.searchParams.has('prompt')).toBe(false)
    ms.state.challenge = url.searchParams.get('code_challenge')!
    return url.searchParams.get('state')!
  }
  const papyrus = (path: string, init: { method?: string; body?: unknown; key?: string; id?: string } = {}) =>
    h.call(path, {
      method: init.method ?? 'GET',
      headers: { authorization: `Bearer ${init.key ?? 'good-key'}`, 'x-papyrus-deployment-id': init.id ?? 'pd_123', 'content-type': 'application/json' },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    })
  const events = () => h.sql.prepare("SELECT message FROM events WHERE source = 'microsoft'").all() as { message: string }[]
  return { ...session, ms, license, deployed, accepted, bound, authorize, papyrus, events }
}

/** Connect Microsoft from the deployment page up to Microsoft's sign-in; returns the transaction id. */
const throughConsent = async (s: ReturnType<typeof setup>) => {
  const start = await s.get('/deploy/dep_abc/microsoft/connect')
  expect(start.status).toBe(302)
  const consent = new URL(start.headers.get('location')!)
  expect(consent.origin + consent.pathname).toBe(`${AUTHORITY}/organizations/v2.0/adminconsent`)
  expect(Object.fromEntries(consent.searchParams)).toMatchObject({ client_id: 'ms-client', scope: 'openid profile email https://graph.microsoft.com/User.Read', redirect_uri: 'https://papyrus.beaglabs.test/microsoft/callback' })
  const txn = consent.searchParams.get('state')!
  const approved = await s.get(`/microsoft/callback?admin_consent=True&tenant=${TENANT}&state=${txn}`)
  expect(approved.status).toBe(302)
  expect(s.authorize(approved.headers.get('location')!)).toBe(txn)
  return txn
}

describe('claim card', () => {
  it('requires the terms checkbox, then claims, deploys and goes on to Connect Microsoft', async () => {
    const s = setup()
    s.h.insertDeployment({ id: 'dep_new' })
    const page = await (await s.get('/deploy/dep_new')).text()
    expect(page).toContain('name="terms"')
    expect(page).toContain('https://www.beaglabs.com/papyrus/terms')
    expect(page).toContain('https://www.beaglabs.com/papyrus/privacy')
    expect(page).toContain('Connect Microsoft and go live')

    const refused = await s.post('/deploy/dep_new/org', { org: 'acme' })
    expect(refused.status).toBe(400)
    expect(await refused.text()).toContain('Accept the Terms of Service and Privacy Policy')
    expect(s.h.sql.prepare('SELECT * FROM hosted_orgs').all()).toHaveLength(0)

    // Billing not active yet, so not deployed: back to the page instead of Microsoft.
    const claimed = await s.post('/deploy/dep_new/org', { org: 'acme', terms: 'accept' })
    expect(claimed.status).toBe(303)
    expect(claimed.headers.get('location')).toBe('/deploy/dep_new')
    const row = s.h.sql.prepare('SELECT acceptance FROM terms_acceptances WHERE deployment_id = ?').get('dep_new') as { acceptance: string }
    expect(JSON.parse(row.acceptance)).toMatchObject({ accepted_by_account_email: 'owner@example.com', organization: 'acme', termsVersion: '2026-10-16', privacyVersion: '2026-10-16' })
  })
})

describe('Connect Microsoft', () => {
  it('admin consent, then sign-in: binds the tenant, makes the admin System Owner and passes the step', async () => {
    const s = setup()
    s.deployed()
    s.accepted()
    const txn = await throughConsent(s)
    const done = await s.get(`/microsoft/callback?code=code-1&state=${txn}`)
    expect(done.status).toBe(302)
    expect(done.headers.get('location')).toBe('/deploy/dep_abc')

    expect(s.h.sql.prepare('SELECT * FROM microsoft_bindings').all()).toEqual([
      { deployment_id: 'dep_abc', license_deployment_id: 'pd_123', tenant_id: TENANT, owner_oid: 'oid-owner', owner_name: 'Jane Doe', owner_email: 'jane@contoso.com', bound_at: expect.any(String) },
    ])
    expect(JSON.parse(s.h.deployment('dep_abc').steps as string).microsoft).toMatchObject({ status: 'pass', reason: 'Microsoft connected · Jane Doe is System Owner' })
    expect(s.events()).toEqual([{ message: 'Microsoft connected · contoso.com · Jane Doe is System Owner' }])
    // No Microsoft token is kept anywhere.
    const stored = JSON.stringify(s.h.sql.prepare('SELECT * FROM microsoft_transactions').all())
    expect(stored).not.toContain('graph-access-token')
    expect(stored).not.toContain('never-stored')
    expect(stored).not.toContain('eyJ')

    // The transaction is spent.
    expect((await s.get(`/microsoft/callback?code=code-1&state=${txn}`)).status).toBe(400)

    const view = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(view.deployment.microsoft).toBeNull()
  })

  it('refuses a different tenant once bound and leaves the binding alone', async () => {
    const s = setup()
    s.deployed()
    s.accepted()
    const txn = await throughConsent(s)
    // A second tab connected another tenant while this transaction was in flight.
    s.bound('dep_abc', 'pd_123', OTHER_TENANT)
    const done = await s.get(`/microsoft/callback?code=code-1&state=${txn}`)
    expect(done.status).toBe(409)
    expect(await done.text()).toContain('This deployment is connected to a different Microsoft organization. Contact Beag Labs support to change it.')
    expect((s.h.sql.prepare('SELECT tenant_id FROM microsoft_bindings').get() as { tenant_id: string }).tenant_id).toBe(OTHER_TENANT)
  })

  it('rejects an ID token for another tenant or with the wrong nonce', async () => {
    const s = setup()
    s.deployed()
    s.accepted()
    s.ms.state.claims = { ...s.ms.state.claims, nonce: 'someone-elses' }
    const txn = await throughConsent(s)
    expect((await s.get(`/microsoft/callback?code=code-1&state=${txn}`)).status).toBe(400)
    expect(s.h.sql.prepare('SELECT * FROM microsoft_bindings').all()).toHaveLength(0)
  })

  it('only the account that started it can finish it', async () => {
    const s = setup()
    s.deployed()
    s.accepted()
    const start = await s.get('/deploy/dep_abc/microsoft/connect')
    const txn = new URL(start.headers.get('location')!).searchParams.get('state')!
    expect((await s.h.call(`/microsoft/callback?admin_consent=True&tenant=${TENANT}&state=${txn}`)).status).toBe(403)
  })

  it('shows who has to approve, with a shareable admin-consent link, when consent is refused', async () => {
    const s = setup()
    s.deployed()
    s.accepted()
    const start = await s.get('/deploy/dep_abc/microsoft/connect')
    const txn = new URL(start.headers.get('location')!).searchParams.get('state')!
    const refused = await s.get(`/microsoft/callback?error=access_denied&error_description=${encodeURIComponent('AADSTS90094: Admin consent is required.')}&state=${txn}`)
    expect(refused.status).toBe(403)
    const html = await refused.text()
    expect(html).toContain('Global Administrator or Privileged Role Administrator')
    const link = `${AUTHORITY}/organizations/v2.0/adminconsent?${new URLSearchParams({ client_id: 'ms-client', scope: 'openid profile email https://graph.microsoft.com/User.Read', redirect_uri: 'https://papyrus.beaglabs.test/microsoft/consented' })}`
    expect(html).toContain(link.replace(/&/g, '&amp;'))
    expect(html).toContain('href="/deploy/dep_abc/microsoft/connect"')
    expect(html).toContain('/assets/copy.js')

    const consented = await s.h.call('/microsoft/consented')
    expect(consented.status).toBe(200)
    expect(await consented.text()).toContain('Papyrus is approved for your organization. The person setting up Papyrus can now click Connect Microsoft again.')
  })

  it('asks for the terms first, then deploy first; says plainly when it is not configured', async () => {
    const s = setup()
    s.deployed()
    const noTerms = await s.get('/deploy/dep_abc/microsoft/connect')
    expect(noTerms.status).toBe(409)
    expect(await noTerms.text()).toContain('Accept the Terms of Service and Privacy Policy first.')
    const view = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(view.deployment.microsoft).toEqual({ href: '/deploy/dep_abc/microsoft/connect', termsAccepted: false, termsUrl: 'https://www.beaglabs.com/papyrus/terms', privacyUrl: 'https://www.beaglabs.com/papyrus/privacy' })
    expect(view.deployment.next).toMatchObject({ title: 'Connect Microsoft', body: 'Connect Microsoft so your team can sign in.' })

    // The dialog: tick the box, then on to Microsoft.
    expect((await s.post('/deploy/dep_abc/microsoft/connect', {})).status).toBe(400)
    const accepted = await s.post('/deploy/dep_abc/microsoft/connect', { terms: 'accept' })
    expect(accepted.status).toBe(303)
    expect(accepted.headers.get('location')).toBe('/deploy/dep_abc/microsoft/connect')
    expect((await s.get('/deploy/dep_abc/microsoft/connect')).status).toBe(302)

    s.deployed('dep_new', null, 'globex', [])
    s.accepted('dep_new')
    const notDeployed = await s.get('/deploy/dep_new/microsoft/connect')
    expect(await notDeployed.text()).toContain('Deploy first.')

    const off = setup({ env: { MICROSOFT_CLIENT_ID: '' } })
    off.deployed()
    off.accepted()
    const response = await off.get('/deploy/dep_abc/microsoft/connect')
    expect(response.status).toBe(503)
    expect(await response.text()).toContain('Connect Microsoft isn&#39;t set up on papyrus.beaglabs.com yet.')
  })
})

describe('microsoft step', () => {
  it('records an early connection immediately and does not request consent twice', async () => {
    const s = setup()
    s.deployed('dep_abc', 'pd_123', 'acme', ['connect', 'deploy'])
    s.accepted()
    const txn = await throughConsent(s)
    expect((await s.get(`/microsoft/callback?code=code-1&state=${txn}`)).status).toBe(302)
    const saved = JSON.parse(s.h.deployment('dep_abc').steps as string)
    expect(saved.microsoft.status).toBe('pass')
    expect(saved.dns.status).toBe('pending')
    expect(saved.health.status).toBe('pending')
    expect(saved.registration.status).toBe('pending')
    const connectedAgain = await s.get('/deploy/dep_abc/microsoft/connect')
    expect(connectedAgain.headers.get('location')).toBe('/deploy/dep_abc')
    expect(s.h.sql.prepare('SELECT COUNT(*) AS n FROM microsoft_transactions').get()).toEqual({ n: 1 })
    const view = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(view.deployment.microsoft).toBeNull()
  })

  it('repairs stale step state on reads while health is failing, and detects a removed binding', async () => {
    const s = setup()
    s.deployed('dep_abc', 'pd_123', 'acme', ['connect', 'deploy', 'dns'])
    s.h.sql.prepare("UPDATE deployments SET steps = json_set(steps, '$.health.status', 'fail') WHERE id = 'dep_abc'").run()
    s.bound()
    const view = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(view.deployment.microsoft).toBeNull()
    let saved = JSON.parse(s.h.deployment('dep_abc').steps as string)
    expect(saved.microsoft.status).toBe('pass')
    expect(saved.health.status).toBe('fail')
    s.h.sql.prepare('DELETE FROM microsoft_bindings').run()
    const unbound = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(unbound.deployment.microsoft).not.toBeNull()
    saved = JSON.parse(s.h.deployment('dep_abc').steps as string)
    expect(saved.microsoft.status).toBe('pending')
    expect(saved.registration.status).toBe('pending')
    expect(s.ms.state.calls).toEqual([])
  })

  it('does not adopt a binding for a different license deployment', async () => {
    const s = setup()
    s.deployed()
    s.bound('dep_abc', 'pd_456')
    const view = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(view.deployment.microsoft).not.toBeNull()
  })

  it('reconciles the deployment list without advancing bootstrap or contacting Microsoft', async () => {
    const s = setup()
    s.deployed('dep_abc', 'pd_123', 'acme', ['connect', 'deploy'])
    s.bound()
    expect((await s.get('/api/deployments')).status).toBe(200)
    const saved = JSON.parse(s.h.deployment('dep_abc').steps as string)
    expect(saved.microsoft.status).toBe('pass')
    expect(saved.dns.status).toBe('pending')
    expect(s.ms.state.calls).toEqual([])
  })

  it('passes when the binding exists and is pending (no probing Papyrus) until then', async () => {
    const s = setup()
    s.deployed()
    const check = async () => {
      const exit = await runProgram(
        s.h.env,
        Effect.gen(function* () {
          const account = yield* first<Account>('SELECT * FROM accounts WHERE id = ?', 'acct_1')
          return yield* runStep((yield* getDeployment('dep_abc'))!, account!, 'microsoft')
        }),
      )
      if (Exit.isFailure(exit)) throw new Error('step failed')
      return exit.value
    }
    expect(await check()).toEqual({ status: 'pending', reason: 'Connect Microsoft so your team can sign in.' })
    s.bound()
    expect(await check()).toEqual({ status: 'pass', reason: 'Microsoft connected · Jane Doe is System Owner' })
    expect(s.ms.state.calls).toEqual([])
    // Its own button, not a "Check microsoft" one.
    s.h.sql.prepare('DELETE FROM microsoft_bindings').run()
    expect(await check()).toMatchObject({ status: 'pending' })
    const view = (await (await s.get('/api/deployments/dep_abc')).json()) as DetailPayload
    expect(view.deployment.actions.map((a) => a.id)).not.toContain('check')
  })
})

describe('sign-in to Papyrus through the broker', () => {
  /** Papyrus opens a transaction, the browser signs in, Papyrus gets a handle back. */
  const signInToPapyrus = async (s: ReturnType<typeof setup>) => {
    const opened = await s.papyrus('/api/microsoft/transactions', { method: 'POST', body: { state: 'papyrus-state', nonce: 'papyrus-nonce' } })
    expect(opened.status).toBe(200)
    const { url } = (await opened.json()) as { url: string }
    expect(url).toMatch(/^https:\/\/papyrus\.beaglabs\.test\/microsoft\/start\?txn=mtx_/)
    const started = await s.h.call(url.replace('https://papyrus.beaglabs.test', ''))
    expect(started.status).toBe(302)
    const txn = s.authorize(started.headers.get('location')!)
    const back = await s.h.call(`/microsoft/callback?code=code-2&state=${txn}`)
    expect(back.status).toBe(302)
    const location = new URL(back.headers.get('location')!)
    expect(location.origin + location.pathname).toBe('https://acme.papyrus.beaglabs.com/api/auth/entra/callback')
    expect(location.searchParams.get('state')).toBe('papyrus-state')
    return location.searchParams.get('handle')!
  }

  it('needs Connect Microsoft first', async () => {
    const s = setup()
    s.deployed()
    const response = await s.papyrus('/api/microsoft/transactions', { method: 'POST', body: { state: 's', nonce: 'n' } })
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ code: 'not_bound', error: 'Connect Microsoft at papyrus.beaglabs.com first' })
    expect((await s.papyrus('/api/microsoft/transactions', { method: 'POST', body: { state: 's', nonce: 'n' }, key: 'wrong' })).status).toBe(401)
    expect((await s.papyrus('/api/microsoft/transactions', { method: 'POST', body: { state: 'x'.repeat(257), nonce: 'n' } })).status).toBe(400)
  })

  it('signs the identity for that deployment and hands it over once, for 60 seconds, to that deployment only', async () => {
    const s = setup()
    s.deployed()
    s.bound()
    s.deployed('dep_other', 'pd_456', 'globex')
    const before = Date.now()
    const handle = await signInToPapyrus(s)

    expect(s.license.signIdentity).toHaveBeenCalledTimes(1)
    const payload = s.license.signIdentity.mock.calls[0]![0] as IdentityPayload
    expect(Object.keys(payload).sort()).toEqual(['aud', 'email', 'expiresAt', 'issuedAt', 'jobTitle', 'name', 'nonce', 'oid', 'pictureUrl', 'preferredUsername', 'tid', 'type'])
    expect(payload).toMatchObject({
      type: 'papyrus-identity',
      aud: 'pd_123',
      tid: TENANT,
      oid: 'oid-owner',
      name: 'Jane Doe',
      preferredUsername: 'jane@contoso.com',
      email: 'jane@contoso.com',
      jobTitle: 'CFO',
      pictureUrl: `data:image/jpeg;base64,${Buffer.from(PHOTO).toString('base64')}`,
      nonce: 'papyrus-nonce',
    })
    expect(Date.parse(payload.expiresAt) - Date.parse(payload.issuedAt)).toBe(5 * 60_000)
    expect(Date.parse(payload.issuedAt)).toBeGreaterThanOrEqual(before - 1000)
    const stored = s.h.sql.prepare("SELECT handle_sha256, expires_at FROM microsoft_transactions WHERE phase = 'handle'").get() as { handle_sha256: string; expires_at: string }
    expect(stored.handle_sha256).toBe(createHash('sha256').update(handle).digest('hex'))
    expect(Date.parse(stored.expires_at) - Date.now()).toBeLessThanOrEqual(60_000)
    expect(JSON.stringify(s.h.sql.prepare('SELECT * FROM microsoft_transactions').all())).not.toContain('graph-access-token')

    // Another deployment's key can't redeem it.
    const other = await s.papyrus('/api/microsoft/redeem', { method: 'POST', body: { handle }, key: 'other-key', id: 'pd_456' })
    expect(other.status).toBe(404)
    expect(await other.json()).toMatchObject({ code: 'handle_invalid' })

    const redeemed = await s.papyrus('/api/microsoft/redeem', { method: 'POST', body: { handle } })
    expect(redeemed.status).toBe(200)
    expect(redeemed.headers.get('cache-control')).toBe('no-store')
    expect(await redeemed.json()).toEqual({ assertion: { payload, keyId: 'beag-kv-1', signature: 'identity:pd_123:oid-owner' } })
    // Once only, and the assertion is gone from D1.
    expect((await s.papyrus('/api/microsoft/redeem', { method: 'POST', body: { handle } })).status).toBe(404)
    expect(s.h.sql.prepare('SELECT identity_json FROM microsoft_transactions WHERE identity_json IS NOT NULL').all()).toHaveLength(0)
  })

  it('expires the handle after 60 seconds and omits what Microsoft did not send', async () => {
    const s = setup()
    s.deployed()
    s.bound()
    s.ms.state.photo = null
    s.ms.state.me = { displayName: 'Jane Doe' }
    s.ms.state.claims = { tid: TENANT, oid: 'oid-2' }
    const handle = await signInToPapyrus(s)
    const payload = s.license.signIdentity.mock.calls[0]![0] as IdentityPayload
    expect(Object.keys(payload).sort()).toEqual(['aud', 'expiresAt', 'issuedAt', 'name', 'nonce', 'oid', 'tid', 'type'])
    s.h.sql.prepare("UPDATE microsoft_transactions SET expires_at = ? WHERE phase = 'handle'").run(new Date(Date.now() - 1000).toISOString())
    expect((await s.papyrus('/api/microsoft/redeem', { method: 'POST', body: { handle } })).status).toBe(404)
  })

  it('a start link works only for a fresh portal transaction', async () => {
    const s = setup()
    expect((await s.h.call('/microsoft/start?txn=mtx_unknown')).status).toBe(400)
  })
})

describe('GET /api/microsoft/binding', () => {
  it('needs the deployment key and answers 404 not_bound until Connect Microsoft is done', async () => {
    const s = setup()
    s.deployed()
    expect((await s.h.call('/api/microsoft/binding')).status).toBe(401)
    expect((await s.papyrus('/api/microsoft/binding', { key: 'wrong' })).status).toBe(401)
    expect((await s.papyrus('/api/microsoft/binding', { key: 'other-key' })).status).toBe(401)
    const missing = await s.papyrus('/api/microsoft/binding')
    expect(missing.status).toBe(404)
    expect(await missing.json()).toMatchObject({ code: 'not_bound' })

    s.accepted()
    s.bound()
    const response = await s.papyrus('/api/microsoft/binding')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      tenantId: TENANT,
      clientId: 'ms-client',
      owner: { oid: 'oid-owner', name: 'Jane Doe', email: 'jane@contoso.com' },
      terms: { accepted_by_account_email: 'owner@example.com', organization: 'acme', termsVersion: '2026-10-16', privacyVersion: '2026-10-16', acceptedAt: 'now' },
      boundAt: '2026-10-18T00:00:00.000Z',
    })
  })
})
