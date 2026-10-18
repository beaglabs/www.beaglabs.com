import {describe, expect, it} from 'vitest'
import {signedIn} from './helpers/session'

describe('retired trial offer', () => {
  it('never shows a trial banner or a trial offer, including for a legacy Stripe trial', async () => {
    const { h, get } = signedIn()
    h.insertDeployment({id:'dep_1',billing_state:'active'})
    h.sql.prepare("UPDATE deployments SET stripe_status = 'trialing' WHERE id = 'dep_1'").run()
    for(const path of ['/deploy','/deploy/dep_1','/billing','/settings']) {
      const html = await (await get(path)).text()
      expect(html).not.toContain('data-trial')
      expect(html).not.toContain('14-day trial')
      expect(html).not.toContain('days left')
    }
  })
})
