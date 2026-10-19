import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduledLinear } from '../src/app'
import { customerAttributes, customerKeyOf } from '../src/linear'
import { harness } from './helpers/harness'

const account = (id: string, email: string, flags: { active?: number; paid?: number; organization?: string | null } = {}) => ({
  id,
  email,
  name: null,
  organization: flags.organization ?? null,
  active: flags.active ?? 0,
  paid: flags.paid ?? 0,
})

describe('Linear customer attributes', () => {
  it('groups accounts by business domain and keeps personal addresses apart', () => {
    expect(customerKeyOf({ id: 'acct_1', email: 'dana@Acme.com' })).toBe('domain:acme.com')
    expect(customerKeyOf({ id: 'acct_2', email: 'dana@gmail.com' })).toBe('account:acct_2')
    const customers = customerAttributes([account('acct_1', 'a@acme.com'), account('acct_2', 'b@acme.com', { organization: 'Acme Corp' }), account('acct_3', 'c@gmail.com')], 'user_james')
    expect([...customers.keys()].sort()).toEqual(['account:acct_3', 'domain:acme.com'])
    expect(customers.get('domain:acme.com')).toEqual({ externalId: 'domain:acme.com', name: 'Acme Corp', domains: ['acme.com'], ownerId: 'user_james', status: 'Prospect' })
    expect(customers.get('account:acct_3')).toMatchObject({ name: 'c@gmail.com', status: 'Prospect' })
    expect(customers.get('account:acct_3')).not.toHaveProperty('domains')
  })

  it('is Active while anything is billed, Churned once paid with nothing billed, else Prospect', () => {
    const status = (...members: ReturnType<typeof account>[]) => customerAttributes(members).get('domain:acme.com')!.status
    expect(status(account('a', 'a@acme.com'))).toBe('Prospect')
    expect(status(account('a', 'a@acme.com', { paid: 1 }))).toBe('Churned')
    expect(status(account('a', 'a@acme.com', { paid: 1 }), account('b', 'b@acme.com', { active: 1, paid: 1 }))).toBe('Active')
  })
})

describe('Linear customer sync', () => {
  afterEach(() => vi.unstubAllGlobals())

  /** A fake Linear GraphQL endpoint: records every operation and answers the ones the sync uses. */
  const fakeLinear = () => {
    const calls: { query: string; variables: Record<string, any> }[] = []
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { query: string; variables: Record<string, any> }
      calls.push(body)
      const data = body.query.includes('customerStatuses')
        ? { customerStatuses: { nodes: [{ id: 'st_prospect', name: 'Prospect' }, { id: 'st_active', name: 'Active' }, { id: 'st_churned', name: 'Churned' }] } }
        : body.query.includes('customerUpsert')
          ? { customerUpsert: { success: true, customer: { id: 'cust_1' } } }
          : body.query.includes('issueCreate')
            ? { issueCreate: { success: true, issue: { id: 'issue_1', url: 'https://linear.app/x' } } }
            : { customerNeedCreate: { success: true } }
      return Response.json({ data })
    })
    const upserts = () => calls.filter((c) => c.query.includes('customerUpsert')).map((c) => c.variables.input)
    return { calls, upserts }
  }

  const setup = () => {
    const h = harness({ env: { LINEAR_API_KEY: 'lin_x', LINEAR_TEAM_ID: 'team_1', LINEAR_ASSIGNEE_ID: 'user_james', LOGO_DEV_TOKEN: 'pk_test' } })
    h.insertAccount('acct_1', 'dana@acme.com')
    h.sql.prepare("INSERT INTO compute_credit_offers (email, code_hash, code_ciphertext, issued_at) VALUES ('dana@acme.com', 'h', 'c', 'now')").run()
    return h
  }

  it('creates a Prospect, links the lead issue to it, and skips unchanged customers', async () => {
    const h = setup()
    const linear = fakeLinear()
    await scheduledLinear(h.env)
    expect(linear.upserts()).toEqual([{ externalId: 'domain:acme.com', name: 'Acme', domains: ['acme.com'], logoUrl: 'https://img.logo.dev/acme.com?token=pk_test', ownerId: 'user_james', statusId: 'st_prospect' }])
    const need = linear.calls.find((c) => c.query.includes('customerNeedCreate'))!
    expect(need.variables.input).toMatchObject({ issueId: 'issue_1', customerId: 'cust_1' })
    expect(h.sql.prepare("SELECT delivered_at, linear_customer_id FROM linear_outbox WHERE key = 'lead:acct_1'").get()).toMatchObject({ linear_customer_id: 'cust_1' })

    linear.calls.length = 0
    await scheduledLinear(h.env)
    expect(linear.upserts()).toEqual([])
  })

  it('moves the customer to Active when a deployment is billed and to Churned when billing ends', async () => {
    const h = setup()
    const linear = fakeLinear()
    await scheduledLinear(h.env)
    h.insertDeployment({ id: 'dep_1', billing_state: 'active', stripe_subscription_id: 'sub_1' })
    await scheduledLinear(h.env)
    expect(linear.upserts().at(-1)).toMatchObject({ statusId: 'st_active' })
    h.sql.prepare("UPDATE deployments SET billing_state = 'canceled' WHERE id = 'dep_1'").run()
    await scheduledLinear(h.env)
    expect(linear.upserts().at(-1)).toMatchObject({ statusId: 'st_churned' })
  })

  it('renames the customer when the organization changes', async () => {
    const h = setup()
    const linear = fakeLinear()
    await scheduledLinear(h.env)
    h.sql.prepare("UPDATE accounts SET organization = 'Acme Industries' WHERE id = 'acct_1'").run()
    await scheduledLinear(h.env)
    expect(linear.upserts().at(-1)).toMatchObject({ name: 'Acme Industries' })
  })
})
