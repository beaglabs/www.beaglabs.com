import { describe, expect, it, vi } from 'vitest'
import { record } from '../src/setup'
import type { ActionResult, DetailPayload, ListPayload } from '../src/ui/types'
import { signedIn } from './helpers/session'

const STEPS = ['connect', 'deploy', 'dns', 'health', 'microsoft', 'registration'] as const
const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
const steps = (passed: readonly string[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ ...Object.fromEntries(STEPS.map((id) => [id, passed.includes(id) ? { status: 'pass', at: at(30) } : { status: 'pending' }])), ...extra })

/** A fake R2 bucket. */
const bucket = () => {
  const objects = new Map<string, Uint8Array<ArrayBuffer>>()
  return {
    objects,
    binding: {
      put: async (key: string, value: Uint8Array<ArrayBuffer>) => void objects.set(key, value),
      get: async (key: string) => (objects.has(key) ? { body: new Blob([objects.get(key)!]).stream() } : null),
      delete: async (key: string) => void objects.delete(key),
    } as unknown as R2Bucket,
  }
}

function setup(options: Parameters<typeof signedIn>[0] = {}) {
  const session = signedIn(options)
  const { h, cookie } = session
  h.sql.prepare("INSERT INTO hosted_infra (id, data, updated_at) VALUES ('aws', ?, 'now')").run(JSON.stringify({ loadBalancerDns: 'alb.example' }))
  const hosted = (id: string, org: string, stepJson: string, account = 'acct_1') => {
    h.insertDeployment({ id, account_id: account, billing_state: 'active', license_deployment_id: `pd_${id}` })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = ?, steps = ?, updated_at = ? WHERE id = ?").run(`${org}.papyrus.beaglabs.com`, stepJson, at(30), id)
  }
  const json = async <T,>(path: string) => {
    const response = await h.call(path, { headers: { cookie } })
    return { status: response.status, body: (await response.json()) as T, response }
  }
  const postJson = async <T,>(path: string, headers: Record<string, string> = { origin: h.env.BASE_URL }) => {
    const response = await h.call(path, { method: 'POST', headers: { cookie, 'content-type': 'application/json', ...headers }, body: '{}' })
    return { status: response.status, body: (await response.json()) as T }
  }
  return { ...session, hosted, json, postJson }
}

describe('GET /api/deployments', () => {
  it('needs a session and lists only the signed-in account’s deployments', async () => {
    const { h, hosted, json } = setup()
    h.insertAccount('acct_2', 'other@example.com')
    hosted('dep_mine', 'acme', steps(STEPS))
    hosted('dep_theirs', 'globex', steps(STEPS), 'acct_2')
    expect((await h.call('/api/deployments')).status).toBe(401)
    const { body, response } = await json<ListPayload>('/api/deployments')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(body.deployments.map((d) => d.id)).toEqual(['dep_mine'])
    expect(body.deployments[0]).toMatchObject({ status: 'running', statusLabel: 'Running', health: 'healthy', url: 'https://acme.papyrus.beaglabs.com/', provider: 'Hosted by Beag Labs', region: 'us-east-2', environment: 'Production' })
  })
})

