import { Hono } from 'hono'
import { createHash } from 'node:crypto'
import { first, getDb } from './db'
import type { Bindings } from './env'

type Row = Record<string,any>
const app=new Hono<{Bindings:Bindings}>()
function sha(s:string){return createHash('sha256').update(s).digest('hex')}
function b64(s:string){return Uint8Array.from(atob(s),x=>x.charCodeAt(0))}
function derToRaw(der:Uint8Array):Uint8Array{
  if(der[0]!==48||der[1]!==der.length-2)throw Error('bad signature')
  let pos=2;const out=new Uint8Array(64)
  for(let k=0;k<2;k++){if(der[pos++]!==2)throw Error('bad integer');const n=der[pos++];const b=der.slice(pos,pos+n);pos+=n;if(!n||n>33)throw Error('bad size');const v=b[0]===0?b.slice(1):b;if(v.length>32)throw Error('bad scalar');out.set(v,k*32+32-v.length)}
  if(pos!==der.length)throw Error('bad trailing bytes')
  return out
}
async function verifyProof(publicKeyPem:string,data:string,signature:string){
  try{
    const pem=publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g,'')
    const key=await crypto.subtle.importKey('spki',b64(pem),{name:'ECDSA',namedCurve:'P-256'},false,['verify'])
    return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,derToRaw(b64(signature)),new TextEncoder().encode(data))
  }catch{return false}
}
async function stripeFetch(env:Bindings,path:string,body:URLSearchParams,identifier:string):Promise<Response>{
  if(!env.STRIPE_SECRET_KEY)throw Error('Stripe secret missing')
  return fetch('https://api.stripe.com/v1/'+path,{
    method:'POST',headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY,'content-type':'application/x-www-form-urlencoded','idempotency-key':identifier},
    body,signal:AbortSignal.timeout(15000)
  })
}
app.post('/api/direct/usage',async c=>{
  const input=await c.req.json().catch(()=>({})) as Row
  const deploymentId=input.deploymentId
  const intervals=input.intervals
  if(typeof deploymentId!=='string'||!Array.isArray(intervals)||intervals.length<1||intervals.length>100||typeof input.signature!=='string')return c.json({error:'invalid_usage_batch'},400)
  const db=getDb(c.env)
  const deployment=first<Row>(await db.execute({sql:"SELECT d.*,e.status AS entitlement_status,e.valid_until FROM deployments d JOIN entitlements e ON e.id=d.entitlement_id WHERE d.papyrus_deployment_id=?",args:[deploymentId]}))
  if(!deployment||deployment.status==='retired'||deployment.status==='suspended'||deployment.entitlement_status!=='active'||!deployment.activation_public_key_pem)return c.json({error:'deployment_not_active'},403)
  const nonce=input.nonce
  const signedAt=input.signedAt
  if(typeof nonce!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(nonce)||typeof signedAt!=='string'||Math.abs(Date.now()-Date.parse(signedAt))>300000)return c.json({error:'invalid_usage_proof'},403)
  const signedData=JSON.stringify([deploymentId,nonce,signedAt,intervals])
  if(!await verifyProof(deployment.activation_public_key_pem,signedData,input.signature))return c.json({error:'invalid_signature'},403)
  if(!c.env.STRIPE_METER_EVENT_NAME||!c.env.STRIPE_SECRET_KEY)return c.json({error:'billing_not_configured'},503)
  const accepted:number[]=[]
  for(const item of intervals as Row[]){
    const seq=item.sequence,started=Date.parse(item.startedAt),ended=Date.parse(item.endedAt),mc=item.licensedMilliCpus
    if(!Number.isSafeInteger(seq)||seq<1||!Number.isSafeInteger(mc)||mc<1||mc>1024000||!Number.isFinite(started)||!Number.isFinite(ended)||ended<=started||ended-started>3600000||ended>Date.now()+60000||Date.now()-ended>36*3600000)return c.json({error:'invalid_usage_interval'},400)
    if(item.deploymentId!==deploymentId||item.cpuMilliseconds!==(ended-started)*mc)return c.json({error:'usage_quantity_mismatch'},400)
    if(deployment.valid_until&&ended>Date.parse(deployment.valid_until))return c.json({error:'entitlement_expired'},403)
    const stripeSubId = first<Row>(await db.execute({sql:"SELECT stripe_subscription_id FROM direct_enrollment_tokens WHERE deployment_id=? ORDER BY claimed_at DESC LIMIT 1",args:[deploymentId]}))?.stripe_subscription_id
    if(!stripeSubId)return c.json({error:'subscription_not_bound'},409)
    const subscriptionRes=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(stripeSubId),{headers:{authorization:'Bearer '+c.env.STRIPE_SECRET_KEY},signal:AbortSignal.timeout(10000)})
    if(!subscriptionRes.ok)return c.json({error:'stripe_unavailable'},503)
    const sub=await subscriptionRes.json() as Row
    if(!['active','trialing'].includes(sub.status)||sub.metadata?.organization_id!==deployment.customer_organization_id||sub.metadata?.entitlement_id!==deployment.entitlement_id)return c.json({error:'subscription_not_active'},402)
    const itemId=sub.items?.data?.find((entry:Row)=>entry.price?.recurring?.usage_type==='metered')?.id
    if(!itemId)return c.json({error:'metered_subscription_item_missing'},409)
    const identifier='papyrus_'+sha(deploymentId+':'+seq)
    const found=first<Row>(await db.execute({sql:"SELECT * FROM direct_deployment_usage WHERE deployment_id=? AND sequence=?",args:[deployment.id,seq]}))
    if(found&&(found.started_at!==item.startedAt||found.ended_at!==item.endedAt||Number(found.milli_cpus)!==mc))return c.json({error:'sequence_conflict'},409)
    if(!found)await db.execute({sql:"INSERT INTO direct_deployment_usage(deployment_id,sequence,started_at,ended_at,milli_cpus,cpu_milliseconds,event_identifier,stripe_subscription_item_id) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(deployment_id,sequence) DO NOTHING",args:[deployment.id,seq,item.startedAt,item.endedAt,mc,item.cpuMilliseconds,identifier,itemId]})
    const state=first<Row>(await db.execute({sql:"SELECT * FROM direct_deployment_usage WHERE deployment_id=? AND sequence=?",args:[deployment.id,seq]}))
    if(state?.state==='submitted'){accepted.push(seq);continue}
    // Bill integral millicpu-seconds. Stripe rate must price 3,600,000 units
    // as one vCPU-hour. Never round each interval upward.
    const units=Math.floor(item.cpuMilliseconds/1000)
    if(units<1)return c.json({error:'interval_too_small'},400)
    const params=new URLSearchParams({event_name:c.env.STRIPE_METER_EVENT_NAME,identifier,payload:JSON.stringify({stripe_customer_id:sub.customer,value:String(units)}),timestamp:String(Math.floor(ended/1000))})
    const result=await stripeFetch(c.env,'billing/meter_events',params,identifier)
    if(!result.ok)return c.json({error:'stripe_meter_submission_failed',retryable:true},503)
    await db.execute({sql:"UPDATE direct_deployment_usage SET state='submitted',submitted_at=? WHERE deployment_id=? AND sequence=? AND state='pending'",args:[new Date().toISOString(),deployment.id,seq]})
    accepted.push(seq)
  }
  return c.json({acknowledged:accepted})
})
// Stripe webhook signature verification follows Stripe's timestamp.payload HMAC
app.post('/api/direct/stripe/webhook',async c=>{
  if(!c.env.STRIPE_WEBHOOK_SECRET)return c.json({error:'webhook_not_configured'},503)
  const raw=await c.req.text()
  const hdr=c.req.header('stripe-signature')??''
  const t=/\bt=(\d+)\b/.exec(hdr)?.[1]
  const signatures=[...hdr.matchAll(/\bv1=([a-f0-9]{64})\b/g)].map(x=>x[1])
  if(!t||Math.abs(Date.now()/1000-Number(t))>300||!signatures.length)return c.json({error:'signature_invalid'},400)
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(c.env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const mac=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+raw))).toString('hex')
  if(!signatures.some(s=>s===mac))return c.json({error:'signature_invalid'},400)
  const event=JSON.parse(raw) as Row
  if(typeof event.id!=='string'||typeof event.type!=='string')return c.json({error:'bad_event'},400)
  await getDb(c.env).execute({sql:'INSERT INTO direct_stripe_events(event_id,event_type,received_at) VALUES(?,?,?) ON CONFLICT(event_id) DO NOTHING',args:[event.id,event.type,new Date().toISOString()]})
  // Subscription authority is checked live with Stripe at enrollment and metering.
  // Webhook is auditable signal only: never grant a license from webhook payload.
  return c.json({received:true})
})
export default app
