import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { createConnectApp } from '../src/app'
import { canonical, deploymentIdOf } from '../src/identity'
import type { Database, LooseStatement } from '../src/db'
import type { Bindings } from '../src/env'
import type { PlaidGateway } from '../src/plaid'

const authority = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const authorityPem = authority.publicKey.export({ type: 'spki', format: 'pem' }).toString()
const signLicense = (payload: Record<string, unknown>) => ({ ...payload, keyId: 'beag-1', signature: sign('sha256', Buffer.from(canonical(payload)), authority.privateKey).toString('base64') })
const orgLicense = (organizationId = 'org_city', expiresAt = new Date(Date.now() + 86_400_000).toISOString()) =>
  signLicense({ scope: 'organization', organizationId, entitlementId: 'ent', licenseId: `lic_${organizationId}`, licensee: 'City', profiles: ['commercial'], features: ['core'], issuedAt: new Date().toISOString(), expiresAt, allowedTenantIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] })

function installKey() {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  return { pem: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString(), sign: (payload: unknown) => sign('sha256', Buffer.from(canonical(payload)), pair.privateKey).toString('base64') }
}

function fixture(options: { managed?: Map<string, { organizationId: string; status: string; publicOrigin?: string }> } = {}) {
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'))
  const execute = (statement: LooseStatement) => {
    const { sql: query, args = [] } = typeof statement === 'string' ? { sql: statement } : statement
    const prepared = sql.prepare(query)
    if (/^\s*SELECT/i.test(query)) return { rows: prepared.all(...args as any[]) }
    return { rows: [], rowsAffected: Number(prepared.run(...args as any[]).changes) }
  }
  const db = { execute: async (s: LooseStatement) => execute(s), batch: async (ss: readonly LooseStatement[]) => ss.map(execute) } as unknown as Database
  const calls: Array<{ name: string; args: unknown[] }> = []
  const plaid: PlaidGateway = {
    async linkToken(mode, input) { calls.push({ name: 'plaidLinkToken', args: [mode, input] }); return { linkToken: 'link-sandbox-1', expiration: '2026-10-16T16:00:00Z' } },
    async accountDetails(mode, input) {
      calls.push({ name: 'plaidAccount', args: [mode, input] })
      return { routingNumber: '011401533', accountNumber: '1111222233330000', accountType: 'checking', mask: '0000', institutionName: input.institutionName, tokenized: false,
        ...(input.legalName ? { nameMatch: { score: input.legalName === 'Acme Paving LLC' ? 92 : 31, matched: input.legalName === 'Acme Paving LLC' } } : {}) }
    },
  }
  const app = createConnectApp({ database: () => db, plaid: () => plaid, managedDeployment: async (_env: Bindings, id: string) => options.managed?.get(id) })
  const env = { LICENSE_AUTHORITIES: JSON.stringify({ 'beag-1': authorityPem }) } as Bindings
  const call = (path: string, init: RequestInit = {}) => app.request(`https://connect.beaglabs.test${path}`, init, env)
  /** A signed call, exactly as Papyrus's ConnectClient makes it. */
  const signed = (key: ReturnType<typeof installKey>, installId: string, method: 'GET' | 'POST', path: string, body?: unknown, timestamp = String(Math.floor(Date.now() / 1000))) => {
    const text = body === undefined ? '' : JSON.stringify(body)
    const signature = key.sign({ method, path, timestamp, bodySha256: createHash('sha256').update(text).digest('hex') })
    return call(path, { method, headers: { 'content-type': 'application/json', 'x-papyrus-install': installId, 'x-papyrus-timestamp': timestamp, 'x-papyrus-signature': signature }, ...(text ? { body: text } : {}) })
  }
  const register = async (key = installKey(), license: unknown = orgLicense(), origin = 'https://papyrus.springfield.gov') => {
    const response = await call('/v1/installs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ license, publicKeyPem: key.pem, origin }) })
    return { response, key, body: await response.json() as { installId: string; webhookSecret: string; code?: string } }
  }
  return { sql, calls, call, signed, register }
}
const linkToken = { mode: 'test', purpose: 'payee', reference: 'req-1' }

test('registers an install with a valid license and binds it to the organization', async () => {
  const f = fixture()
  const { response, key, body } = await f.register()
  assert.equal(response.status, 200)
  assert.equal(body.installId, deploymentIdOf(key.pem))
  assert.match(body.webhookSecret, /^[0-9a-f]{64}$/)
  assert.equal((f.sql.prepare('SELECT owner_key FROM connect_installs').get() as { owner_key: string }).owner_key, 'org:org_city')
  const tampered = { ...orgLicense(), organizationId: 'org_other' }
  assert.equal((await f.register(installKey(), tampered)).response.status, 401)
  assert.equal((await f.register(installKey(), orgLicense('org_city', new Date(Date.now() - 1000).toISOString()))).body.code, 'LICENSE_EXPIRED')
  const deploymentLicense = signLicense({ scope: 'deployment', deploymentId: 'someone-else', licenseId: 'lic_dep', licensee: 'City', profiles: ['commercial'], features: [], issuedAt: new Date().toISOString(), expiresAt: null })
  assert.equal((await f.register(installKey(), deploymentLicense)).body.code, 'LICENSE_MISMATCH')
  assert.equal((await f.register(installKey(), orgLicense(), 'http://papyrus.springfield.gov')).response.status, 400)
})

test('every other call must be signed by a registered install, recently', async () => {
  const f = fixture()
  const { key, body } = await f.register()
  assert.equal((await f.call('/v1/plaid/link-token', { method: 'POST', body: JSON.stringify(linkToken) })).status, 401)
  assert.equal((await f.signed(installKey(), body.installId, 'POST', '/v1/plaid/link-token', linkToken)).status, 401)
  assert.equal((await f.signed(key, body.installId, 'POST', '/v1/plaid/link-token', linkToken, String(Math.floor(Date.now() / 1000) - 900))).status, 401)
  const unknown = await f.signed(key, 'nobody', 'POST', '/v1/plaid/link-token', linkToken)
  assert.equal((await unknown.json() as { code: string }).code, 'INSTALL_UNKNOWN')
  assert.equal((await f.signed(key, body.installId, 'POST', '/v1/plaid/link-token', linkToken)).status, 200)
})

test('an Azure Marketplace VM with no signed license registers once its customer claimed it, as that organization', async () => {
  const claimed = installKey(), unclaimed = installKey(), retired = installKey()
  const managed = new Map([[deploymentIdOf(claimed.pem), { organizationId: 'org_city', status: 'running', publicOrigin: 'https://papyrus.springfield.gov' }],
    [deploymentIdOf(retired.pem), { organizationId: 'org_city', status: 'retired' }]])
  const f = fixture({ managed })
  assert.equal((await f.register(unclaimed, null)).body.code, 'LICENSE_REQUIRED')
  assert.equal((await f.register(retired, null)).body.code, 'DEPLOYMENT_RETIRED')
  assert.equal((await f.register(claimed, null, 'https://elsewhere.example')).body.code, 'ORIGIN_MISMATCH')
  const marketplace = await f.register(claimed, null)
  assert.equal(marketplace.response.status, 200)
  assert.deepEqual({ ...f.sql.prepare('SELECT owner_key, license_id FROM connect_installs WHERE id=?').get(marketplace.body.installId) as object }, { owner_key: 'org:org_city', license_id: `marketplace:${deploymentIdOf(claimed.pem)}` })
  assert.equal((await f.signed(claimed, marketplace.body.installId, 'POST', '/v1/plaid/link-token', linkToken)).status, 200)
  // Retiring the deployment (or moving it to another organization) cuts it off.
  managed.set(deploymentIdOf(claimed.pem), { organizationId: 'org_city', status: 'retired' })
  assert.equal((await (await f.signed(claimed, marketplace.body.installId, 'POST', '/v1/plaid/link-token', linkToken)).json() as { code: string }).code, 'INSTALL_UNKNOWN')
})

test('Plaid: link tokens and account details only for registered installs, keyed to the owner, nothing kept', async () => {
  const f = fixture()
  const city = await f.register()
  assert.equal((await f.call('/v1/plaid/link-token', { method: 'POST', body: JSON.stringify({ mode: 'test' }) })).status, 401)
  const token = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/plaid/link-token', { mode: 'test', purpose: 'payee', reference: 'req-1' })).json() as { linkToken: string }
  assert.equal(token.linkToken, 'link-sandbox-1')
  assert.deepEqual(f.calls.find(item => item.name === 'plaidLinkToken')!.args, ['test', { clientUserId: 'org:org_city:payee:req-1', clientName: 'Papyrus' }])
  const details = await (await f.signed(city.key, city.body.installId, 'POST', '/v1/plaid/account', { mode: 'test', publicToken: 'public-sandbox-1', accountId: 'acc-1', legalName: 'Acme Paving LLC', institutionName: 'First Platypus Bank' })).json() as Record<string, unknown>
  assert.deepEqual(details, { routingNumber: '011401533', accountNumber: '1111222233330000', accountType: 'checking', mask: '0000', institutionName: 'First Platypus Bank', tokenized: false, nameMatch: { score: 92, matched: true } })
  assert.equal((await f.signed(city.key, city.body.installId, 'POST', '/v1/plaid/account', { mode: 'test', accountId: 'acc-1' })).status, 400)
  assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE '%plaid%'").get()!.n, 0)
})
