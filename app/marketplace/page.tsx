'use client'

import { useCallback, useEffect, useState } from 'react'
import { marketplaceAuth } from '@/lib/marketplace-auth'
import { SiteFooter } from '@/components/site-footer'
import { unzipSync, strFromU8 } from 'fflate'
import { ArrowRight, Download, Fingerprint, KeyRound, MessageSquare, Package, Plus, RefreshCw, Shield, UploadCloud } from 'lucide-react'

const API = 'https://api.beaglabs.com'
type Publisher = { id:string; slug:string; display_name:string; type:'company'|'individual'; status:string; verified_at:number|null; role:string }
type StripeState = {status:string; configured?:boolean; stale?:boolean; detailsSubmitted?:boolean; payoutsEnabled?:boolean; requirementsDue?:string[]}
type Artifact = {id:string;slug:string;name:string;type:'mcpb'|'skill';description:string;created_at:number;version_id:string|null;version:string|null;version_status:string|null;sha256:string|null}
type Version = {id:string;version:string;sha256:string;status:string;created_at:number}
type ApiKey = {id:string;name:string;key_prefix:string;created_at:number;last_used_at:number|null;revoked_at:number|null}
type Conversation = {id:string;publisher_id:string;subject:string;created_at:number}
type Message = {id:string;body:string;sender_user_id:string;created_at:number}
type Section = 'overview'|'artifacts'|'publish'|'credentials'|'messages'|'settings'
const sections:{id:Section;label:string}[] = [
  {id:'overview',label:'Overview'}, {id:'artifacts',label:'Artifacts'}, {id:'publish',label:'Publish version'},
  {id:'credentials',label:'API keys'}, {id:'messages',label:'Messages'}, {id:'settings',label:'Publisher settings'}
]
const input = 'w-full border-2 border-[#111] bg-white px-3 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_#f3aa82]'
const btn = 'border-2 border-[#111] px-3 py-2 text-xs font-black uppercase transition-colors hover:bg-[#ffe6d6] disabled:cursor-not-allowed disabled:opacity-40'
const fmt = (n:number|null|undefined) => n?new Date(n*1000).toLocaleString():'Never'
const status = (s:string) => s.replaceAll('_',' ')
const releaseText = (s:string) => ({submitted:'Queued for automated scan',scanning:'Scanning and signing',review:'Security checks complete · awaiting approval',published:'Approved and downloadable',rejected:'Review required · publication blocked'} as Record<string,string>)[s]||status(s)
const stripeText = (s?:StripeState) => !s?'Checking':s.stale?'Temporarily unavailable':s.status==='complete'?'Payout setup complete (sandbox)':status(s.status)
async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  const r=await fetch(API+path,{credentials:'include',cache:'no-store',...init,headers:{...(init.body?{'content-type':'application/json'}:{}),...init.headers}})
  const value=await r.json().catch(()=>({}))
  if(!r.ok)throw Error(value.error||'Request failed ('+r.status+')')
  return value as T
}
const post=<T,>(path:string,body:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(body)})

