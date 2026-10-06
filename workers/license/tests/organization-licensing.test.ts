import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { generateKeyPairSync, verify } from 'node:crypto'
import { createOrganizationLicensingApp } from '../src/organization-licensing'
import { canonical, signLicense, type LicensePayload } from '../src/license'
import type { Database, LooseStatement } from '../src/db'
import type { Bindings } from '../src/env'

const tenant = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'
const key = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const pem = key.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
function fixture(options: { admin?: boolean; failSign?: boolean; duringSign?: (sql: DatabaseSync) => void } = {}) {
  const sql = new DatabaseSync(':memory:')
  for (const file of ['schema.sql', 'partner-schema.sql', 'marketplace-schema.sql', 'branding-schema.sql', 'organization-license-schema.sql']) sql.exec(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'))
  const stamp = new Date().toISOString()
  sql.prepare("INSERT INTO organizations (id,organization_type,legal_name,status,created_at,updated_at) VALUES ('org','commercial','Customer','active',?,?)").run(stamp,stamp)
  sql.prepare("INSERT INTO organizations (id,organization_type,legal_name,status,created_at,updated_at) VALUES ('other','commercial','Other','active',?,?)").run(stamp,stamp)
  sql.prepare("INSERT INTO products (id,sku,name,term_type,provisioning_type,created_at,updated_at) VALUES ('prod','ENTERPRISE','Enterprise','annual','license',?,?)").run(stamp,stamp)
  sql.prepare("INSERT INTO orders (id,customer_organization_id,status,created_at,updated_at) VALUES ('order','org','booked',?,?)").run(stamp,stamp)
  sql.prepare("INSERT INTO order_items (id,order_id,product_id,unit_price_cents,extended_price_cents,created_at) VALUES ('item','order','prod',1,1,?)").run(stamp)
  sql.prepare(`INSERT INTO entitlements (id,order_item_id,customer_organization_id,product_id,status,valid_from,valid_until,feature_set_json,allowed_profiles_json,issued_by_oid,created_at,updated_at)
    VALUES ('ent','item','org','prod','active',?,?,'["core","app-factory"]','["commercial"]','admin',?,?)`).run(new Date(Date.now()-10000).toISOString(),new Date(Date.now()+86400000).toISOString(),stamp,stamp)
  const execute = (statement: LooseStatement) => {
    const { sql: query, args = [] } = typeof statement === 'string' ? { sql: statement } : statement
    const prepared = sql.prepare(query)
    if (/^\s*SELECT/i.test(query)) return { rows: prepared.all(...args as any[]) }
    return { rows: [], rowsAffected: prepared.run(...args as any[]).changes }
  }
  const db = { execute: async (s: LooseStatement) => execute(s), batch: async (ss: readonly LooseStatement[]) => {
    sql.exec('BEGIN'); try { const result=ss.map(execute); sql.exec('COMMIT'); return result } catch(error) { sql.exec('ROLLBACK'); throw error }
  }} as unknown as Database
  const app = createOrganizationLicensingApp({ database: () => db, admin: async request => options.admin === false || request.headers.get('x-test-role') === 'partner' ? null : { oid: 'admin' }, sign: async (_env, payload) => {
    if (options.failSign) throw new Error('unavailable')
    options.duringSign?.(sql)
    return signLicense(payload,'key',pem)
  } })
  const request = (path: string, method = 'GET', value?: unknown, role?: string) => app.request(`https://license.example.com/api/v1/entitlements/${path}`, { method, headers: { 'content-type':'application/json', ...(role ? { 'x-test-role':role } : {}) }, ...(value !== undefined && method !== 'GET' ? { body:JSON.stringify(value) } : {}) }, {} as Bindings)
  const save = () => request('ent/license-scope','PUT',{scope:'organization',allowedTenantIds:[tenant],allowedDomains:['PAPYRUS.Example.com']})
  return { sql, request, save, close:()=>sql.close() }
}

test('schema applies idempotently and scope defaults to deployment', async () => { const f=fixture();try{ f.sql.exec(readFileSync(new URL('../organization-license-schema.sql',import.meta.url),'utf8')); assert.equal((await (await f.request('ent/license-scope')).json()).scope,'deployment') }finally{f.close()} })
test('unauthenticated and partner requests cannot read or mutate scope or issue licenses', async () => {
  const f=fixture({admin:false}); const partner=fixture();try{for(const [path,method] of [['ent/license-scope','GET'],['ent/license-scope','PUT'],['ent/licenses','GET'],['ent/licenses','POST']]){assert.equal((await f.request(path,method,{})).status,401);assert.equal((await partner.request(path,method,{},'partner')).status,401)}}finally{f.close();partner.close()}
})
test('approval normalizes tenants and exact hostnames, derives and signs all claims, records audit, and reissues independently', async () => {
 const f=fixture();try{
  assert.equal((await f.save()).status,200)
  const scope=await (await f.request('ent/license-scope')).json(); assert.deepEqual(scope.allowedTenantIds,[tenant.toLowerCase()]);assert.deepEqual(scope.allowedDomains,['papyrus.example.com'])
  const response=await f.request('ent/licenses','POST',{});assert.equal(response.status,201);const {document}=await response.json()
  assert.equal(document.scope,'organization');assert.equal(document.organizationId,'org');assert.equal(document.entitlementId,'ent');assert.equal(document.deploymentId,undefined);assert.deepEqual(document.features,['core','app-factory']);assert.deepEqual(document.profiles,['commercial']);assert.equal(document.licensee,'Customer')
  const {signature,keyId,...payload}=document;assert.equal(keyId,'key');assert.ok(verify('sha256',Buffer.from(canonical(payload)),key.publicKey,Buffer.from(signature,'base64')))
  assert.equal((await f.request('ent/licenses','POST',{})).status,201)
  const history=await (await f.request('ent/licenses')).json();assert.equal(history.items.length,2);assert.deepEqual(history.items.map((r:any)=>r.status).sort(),['issued','superseded']);assert.equal(f.sql.prepare('SELECT count(*) AS n FROM license_issuances').get()!.n,0)
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM audit_events').get()!.n,3)
 }finally{f.close()}
})
test('rejects unknown scope, empty tenants, wildcard/URL domains, empty domain arrays, and issuance overrides', async () => {const f=fixture();try{
 for(const value of [{scope:'all'},{scope:'organization',allowedTenantIds:[]},{scope:'organization',allowedTenantIds:['common']},{scope:'organization',allowedTenantIds:[tenant],allowedDomains:['*.example.com']},{scope:'organization',allowedTenantIds:[tenant],allowedDomains:['https://example.com']},{scope:'organization',allowedTenantIds:[tenant],allowedDomains:[]}]) assert.equal((await f.request('ent/license-scope','PUT',value)).status,422)
 assert.equal((await f.request('ent/licenses','POST',{})).status,409);await f.save();assert.equal((await f.request('ent/licenses','POST',{features:['everything']})).status,422)
}finally{f.close()}})
test('rejects inactive, expired, missing-expiry, future, and malformed terms and mismatched customer order', async () => {
 for(const update of ["status='revoked'","valid_until=NULL","valid_until='invalid'","valid_until='2000-01-01'","valid_from='2999-01-01'","valid_from='invalid'","customer_organization_id='other'"]){const f=fixture();try{f.sql.exec(`UPDATE entitlements SET ${update}`);assert.equal((await f.save()).status,409)}finally{f.close()}}
})
test('a signer failure creates no issuance and does not supersede existing licenses', async () => {const f=fixture({failSign:true});try{await f.save();assert.equal((await f.request('ent/licenses','POST',{})).status,503);assert.equal(f.sql.prepare('SELECT count(*) AS n FROM organization_license_issuances').get()!.n,0);assert.equal(f.sql.prepare('SELECT count(*) AS n FROM audit_events').get()!.n,1)}finally{f.close()}})
test('scope or entitlement changes during signing roll back issuance and audit', async () => {
 for(const change of ["UPDATE entitlement_license_scopes SET version='changed'","UPDATE entitlements SET feature_set_json='[]'","UPDATE entitlements SET status='revoked'","UPDATE orders SET customer_organization_id='other'"]){const f=fixture({duringSign:sql=>sql.exec(change)});try{await f.save();assert.equal((await f.request('ent/licenses','POST',{})).status,409);assert.equal(f.sql.prepare('SELECT count(*) AS n FROM organization_license_issuances').get()!.n,0);assert.equal(f.sql.prepare('SELECT count(*) AS n FROM audit_events').get()!.n,1)}finally{f.close()}}
})
test('removing organization scope preserves signed history and stops organization issuance',async()=>{const f=fixture();try{await f.save();assert.equal((await f.request('ent/licenses','POST',{})).status,201);assert.equal((await f.request('ent/license-scope','PUT',{scope:'deployment'})).status,200);assert.equal((await f.request('ent/licenses','POST',{})).status,409);assert.equal((await (await f.request('ent/licenses')).json()).items.length,1)}finally{f.close()}})

// Optional cross-repository integration: run with PAPYRUS_ROOT set to the runtime checkout.
test('issuer document activates unchanged on two independent Papyrus runtimes', { skip: !process.env.PAPYRUS_ROOT }, async()=>{
 const runtimeRoot=process.env.PAPYRUS_ROOT!
 const {LicenseService}=await import(pathToFileURL(join(runtimeRoot,'apps/server/src/license.ts')).href)
 const {AgentDatabase}=await import(pathToFileURL(join(runtimeRoot,'apps/server/src/agent/database.ts')).href)
 const f=fixture();const dataDirs:string[]=[];const databases:any[]=[]
 try{
  await f.save();const response=await f.request('ent/licenses','POST',{});assert.equal(response.status,201);const {document}=await response.json()
  const services=[0,1].map(()=>{const dir=mkdtempSync(join(tmpdir(),'issuer-runtime-'));dataDirs.push(dir);const db=new AgentDatabase(':memory:');databases.push(db);return new LicenseService(db,dir,'commercial',{key:key.publicKey.export({type:'spki',format:'pem'}).toString()},()=>({tenantId:tenant.toLowerCase(),publicOrigin:'https://papyrus.example.com'}))})
  assert.notEqual(services[0].deploymentId,services[1].deploymentId)
  for(const service of services){assert.equal(service.activate(document).valid,true);assert.equal(service.status().license.entitlementId,'ent');assert.equal(service.allowsRequestHost('evil.example.com'),false)}
 }finally{for(const db of databases)db.close();for(const dir of dataDirs)rmSync(dir,{recursive:true,force:true});f.close()}
})