describe('GET /api/deployments/:id', () => {
  it('is scoped to the account (another account’s id is a 404)', async () => {
    const { h, hosted, json } = setup()
    h.insertAccount('acct_2', 'other@example.com')
    hosted('dep_theirs', 'globex', steps(STEPS), 'acct_2')
    expect((await json('/api/deployments/dep_theirs')).status).toBe(404)
    expect((await h.call('/api/deployments/dep_theirs')).status).toBe(401)
  })

  it('reports backend milestones: completed, active (with the check’s own words), pending, failed', async () => {
    const { h, hosted, json } = setup()
    hosted('dep_abc', 'acme', steps(['connect', 'deploy', 'dns'], { health: { status: 'pending', at: at(0.5), reason: 'GET … → 503; Papyrus is still starting.' } }))
    // Nothing due yet (checked 30s ago), so no automatic check runs.
    const { body } = await json<DetailPayload>('/api/deployments/dep_abc')
    const d = body.deployment
    expect(d.milestones.map((m) => [m.label, m.state])).toEqual([
      ['Workspace', 'completed'],
      ['Address', 'completed'],
      ['Health check', 'active'],
      ['Microsoft', 'pending'],
      ['Registration', 'pending'],
    ])
    expect(d.milestones[0]!.detail).toBe('Container and storage created in us-east-2.')
    expect(d.milestones[2]).toMatchObject({ note: 'GET … → 503; Papyrus is still starting.' })
    expect(d).toMatchObject({ status: 'starting', health: 'starting', busy: true, progress: { completed: 2, total: 5, mode: 'determinate' }, operation: { label: 'Starting Papyrus' } })
    expect(d.preview).toMatchObject({ state: 'provisioning', mode: 'none', image: null })

    h.sql.prepare('UPDATE deployments SET steps = ? WHERE id = ?').run(JSON.stringify(record(JSON.parse(steps(['connect', 'deploy', 'dns'])), 'health', { status: 'fail', reason: 'answered 502' })), 'dep_abc')
    const failed = (await json<DetailPayload>('/api/deployments/dep_abc')).body.deployment
    expect(failed.milestones[2]).toMatchObject({ state: 'failed', detail: 'answered 502' })
    expect(failed.failure).toEqual({ stage: 'Health check', message: 'answered 502', recovery: ['retry', 'redeploy'] })
    // Each action once: Redeploy is a recovery action here, not also a header action.
    expect(failed.actions.filter((a) => a.id === 'redeploy')).toHaveLength(1)
    expect(failed.preview.state).toBe('failed')
  })

  it('has a monotonic version: newer state never compares older', async () => {
    const { h, hosted, json } = setup()
    hosted('dep_abc', 'acme', steps(STEPS))
    const before = (await json<DetailPayload>('/api/deployments/dep_abc')).body.deployment.version
    h.sql.prepare("INSERT INTO deployment_lifecycle (deployment_id, state, changed_at) VALUES ('dep_abc', 'stopped', ?)").run(new Date(Date.now() + 1000).toISOString())
    const after = (await json<DetailPayload>('/api/deployments/dep_abc')).body.deployment
    expect(after.status).toBe('stopped')
    expect(after.version).toBeGreaterThan(before)
  })

  it('runs the due read-only check while the page polls, and logs only when the outcome changes', async () => {
    let answer = 503
    const fetch = vi.fn(async () => new Response(answer === 200 ? '{"entraConfigured":false}' : 'starting', { status: answer, headers: { 'content-type': 'application/json' } }))
    const { h, hosted, json } = setup({ fetch })
    hosted('dep_abc', 'acme', steps(['connect', 'deploy', 'dns'], { deploy: { status: 'pass', at: at(2) }, health: { status: 'pending', at: at(1), reason: 'GET https://acme.papyrus.beaglabs.com/api/config/public → 503; Papyrus is still starting.' } }))
    const events = () => h.sql.prepare("SELECT message FROM events WHERE source = 'health'").all() as { message: string }[]

    await json('/api/deployments/dep_abc')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(events()).toHaveLength(0) // same answer as before: quiet

    // Within the throttle nothing runs again.
    await json('/api/deployments/dep_abc')
    expect(fetch).toHaveBeenCalledTimes(1)

    answer = 200
    h.sql.prepare("UPDATE auto_checks SET claimed_at = '2000-01-01T00:00:00.000Z'").run()
    h.sql.prepare('UPDATE deployments SET steps = json_set(steps, \'$.health.at\', ?) WHERE id = ?').run(at(1), 'dep_abc')
    await json('/api/deployments/dep_abc')
    expect(events()).toHaveLength(1)
    expect(events()[0]!.message).toMatch(/^GET https:\/\/acme\.papyrus\.beaglabs\.com\/api\/config\/public → 200 · healthy\./)
    const live = (await json<DetailPayload>('/api/deployments/dep_abc')).body.deployment
    expect(live.milestones[2]!.state).toBe('completed')
    expect(live.health).toBe('healthy')
  })
})

