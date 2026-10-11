import { Hono } from 'hono'
import { createHash, randomBytes } from 'node:crypto'
import { first, getDb, parseJsonArray } from './db'
import type { Bindings } from './env'
import { canonical, deploymentIdForPublicKey, payloadSha256, type LicensePayload } from './license'
import { signLicenseWithAzureKeyVault } from './azure-key-vault-signer'
import licenseApp from './index'

type Row = Record<string, any>
const app = new Hono<{Bindings: Bindings}>()
const now = () => new Date().toISOString()
const sha = (value: string) => createHash('sha256').update(value).digest('hex')
function failure(status: number, message: string) { return Response.json({error:message},{status}) }
async function admin(request: Request, env: Bindings, ctx: any): Promise<string | null> {
  const res = await licenseApp.fetch(new Request(new URL('/api/v1/me',request.url),{headers:request.headers}),env,ctx)
  if (!res.ok) return null
  const data = await res.json() as {admin?:{oid?:string}}
  return data.admin?.oid ?? null
}
async function stripeGet(env: Bindings, path: string): Promise<Row> {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  const res = await fetch('https://api.stripe.com/v1/'+path,{
    headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY},
    signal:AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error('Stripe subscription verification failed: HTTP '+res.status)
  return await res.json() as Row
}
async function paidSubscription(env: Bindings, subscriptionId: string): Promise<Row> {
  if (!/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)) throw new Error('Invalid Stripe subscription')
  const sub=await stripeGet(env,'subscriptions/'+encodeURIComponent(subscriptionId)+'?expand[]=latest_invoice')
  if (sub.id!==subscriptionId || sub.status!=='active' || (typeof sub.latest_invoice === 'object' && sub.latest_invoice?.status !== 'paid')) throw new Error('Stripe subscription not paid')
  return sub
}
async function proofValid(proof: Row): Promise<boolean> {
  try {
    if(typeof proof.publicKeyPem!=='string'||proof.publicKeyPem.length>4000||typeof proof.deploymentId!=='string'||proof.deploymentId!==deploymentIdForPublicKey(proof.publicKeyPem))return false
    if(typeof proof.nonce!=='string'||!/^[a-zA-Z0-9_-]{32}$/.test(proof.nonce))return false
    const age=Date.now()-Date.parse(proof.issuedAt)
    if(!Number.isFinite(age)||age<0||age>300000)return false
    if(!['commercial','government'].includes(proof.profile))return false
    const bytes=Uint8Array.from(atob(proof.signature),c=>c.charCodeAt(0))
    const pem=proof.publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g,'')
    const key=await crypto.subtle.importKey('spki',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'ECDSA',namedCurve:'P-256'},false,['verify'])
    // Node signs DER-encoded ECDSA; WebCrypto expects raw r||s.
    const raw=derToRaw(bytes)
    return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,raw,new TextEncoder().encode(JSON.stringify([proof.deploymentId,proof.publicKeyPem,proof.profile,proof.nonce,proof.issuedAt])))
  } catch{return false}
}
function derToRaw(der: Uint8Array): Uint8Array {
  if(der[0]!==0x30||der[1]!==der.length-2) throw Error('Invalid signature')
  let i=2
  const ints:Uint8Array[]=[]
  for(let j=0;j<2;j++){if(der[i++]!==2)throw Error('Invalid integer');const len=der[i++];const n=der.slice(i,i+len);i+=len;if(!n.length||n.length>33)throw Error('Invalid length');const v=n[0]===0?n.slice(1):n;if(v.length>32)throw Error('Invalid scalar');const out=new Uint8Array(32);out.set(v,32-v.length);ints.push(out)}
  if(i!==der.length)throw Error('Invalid DER trailing data')
  const result=new Uint8Array(64);result.set(ints[0],0);result.set(ints[1],32);return result
}
app.post('/api/direct/enrollment-tokens',async c=>{
  const oid=await admin(c.req.raw,c.env,c.executionCtx)
  if(!oid)return c.json({error:'admin_required'},401)
  const input=await c.req.json().catch(()=>({})) as Row
  if(typeof input.entitlementId!=='string'||typeof input.stripeSubscriptionId!=='string')return c.json({error:'invalid_request'},400)
  const db=getDb(c.env)
  const entitlement=first<Row>(await db.execute({sql:"SELECT * FROM entitlements WHERE id=? AND status='active'",args:[input.entitlementId]}))
  if(!entitlement)return c.json({error:'entitlement_not_active'},409)
  let subscription:Row
  try{subscription=await paidSubscription(c.env,input.stripeSubscriptionId)}catch{return c.json({error:'stripe_subscription_not_active'},409)}
  if(subscription.metadata?.organization_id!==entitlement.customer_organization_id||subscription.metadata?.entitlement_id!==entitlement.id)return c.json({error:'stripe_ownership_mismatch'},409)
  const token='pen_'+randomBytes(32).toString('base64url')
  await db.execute({sql:"INSERT INTO direct_enrollment_tokens(token_hash,entitlement_id,stripe_subscription_id,expires_at,created_by_oid,created_at) VALUES(?,?,?,?,?,?)",args:[sha(token),entitlement.id,subscription.id,new Date(Date.now()+30*60_000).toISOString(),oid,now()]})
  return c.json({enrollmentToken:token,expiresAt:new Date(Date.now()+30*60_000).toISOString()},201)
})
app.post('/api/direct/enroll',async c=>{
  const token=c.req.header('authorization')?.replace(/^Bearer /,'')
  if(!token||!/^pen_[A-Za-z0-9_-]{43}$/.test(token))return c.json({error:'invalid_enrollment'},401)
  const input=await c.req.json().catch(()=>({})) as Row
  const proof=input.proof as Row
  if(!proof||!await proofValid(proof))return c.json({error:'invalid_deployment_proof'},403)
  const db=getDb(c.env)
  const grant=first<Row>(await db.execute({sql:"SELECT t.*,e.customer_organization_id,e.feature_set_json,e.allowed_profiles_json,e.valid_until,e.status AS entitlement_status,o.legal_name FROM direct_enrollment_tokens t JOIN entitlements e ON e.id=t.entitlement_id JOIN organizations o ON o.id=e.customer_organization_id WHERE t.token_hash=?",args:[sha(token)]}))
  if(!grant||grant.expires_at<now()||grant.entitlement_status!=='active'||(grant.deployment_id&&grant.deployment_id!==proof.deploymentId))return c.json({error:'enrollment_unavailable'},409)
  if(!parseJsonArray(grant.allowed_profiles_json).includes(proof.profile))return c.json({error:'profile_not_entitled'},403)
  let subscription:Row
  try{subscription=await paidSubscription(c.env,grant.stripe_subscription_id)}catch{return c.json({error:'subscription_inactive'},402)}
  if(subscription.metadata?.organization_id!==grant.customer_organization_id||subscription.metadata?.entitlement_id!==grant.entitlement_id)return c.json({error:'subscription_ownership_mismatch'},403)
  const prior=first<Row>(await db.execute({sql:"SELECT * FROM deployments WHERE papyrus_deployment_id=?",args:[proof.deploymentId]}))
  if(prior&&(prior.entitlement_id!==grant.entitlement_id||prior.activation_public_key_pem!==proof.publicKeyPem))return c.json({error:'deployment_bound_to_other_customer'},409)
  const installationId=prior?.id??'dep_'+crypto.randomUUID()
  if(!prior){
    const used=first<Row>(await db.execute({sql:"SELECT COUNT(*) AS n FROM deployments WHERE entitlement_id=? AND status!='retired'",args:[grant.entitlement_id]}))
    const entitlement=first<Row>(await db.execute({sql:"SELECT deployment_limit FROM entitlements WHERE id=?",args:[grant.entitlement_id]}))
    if(Number(used?.n)>=Number(entitlement?.deployment_limit))return c.json({error:'deployment_limit_reached'},409)
  }
  const timestamp=now()
  const payload:LicensePayload={licenseId:'lic_'+crypto.randomUUID(),licensee:grant.legal_name,deploymentId:proof.deploymentId,profiles:[proof.profile],features:parseJsonArray(grant.feature_set_json),issuedAt:timestamp,expiresAt:new Date(Math.min(Date.now()+86400000,grant.valid_until?Date.parse(grant.valid_until):Infinity)).toISOString()}
  let signed
  try{signed=await signLicenseWithAzureKeyVault(c.env,payload)}catch{return c.json({error:'signer_unavailable'},503)}
  const issuanceId='lsi_'+crypto.randomUUID()
  try{
    await db.batch([
      {sql:"INSERT INTO deployments(id,entitlement_id,customer_organization_id,deployment_name,papyrus_deployment_id,deployment_profile,activation_public_key_pem,status,registered_by_oid,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(papyrus_deployment_id) DO NOTHING",args:[installationId,grant.entitlement_id,grant.customer_organization_id,'Direct '+proof.deploymentId.slice(0,12),proof.deploymentId,proof.profile,proof.publicKeyPem,'registered',grant.created_by_oid,timestamp,timestamp]},
      {sql:"UPDATE direct_enrollment_tokens SET deployment_id=?,claimed_at=COALESCE(claimed_at,?) WHERE token_hash=? AND (deployment_id IS NULL OR deployment_id=?)",args:[proof.deploymentId,timestamp,sha(token),proof.deploymentId]},
      {sql:"INSERT INTO license_issuances(id,license_id,deployment_id,entitlement_id,key_id,payload_json,signed_document_json,payload_sha256,status,issued_by_oid,issued_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",args:[issuanceId,payload.licenseId,installationId,grant.entitlement_id,signed.keyId,JSON.stringify(payload),JSON.stringify(signed),payloadSha256(payload),'issued',grant.created_by_oid,timestamp,payload.expiresAt]},
    ],'write')
  }catch{return c.json({error:'enrollment_conflict'},409)}
  return c.json({license:signed,installationId})
})
export default app
