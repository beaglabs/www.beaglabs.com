import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { RESERVED_ORG_NAMES, validateOrgName } from '../src/hosted'
import { STEP_IDS, initialSteps, record, visibleSteps } from '../src/setup'
import type { Bindings } from '../src/env'
import { harness } from './helpers/harness'

const TOKEN = 'session-token'

function signedIn(env: Partial<Bindings> = {}) {
  const h = harness({ env })
  h.insertAccount('acct_1')
  h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update(TOKEN).digest('hex'), 'acct_1', '2999-01-01T00:00:00.000Z')
  h.insertDeployment({ id: 'dep_abc', billing_state: 'none' })
  h.sql.prepare('UPDATE deployments SET steps = ? WHERE id = ?').run(JSON.stringify(initialSteps()), 'dep_abc')
  const get = (path: string) => h.call(path, { headers: { cookie: `cp_session=${TOKEN}` } })
  const post = (path: string, form: Record<string, string> = {}) =>
    h.call(path, { method: 'POST', headers: { cookie: `cp_session=${TOKEN}`, origin: h.env.BASE_URL, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() })
  const flagByoc = () => h.sql.prepare('INSERT INTO account_flags (account_id, byoc_enabled) VALUES (?, 1)').run('acct_1')
  return { h, get, post, flagByoc }
}

describe('org names', () => {
  it('accepts lowercase DNS labels of 3–40 characters (input is lowercased)', () => {
    expect(validateOrgName('acme')).toEqual({ ok: true, name: 'acme' })
    expect(validateOrgName('  Acme-Corp ')).toEqual({ ok: true, name: 'acme-corp' })
    expect(validateOrgName('a1b')).toMatchObject({ ok: true })
    expect(validateOrgName('x'.repeat(40))).toMatchObject({ ok: true })
  })

  it('rejects bad labels', () => {
    for (const bad of ['ab', 'x'.repeat(41), '-acme', 'acme-', 'ac_me', 'ac.me', 'acmé', 'xn--acme', 'ac--me', '']) {
      expect(validateOrgName(bad), bad).toMatchObject({ ok: false })
    }
  })

  it('rejects reserved names', () => {
    for (const name of ['www', 'api', 'admin', 'app', 'mail', 'license', 'connect', 'status', 'papyrus', 'beaglabs']) {
      expect(RESERVED_ORG_NAMES.has(name)).toBe(true)
      expect(validateOrgName(name)).toMatchObject({ ok: false, reason: `${name} is reserved.` })
    }
  })

  it('checks availability live and keeps names unique', async () => {
    const { h, get, post } = signedIn()
    expect(await (await get('/api/org-names/check?name=Acme')).json()).toEqual({ name: 'acme', available: true, reason: 'acme.papyrus.beaglabs.com is available.' })
    expect(await (await get('/api/org-names/check?name=admin')).json()).toMatchObject({ available: false, reason: 'admin is reserved.' })
    expect(await (await get('/api/org-names/check?name=a')).json()).toMatchObject({ available: false })
    expect((await h.call('/api/org-names/check?name=acme')).status).toBe(401)

    expect((await post('/deploy/dep_abc/org', { org: 'acme', terms: 'accept' })).status).toBe(303)
    const row = h.deployment('dep_abc')
    expect(row).toMatchObject({ provider: 'hosted', hostname: 'acme.papyrus.beaglabs.com' })
    expect(JSON.parse(row.steps as string).connect).toMatchObject({ status: 'pass' })
    // Billing isn't active, so nothing was deployed yet.
    expect(h.license.createDeployment).not.toHaveBeenCalled()
    expect(await (await get('/api/org-names/check?name=acme')).json()).toMatchObject({ available: false, reason: 'acme is taken.' })

    // A second deployment (another account) can't take it.
    h.insertAccount('acct_2', 'other@example.com')
    h.insertDeployment({ id: 'dep_two', account_id: 'acct_2' })
    h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update('two').digest('hex'), 'acct_2', '2999-01-01T00:00:00.000Z')
    const taken = await h.call('/deploy/dep_two/org', { method: 'POST', headers: { cookie: 'cp_session=two', origin: h.env.BASE_URL, 'content-type': 'application/x-www-form-urlencoded' }, body: 'org=acme&terms=accept' })
    expect(taken.status).toBe(409)
    expect(await taken.text()).toContain('acme is taken')
    expect(h.deployment('dep_two').provider).toBeNull()
    expect((await h.call('/deploy/dep_two/org', { method: 'POST', headers: { cookie: 'cp_session=two', origin: h.env.BASE_URL, 'content-type': 'application/x-www-form-urlencoded' }, body: 'org=www&terms=accept' })).status).toBe(400)
    const slots = h.sql.prepare('SELECT org_name, slot FROM hosted_orgs').all()
    expect(slots).toEqual([{ org_name: 'acme', slot: 1 }])
    // The first deployment can't claim a second name.
    expect((await post('/deploy/dep_abc/org', { org: 'other', terms: 'accept' })).status).toBe(409)
  })
})