describe('POST /api/deployments/:id/actions/:action', () => {
  it('refuses cross-origin posts, unknown actions, other accounts and actions that are not allowed', async () => {
    const { h, hosted, postJson } = setup()
    h.insertAccount('acct_2', 'other@example.com')
    hosted('dep_abc', 'acme', steps(STEPS))
    hosted('dep_theirs', 'globex', steps(STEPS), 'acct_2')
    expect((await postJson('/api/deployments/dep_abc/actions/stop', {})).status).toBe(403)
    expect((await postJson('/api/deployments/dep_abc/actions/stop', { origin: 'https://evil.example' })).status).toBe(403)
    expect((await postJson('/api/deployments/dep_abc/actions/explode')).status).toBe(404)
    expect((await postJson('/api/deployments/dep_theirs/actions/start')).status).toBe(404)
    const refused = await postJson<ActionResult>('/api/deployments/dep_abc/actions/start')
    expect(refused.status).toBe(409)
    expect(refused.body).toMatchObject({ ok: false, message: 'Start is not available for this deployment right now.', deployment: { id: 'dep_abc', status: 'running' } })
  })

  it('runs a setup check and answers with the fresh view model', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
    const { hosted, postJson } = setup({ fetch })
    hosted('dep_abc', 'acme', steps(['connect', 'deploy', 'dns'], { health: { status: 'pending', at: at(1), reason: 'starting' } }))
    const result = await postJson<ActionResult>('/api/deployments/dep_abc/actions/check')
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ ok: true, message: 'GET https://acme.papyrus.beaglabs.com/api/config/public → 200 · healthy.' })
    expect(result.body.deployment!.milestones[2]!.state).toBe('completed')
  })
})

describe('browser preview', () => {
  const png = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])

  it('captures the public page after the health check passes, caches it with its time, rate-limits refreshes', async () => {
    const store = bucket()
    const capture = vi.fn(async (_env: unknown, url: string) => (expect(url).toBe('https://acme.papyrus.beaglabs.com/'), png))
    const { h, hosted, json, postJson, cookie } = setup({ capture, env: { BROWSER: {} as Fetcher, PREVIEWS: store.binding } })
    hosted('dep_abc', 'acme', steps(STEPS))
    const first = (await json<DetailPayload>('/api/deployments/dep_abc')).body.deployment.preview
    expect(first).toMatchObject({ state: 'loading', mode: 'screenshot', captureDue: true })

    const taken = await postJson<ActionResult>('/api/deployments/dep_abc/preview')
    expect(taken.status).toBe(202)
    expect(capture).toHaveBeenCalledTimes(1)
    const shown = (await json<DetailPayload>('/api/deployments/dep_abc')).body.deployment.preview
    expect(shown).toMatchObject({ state: 'running', mode: 'screenshot', canRefresh: false })
    expect(shown.capturedAt).toMatch(/^\d{4}-/)
    expect(shown.image).toBe(`/api/deployments/dep_abc/preview.jpg?v=${Date.parse(shown.capturedAt!)}`)

    const again = await postJson<ActionResult>('/api/deployments/dep_abc/preview')
    expect(again.status).toBe(429)
    expect(again.body.message).toMatch(/Try again in \d+s/)
    expect(capture).toHaveBeenCalledTimes(1)

    const image = await h.call(shown.image!, { headers: { cookie } })
    expect(image.status).toBe(200)
    expect(image.headers.get('content-type')).toBe('image/jpeg')
    expect(image.headers.get('cache-control')).toContain('private')
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(png)
  })

  it('is not taken before health passes, is private to the account, and falls back to a card without Browser Rendering', async () => {
    const store = bucket()
    const capture = vi.fn(async () => png)
    const { h, hosted, postJson, json } = setup({ capture, env: { BROWSER: {} as Fetcher, PREVIEWS: store.binding } })
    hosted('dep_abc', 'acme', steps(['connect', 'deploy', 'dns']))
    expect((await postJson('/api/deployments/dep_abc/preview')).status).toBe(409)
    expect(capture).not.toHaveBeenCalled()
    h.insertAccount('acct_2', 'other@example.com')
    hosted('dep_theirs', 'globex', steps(STEPS), 'acct_2')
    expect((await postJson('/api/deployments/dep_theirs/preview')).status).toBe(404)
    expect((await json('/api/deployments/dep_theirs/preview.jpg')).status).toBe(404)

    const plain = setup()
    plain.hosted('dep_abc', 'acme', steps(STEPS))
    expect((await plain.json<DetailPayload>('/api/deployments/dep_abc')).body.deployment.preview).toMatchObject({ state: 'running', mode: 'card', url: 'https://acme.papyrus.beaglabs.com/' })
    expect((await plain.postJson('/api/deployments/dep_abc/preview')).status).toBe(503)
  })

  it('the page keeps frame-ancestors locked and never frames Papyrus', async () => {
    const { hosted, get } = setup()
    hosted('dep_abc', 'acme', steps(STEPS))
    const response = await get('/deploy/dep_abc')
    const html = await response.text()
    expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(html).not.toContain('<iframe')
    expect(html).toContain('Open environment')
  })
})