export default function PublisherWorkspace(){
  const {data:session,isPending}=marketplaceAuth.useSession()
  const [email,setEmail]=useState(''),[password,setPassword]=useState('')
  const [section,setSection]=useState<Section>('overview')
  const [publishers,setPublishers]=useState<Publisher[]>([])
  const [publisherId,setPublisherId]=useState('')
  const [stripe,setStripe]=useState<Record<string,StripeState>>({})
  const [artifacts,setArtifacts]=useState<Artifact[]>([])
  const [keys,setKeys]=useState<ApiKey[]>([])
  const [conversations,setConversations]=useState<Conversation[]>([])
  const [conversationId,setConversationId]=useState('')
  const [messages,setMessages]=useState<Message[]>([])
  const [versions,setVersions]=useState<Version[]>([])
  const [selectedArtifact,setSelectedArtifact]=useState('')
  const [newName,setNewName]=useState(''),[newType,setNewType]=useState<'mcpb'|'skill'>('mcpb'),[newDescription,setNewDescription]=useState('')
  const [keyName,setKeyName]=useState(''),[oneTimeKey,setOneTimeKey]=useState(''),[uploadKey,setUploadKey]=useState('')
  const [uploadArtifact,setUploadArtifact]=useState(''),[uploadVersion,setUploadVersion]=useState(''),[uploadFile,setUploadFile]=useState<File|null>(null)
  const [reply,setReply]=useState(''),[evidence,setEvidence]=useState<unknown>(null),[evidenceId,setEvidenceId]=useState('')
  const [busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const [isAdmin,setIsAdmin]=useState(false),[lastSync,setLastSync]=useState<Date|null>(null)
  const current=publishers.find(p=>p.id===publisherId)
  const distinctArtifacts=artifacts.filter((a,i,all)=>all.findIndex(x=>x.id===a.id)===i)
  const currentConversation=conversations.find(c=>c.id===conversationId)
  const currentArtifact=distinctArtifacts.find(a=>a.id===selectedArtifact)
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
      setNewName('');setNewDescription('');setUploadArtifact(r.id);setSection('publish')
    },'Artifact created. Upload its first version from the Publish tab.')
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
    if(!uploadFile||!uploadArtifact||!uploadKey||(uploadKind==='mcpb'&&!uploadVersion))return
    await mutate(async()=>{
      const r=await fetch(`${API}/v1/publish/${encodeURIComponent(uploadArtifact)}/versions`,{
        method:'POST',headers:{authorization:`Bearer ${uploadKey}`,...(uploadKind==='mcpb'?{'x-artifact-version':uploadVersion}:{}),'content-type':'application/octet-stream'},body:uploadFile
      })
      const result=await r.json().catch(()=>({}))
      if(!r.ok)throw Error(result.error||`Upload failed (${r.status})`)
      setUploadFile(null);setUploadVersion('');setSection('artifacts');await loadVersions(uploadArtifact)
    },'Upload received. Queued for the automatic scanner; the release state will refresh as it progresses.')
  }
  async function loadVersions(id:string){
    setSelectedArtifact(id);setEvidence(null);setEvidenceId('')
    try{const result=await api<{items:Version[]}>(`/v1/artifacts/${encodeURIComponent(id)}/versions`);setVersions(result.items||[])}
    catch(e){setError(e instanceof Error?e.message:'Unable to load versions')}
  }
  async function viewEvidence(id:string){
    setEvidence(null);setEvidenceId(id)
    try{setEvidence(await api(`/v1/public/releases/${encodeURIComponent(id)}/evidence`))}
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
    setConversationId(id);setMessages([])
    try{const r=await api<{items:Message[]}>(`/v1/conversations/${encodeURIComponent(id)}/messages`);setMessages(r.items)}
    catch(e){setError(e instanceof Error?e.message:'Unable to load messages')}
  }
  async function sendReply(event:React.FormEvent){
    event.preventDefault()
    await mutate(async()=>{await post(`/v1/conversations/${encodeURIComponent(conversationId)}/messages`,{body:reply});setReply('');await openConversation(conversationId)},'Message sent.')
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
            {section==='overview'&&<><div className="grid border-2 border-[#111] sm:grid-cols-3"><div className="border-b border-r border-[#111] p-5"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Publisher verification</p><p className="mt-2 font-black capitalize">{status(current?.status||'unknown')}</p></div><div className="border-b border-r border-[#111] p-5"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Stripe Connect</p><p className="mt-2 font-black">{stripeText(stripe[publisherId])}</p></div><div className="border-b border-[#111] p-5"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">Artifacts / Active keys</p><p className="mt-2 text-xl font-black">{distinctArtifacts.length} / {keys.filter(k=>!k.revoked_at).length}</p></div></div><div className="mt-6 flex flex-wrap gap-2"><button onClick={()=>setSection('artifacts')} className={`${btn} bg-[#ffbd98]`}><Package size={14} className="mr-1 inline"/> Manage artifacts</button><button onClick={()=>setSection('credentials')} className={`${btn} bg-white`}><KeyRound size={14} className="mr-1 inline"/> Publishing keys</button></div>{current?.status!=='approved'&&<p className="mt-5 border-l-4 border-[#e96830] pl-4 text-sm">Publishing becomes available once Beag Labs approves your identity. Your application is already saved.</p>}</>}
            {section==='artifacts'&&<><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="min-w-0"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b-2 border-[#111] bg-[#f8f4ef] text-[11px] uppercase"><tr><th className="p-3">Artifact</th><th className="p-3">Type</th><th className="p-3">Latest version</th><th className="p-3">Actions</th></tr></thead><tbody>{distinctArtifacts.map(a=><tr key={a.id} className="border-b border-[#ddd]"><td className="p-3"><strong>{a.name}</strong><span className="mt-1 block font-mono text-[10px] text-[#777]">{a.slug}</span></td><td className="p-3 uppercase">{a.type}</td><td className="p-3">{a.version||'—'}<span className="block text-xs capitalize text-[#777]">{a.version_status?releaseText(a.version_status):'No release'}</span></td><td className="p-3"><button onClick={()=>void loadVersions(a.id)} className={`${btn} bg-white`}>Versions</button></td></tr>)}</tbody></table>{distinctArtifacts.length===0&&<p className="p-5 text-sm text-[#666]">No artifacts. Create your first artifact using the form.</p>}</div>{selectedArtifact&&<div className="mt-5 border-t-[3px] border-[#111] pt-4"><h3 className="font-black">{currentArtifact?.name} / Versions</h3><div className="mt-3 divide-y border-y border-[#111]">{versions.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><strong>v{v.version}</strong><span className="ml-3 text-xs capitalize text-[#666]">{releaseText(v.status)}</span><code className="mt-1 block max-w-[360px] break-all text-[10px] text-[#888]">{v.sha256}</code></div><div className="flex gap-2">{v.status==='published'&&<><button onClick={()=>void viewEvidence(v.id)} className={`${btn} bg-white`}>Evidence</button><button disabled={busy} onClick={()=>void downloadVersion(v.id,currentArtifact?.type||'mcpb',v.version)} className={`${btn} bg-white`}><Download size={13} className="inline"/> Download</button></>}</div></div>)}</div>{evidenceId&&<div className="mt-4"><h4 className="font-bold">Release evidence</h4><pre className="mt-2 max-h-64 overflow-auto border border-[#111] bg-[#f8f4ef] p-3 text-[11px] whitespace-pre-wrap break-words">{JSON.stringify(evidence,null,2)||'Loading…'}</pre></div>}</div>}</div><form onSubmit={createArtifact} className="self-start border-2 border-[#111] bg-[#fff7f1] p-4"><h3 className="mb-3 text-lg font-black">Create artifact</h3><div className="grid gap-3"><label className="text-xs font-bold uppercase">Name<input required maxLength={160} value={newName} onChange={e=>{setNewName(e.target.value)}} className={`${input} mt-1`}/></label><p className="text-xs text-[#666]">Slug is generated from the name on creation and remains immutable.</p><label className="text-xs font-bold uppercase">Format<select value={newType} onChange={e=>setNewType(e.target.value as 'mcpb'|'skill')} className={`${input} mt-1`}><option value="mcpb">MCPB</option><option value="skill">Agent Skill</option></select></label><label className="text-xs font-bold uppercase">Description<textarea rows={3} maxLength={4000} value={newDescription} onChange={e=>setNewDescription(e.target.value)} className={`${input} mt-1`}/></label><button disabled={busy||current?.status!=='approved'} className={`${btn} bg-[#ffbd98]`}><Plus size={14} className="inline"/> Create artifact</button></div></form></div></>}
            {section==='publish'&&<div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_1fr]"><form onSubmit={upload} className="grid content-start gap-4"><label className="text-xs font-bold uppercase">Artifact<select required value={uploadArtifact} onChange={e=>{setUploadArtifact(e.target.value);setUploadVersion('');setUploadFile(null)}} className={`${input} mt-1`}><option value="">Choose an artifact</option>{distinctArtifacts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}</select></label><label className="text-xs font-bold uppercase">Bundle file (up to 50 MB)<input key={uploadArtifact} required type="file" accept={uploadKind==='mcpb'?'.mcpb':'.zip'} onChange={e=>void selectUploadFile(e.target.files?.[0]||null)} className={`${input} mt-1`}/></label><div className="border-l-[3px] border-[#e96830] bg-[#fff5ec] px-4 py-3"><p className="font-mono text-[10px] font-bold uppercase">Release version · automatically determined</p><p className="mt-1 text-lg font-black">{uploadKind==='skill'?'Assigned by registry on upload':uploadVersion||'Choose an MCPB to read its manifest'}</p><p className="mt-1 text-xs text-[#666]">{uploadKind==='skill'?'The registry assigns the next 1.0.x release.':'This comes from manifest.json inside the bundle and cannot be edited here.'}</p></div><label className="text-xs font-bold uppercase">Publisher API key<input required type="password" autoComplete="off" placeholder="beag_pub_…" value={uploadKey} onChange={e=>setUploadKey(e.target.value)} className={`${input} mt-1`}/></label><button disabled={busy||current?.status!=='approved'||!uploadFile||(uploadKind==='mcpb'&&!uploadVersion)} className={`${btn} flex items-center justify-center gap-2 bg-[#ffbd98]`}><UploadCloud size={16}/> Upload and queue scan</button></form><aside className="border-l-[3px] border-[#111] pl-5 text-sm leading-7"><h3 className="text-lg font-black">Automatic publishing pipeline</h3><ol className="mt-3 list-inside list-decimal space-y-2"><li>Upload the bundle; its version is determined automatically.</li><li>Queued submissions are claimed by GitHub Actions.</li><li>Scanner checks the bundle and Sigstore signs passing releases.</li><li>Beag Labs reviews the security evidence.</li><li>Approved releases become downloadable.</li></ol><p className="mt-4 text-xs text-[#666]">Scan runs are scheduled automatically (up to several minutes to begin). States update every five seconds while a release is active. Your publishing key stays in memory only.</p><button onClick={()=>setSection('credentials')} className={`${btn} mt-4 bg-white`}>Manage publishing keys</button></aside></div>}
            {section==='credentials'&&<><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]"><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b-2 border-[#111] bg-[#f8f4ef] text-[11px] uppercase"><tr><th className="p-3">Key</th><th className="p-3">Created</th><th className="p-3">Last used</th><th className="p-3">Action</th></tr></thead><tbody>{keys.map(k=><tr key={k.id} className="border-b border-[#ddd]"><td className="p-3"><strong>{k.name}</strong><code className="block text-[10px] text-[#777]">{k.key_prefix}…</code></td><td className="p-3 text-xs">{fmt(k.created_at)}</td><td className="p-3 text-xs">{fmt(k.last_used_at)}</td><td className="p-3">{k.revoked_at?<span className="text-xs text-[#777]">Revoked</span>:<button disabled={busy} onClick={()=>void revokeKey(k.id)} className={`${btn} bg-white`}>Revoke</button>}</td></tr>)}</tbody></table>{keys.length===0&&<p className="p-5 text-sm text-[#666]">No publishing keys yet.</p>}</div><form onSubmit={createKey} className="self-start border-2 border-[#111] bg-[#fff7f1] p-4"><h3 className="font-black">Issue a publishing key</h3><p className="mt-1 text-xs leading-5 text-[#666]">Use a separate key per CI workflow or publishing machine.</p><input required maxLength={80} value={keyName} onChange={e=>setKeyName(e.target.value)} placeholder="e.g. release-workflow" className={`${input} mt-3`}/><button disabled={busy||current?.status!=='approved'} className={`${btn} mt-3 w-full bg-[#ffbd98]`}>Generate key</button></form></div>{oneTimeKey&&<div className="mt-5 border-2 border-[#205c39] bg-[#e5f5e6] p-4"><p className="font-black">Copy this key now. It will not be shown again.</p><code className="mt-2 block break-all bg-white p-3 text-xs">{oneTimeKey}</code><button className={`${btn} mt-3 bg-white`} onClick={()=>void navigator.clipboard.writeText(oneTimeKey)}>Copy key</button><button className={`${btn} ml-2 bg-white`} onClick={()=>setOneTimeKey('')}>Dismiss</button></div>}</>}
            {section==='messages'&&<div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]"><div className="border-r-2 border-[#111] pr-4"><h3 className="mb-3 text-xs font-black uppercase">Conversations</h3>{conversations.filter(c=>c.publisher_id===publisherId).map(c=><button key={c.id} onClick={()=>void openConversation(c.id)} className={`mb-2 w-full border-2 border-[#111] p-3 text-left text-sm font-bold ${conversationId===c.id?'bg-[#ffbd98]':'bg-white'}`}>{c.subject}</button>)}{!conversations.some(c=>c.publisher_id===publisherId)&&<p className="text-xs leading-6 text-[#777]">No messages yet. Beag Labs can start a thread with you.</p>}</div><div>{!currentConversation||currentConversation.publisher_id!==publisherId?<p className="text-sm text-[#666]">Select a conversation to read and reply.</p>:<><h3 className="font-black">{currentConversation.subject}</h3><div className="mt-4 max-h-80 min-h-32 space-y-3 overflow-y-auto border-y border-[#ddd] py-4">{messages.map(m=><div key={m.id} className={`max-w-[90%] border-l-[3px] p-3 ${m.sender_user_id===session.user.id?'ml-auto border-[#e96830] bg-[#fff1e6]':'border-[#111] bg-[#f5f4f1]'}`}><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p><p className="mt-2 text-[10px] text-[#777]">{m.sender_user_id===session.user.id?'You':'Beag Labs'} · {fmt(m.created_at)}</p></div>)}</div><form onSubmit={sendReply} className="mt-4 grid gap-2"><textarea required rows={3} maxLength={10000} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Reply to Beag Labs…" className={input}/><button disabled={busy} className={`${btn} bg-[#ffbd98]`}>Send reply <MessageSquare size={13} className="inline"/></button></form></>}</div></div>}
            {section==='settings'&&<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]"><dl className="divide-y border-y-2 border-[#111] text-sm">{[['Publisher',current?.display_name],['Type',current?.type],['Public slug',current?.slug],['Role',current?.role],['Verification',current?.status],['Publisher ID',current?.id]].map(([label,value])=><div key={label} className="grid gap-2 py-3 sm:grid-cols-[170px_1fr]"><dt className="font-bold">{label}</dt><dd className="break-all text-[#555]">{value||'—'}</dd></div>)}</dl><div className="self-start border-2 border-[#111] bg-[#fff7f1] p-4"><h3 className="font-black">Stripe Connect</h3><p className="mt-2 text-sm">{stripeText(stripe[publisherId])}</p><p className="mt-2 text-xs leading-6 text-[#666]">Complete verification with Stripe. Current integration is in sandbox mode.</p><button disabled={busy} onClick={()=>void connectStripe()} className={`${btn} mt-4 w-full bg-[#ffbd98]`}>Open Stripe onboarding</button><a className="mt-4 block break-all text-xs font-bold underline underline-offset-4" target="_blank" rel="noreferrer" href={`https://beaglabs.com/marketplace`}>Publisher portal link</a>{current?.status==='approved'&&<a className="mt-2 block break-all text-xs underline" target="_blank" rel="noreferrer" href={`${API}/v1/public/publishers/${encodeURIComponent(current.slug)}`}>Public registry record ↗</a>}</div></div>}
          </div>
        </div>
      </>}
      {notice&&<p role="status" className="mt-5 border-2 border-[#27603f] bg-[#e5f4e7] p-3 text-sm font-bold">{notice}</p>}
      {error&&<p role="alert" className="mt-5 border-2 border-[#9d331c] bg-[#fff0e8] p-3 text-sm font-bold text-[#9d331c]">{error}</p>}
    </div>
  </main><SiteFooter/></>
}
