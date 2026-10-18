import { describe, expect, it } from 'vitest'
import { signedIn } from './helpers/session'

const setup = () => {
  const s = signedIn()
  s.h.insertDeployment({ id: 'dep_a' })
  s.h.insertDeployment({ id: 'dep_b' })
  s.h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = 'acme.papyrus.beaglabs.com' WHERE id = 'dep_a'").run()
  s.h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = 'other.papyrus.beaglabs.com' WHERE id = 'dep_b'").run()
  return s
}

describe('deployment settings', () => {
  it('scopes addresses and the typed deletion dialog to the selected deployment', async () => {
    const { get } = setup()
    const fullHtml = await (await get('/deploy/dep_a/settings')).text()
    const html = fullHtml.split('</main>')[0]!
    expect(html).toContain('value="acme.papyrus.beaglabs.com" readonly')
    expect(html).not.toContain('other.papyrus.beaglabs.com')
    expect(html).toContain('<dialog id="delete-deployment"')
    expect(html).toContain('action="/deploy/dep_a/delete"')
    expect(html).toContain('data-confirm="acme"')
    expect(html).toContain('data-delete-submit disabled')
    expect(html).toContain('data-delete-cancel>Cancel')
    expect(fullHtml).toContain('src="/assets/deployment-settings.js"')
    const detail = await (await get('/deploy/dep_a')).text()
    expect(detail).toContain('href="/deploy/dep_a/settings"')
    const global = (await (await get('/settings')).text()).split('</main>')[0]!
    expect(global).toContain('Account settings')
    expect(global).not.toContain('data-delete-card')
    expect(global).not.toContain('acme.papyrus.beaglabs.com')
  })

  it('checks ownership and keeps invalid deletion confirmation on the deployment settings page', async () => {
    const { h, get, post } = setup()
    h.insertAccount('acct_other', 'other@example.com')
    h.insertDeployment({ id: 'dep_foreign', account_id: 'acct_other' })
    expect((await get('/deploy/dep_foreign/settings')).status).toBe(404)
    expect((await post('/deploy/dep_foreign/delete', { confirm: 'dep_foreign' })).status).toBe(404)
    const response = await post('/deploy/dep_a/delete', { confirm: 'wrong' })
    expect(response.status).toBe(400)
    const html = (await response.text()).split('</main>')[0]!
    expect(html).toContain('Type acme exactly to confirm.')
    expect(html).toContain('id="delete-deployment"')
    expect(html).not.toContain('other.papyrus.beaglabs.com')
    expect(h.sql.prepare("SELECT * FROM deployment_lifecycle WHERE deployment_id = 'dep_a'").get()).toBeUndefined()
  })
})