describe('BYOC switch', () => {
  it('is off by default: no dropdown, Connect AWS or credential routes, and no link', async () => {
    const { get, post } = signedIn()
    expect((await get('/provision?deployment=dep_abc')).status).toBe(404)
    expect((await get('/provision?deployment=dep_abc&provider=aws')).status).toBe(404)
    expect((await post('/provision', { deployment: 'dep_abc', provider: 'fly-io', apiKey: 'x', orgSlug: 'y', region: 'iad' })).status).toBe(404)
    expect((await get('/aws/connect-template.yaml')).status).toBe(404)
    expect((await post('/deploy/dep_abc/hostname', { hostname: 'papyrus.example.com' })).status).toBe(409)
    const setup = await (await get('/deploy/dep_abc')).text()
    expect(setup).toContain('Choose your organization name')
    expect(setup).not.toContain('Deploy in your own cloud instead')
    expect(setup).not.toContain('href="/provision"')
    expect(setup).not.toContain('Choose where Papyrus runs')
  })

  it('the per-account flag turns it back on for that account only', async () => {
    const { get, flagByoc } = signedIn()
    flagByoc()
    const setup = await (await get('/deploy/dep_abc')).text()
    expect(setup).toContain('Deploy in your own cloud instead')
    expect(setup).toContain('href="/provision?deployment=dep_abc"')
    const provision = await get('/provision?deployment=dep_abc&provider=aws')
    expect(provision.status).toBe(200)
    expect(await provision.text()).toContain('Connect AWS')
    expect((await get('/aws/connect-template.yaml')).status).toBe(200)
  })

  it('BYOC_ENABLED="true" turns it on for every account', async () => {
    const { get } = signedIn({ BYOC_ENABLED: 'true' })
    expect((await get('/provision?deployment=dep_abc')).status).toBe(200)
    expect(await (await get('/deploy/dep_abc')).text()).toContain('Deploy in your own cloud instead')
    expect((await get('/aws/connect-template.yaml')).status).toBe(200)
  })
})

describe('hosted setup steps', () => {
  it('have no provider step and no DNS records to create', async () => {
    expect(visibleSteps('hosted')).toEqual(['deploy', 'dns', 'health', 'microsoft', 'registration'])
    expect(visibleSteps('byoc')).toEqual(STEP_IDS)

    const { h, get, post } = signedIn()
    await post('/deploy/dep_abc/org', { org: 'acme', terms: 'accept' })
    h.sql.prepare('UPDATE deployments SET dns_records = ? WHERE id = ?').run(JSON.stringify([{ type: 'CNAME', name: 'x', value: 'y' }]), 'dep_abc')
    const html = await (await get('/deploy/dep_abc')).text()
    expect(html).toContain('Hosted by Beag Labs')
    expect(html).toContain('acme.papyrus.beaglabs.com')
    for (const label of ['Workspace', 'Address', 'Health check', 'Microsoft', 'Registration']) expect(html).toContain(`<span class="ms-label">${label}</span>`)
    expect(html).not.toContain('Cloud account')
    expect(html).not.toContain('DNS records to create')
    expect(html).not.toContain('name="hostname"')
    expect(html).not.toContain('Choose your organization name')
    // The connect step is recorded as passed, so deploy can run first.
    expect(record(JSON.parse(h.deployment('dep_abc').steps as string), 'deploy', { status: 'pass' }).deploy.status).toBe('pass')
  })

  it('the org-name script is served from this site', async () => {
    const { h } = signedIn()
    const script = await h.call('/assets/org-name.js')
    expect(script.headers.get('content-type')).toContain('javascript')
    expect(await script.text()).toContain('data-check')
  })
})
