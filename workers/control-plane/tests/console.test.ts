import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { initialSteps, record, type Steps } from '../src/setup'
import { harness } from './helpers/harness'

const TOKEN = 'session-token'
const session = (token: string) => createHash('sha256').update(token).digest('hex')

function signedIn(options: Parameters<typeof harness>[0] = {}) {
  const h = harness(options)
  h.insertAccount('acct_1', 'owner@example.com')
  h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(session(TOKEN), 'acct_1', '2999-01-01T00:00:00.000Z')
  const get = (path: string) => h.call(path, { headers: { cookie: `cp_session=${TOKEN}` } })
  const post = (path: string, form: Record<string, string> = {}) =>
    h.call(path, { method: 'POST', headers: { cookie: `cp_session=${TOKEN}`, origin: h.env.BASE_URL, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() })
  /** A hosted deployment at acme.papyrus.beaglabs.com with the given steps. */
  const hosted = (id: string, steps: Steps, billing = 'active') => {
    h.insertDeployment({ id, billing_state: billing })
    h.sql.prepare('UPDATE deployments SET provider = ?, hostname = ?, steps = ? WHERE id = ?').run('hosted', 'acme.papyrus.beaglabs.com', JSON.stringify(steps), id)
  }
  const event = (row: { account?: string; deployment?: string | null; level?: string; source?: string; message?: string }) =>
    h.sql
      .prepare('INSERT INTO events (account_id, deployment_id, at, level, source, message) VALUES (?, ?, ?, ?, ?, ?)')
      .run(row.account ?? 'acct_1', row.deployment ?? null, '2026-10-17T14:00:00.000Z', row.level ?? 'info', row.source ?? 'deploy', row.message ?? 'x')
  const events = () => h.sql.prepare('SELECT * FROM events ORDER BY id').all() as Array<Record<string, unknown>>
  return { h, get, post, hosted, event, events }
}

const passed = (...ids: Array<'connect' | 'deploy' | 'dns' | 'health' | 'microsoft' | 'registration'>) =>
  ids.reduce((steps, id) => record(steps, id, { status: 'pass' }), initialSteps())

describe('Console shell', () => {
  it('renders the sidebar nav with the active item', async () => {
    const { get } = signedIn()
    for (const [path, label] of [['/billing', 'Billing'], ['/team', 'Team'], ['/support', 'Support'], ['/settings', 'Settings'], ['/deploy', 'Deployment']] as const) {
      const response = await get(path)
      expect(response.status, path).toBe(200)
      const html = await response.text()
      expect(html).toContain('<aside class="side"')
      for (const item of ['Deployment', 'Billing', 'Team', 'Support', 'Settings']) expect(html).toContain(`>${item}</a>`)
      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
      expect(html).toMatch(new RegExp(`class="on" aria-current="page">${label}</a>`))
      expect(html).toContain('owner@example.com')
      expect(html).toContain('/assets/papyrus-logo-64.png')
      expect(html).toContain('fonts.googleapis.com')
    }
  })

  it('serves the logo from the Worker at 64px and 128px', async () => {
    const { h } = signedIn()
    for (const [path, size] of [['/assets/papyrus-logo-64.png', 64], ['/assets/papyrus-logo-128.png', 128]] as const) {
      const response = await h.call(path)
      expect(response.headers.get('content-type')).toBe('image/png')
      const bytes = new Uint8Array(await response.arrayBuffer())
      expect(bytes.length).toBeLessThan(40_000)
      // PNG IHDR width, big-endian at offset 16.
      expect(new DataView(bytes.buffer).getUint32(16)).toBe(size)
    }
  })

  it('allows Google Fonts in the CSP', async () => {
    const { get } = signedIn()
    const csp = (await get('/billing')).headers.get('content-security-policy')!
    expect(csp).toContain('https://fonts.googleapis.com')
    expect(csp).toContain('https://fonts.gstatic.com')
  })

  it('lists several deployments first and opens one', async () => {
    const { get, hosted } = signedIn()
    hosted('dep_a', passed('connect'))
    hosted('dep_b', passed('connect'))
    const list = await (await get('/deploy')).text()
    expect(list).toContain('href="/deploy/dep_a"')
    expect(list).toContain('href="/deploy/dep_b"')
    expect(list).not.toContain('data-activity')
    const one = await (await get('/deploy/dep_a')).text()
    expect(one).toContain('data-activity')
    expect(one).toContain('← All deployments')
  })
})

describe('Deployment page', () => {
  it('disables Open Papyrus until the health step passes, then links to the host', async () => {
    const { h, get, hosted } = signedIn()
    hosted('dep_abc', passed('connect', 'deploy', 'dns'))
    const before = await (await get('/deploy/dep_abc')).text()
    expect(before).toMatch(/<span class="btn primary lg" data-open-papyrus role="link" aria-disabled="true"[^>]*>Open Papyrus →<\/span>/)
    expect(before).toContain('Opens once the health check passes.')
    expect(before).not.toContain('href="https://acme.papyrus.beaglabs.com/"')
    expect(before).toContain('Setting up · 3 of 6')

    h.sql.prepare('UPDATE deployments SET steps = ? WHERE id = ?').run(JSON.stringify(passed('connect', 'deploy', 'dns', 'health')), 'dep_abc')
    const after = await (await get('/deploy/dep_abc')).text()
    expect(after).toContain('<a class="btn primary lg" data-open-papyrus href="https://acme.papyrus.beaglabs.com/"')
    expect(after).not.toContain('aria-disabled="true"')
  })

  it('shows real step states: done, running with progress, next, waiting, failed with Retry', async () => {
    const { h, get, hosted } = signedIn()
    const running = record(passed('connect', 'deploy', 'dns'), 'health', { status: 'pending', reason: 'GET … → 503' })
    hosted('dep_abc', running)
    const html = await (await get('/deploy/dep_abc')).text()
    expect(html).toMatch(/id="deploy" data-state="done"/)
    expect(html).toMatch(/id="health" data-state="running"[\s\S]*?role="progressbar"/)
    expect(html).toMatch(/id="microsoft" data-state="next"/)
    expect(html).toMatch(/id="registration" data-state="waiting"/)

    h.sql.prepare('UPDATE deployments SET steps = ? WHERE id = ?').run(JSON.stringify(record(passed('connect', 'deploy', 'dns'), 'health', { status: 'fail', reason: 'answered 502' })), 'dep_abc')
    const failed = await (await get('/deploy/dep_abc')).text()
    expect(failed).toMatch(/id="health" data-state="failed"/)
    expect(failed).toContain('answered 502')
    expect(failed).toContain('action="/deploy/dep_abc/steps/health"><button class="btn sm primary" type="submit">Retry</button>')
    expect(failed).toContain('Needs attention · 3 of 6')
  })

  it('has the plan card, the email support card, and the Activity log', async () => {
    const { h, get, hosted, event } = signedIn()
    hosted('dep_abc', passed('connect'))
    h.sql.prepare("UPDATE deployments SET stripe_customer_id = 'cus_1', stripe_status = 'trialing' WHERE id = 'dep_abc'").run()
    h.sql.prepare("INSERT INTO billing_periods (deployment_id, trial_end, updated_at) VALUES ('dep_abc', '2026-10-31T12:00:00.000Z', 'now')").run()
    event({ deployment: 'dep_abc', level: 'wait', source: 'health', message: 'GET https://acme.papyrus.beaglabs.com/api/health → 503' })
    const html = await (await get('/deploy/dep_abc')).text()
    expect(html).toMatch(/data-trial>Trial · \d+ days? left · ends Oct 31|data-trial>Trial · ends today/)
    expect(html).toContain('$250/month platform · $0.50 per VM hour · $0.00194444 per agent-second (≈ $7/agent-hour)')
    expect(html).toContain('This month so far: 0 VM hours · 0 agent minutes · $0.00 estimated')
    expect(html).toContain('action="/billing/portal"')
    expect(html).toContain('class="card support-page-card"')
    expect(html).toContain('Stuck? Email James and get support within 48 hours')
    expect(html).toContain('<span class="lv warn">WAIT</span>')
    expect(html).toContain('data-endpoint="/api/events?deployment=dep_abc"')
    expect(html).toContain('data-interval="5000"')
    expect(html).toContain('<script src="/assets/activity.js" defer></script>')
    for (const filter of ['All', 'Deploy', 'Billing', 'Team', 'Errors']) expect(html).toContain(`>${filter}</button>`)
  })
})

describe('GET /api/events', () => {
  it('is scoped to the signed-in account, filters by source and level, and pages', async () => {
    const { h, get, hosted, event } = signedIn()
    hosted('dep_abc', passed('connect'))
    h.insertAccount('acct_2', 'other@example.com')
    h.insertDeployment({ id: 'dep_other', account_id: 'acct_2' })
    event({ account: 'acct_2', deployment: 'dep_other', message: 'not yours' })
    event({ deployment: 'dep_abc', level: 'ok', source: 'billing', message: 'Trial started' })
    event({ deployment: 'dep_abc', level: 'error', source: 'health', message: 'health failed' })
    event({ level: 'info', source: 'account', message: 'signed in' })
    event({ deployment: 'dep_abc', level: 'ok', source: 'deploy', message: 'deployed' })

    expect((await h.call('/api/events')).status).toBe(401)
    expect((await get('/api/events?deployment=dep_other')).status).toBe(404)

    const all = (await (await get('/api/events')).json()) as { events: Array<{ message: string; id: number }>; next: number | null }
    expect(all.events.map((e) => e.message)).toEqual(['deployed', 'signed in', 'health failed', 'Trial started'])
    expect(all.next).toBeNull()

    const scoped = (await (await get('/api/events?deployment=dep_abc')).json()) as typeof all
    expect(scoped.events.map((e) => e.message)).toEqual(['deployed', 'signed in', 'health failed', 'Trial started'])

    const messages = async (query: string) => ((await (await get(`/api/events?${query}`)).json()) as typeof all).events.map((e) => e.message)
    expect(await messages('source=billing')).toEqual(['Trial started'])
    expect(await messages('filter=billing')).toEqual(['Trial started'])
    expect(await messages('level=error')).toEqual(['health failed'])
    expect(await messages('filter=errors')).toEqual(['health failed'])
    expect(await messages('filter=team')).toEqual(['signed in'])
    expect(await messages('filter=deploy')).toEqual(['deployed', 'health failed'])
    expect(await messages('source=deploy,health&level=ok')).toEqual(['deployed'])

    const page1 = (await (await get('/api/events?limit=2')).json()) as typeof all
    expect(page1.events.map((e) => e.message)).toEqual(['deployed', 'signed in'])
    expect(page1.next).toBe(page1.events[1]!.id)
    const page2 = (await (await get(`/api/events?limit=2&before=${page1.next}`)).json()) as typeof all
    expect(page2.events.map((e) => e.message)).toEqual(['health failed', 'Trial started'])
    expect(page2.next).toBeNull()

    const newer = (await (await get(`/api/events?after=${page2.events[0]!.id}`)).json()) as typeof all
    expect(newer.events.map((e) => e.message)).toEqual(['deployed', 'signed in'])
  })
})

describe('events are written', () => {
  it('for a Stripe webhook', async () => {
    const { h, events } = signedIn()
    h.insertDeployment({ id: 'dep_1' })
    const trialEnd = Date.parse('2026-10-31T00:00:00Z') / 1000
    await h.stripeEvent({ id: 'evt_1', type: 'customer.subscription.created', data: { object: { id: 'sub_1', status: 'trialing', customer: 'cus_1', trial_end: trialEnd, metadata: { deployment_id: 'dep_1' } } } })
    await h.stripeEvent({ id: 'evt_2', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'past_due', customer: 'cus_1', metadata: {} } } })
    // A replay writes nothing.
    await h.stripeEvent({ id: 'evt_2', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'past_due', customer: 'cus_1', metadata: {} } } })
    expect(events()).toEqual([
      expect.objectContaining({ account_id: 'acct_1', deployment_id: 'dep_1', level: 'ok', source: 'billing', message: 'Trial started · Papyrus · $250/month platform + usage after Oct 31' }),
      expect.objectContaining({ account_id: 'acct_1', deployment_id: 'dep_1', level: 'error', source: 'billing', message: expect.stringContaining('past due') }),
    ])
    expect(h.sql.prepare('SELECT trial_end FROM billing_periods WHERE deployment_id = ?').get('dep_1')).toEqual({ trial_end: '2026-10-31T00:00:00.000Z' })
    for (const row of events()) expect(String(row.message)).not.toMatch(/whsec|sk_test|cus_1|sub_1/)
  })

  it('for health checks: WAIT with attempts while Papyrus starts, ERROR once it should be up', async () => {
    const fetch = (async () => new Response('starting', { status: 503 })) as typeof globalThis.fetch
    const { h, post, hosted, events } = signedIn({ fetch })
    hosted('dep_abc', passed('connect', 'deploy', 'dns'))

    await post('/deploy/dep_abc/steps/health')
    await post('/deploy/dep_abc/steps/health')
    expect(events()).toEqual([
      expect.objectContaining({ level: 'wait', source: 'health', deployment_id: 'dep_abc', message: expect.stringContaining('GET https://acme.papyrus.beaglabs.com/api/config/public → 503') }),
      expect.objectContaining({ level: 'wait', source: 'health', message: expect.stringContaining('(attempt 2)') }),
    ])
    expect(JSON.parse(h.deployment('dep_abc').steps as string).health).toMatchObject({ status: 'pending', attempts: 2 })

    // Deployed an hour ago: no longer "starting", so the check fails.
    const steps = JSON.parse(h.deployment('dep_abc').steps as string)
    steps.deploy.at = new Date(Date.now() - 3_600_000).toISOString()
    h.sql.prepare('UPDATE deployments SET steps = ? WHERE id = ?').run(JSON.stringify(steps), 'dep_abc')
    await post('/deploy/dep_abc/steps/health')
    expect(events().at(-1)).toMatchObject({ level: 'error', source: 'health', message: expect.stringMatching(/→ 503\. Retry.*\(attempt 3\)/) })
    expect(JSON.parse(h.deployment('dep_abc').steps as string).health.status).toBe('fail')
  })

  it('for the org-name claim and the BYOC credential check, without credentials', async () => {
    const denied = (async () => Response.json({ error: 'unauthorized' }, { status: 401 })) as typeof fetch
    const { h, post, events } = signedIn({ env: { BYOC_ENABLED: 'true' }, fetch: denied })
    h.insertDeployment({ id: 'dep_abc' })
    h.insertDeployment({ id: 'dep_byoc' })
    await post('/deploy/dep_abc/org', { org: 'acme' })
    expect(events().at(-1)).toMatchObject({ level: 'ok', source: 'address', message: 'Claimed "acme" · acme.papyrus.beaglabs.com' })
    await post('/provision', { deployment: 'dep_byoc', provider: 'fly-io', apiKey: 'fo1_supersecret', orgSlug: 'acme', region: 'iad' })
    const check = events().at(-1)!
    expect(check).toMatchObject({ source: 'connect', deployment_id: 'dep_byoc', level: 'error' })
    expect(String(check.message)).not.toContain('fo1_supersecret')
  })
})

