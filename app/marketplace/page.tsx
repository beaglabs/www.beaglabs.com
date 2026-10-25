'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { marketplaceAuth } from '@/lib/marketplace-auth'
import { SiteFooter } from '@/components/site-footer'
import { ConversationWorkspace } from '@/components/marketplace/conversation-workspace'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { unzipSync, strFromU8 } from 'fflate'
import { ArrowRight, ChevronDown, Copy, Download, Fingerprint, KeyRound, MessageSquare, Package, Plus, RefreshCw, Shield, UploadCloud } from 'lucide-react'

const API = 'https://api.beaglabs.com'
type Publisher = { id:string; slug:string; display_name:string; type:'company'|'individual'; status:string; verified_at:number|null; role:string;has_logo?:number;logo_updated_at?:number }
type StripeState = {status:string; configured?:boolean; stale?:boolean; detailsSubmitted?:boolean; payoutsEnabled?:boolean; requirementsDue?:string[]}
type Artifact = {id:string;slug:string;name:string;type:'mcpb'|'skill';description:string;created_at:number;version_id:string|null;version:string|null;version_status:string|null;sha256:string|null;image_url?:string|null;has_image?:number;image_updated_at?:number|null;billing_model?:'free'|'one_time'|'monthly'|'annual'|null;amount_cents?:number|null;currency?:string|null}
type Version = {id:string;version:string;sha256:string;status:string;created_at:number}
type ReleaseEvidence = {version?:string;sha256?:string;scan?:{outcome?:string;file_count?:number;findings?:Array<{rule?:string;severity?:string;path?:string;detail?:string}>};sigstoreBundle?:unknown}
type ApiKey = {id:string;name:string;key_prefix:string;created_at:number;last_used_at:number|null;revoked_at:number|null}
type Conversation = {id:string;publisher_id:string;subject:string;created_at:number}
type Message = {id:string;body:string;sender_user_id:string;created_at:number}
type Section = 'publisher'|'artifacts'|'publish'|'credentials'|'messages'
const sections:{id:Section;label:string}[] = [
  {id:'publisher',label:'Publisher'}, {id:'artifacts',label:'Artifacts'}, {id:'publish',label:'Publish version'},
  {id:'credentials',label:'API keys'}, {id:'messages',label:'Messages'}
]
const input = 'w-full border-2 border-[#111] bg-white px-3 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_#f3aa82]'
const btn = 'border-2 border-[#111] px-3 py-2 text-xs font-black uppercase transition-colors hover:bg-[#ffe6d6] disabled:cursor-not-allowed disabled:opacity-40'
const fmt = (n:number|null|undefined) => n?new Date(n*1000).toLocaleString():'Never'
const status = (s:string) => s.replaceAll('_',' ')
const releaseText = (s:string) => ({submitted:'Queued for automated scan',scanning:'Scanning and signing',review:'Security review pending · not public',published:'PASS · Public listing',rejected:'FAIL · Publication blocked',suspended:'Suspended · Hidden'} as Record<string,string>)[s]||status(s)
const stripeText = (s?:StripeState) => !s?'Checking':s.stale?'Temporarily unavailable':s.status==='complete'?'Payout setup complete (sandbox)':status(s.status)
async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  const r=await fetch(API+path,{credentials:'include',cache:'no-store',...init,headers:{...(init.body?{'content-type':'application/json'}:{}),...init.headers}})
  const value=await r.json().catch(()=>({}))
  if(!r.ok)throw Error(value.error||'Request failed ('+r.status+')')
  return value as T
}
const post=<T,>(path:string,body:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(body)})
const put=<T,>(path:string,body:unknown)=>api<T>(path,{method:'PUT',body:JSON.stringify(body)})
async function imagePayload(file:File){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<50||file.size>700000)throw Error('Choose a PNG, JPEG, or WebP image between 50 bytes and 700 KB.')
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=()=>reject(Error('Cannot read the image'));reader.readAsDataURL(file)})
  return {source:'upload' as const,mimeType:file.type,data}
}
function ArtifactMark({artifact}:{artifact:Artifact}){
  const src=artifact.has_image?`${API}/v1/public/artifacts/${encodeURIComponent(artifact.id)}/image?v=${artifact.image_updated_at||0}`:artifact.image_url||''
  const [failed,setFailed]=useState(false)
  useEffect(()=>setFailed(false),[src])
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border-2 border-[#111] bg-[#fff2e8]">{src&&!failed?<img src={src} alt="" className="h-full w-full object-contain" onError={()=>setFailed(true)}/>:<Package size={23} aria-hidden="true" className="text-[#ab542c]"/>}</span>
}

export default function PublisherWorkspace(){
  const {data:session,isPending}=marketplaceAuth.useSession()
  const [email,setEmail]=useState(''),[password,setPassword]=useState('')
  const [section,setSection]=useState<Section>('publisher')
  const [publishers,setPublishers]=useState<Publisher[]>([])
  const [publisherId,setPublisherId]=useState('')
  const [stripe,setStripe]=useState<Record<string,StripeState>>({})
  const [artifacts,setArtifacts]=useState<Artifact[]>([])
  const [keys,setKeys]=useState<ApiKey[]>([])
  const [conversations,setConversations]=useState<Conversation[]>([])
  const [conversationId,setConversationId]=useState('')
  const [messages,setMessages]=useState<Message[]>([])
  const [messageLoading,setMessageLoading]=useState(false)
  const messageRequest=useRef(0)
  const [versions,setVersions]=useState<Version[]>([])
  const [selectedArtifact,setSelectedArtifact]=useState('')
  const [newName,setNewName]=useState(''),[newType,setNewType]=useState<'mcpb'|'skill'>('mcpb'),[newDescription,setNewDescription]=useState('')
  const [keyName,setKeyName]=useState(''),[oneTimeKey,setOneTimeKey]=useState('')
  const [uploadArtifact,setUploadArtifact]=useState(''),[uploadVersion,setUploadVersion]=useState(''),[uploadFile,setUploadFile]=useState<File|null>(null)
  const [reply,setReply]=useState(''),[evidence,setEvidence]=useState<ReleaseEvidence|null>(null),[evidenceId,setEvidenceId]=useState(''),[evidenceOpen,setEvidenceOpen]=useState(false)
  const [createOpen,setCreateOpen]=useState(false)
  const [dropActive,setDropActive]=useState(false)
  const [logoOpen,setLogoOpen]=useState(false),[logoFile,setLogoFile]=useState<File|null>(null),[logoDomain,setLogoDomain]=useState('')
  const [pricingOpen,setPricingOpen]=useState(false),[pricingArtifact,setPricingArtifact]=useState('')
  const [billingModel,setBillingModel]=useState<'free'|'one_time'|'monthly'|'annual'>('free'),[priceUsd,setPriceUsd]=useState('0')
  const [imageOpen,setImageOpen]=useState(false),[imageTarget,setImageTarget]=useState(''),[imageFile,setImageFile]=useState<File|null>(null),[imageUrl,setImageUrl]=useState('')
  const [busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const [isAdmin,setIsAdmin]=useState(false),[lastSync,setLastSync]=useState<Date|null>(null)
  const current=publishers.find(p=>p.id===publisherId)
  const distinctArtifacts=artifacts.filter((a,i,all)=>all.findIndex(x=>x.id===a.id)===i)
  const currentConversation=conversations.find(c=>c.id===conversationId)
  const uploadKind=distinctArtifacts.find(a=>a.id===uploadArtifact)?.type
  const activeVersions=artifacts.some(a=>a.version_status==='submitted'||a.version_status==='scanning'||a.version_status==='review')

  const refresh=useCallback(async()=>{
    if(!session?.user)return
    try{
      const [p,inbox,admin]=await Promise.all([
        api<{items:Publisher[]}>('/v1/me/publishers'),
        api<{items:Conversation[]}>('/v1/conversations').catch(()=>({items:[]})),
        api('/v1/admin/dashboard').then(()=>true).catch(()=>false)
      ])
      setPublishers(p.items||[]);setConversations(inbox.items||[]);setIsAdmin(admin)
      setPublisherId(old=>p.items.some(x=>x.id===old)?old:p.items[0]?.id||'')
      setLastSync(new Date());setError('')
    }catch(e){setError(e instanceof Error?e.message:'Could not load publisher data')}
    finally{setLoaded(true)}
  },[session?.user])
  const refreshPublisher=useCallback(async()=>{
    if(!publisherId)return
    try{
      const [a,k,s]=await Promise.all([
        api<{items:Artifact[]}>(`/v1/publishers/${encodeURIComponent(publisherId)}/artifacts`),
        api<{items:ApiKey[]}>(`/v1/publishers/${encodeURIComponent(publisherId)}/api-keys`),
        api<StripeState>(`/v1/onboarding/publishers/${encodeURIComponent(publisherId)}/connect`).catch(()=>({status:'unavailable',stale:true}))
      ])
      setArtifacts(a.items||[]);setKeys(k.items||[]);setStripe(old=>({...old,[publisherId]:s}))
    }catch(e){setError(e instanceof Error?e.message:'Could not load publisher resources')}
  },[publisherId])
  useEffect(()=>{if(session?.user)void refresh()},[session?.user,refresh])
  useEffect(()=>{if(publisherId)void refreshPublisher()},[publisherId,refreshPublisher])
  useEffect(()=>{
    if(!session?.user)return
    const id=window.setInterval(()=>{if(document.visibilityState==='visible'){void refresh();void refreshPublisher()}},30000)
    return()=>window.clearInterval(id)
  },[session?.user,refresh,refreshPublisher])
  useEffect(()=>{
    if(!publisherId||!activeVersions)return
    const poll=window.setInterval(async()=>{
      if(document.visibilityState!=='visible')return
      try{
        const r=await api<{items:Artifact[]}>(`/v1/publishers/${encodeURIComponent(publisherId)}/artifacts`)
        setArtifacts(r.items||[])
        if(selectedArtifact){const v=await api<{items:Version[]}>(`/v1/artifacts/${encodeURIComponent(selectedArtifact)}/versions`);setVersions(v.items||[])}
      }catch{/* keep last visible state; manual refresh remains available */}
    },5000)
    return()=>window.clearInterval(poll)
  },[publisherId,activeVersions,selectedArtifact])
  async function mutate(fn:()=>Promise<unknown>,message:string){
    setBusy(true);setError('');setNotice('')
    try{await fn();setNotice(message);await refreshPublisher()}
    catch(e){setError(e instanceof Error?e.message:'Action failed')}
    finally{setBusy(false)}
  }
  async function signIn(event:React.FormEvent){
    event.preventDefault()
    await mutate(async()=>{const r=await marketplaceAuth.signIn.email({email,password});if(r.error)throw Error(r.error.message||'Sign-in failed');window.location.reload()},'Signed in')
  }
  async function passkey(){
    await mutate(async()=>{const r=await marketplaceAuth.signIn.passkey();if(r.error)throw Error(r.error.message||'Passkey failed');window.location.reload()},'Signed in')
  }
  async function createArtifact(event:React.FormEvent){
    event.preventDefault()
    await mutate(async()=>{
      const r=await post<{id:string}>('/v1/artifacts',{publisherId,type:newType,name:newName,description:newDescription})
      setNewName('');setNewDescription('');setCreateOpen(false);setUploadArtifact(r.id);setSection('publish')
    },'Artifact created. Upload its first version from the Publish tab.')
  }
  async function savePublisherLogo(event:React.FormEvent){
    event.preventDefault()
    if(!publisherId)return
    await mutate(async()=>{
      let payload:unknown
      if(logoFile)payload={logo:await imagePayload(logoFile)}
      else {
        let hostname=''
        try{const u=new URL(logoDomain);if(!['https:','http:'].includes(u.protocol))throw Error();hostname=u.hostname.toLowerCase().replace(/^www\./,'')}catch{throw Error('Upload a logo or enter a valid website URL for Logo.dev.')}
        payload={logo:{source:'logo_dev',domain:hostname},website:logoDomain}
      }
      await put(`/v1/publishers/${encodeURIComponent(publisherId)}/logo`,payload)
      setLogoOpen(false);setLogoFile(null);setLogoDomain('');await refresh()
    },'Publisher logo updated.')
  }
  async function saveArtifactImage(event:React.FormEvent){
    event.preventDefault()
    if(!imageTarget)return
    await mutate(async()=>{
      const payload=imageFile?{logo:await imagePayload(imageFile)}:{imageUrl:imageUrl.trim()}
      if(!imageFile&&!imageUrl.trim())throw Error('Choose an image or enter an HTTPS image URL.')
      await put(`/v1/artifacts/${encodeURIComponent(imageTarget)}/image`,payload)
      setImageOpen(false);setImageTarget('');setImageFile(null);setImageUrl('')
    },'Artifact image updated.')
  }
  async function savePrice(event:React.FormEvent){
    event.preventDefault()
    const amountCents=billingModel==='free'?0:Math.round(Number(priceUsd)*100)
    if(!Number.isSafeInteger(amountCents)||(billingModel!=='free'&&amountCents<100)){
      setError('Paid prices must be at least $1.00.');return
    }
    await mutate(async()=>{await put(`/v1/artifacts/${encodeURIComponent(pricingArtifact)}/pricing`,
      {billingModel,amountCents,currency:'usd'});setPricingOpen(false)},'Listing price updated.')
  }
  function editPrice(a:Artifact){
    setError('');setPricingArtifact(a.id);setBillingModel(a.billing_model||'free')
    setPriceUsd(((a.amount_cents||0)/100).toFixed(2));setPricingOpen(true)
  }
  async function createKey(event:React.FormEvent){
    event.preventDefault()
    await mutate(async()=>{
      const r=await post<{apiKey:string}>(`/v1/publishers/${encodeURIComponent(publisherId)}/api-keys`,{name:keyName})
      setOneTimeKey(r.apiKey);setUploadKey(r.apiKey);setKeyName('')
    },'API key generated. Copy it now; it cannot be recovered later.')
  }
  async function revokeKey(id:string){
    if(!window.confirm('Revoke this API key? Existing automations using it will stop working.'))return
    await mutate(()=>api(`/v1/publishers/${encodeURIComponent(publisherId)}/api-keys/${encodeURIComponent(id)}`,{method:'DELETE'}),'API key revoked.')
  }
  async function selectUploadFile(file:File|null){
    setUploadFile(null);setUploadVersion('');setError('')
    if(!file)return
    if(file.size>50*1024*1024){setError('Maximum bundle size is 50 MB');return}
    if(!uploadArtifact){setError('Choose an artifact first.');return}
    if(uploadKind==='skill'){
      if(!file.name.toLowerCase().endsWith('.zip')){setError('Agent Skill bundles must be ZIP files.');return}
      setUploadFile(file);return
    }
    if(!file.name.toLowerCase().endsWith('.mcpb')){setError('MCP bundles must be .mcpb files.');return}
    try{
      const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>entry.name==='manifest.json'&&entry.originalSize<256*1024})
      if(!files['manifest.json'])throw Error('The MCPB must contain a root manifest.json.')
      const manifest=JSON.parse(strFromU8(files['manifest.json'])) as {version?:unknown}
      if(typeof manifest.version!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9.+_-]{0,79}$/.test(manifest.version))throw Error('The MCPB manifest has no valid version.')
      setUploadVersion(manifest.version);setUploadFile(file)
    }catch(e){setError(e instanceof Error?e.message:'Cannot read manifest.json from the MCPB bundle')}
  }
  async function upload(event:React.FormEvent){
    event.preventDefault()
    if(!uploadFile||!uploadArtifact||(uploadKind==='mcpb'&&!uploadVersion))return
    await mutate(async()=>{
      const r=await fetch(`${API}/v1/portal/artifacts/${encodeURIComponent(uploadArtifact)}/versions`,{
        method:'POST',credentials:'include',headers:{...(uploadKind==='mcpb'?{'x-artifact-version':uploadVersion}:{}),'content-type':'application/octet-stream'},body:uploadFile
      })
      const result=await r.json().catch(()=>({}))
      if(!r.ok)throw Error(result.error||`Upload failed (${r.status})`)
      setUploadFile(null);setUploadVersion('');setSection('artifacts');await loadVersions(uploadArtifact)
    },'Upload received. Queued for the automatic scanner; the release state will refresh as it progresses.')
  }
  async function loadVersions(id:string){
    setSelectedArtifact(id);setVersions([]);setEvidence(null);setEvidenceId('')
    try{const result=await api<{items:Version[]}>(`/v1/artifacts/${encodeURIComponent(id)}/versions`);setVersions(result.items||[])}
    catch(e){setError(e instanceof Error?e.message:'Unable to load versions')}
  }
  function toggleVersions(id:string){
    if(selectedArtifact===id){setSelectedArtifact('');setVersions([]);setEvidence(null);setEvidenceId('');return}
    void loadVersions(id)
  }
  async function viewEvidence(id:string){
    setEvidence(null);setEvidenceId(id)
    try{setEvidence(await api<ReleaseEvidence>(`/v1/public/releases/${encodeURIComponent(id)}/evidence`));setEvidenceOpen(true)}
    catch(e){setError(e instanceof Error?e.message:'Evidence not available')}
  }
  async function downloadVersion(id:string,kind:'mcpb'|'skill',version:string){
    setBusy(true)
    try{
      const r=await fetch(`${API}/v1/releases/${encodeURIComponent(id)}/download`,{credentials:'include'})
      if(!r.ok)throw Error('Download unavailable ('+r.status+')')
      const blob=await r.blob();const url=URL.createObjectURL(blob)
      const link=document.createElement('a');link.href=url;link.download=`artifact-${version}.${kind==='mcpb'?'mcpb':'zip'}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000)
    }catch(e){setError(e instanceof Error?e.message:'Download failed')}
    finally{setBusy(false)}
  }
  async function connectStripe(){
    await mutate(async()=>{const r=await post<{url:string}>(`/v1/onboarding/publishers/${encodeURIComponent(publisherId)}/connect`,{});window.location.assign(r.url)},'Opening Stripe')
  }
  async function openConversation(id:string){
    const request=++messageRequest.current
    setConversationId(id);setMessages([]);setMessageLoading(true)
    try{const r=await api<{items:Message[]}>(`/v1/conversations/${encodeURIComponent(id)}/messages`);if(request===messageRequest.current)setMessages(r.items||[])}
    catch(e){if(request===messageRequest.current)setError(e instanceof Error?e.message:'Unable to load messages')}
    finally{if(request===messageRequest.current)setMessageLoading(false)}
  }
  useEffect(()=>{
    if(section!=='messages'||!conversationId||!session?.user)return
    const timer=window.setInterval(async()=>{
      if(document.visibilityState!=='visible')return
      const id=conversationId
      try{const r=await api<{items:Message[]}>(`/v1/conversations/${encodeURIComponent(id)}/messages`);if(id===conversationId)setMessages(r.items||[])}catch{/* preserve visible conversation on transient failure */}
    },10000)
    return()=>window.clearInterval(timer)
  },[section,conversationId,session?.user])

  async function sendReply(event:React.FormEvent){
    event.preventDefault()
    await mutate(async()=>{await post(`/v1/conversations/${encodeURIComponent(conversationId)}/messages`,{body:reply});setReply('');const r=await api<{items:Message[]}>(`/v1/conversations/${encodeURIComponent(conversationId)}/messages`);setMessages(r.items||[])},'Message sent.')
  }

  return <><main className="site-page-grid min-h-[calc(100svh-67px)] bg-[#fffaf6] px-4 py-8 text-[#111]">
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-[#111] pb-5">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#b94e20]">Beag Labs / Marketplace</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Publisher workspace<span className="text-[#e96830]">.</span></h1><p className="mt-1 text-sm text-[#555]">Publish, verify, and manage your artifacts.</p></div>
        <div className="flex flex-wrap gap-2">{session?.user&&<><button onClick={()=>void refresh().then(refreshPublisher)} className={`${btn} flex items-center gap-2 bg-white`}><RefreshCw size={14}/> Refresh</button><button onClick={()=>void marketplaceAuth.signOut().then(()=>location.reload())} className={`${btn} bg-white`}>Sign out</button></>}</div>
      </header>
      {isPending?<p>Checking your account…</p>:!session?.user?<div className="grid gap-8 border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0_#111] md:grid-cols-2 md:p-9">
        <div><p className="font-mono text-xs font-black uppercase text-[#a6461d]">Publisher access</p><h2 className="mt-3 text-3xl font-black">Welcome back.</h2><p className="mt-4 max-w-sm text-sm leading-7 text-[#555]">Sign in to manage your artifacts, upload new versions, view evidence, issue publishing keys, and reply to Beag Labs. Your onboarding is saved.</p><p className="mt-6 border-l-4 border-[#e96830] pl-3 text-xs leading-6">First-time setup still uses the local Agent Skill onboarding wizard. Returning publishers sign in here.</p></div>
        <div><form onSubmit={signIn} className="grid gap-3"><label className="text-xs font-black uppercase">Work email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={`${input} mt-2`}/></label><label className="text-xs font-black uppercase">Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className={`${input} mt-2`}/></label><button disabled={busy} className={`${btn} bg-[#ffbd98]`}>Sign in <ArrowRight size={14} className="inline"/></button></form><button disabled={busy} onClick={()=>void passkey()} className={`${btn} mt-3 flex w-full items-center justify-center gap-2 bg-white`}><Fingerprint size={16}/> Sign in with passkey</button></div>
      </div>:!loaded?<p>Loading your workspace…</p>:publishers.length===0?<div className="border-[3px] border-[#111] bg-white p-7"><h2 className="text-xl font-black">No publisher identity found</h2><p className="mt-2 text-sm">Complete the one-time onboarding wizard, then return here to manage your account.</p></div>:<>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><label htmlFor="publisher-choice" className="font-mono text-[11px] font-black uppercase">Active publisher</label><select id="publisher-choice" value={publisherId} onChange={e=>{setPublisherId(e.target.value);setSelectedArtifact('');setOneTimeKey('')}} className={`${input} max-w-sm font-bold`}>{publishers.map(p=><option key={p.id} value={p.id}>{p.display_name}</option>)}</select></div><div className="flex flex-wrap gap-2">{isAdmin&&<a href="/marketplace/admin" className={`${btn} bg-[#ffbd98]`}><Shield size={13} className="mr-1 inline"/> Admin console</a>}<span className="self-center font-mono text-[10px] text-[#666]">Updated {lastSync?.toLocaleTimeString()||'—'}</span></div></div>
        <div className="min-h-[max(650px,calc(100svh-160px))] border-[3px] border-[#111] bg-white shadow-[5px_5px_0_#111]">
          <nav aria-label="Publisher workspace" className="flex shrink-0 flex-wrap border-b-[3px] border-[#111] bg-[#f7f0e8]">{sections.map(s=><button key={s.id} onClick={()=>setSection(s.id)} aria-current={section===s.id?'page':undefined} className={`border-r-2 border-[#111] px-4 py-3 text-xs font-black uppercase hover:bg-[#ffe6d5] ${section===s.id?'bg-[#ffbd98]':''}`}>{s.label}{s.id==='messages'&&conversations.length?` · ${conversations.length}`:''}</button>)}</nav>
          <div className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#111] pb-3"><h2 className="text-2xl font-black">{sections.find(s=>s.id===section)?.label}</h2><span className="font-mono text-[10px] uppercase text-[#777]">{current?.display_name} / {status(current?.status||'')}</span></div>
            {section==='publisher'&&<div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-5 border-2 border-[#111] bg-[#fff7f1] p-5">
                <Dialog open={logoOpen} onOpenChange={setLogoOpen}><DialogTrigger asChild><button type="button" title="Change publisher logo" aria-label="Change publisher logo" className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-2 border-[#111] bg-white text-3xl font-black hover:outline hover:outline-2 hover:outline-[#f17842]">
                  {current?.has_logo?<img src={`${API}/v1/public/publishers/${encodeURIComponent(current.slug)}/logo?v=${current.logo_updated_at||0}`} alt={`${current.display_name} logo`} className="h-full w-full object-contain"/>:<span aria-label="Publisher initials">{(current?.display_name||'?').slice(0,2).toUpperCase()}</span>}
                  <span className="absolute inset-x-0 bottom-0 bg-[#111] py-1 text-center text-[10px] font-black uppercase text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Edit logo</span>
                </button></DialogTrigger><DialogContent className="rounded-none border-[3px] border-[#111] bg-[#fffaf6] shadow-[7px_7px_0_#111] sm:max-w-md"><DialogHeader><DialogTitle className="text-xl font-black">Publisher logo</DialogTitle><DialogDescription>Upload an image or use Logo.dev for your website domain.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={savePublisherLogo}><label className="text-xs font-bold uppercase">Upload PNG, JPEG or WebP<input className={`${input} mt-1`} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setLogoFile(e.target.files?.[0]||null)}/></label><label className="text-xs font-bold uppercase">Website URL (Logo.dev fallback)<input className={`${input} mt-1`} type="url" placeholder="https://beaglabs.com" value={logoDomain} onChange={e=>setLogoDomain(e.target.value)} disabled={!!logoFile}/></label><p className="text-xs text-[#666]">Uploads take priority. Maximum 700 KB. Changes appear across your publisher profile.</p><DialogFooter><DialogClose asChild><button type="button" className={btn}>Cancel</button></DialogClose><button disabled={busy||(!logoFile&&!logoDomain.trim())} className={`${btn} bg-[#ffbd98]`}>Save logo</button></DialogFooter></form></DialogContent></Dialog>
                <div className="min-w-0 flex-1"><h3 className="text-xl font-black">{current?.display_name}</h3><p className="mt-1 font-mono text-xs text-[#666]">/{current?.slug} · {current?.type}</p><p className="mt-2 text-xs">Identity: <strong className="capitalize">{status(current?.status||'unknown')}</strong> · Stripe: <strong>{stripeText(stripe[publisherId])}</strong></p></div>
                <button disabled={busy} onClick={()=>void connectStripe()} className={`${btn} bg-[#ffbd98]`}>Manage Stripe Connect ↗</button>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <dl className="divide-y-2 border-y-2 border-[#111] text-sm">{[['Publisher ID',current?.id],['Publisher type',current?.type],['Public slug',current?.slug],['Member role',current?.role],['Verification',current?.status],['Artifacts',String(distinctArtifacts.length)],['Active API keys',String(keys.filter(k=>!k.revoked_at).length)]].map(([label,value])=><div key={label} className="grid gap-2 py-3 sm:grid-cols-[170px_1fr]"><dt className="font-bold">{label}</dt><dd className="break-all text-[#555]">{value||'—'}</dd></div>)}</dl>
                <aside className="self-start border-l-4 border-[#111] bg-[#f5f0e9] p-4"><h4 className="font-black">Publisher identity</h4><p className="mt-2 text-sm leading-6">Your verified identity, payout account, and public registry attribution are managed here. Artifact publishing and credentials have their own dedicated tabs.</p><a className="mt-4 block text-xs font-bold underline" href={`${API}/v1/public/publishers/${encodeURIComponent(current?.slug||'')}`} target="_blank" rel="noreferrer">View public registry record ↗</a>{!current?.has_logo&&<p className="mt-3 text-xs text-[#76533d]">Existing publisher: logo not yet uploaded. New applications require a logo.</p>}</aside>
              </div>
              {current?.status!=='approved'&&<p className="border-l-4 border-[#e96830] pl-4 text-sm">Publishing becomes available when Beag Labs approves the application.</p>}
            </div>}
            {section==='artifacts'&&<>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Artifact inventory</h3>
                  <p className="mt-1 text-xs text-[#666]">{distinctArtifacts.length} listing{distinctArtifacts.length===1?'':'s'} · Choose an artifact to inspect its releases.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><button disabled={busy||current?.status!=='approved'} className={`${btn} flex items-center gap-2 bg-[#ffbd98]`}><Plus size={14}/> Create artifact</button></DialogTrigger><DialogContent className="max-h-[min(90svh,780px)] overflow-y-auto rounded-none border-[3px] border-[#111] bg-[#fffaf6] p-0 shadow-[7px_7px_0_#111] sm:max-w-lg"><DialogHeader className="border-b-[3px] border-[#111] bg-[#ffbd98] px-6 py-5 text-left"><p className="font-mono text-[10px] font-black uppercase tracking-widest">Publisher / New listing</p><DialogTitle className="text-2xl font-black">Create artifact</DialogTitle><DialogDescription className="text-sm text-[#333]">Set up an MCP bundle or Agent Skill listing. Uploads happen separately.</DialogDescription></DialogHeader><form onSubmit={createArtifact} className="grid gap-4 px-6 pb-6"><div className="grid gap-3"><label className="text-xs font-bold uppercase">Name<input required maxLength={160} value={newName} onChange={e=>{setNewName(e.target.value)}} className={`${input} mt-1`}/></label><p className="text-xs text-[#666]">Slug is generated from the name on creation and remains immutable.</p><label className="text-xs font-bold uppercase">Format<select value={newType} onChange={e=>setNewType(e.target.value as 'mcpb'|'skill')} className={`${input} mt-1`}><option value="mcpb">MCPB</option><option value="skill">Agent Skill</option></select></label><label className="text-xs font-bold uppercase">Description<textarea rows={3} maxLength={4000} value={newDescription} onChange={e=>setNewDescription(e.target.value)} className={`${input} mt-1`}/></label><DialogFooter className="mt-2 border-t-2 border-[#111] pt-4"><DialogClose asChild><button type="button" className={`${btn} bg-white`}>Cancel</button></DialogClose><button disabled={busy||current?.status!=='approved'} className={`${btn} bg-[#ffbd98]`}><Plus size={14} className="inline"/> Create artifact</button></DialogFooter></div></form></DialogContent></Dialog>
              </div>
              <div className="overflow-hidden border-2 border-[#111]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[690px] text-left text-sm">
                    <thead className="border-b-2 border-[#111] bg-[#f5f0e9] text-[11px] uppercase tracking-wide">
                      <tr><th className="px-4 py-3">Artifact</th><th className="px-4 py-3">Format</th><th className="px-4 py-3">Latest release</th><th className="px-4 py-3">Price</th><th className="px-4 py-3 text-right">Manage</th></tr>
                    </thead>
                    <tbody>{distinctArtifacts.map(a=>{
                      const expanded=selectedArtifact===a.id
                      const releaseCount=artifacts.filter(row=>row.id===a.id&&row.version_id).length
                      return <Fragment key={a.id}>
                        <tr onClick={()=>toggleVersions(a.id)} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleVersions(a.id)}}} tabIndex={0} aria-expanded={expanded} aria-controls={`releases-${a.id}`} className={`cursor-pointer border-b border-[#ded8d0] outline-offset-[-3px] transition-colors hover:bg-[#fff3e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e96830] ${expanded?'bg-[#fff0e7]':'bg-white'}`}>
                          <td className="px-4 py-4"><div className="flex items-center gap-3"><ArtifactMark artifact={a}/><div className="min-w-0"><span className="block font-black">{a.name}</span><span className="mt-1 block break-all font-mono text-[11px] text-[#777]">{a.slug}</span></div></div></td>
                          <td className="px-4 py-4"><span className="inline-block border border-[#111] bg-[#faf6f2] px-2 py-1 font-mono text-[11px] font-bold uppercase">{a.type}</span></td>
                          <td className="px-4 py-4"><span className="font-bold">{a.version?'v'+a.version:'—'}</span><span className="mt-1 block text-xs text-[#666]">{a.version_status?releaseText(a.version_status):'No releases yet'}</span></td>
                          <td className="px-4 py-4 font-semibold">{!a.billing_model?'Not set':a.billing_model==='free'?'Free':`${((a.amount_cents||0)/100).toFixed(2)} ${a.billing_model==='one_time'?'once':a.billing_model==='monthly'?'/mo':'/yr'}`}</td>
                          <td className="px-4 py-4 text-right"><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={e=>{e.stopPropagation();editPrice(a)}} className={`${btn} bg-[#ffbd98]`}>Set price</button><button onClick={e=>{e.stopPropagation();setImageTarget(a.id);setImageFile(null);setImageUrl(a.image_url||'');setImageOpen(true)}} className={`${btn} bg-white`}>Edit image</button><button aria-expanded={expanded} aria-controls={`releases-${a.id}`} onClick={e=>{e.stopPropagation();toggleVersions(a.id)}} className={`${btn} inline-flex items-center gap-2 ${expanded?'bg-[#ffbd98]':'bg-white'}`}>Releases ({releaseCount}) <ChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${expanded?'rotate-180':''}`}/></button></div></td>
                        </tr>
                        {expanded&&<tr id={`releases-${a.id}`} className="border-b-2 border-[#111] bg-[#fff9f4]">
                          <td colSpan={5} className="p-0">
                            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-200">
                              <div className="flex items-center justify-between border-b border-[#dfcfc3] px-5 py-3"><span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#a14b24]">Release history · {a.name}</span><span className="text-xs text-[#777]">{releaseCount} release{releaseCount===1?'':'s'}</span></div>
                              {versions.length===0?<p className="px-5 py-6 text-sm text-[#666]">No versions have been submitted for this artifact. <button onClick={()=>{setUploadArtifact(a.id);setSection('publish')}} className="font-bold underline underline-offset-4">Publish the first version →</button></p>:<div className="divide-y divide-[#eaded4]">
                                {versions.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3"><span className="font-black">v{v.version}</span><span className={`border border-[#111] px-2 py-1 text-[10px] font-black uppercase ${v.status==='published'?'bg-[#dff0df]':v.status==='rejected'?'bg-[#ffe0d8]':'bg-[#fff0d9]'}`}>{releaseText(v.status)}</span><span className="text-xs text-[#777]">Submitted {fmt(v.created_at)}</span></div>
                                    <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[#777]"><span className="truncate">SHA-256 · {v.sha256.slice(0,18)}…{v.sha256.slice(-8)}</span><button title="Copy full SHA-256" aria-label={`Copy SHA-256 for version ${v.version}`} onClick={()=>void navigator.clipboard.writeText(v.sha256).then(()=>setNotice('SHA-256 copied')).catch(()=>setError('Could not copy SHA-256'))} className="rounded-sm p-1 hover:bg-[#f7e0d2]"><Copy size={13}/></button></div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">{v.status==='published'&&<><button onClick={()=>void viewEvidence(v.id)} className={`${btn} bg-white`}>Inspect evidence</button><button disabled={busy} onClick={()=>void downloadVersion(v.id,a.type,v.version)} className={`${btn} inline-flex items-center gap-2 bg-[#ffbd98]`}><Download size={13}/> Download</button></>}</div>
                                </div>)}
                              </div>}
                            </div>
                          </td>
                        </tr>}
                      </Fragment>
                    })}</tbody>
                  </table>
                </div>
                {distinctArtifacts.length===0&&<div className="bg-white px-5 py-10 text-center"><Package className="mx-auto h-7 w-7 text-[#b05a33]"/><h4 className="mt-2 font-black">No artifacts yet</h4><p className="mt-1 text-sm text-[#666]">Create your first MCP bundle or Agent Skill listing to get started.</p></div>}
              </div>
              <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
                <DialogContent className="rounded-none border-[3px] border-[#111] bg-[#fffaf6] shadow-[7px_7px_0_#111] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">Set artifact price</DialogTitle>
                    <DialogDescription>Choose the price buyers will see. Payment checkout is not yet enabled.</DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-4" onSubmit={savePrice}>
                    {error&&<p role="alert" className="border-l-4 border-[#b83220] bg-[#ffe8df] p-3 text-sm">{error}</p>}
                    <label className="text-xs font-bold uppercase">Billing model
                      <select className={`${input} mt-1`} value={billingModel} onChange={e=>setBillingModel(e.target.value as typeof billingModel)}>
                        <option value="free">Free</option>
                        <option value="one_time">One-time purchase</option>
                        <option value="monthly">Monthly subscription</option>
                        <option value="annual">Annual subscription</option>
                      </select>
                    </label>
                    {billingModel!=='free'&&<label className="text-xs font-bold uppercase">Price (USD)
                      <input type="number" min="1" max="100000" step="0.01" required value={priceUsd}
                        onChange={e=>setPriceUsd(e.target.value)} className={`${input} mt-1`}/>
                    </label>}
                    <DialogFooter>
                      <DialogClose asChild><button type="button" className={btn}>Cancel</button></DialogClose>
                      <button type="submit" disabled={busy} className={`${btn} bg-[#ffbd98]`}>{busy?'Saving…':'Save price'}</button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={imageOpen} onOpenChange={setImageOpen}><DialogContent className="rounded-none border-[3px] border-[#111] bg-[#fffaf6] shadow-[7px_7px_0_#111] sm:max-w-md"><DialogHeader><DialogTitle className="text-xl font-black">Artifact image</DialogTitle><DialogDescription>Choose a logo file or use a hosted image URL. The listing will show a placeholder until you set one.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={saveArtifactImage}><label className="text-xs font-bold uppercase">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" className={`${input} mt-1`} onChange={e=>setImageFile(e.target.files?.[0]||null)}/></label><label className="text-xs font-bold uppercase">Or HTTPS image URL<input type="url" placeholder="https://example.com/logo.png" className={`${input} mt-1`} value={imageUrl} disabled={!!imageFile} onChange={e=>setImageUrl(e.target.value)}/></label><p className="text-xs text-[#666]">Uploads must be PNG, JPEG or WebP under 700 KB. Images are displayed in artifact listings.</p><DialogFooter><DialogClose asChild><button type="button" className={btn}>Cancel</button></DialogClose><button disabled={busy||(!imageFile&&!imageUrl.trim())} className={`${btn} bg-[#ffbd98]`}>Save image</button></DialogFooter></form></DialogContent></Dialog>
              <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
                <DialogContent className="max-h-[min(90svh,900px)] overflow-y-auto rounded-none border-[3px] border-[#111] bg-white p-0 shadow-[7px_7px_0_#111] sm:max-w-2xl">
                  <DialogHeader className="border-b-[3px] border-[#111] bg-[#f9e2d5] px-6 py-5 text-left">
                    <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#93421c]">Supply chain verification</p>
                    <DialogTitle className="text-2xl font-black">Release evidence</DialogTitle>
                    <DialogDescription className="text-sm text-[#333]">Scanner results and signing evidence for this release.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 px-6 pb-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="border-2 border-[#111] bg-[#faf6f2] p-3"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Scan outcome</p><p className="mt-1 font-black">{evidence?.scan?.outcome||'—'}</p></div>
                      <div className="border-2 border-[#111] bg-[#faf6f2] p-3"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Files scanned</p><p className="mt-1 font-black">{evidence?.scan?.file_count??'—'}</p></div>
                      <div className="col-span-2 border-2 border-[#111] bg-[#faf6f2] p-3 sm:col-span-1"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Sigstore bundle</p><p className="mt-1 font-black">{evidence?.sigstoreBundle?'Available':'Unavailable'}</p></div>
                    </div>
                    <div><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Artifact digest</p><code className="mt-1 block break-all border border-[#bbb] bg-[#f8f4ef] p-3 text-xs">{evidence?.sha256||'—'}</code></div>
                    <div><h4 className="font-black">Findings ({evidence?.scan?.findings?.length||0})</h4>
                      {evidence?.scan?.findings?.length?<ul className="mt-2 divide-y border-y border-[#ddd]">{evidence.scan.findings.map((f,i)=><li key={i} className="py-3 text-sm"><span className="font-black">{f.severity||'Finding'}</span> · {f.rule||'Security check'}<p className="mt-1 text-[#666]">{f.detail||f.path||'No detail supplied'}</p></li>)}</ul>:<p className="mt-2 border-l-4 border-[#31704a] bg-[#edf7ef] p-3 text-sm">No findings reported by this scan.</p>}
                    </div>
                    <details className="border-2 border-[#111] bg-[#faf6f2]"><summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase">Raw signed evidence (JSON)</summary><pre className="max-h-56 overflow-auto border-t border-[#111] p-4 text-[11px] whitespace-pre-wrap break-words">{JSON.stringify(evidence,null,2)}</pre></details>
                    <DialogFooter><DialogClose asChild><button className={`${btn} bg-[#ffbd98]`}>Done</button></DialogClose></DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </>}
            {section==='publish'&&<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
              <form onSubmit={upload} className="min-w-0 space-y-6">
                <div>
                  <div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center border-2 border-[#111] bg-[#ffbd98] font-mono text-xs font-black">01</span><div><h3 className="font-black">Select your artifact</h3><p className="text-xs text-[#666]">Choose the listing receiving this release.</p></div></div>
                  {distinctArtifacts.length===0?<div className="border-2 border-dashed border-[#111] bg-[#fff7f1] p-5"><p className="text-sm font-bold">You don't have an artifact yet.</p><button type="button" onClick={()=>setSection('artifacts')} className={`${btn} mt-3 bg-[#ffbd98]`}>Go to Artifacts →</button></div>:<select aria-label="Choose artifact" required value={uploadArtifact} onChange={e=>{setUploadArtifact(e.target.value);setUploadVersion('');setUploadFile(null)}} className={`${input} w-full max-w-[680px] text-sm font-semibold`}><option value="">Select an existing artifact…</option>{distinctArtifacts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.type==='mcpb'?'MCP Bundle':'Agent Skill'}</option>)}</select>}
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center border-2 border-[#111] font-mono text-xs font-black ${uploadArtifact?'bg-[#ffbd98]':'bg-[#f2ede8] text-[#777]'}`}>02</span><div><h3 className="font-black">Add your bundle</h3><p className="text-xs text-[#666]">{uploadKind==='skill'?'Upload a .zip Agent Skill':'Upload a .mcpb package'} · Maximum 50 MB</p></div></div>
                  <label onDragOver={e=>{if(uploadArtifact){e.preventDefault();setDropActive(true)}}} onDragLeave={e=>{e.preventDefault();setDropActive(false)}} onDrop={e=>{e.preventDefault();setDropActive(false);if(uploadArtifact)void selectUploadFile(e.dataTransfer.files?.[0]||null)}} className={`group flex min-h-[190px] cursor-pointer flex-col items-center justify-center border-[3px] border-dashed px-5 py-8 text-center transition-colors ${dropActive?'border-[#e96830] bg-[#ffdfc8]':uploadArtifact?'border-[#111] bg-[#fffaf6] hover:bg-[#fff0e5]':'cursor-not-allowed border-[#bcb3ac] bg-[#f3efec]'}`}>
                    <input disabled={!uploadArtifact} type="file" accept={uploadKind==='skill'?'.zip':'.mcpb'} className="sr-only" onChange={e=>void selectUploadFile(e.target.files?.[0]||null)}/>
                    {uploadFile?<><Package size={27} className="mb-3 text-[#b9562e]"/><span className="max-w-full break-all text-base font-black">{uploadFile.name}</span><span className="mt-1 font-mono text-xs text-[#666]">{(uploadFile.size/1024/1024).toFixed(2)} MB · Click or drop another file to replace</span></>:<><UploadCloud size={30} className="mb-3 text-[#b9562e]"/><span className="font-black">{uploadArtifact?'Drop your bundle here, or browse files':'Choose an artifact to enable upload'}</span><span className="mt-2 text-xs text-[#666]">We’ll read the release version automatically.</span></>}
                  </label>
                </div>
                {uploadFile&&<div className="border-2 border-[#111] bg-[#fff2e8] p-4">
                  <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#111] bg-white font-mono text-xs font-black">03</span><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase">Ready for security review</p><p className="mt-1 text-lg font-black">{uploadKind==='skill'?'Registry-assigned version':uploadVersion?'Version '+uploadVersion:'Reading version…'}</p><p className="mt-1 text-xs leading-5 text-[#666]">{uploadKind==='skill'?'The registry assigns the next 1.0.x version.':'Version read from manifest.json. It cannot be edited here.'}</p></div></div>
                </div>}
                <div className="flex flex-wrap items-center gap-4 border-t-2 border-[#111] pt-5"><button disabled={busy||current?.status!=='approved'||!uploadArtifact||!uploadFile||(uploadKind==='mcpb'&&!uploadVersion)} className={`${btn} flex min-w-[200px] items-center justify-center gap-2 bg-[#ffbd98] px-5 py-3`}><UploadCloud size={16}/>{busy?'Submitting…':'Submit for scan'}</button><p className="max-w-sm text-xs leading-5 text-[#666]">Signed in as {session?.user?.email}. No publishing key required in the browser.</p></div>
              </form>
              <aside className="h-fit border-2 border-[#111] bg-[#f7f3ee] p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#a74b21]">After submission</p>
                <h3 className="mt-2 text-lg font-black">We handle the release checks.</h3>
                <ol className="mt-5 space-y-4 text-sm">{[{name:'Queued',detail:'Your bundle enters the automated pipeline.'},{name:'Security scan',detail:'Bundle and dependency checks run.'},{name:'Evidence & signing',detail:'Passing releases receive attestations.'},{name:'Approval',detail:'Beag Labs reviews the evidence before publishing.'}].map((s,i)=><li key={s.name} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#111] bg-white font-mono text-[10px] font-bold">{i+1}</span><span><strong className="block">{s.name}</strong><span className="text-xs leading-5 text-[#666]">{s.detail}</span></span></li>)}</ol>
                <p className="mt-5 border-t border-[#c8beb7] pt-4 text-xs leading-5 text-[#666]">After submission, your artifact’s release history shows the live status. Scans may take a few minutes to start.</p>
                <button type="button" onClick={()=>setSection('artifacts')} className="mt-3 text-xs font-black underline underline-offset-4">View release history →</button>
              </aside>
            </div>}
            {section==='credentials'&&<><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]"><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b-2 border-[#111] bg-[#f8f4ef] text-[11px] uppercase"><tr><th className="p-3">Key</th><th className="p-3">Created</th><th className="p-3">Last used</th><th className="p-3">Action</th></tr></thead><tbody>{keys.map(k=><tr key={k.id} className="border-b border-[#ddd]"><td className="p-3"><strong>{k.name}</strong><code className="block text-[10px] text-[#777]">{k.key_prefix}…</code></td><td className="p-3 text-xs">{fmt(k.created_at)}</td><td className="p-3 text-xs">{fmt(k.last_used_at)}</td><td className="p-3">{k.revoked_at?<span className="text-xs text-[#777]">Revoked</span>:<button disabled={busy} onClick={()=>void revokeKey(k.id)} className={`${btn} bg-white`}>Revoke</button>}</td></tr>)}</tbody></table>{keys.length===0&&<p className="p-5 text-sm text-[#666]">No publishing keys yet.</p>}</div><form onSubmit={createKey} className="self-start border-2 border-[#111] bg-[#fff7f1] p-4"><h3 className="font-black">Issue a publishing key</h3><p className="mt-1 text-xs leading-5 text-[#666]">Use a separate key per CI workflow or publishing machine.</p><input required maxLength={80} value={keyName} onChange={e=>setKeyName(e.target.value)} placeholder="e.g. release-workflow" className={`${input} mt-3`}/><button disabled={busy||current?.status!=='approved'} className={`${btn} mt-3 w-full bg-[#ffbd98]`}>Generate key</button></form></div>{oneTimeKey&&<div className="mt-5 border-2 border-[#205c39] bg-[#e5f5e6] p-4"><p className="font-black">Copy this key now. It will not be shown again.</p><code className="mt-2 block break-all bg-white p-3 text-xs">{oneTimeKey}</code><button className={`${btn} mt-3 bg-white`} onClick={()=>void navigator.clipboard.writeText(oneTimeKey)}>Copy key</button><button className={`${btn} ml-2 bg-white`} onClick={()=>setOneTimeKey('')}>Dismiss</button></div>}</>}
            {section==='messages'&&<ConversationWorkspace
              threads={conversations.filter(c=>c.publisher_id===publisherId)}
              selectedId={currentConversation?.publisher_id===publisherId?conversationId:''}
              messages={messages}
              selfUserId={session.user.id}
              selfLabel="You"
              otherLabel="Beag Labs"
              draft={reply}
              onDraftChange={setReply}
              onSelect={id=>void openConversation(id)}
              onSend={sendReply}
              busy={busy}
              loading={messageLoading}
              title="Your conversations"
            />}
            
          </div>
        </div>
      </>}
      {notice&&<p role="status" className="mt-5 border-2 border-[#27603f] bg-[#e5f4e7] p-3 text-sm font-bold">{notice}</p>}
      {error&&<p role="alert" className="mt-5 border-2 border-[#9d331c] bg-[#fff0e8] p-3 text-sm font-bold text-[#9d331c]">{error}</p>}
    </div>
  </main><SiteFooter/></>
}
