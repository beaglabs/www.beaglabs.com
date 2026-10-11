import { Hono } from 'hono'
import { createHash, randomBytes } from 'node:crypto'
import { first, getDb, parseJsonArray } from './db'
import { deploymentIdForPublicKey } from './license'
import provisionApp from './provision'
import type { Bindings } from './env'

type Row = Record<string, any>
const app = new Hono<{ Bindings: Bindings }>()
const hash=(s:string)=>createHash('sha256').update(s).digest('hex')
const code=()=>randomBytes(32).toString('base64url')
const now=()=>new Date().toISOString()
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'cache-control':'no-store'}})
const originAllowed=(req:Request)=>{const h=req.headers.get('origin');return h===new URL(req.url).origin}
async function subscription(env:Bindings,id:string):Promise<Row|null>{
  if(!env.STRIPE_SECRET_KEY||!/^sub_[A-Za-z0-9]+$/.test(id))return null
  const res=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(id)+'?expand[]=latest_invoice',{headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY},signal:AbortSignal.timeout(10000)})
  if(!res.ok)return null
  const sub=await res.json() as Row
  return sub.id===id&&sub.status==='active'&&(!sub.latest_invoice||typeof sub.latest_invoice!=='object'||sub.latest_invoice.status==='paid')?sub:null
}
async function subscriptionsForOrganization(env:Bindings,organizationId:string):Promise<Row[]>{
  if(!env.STRIPE_SECRET_KEY)return []
  const query="metadata['organization_id']:'"+organizationId.replace(/'/g,'')+"'"
  const res=await fetch('https://api.stripe.com/v1/subscriptions/search?'+new URLSearchParams({query,limit:'100'}),{headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY},signal:AbortSignal.timeout(12000)})
  if(!res.ok)throw Error('Stripe subscriptions unavailable')
  const result=await res.json() as {data?:Row[]}
  return (result.data??[]).filter(s=>s.status==='active')
}
async function owner(request:Request,env:Bindings,ctx:any):Promise<Row|null>{
  const url=new URL('/api/provision/private/me',request.url)
  const response=await provisionApp.fetch(new Request(url,{headers:request.headers}),env,ctx)
  if(!response.ok)return null
  const profile=await response.json() as Row
  return profile?.user?.oid&&profile?.organization?.id?profile:null
}
async function keyProof(proof:Row):Promise<boolean>{
  try{
    if(!proof||typeof proof.publicKeyPem!=='string'||proof.publicKeyPem.length>4000||deploymentIdForPublicKey(proof.publicKeyPem)!==proof.deploymentId)return false
    if(!['commercial','government'].includes(proof.profile)||typeof proof.nonce!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(proof.nonce))return false
    const diff=Date.now()-Date.parse(proof.issuedAt)
    if(!Number.isFinite(diff)||diff<0||diff>300000)return false
    const pem=proof.publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g,'')
    const key=await crypto.subtle.importKey('spki',Uint8Array.from(atob(pem),x=>x.charCodeAt(0)),{name:'ECDSA',namedCurve:'P-256'},false,['verify'])
    const der=Uint8Array.from(atob(proof.signature),x=>x.charCodeAt(0))
    if(der[0]!==48||der[1]!==der.length-2)return false
    let p=2;const raw=new Uint8Array(64)
    for(let n=0;n<2;n++){if(der[p++]!==2)return false;const len=der[p++];if(!len||len>33)return false;const b=der.slice(p,p+len);p+=len;const t=b[0]===0?b.slice(1):b;if(t.length>32)return false;raw.set(t,n*32+32-t.length)}
    if(p!==der.length)return false
    return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,raw,new TextEncoder().encode(JSON.stringify([proof.deploymentId,proof.publicKeyPem,proof.profile,proof.nonce,proof.issuedAt])))
  }catch{return false}
}
app.post('/api/direct/device/start',async c=>{
  const input=await c.req.json().catch(()=>({})) as Row
  const proof=input.proof
  if(!await keyProof(proof))return fail('invalid_deployment_proof',403)
  const secret=code(),userCode=randomBytes(5).toString('hex').toUpperCase(),ts=now(),expires=new Date(Date.now()+600000).toISOString()
  const db=getDb(c.env)
  await db.execute({sql:'INSERT INTO direct_device_authorizations(device_code_hash,user_code_hash,deployment_id,public_key_pem,deployment_profile,created_at,expires_at,poll_after) VALUES(?,?,?,?,?,?,?,?)',args:[hash(secret),hash(userCode),proof.deploymentId,proof.publicKeyPem,proof.profile,ts,expires,ts]})
  return c.json({device_code:secret,user_code:userCode,verification_uri:new URL('/activate',c.env.BASE_URL).toString(),expires_in:600,interval:5},{status:201,headers:{'cache-control':'no-store'}})
})
app.post('/api/direct/device/poll',async c=>{
  const {device_code}=await c.req.json().catch(()=>({})) as Row
  if(typeof device_code!=='string'||device_code.length<32)return fail('invalid_device_code',401)
  const db=getDb(c.env),key=hash(device_code)
  const state=first<Row>(await db.execute({sql:'SELECT * FROM direct_device_authorizations WHERE device_code_hash=?',args:[key]}))
  if(!state)return fail('invalid_device_code',401)
  if(state.expires_at<now())return fail('expired_token',400)
  if(state.status==='denied')return fail('access_denied',403)
  if(state.status==='approved'){
    const dep=first<Row>(await db.execute({sql:'SELECT id,status FROM deployments WHERE papyrus_deployment_id=? AND entitlement_id=?',args:[state.deployment_id,state.entitlement_id]}))
    if(!dep||dep.status==='suspended'||dep.status==='retired')return fail('authorization_revoked',403)
    return c.json({status:'approved',deployment_id:state.deployment_id,installation_id:dep.id,organization_id:state.organization_id,entitlement_id:state.entitlement_id},{headers:{'cache-control':'no-store'}})
  }
  if(state.poll_after>now()){
    const seconds=Math.min(30,Number(state.poll_interval_seconds)+5)
    await db.execute({sql:"UPDATE direct_device_authorizations SET poll_interval_seconds=?,poll_after=? WHERE device_code_hash=? AND status='pending'",args:[seconds,new Date(Date.now()+seconds*1000).toISOString(),key]})
    return c.json({error:'slow_down',interval:seconds},400)
  }
  await db.execute({sql:"UPDATE direct_device_authorizations SET poll_after=? WHERE device_code_hash=? AND status='pending'",args:[new Date(Date.now()+Number(state.poll_interval_seconds)*1000).toISOString(),key]})
  return c.json({error:'authorization_pending',interval:Number(state.poll_interval_seconds)},400)
})
app.get('/api/direct/device/options',async c=>{
  const identity=await owner(c.req.raw,c.env,c.executionCtx)
  if(!identity)return fail('entra_organization_auth_required',401)
  const entitlements=(await getDb(c.env).execute({sql:"SELECT id,allowed_profiles_json FROM entitlements WHERE customer_organization_id=? AND status='active'",args:[identity.organization.id]})).rows
  let subs:Row[]
  try{subs=await subscriptionsForOrganization(c.env,identity.organization.id)}catch{return fail('stripe_unavailable',503)}
  const items=entitlements.flatMap(e=>subs.filter(s=>s.metadata?.entitlement_id===e.id).map(s=>({entitlement_id:e.id,subscription_id:s.id,profiles:parseJsonArray(e.allowed_profiles_json)})))
  return c.json({organization:{id:identity.organization.id,name:identity.organization.display_name??identity.organization.legal_name},items},{headers:{'cache-control':'no-store'}})
})
app.post('/api/direct/device/approve',async c=>{
  if(!originAllowed(c.req.raw))return fail('origin_required',403)
  const identity=await owner(c.req.raw,c.env,c.executionCtx)
  if(!identity)return fail('entra_organization_auth_required',401)
  const input=await c.req.json().catch(()=>({})) as Row
  const userCode=typeof input.user_code==='string'?input.user_code.replace(/[-\s]/g,'').toUpperCase():''
  if(!/^[A-F0-9]{10}$/.test(userCode)||typeof input.entitlement_id!=='string')return fail('invalid_request')
  const db=getDb(c.env),key=hash(userCode)
  const pending=first<Row>(await db.execute({sql:"SELECT * FROM direct_device_authorizations WHERE user_code_hash=? AND status='pending' AND expires_at>?",args:[key,now()]}))
  if(!pending)return fail('device_code_expired_or_used',409)
  if(identity.environment!==pending.deployment_profile)return fail('environment_mismatch',403)
  const entitlement=first<Row>(await db.execute({sql:"SELECT * FROM entitlements WHERE id=? AND customer_organization_id=? AND status='active'",args:[input.entitlement_id,identity.organization.id]}))
  if(!entitlement||!parseJsonArray(entitlement.allowed_profiles_json).includes(pending.deployment_profile))return fail('not_entitled',403)
  let candidate:Row[]
  try{candidate=await subscriptionsForOrganization(c.env,identity.organization.id)}catch{return fail('stripe_unavailable',503)}
  const chosen=candidate.find(s=>s.metadata?.entitlement_id===entitlement.id)
  if(!chosen)return fail('subscription_not_found',402)
  const sub=await subscription(c.env,chosen.id)
  if(!sub)return fail('subscription_not_paid',402)
  if(sub.metadata?.organization_id!==identity.organization.id||sub.metadata?.entitlement_id!==entitlement.id)return fail('subscription_ownership_mismatch',403)
  const existing=first<Row>(await db.execute({sql:'SELECT * FROM deployments WHERE papyrus_deployment_id=?',args:[pending.deployment_id]}))
  if(existing&&(existing.customer_organization_id!==identity.organization.id||existing.activation_public_key_pem!==pending.public_key_pem))return fail('deployment_already_bound',409)
  if(!existing){
    const count=first<Row>(await db.execute({sql:"SELECT COUNT(*) AS n FROM deployments WHERE entitlement_id=? AND status!='retired'",args:[entitlement.id]}))
    if(Number(count?.n)>=Number(entitlement.deployment_limit))return fail('deployment_limit_reached',409)
  }
  const installationId=existing?.id??'dep_'+crypto.randomUUID(),ts=now()
  // Transactional compare-and-set protects the one-time user code. A new
  // installation is persisted in the same transaction as its approval.
  try{
    await db.batch([
      {sql:"UPDATE direct_device_authorizations SET status='approved',organization_id=?,entitlement_id=?,stripe_subscription_id=?,approved_by_oid=?,approved_at=? WHERE user_code_hash=? AND status='pending' AND expires_at>?",args:[identity.organization.id,entitlement.id,sub.id,identity.user.oid,ts,key,ts]},
      {sql:"INSERT INTO deployments(id,entitlement_id,customer_organization_id,deployment_name,papyrus_deployment_id,deployment_profile,activation_public_key_pem,status,registered_by_oid,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT status FROM direct_device_authorizations WHERE user_code_hash=?)='approved' ON CONFLICT(papyrus_deployment_id) DO NOTHING",args:[installationId,entitlement.id,identity.organization.id,'Direct '+pending.deployment_id.slice(0,12),pending.deployment_id,pending.deployment_profile,pending.public_key_pem,'registered',identity.user.oid,ts,ts,key]},
    ],'write')
  }catch{return fail('approval_conflict',409)}
  return c.json({approved:true,installation_id:installationId})
})
app.get('/activate',c=>c.html(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Activate Papyrus</title></head><body style="font:16px system-ui;max-width:560px;margin:4rem auto;padding:1rem"><h1>Activate Papyrus</h1><p>Sign in through the Beag Labs provisioning portal, then approve the device code displayed by Papyrus.</p><a href="/provision/commercial">Sign in with Microsoft Entra</a><p>Return here after signing in.</p><form id="activate"><label>Device code <input name="user_code" required maxlength="12" autocomplete="off"></label><p><label>Subscription <select id="entitlements" name="entitlement_id" required><option value="">Loading...</option></select></label></p><button>Approve installation</button></form><pre id="result" role="status"></pre><script>fetch('/api/direct/device/options',{credentials:'same-origin'}).then(r=>r.json()).then(data=>{const el=document.getElementById('entitlements');el.textContent='';for(const item of data.items||[]){const option=document.createElement('option');option.value=item.entitlement_id;option.textContent='Papyrus subscription '+item.subscription_id;el.append(option)}if(!el.options.length){const option=document.createElement('option');option.textContent='Sign in with Entra and verify a subscription';el.append(option)}}).catch(()=>{});document.getElementById('activate').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const response=await fetch('/api/direct/device/approve',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(data)});document.getElementById('result').textContent=JSON.stringify(await response.json(),null,2)}</script></body></html>`))
export default app
