import { describe, expect, it } from 'vitest'
import { PRICE_ROWS, PRICE_SUMMARY, sizeRows } from '../src/pricing'
import { pricingTable, sizeTable } from '../src/views'
import { signedIn } from './helpers/session'

describe('pricing', () => {
  it('summarises the three charges', () => {
    expect(PRICE_SUMMARY).toBe('$250/month platform · $0.50 per VM hour · $0.00194444 per agent-second (≈ $7/agent-hour)')
    expect(PRICE_ROWS.map((r) => [r.id, r.amount, r.unit])).toEqual([
      ['platform', '$250', 'per month'],
      ['compute', '$0.50', 'per VM hour'],
      ['execution', '$0.00194444', 'per agent-second'],
    ])
  })

  it('renders the pricing table from its rows', () => {
    const html = pricingTable([{ id: 'platform', label: 'Small org', amount: '$1', unit: 'per month', detail: 'x' }])
    expect(html).toBe('<table class="pricing"><tbody><tr data-price="platform"><th scope="row">Small org<small>x</small></th><td><strong class="amt">$1</strong><span class="unit">per month</span></td></tr></tbody></table>')
  })

  it('computes the organization-size table from the constants', () => {
    expect(sizeRows()).toEqual([
      { users: 100, agentHours: 200, monthlyTotal: 2015, perUser: 20.15 },
      { users: 500, agentHours: 1000, monthlyTotal: 7615, perUser: 15.23 },
      { users: 1000, agentHours: 2000, monthlyTotal: 14615, perUser: 14.62 },
      { users: 5000, agentHours: 10000, monthlyTotal: 70615, perUser: 14.12 },
    ])
    const html = sizeTable()
    for (const cells of [
      ['100 users', '200', '$2,015', '$20.15'],
      ['500 users', '1,000', '$7,615', '$15.23'],
      ['1,000 users', '2,000', '$14,615', '$14.62'],
      ['5,000 users', '10,000', '$70,615', '$14.12'],
    ]) expect(html).toContain(`<tr><th scope="row">${cells[0]}</th><td>${cells[1]}</td><td>${cells[2]}</td><td>${cells[3]}</td></tr>`)
    expect(html).toContain('<caption>Assumes one deployment running all month (730 VM hours) and 2 agent-hours per user per month.</caption>')
    expect(html).toContain('<th scope="col">Effective cost per user/month</th>')
  })

  it('the plan step shows the three charges and the size table before payment, and no old prices anywhere', async () => {
    const { h, get } = signedIn()
    const plan = await (await get('/deploy')).text()
    expect(plan).toContain('data-plan-step')
    for (const id of ['platform', 'compute', 'execution']) expect(plan).toContain(`<tr data-price="${id}">`)
    expect(plan).toContain('data-size-table')
    expect(plan).toContain('<td>$14,615</td><td>$14.62</td>')
    expect(plan).toContain('action="/billing/checkout"')
    const pages = [plan, await (await get('/billing')).text(), await (await h.call('/signup')).text()]
    for (const html of pages) {
      expect(html).not.toContain('13,000')
      expect(html).not.toMatch(/\$50\s*\/\s*h(ou)?r/)
    }
  })
})
