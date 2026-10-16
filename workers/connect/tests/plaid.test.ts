import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Bindings } from '../src/env'
import { plaidGateway } from '../src/plaid'

const env = { AZURE_KEY_VAULT_URL: 'https://beag-test.vault.azure.net', AZURE_KEY_VAULT_TENANT_ID: 't', AZURE_KEY_VAULT_CLIENT_ID: 'c', AZURE_KEY_VAULT_CLIENT_SECRET: 's' } as Bindings

function stubFetch(options: { matchFails?: boolean; noNumbers?: boolean } = {}) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = []
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('login.microsoftonline.com')) return json({ access_token: 'vault-token', expires_in: 3600 })
    if (url.includes('vault.azure.net/secrets/')) return json({ value: url.includes('plaid-client-id') ? 'client-1' : 'secret-sandbox' })
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    calls.push({ url, body })
    if (url.endsWith('/item/public_token/exchange')) return json({ access_token: 'access-sandbox-1' })
    if (url.endsWith('/auth/get')) return json({ accounts: [{ account_id: 'acc-1', mask: '0000', name: 'Plaid Checking', subtype: 'checking' }],
      numbers: { ach: options.noNumbers ? [] : [{ account_id: 'acc-1', account: '1111222233330000', routing: '011401533', wire_routing: '021000021', is_tokenized_account_number: false }] } })
    if (url.endsWith('/identity/match')) return options.matchFails ? json({ error_code: 'PRODUCTS_NOT_SUPPORTED', error_message: 'no identity' }, 400)
      : json({ accounts: [{ account_id: 'acc-1', legal_name: { score: 88, is_business_name_detected: true } }] })
    if (url.endsWith('/item/remove')) return json({ removed: true })
    if (url.endsWith('/link/token/create')) return json({ link_token: 'link-sandbox-1', expiration: '2026-10-16T16:00:00Z' })
    return json({ error_code: 'NOT_FOUND' }, 404)
  }) as typeof fetch
  return calls
}

test('reads one account, checks the name, and always removes the connection', async () => {
  const calls = stubFetch()
  const details = await plaidGateway(env).accountDetails('test', { publicToken: 'public-1', accountId: 'acc-1', legalName: 'Acme Paving LLC', institutionName: 'First Platypus Bank' })
  assert.deepEqual(details, { routingNumber: '011401533', wireRoutingNumber: '021000021', accountNumber: '1111222233330000', accountType: 'checking', mask: '0000', accountName: 'Plaid Checking',
    institutionName: 'First Platypus Bank', tokenized: false, nameMatch: { score: 88, matched: true, businessName: true } })
  assert.ok(calls.every(call => call.url.startsWith('https://sandbox.plaid.com/') && call.body.client_id === 'client-1' && call.body.secret === 'secret-sandbox'))
  assert.equal(calls.at(-1)!.url, 'https://sandbox.plaid.com/item/remove')

  const token = await plaidGateway(env).linkToken('test', { clientUserId: 'org:x:payee:1', clientName: 'City of Springfield payments portal' })
  assert.equal(token.linkToken, 'link-sandbox-1')
  assert.deepEqual(calls.at(-1)!.body.products, ['auth'])
  assert.deepEqual(calls.at(-1)!.body.account_filters, { depository: { account_subtypes: ['checking', 'savings'] } })
  assert.equal(calls.at(-1)!.body.client_name, 'City of Springfield payments p')
})

test('details without a name check when the bank offers none; removes the connection even when the account cannot take ACH', async () => {
  stubFetch({ matchFails: true })
  assert.equal((await plaidGateway(env).accountDetails('test', { publicToken: 'p', accountId: 'acc-1', legalName: 'Acme' })).nameMatch, undefined)
  const calls = stubFetch({ noNumbers: true })
  await assert.rejects(plaidGateway(env).accountDetails('test', { publicToken: 'p', accountId: 'acc-1' }), /cannot be paid by ACH/)
  assert.equal(calls.at(-1)!.url, 'https://sandbox.plaid.com/item/remove')
})