describe('signed-out pages', () => {
  it('render as a centred card with the logo and no sidebar', async () => {
    const resend = (async () => Response.json({ id: 'email_1' })) as typeof fetch
    const { h } = signedIn({ fetch: resend })
    const pages = [
      await h.call('/login'),
      await h.call('/signup'),
      await h.call('/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=new%40example.com' }),
    ]
    const texts = await Promise.all(pages.map((p) => p.text()))
    expect(texts[2]).toContain('Check your email')
    for (const html of texts) {
      expect(html).toContain('<main class="solo">')
      expect(html).toContain('/assets/papyrus-logo-64.png')
      expect(html).not.toContain('<aside class="side"')
      expect(html).not.toContain('support-card')
    }
  })

  it('the org-name claim screen is a centred card too (with the support card, signed in)', async () => {
    const { h, get } = signedIn()
    h.insertDeployment({ id: 'dep_abc' })
    const html = await (await get('/deploy/dep_abc')).text()
    expect(html).toContain('Choose your organization name')
    expect(html).toContain('<main class="solo">')
    expect(html).not.toContain('<aside class="side"')
    expect(html).toContain('id="support-card"')
  })

  it('sign-ins are logged', async () => {
    const { h, events } = signedIn()
    const token = 'magic'
    h.sql.prepare('INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)').run(session(token), 'owner@example.com', '2999-01-01T00:00:00.000Z')
    expect((await h.call(`/login/email?token=${token}`)).status).toBe(303)
    expect(events().at(-1)).toMatchObject({ account_id: 'acct_1', deployment_id: null, level: 'info', source: 'account', message: 'owner@example.com signed in with an email link' })
  })
})

describe('Settings', () => {
  it('saves the name, and keeps the organization read-only once deployed', async () => {
    const { h, get, post } = signedIn()
    await post('/settings', { name: 'Jordan', organization: 'Acme Corp' })
    expect(h.sql.prepare('SELECT name, organization FROM accounts WHERE id = ?').get('acct_1')).toEqual({ name: 'Jordan', organization: 'Acme Corp' })
    h.insertDeployment({ id: 'dep_abc', license_deployment_id: 'pd_1' })
    expect(await (await get('/settings')).text()).toMatch(/id="organization"[^>]*readonly/)
    await post('/settings', { name: 'Jordan B', organization: 'Changed' })
    expect(h.sql.prepare('SELECT name, organization FROM accounts WHERE id = ?').get('acct_1')).toEqual({ name: 'Jordan B', organization: 'Acme Corp' })
  })
})
