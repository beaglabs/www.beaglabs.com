'use client'

import { useCallback, useEffect, useState } from 'react'
import { marketplaceAuth } from '@/lib/marketplace-auth'
import { ArrowLeft, CheckCircle2, ClipboardCopy, Fingerprint, RefreshCw, ShieldAlert } from 'lucide-react'

const API = 'https://api.beaglabs.com'
type Section = 'dashboard' | 'publishers' | 'users' | 'invitations' | 'publications' | 'messages'
type Publisher = { id:string; display_name:string; type:string; status:string; first_name:string; last_name:string; email:string; country:string; created_at:number }
type User = { id:string; name:string; email:string; emailVerified:boolean; role:string|null; createdAt:number }
type Invitation = { id:string; email:string; created_at:number; expires_at:number; used_at:number|null }
type Publication = { id:string; version:string; sha256:string; status:string; created_at:number; artifact:string; publisher:string }
type Conversation = { id:string; publisher_id:string; subject:string; created_at:number }
type Message = { id:string; sender_user_id:string; body:string; created_at:number }
type Dashboard = { publishers:{count:number}; pending:{count:number}; artifacts:{count:number}; conversations:{count:number} }
type Evidence = { version:{id:string;sha256:string;status:string}; assessments:Array<{id:string;outcome:string;policy_id:string;policy_version:string}>; scan:unknown; sigstore:unknown }

async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  const response=await fetch(`${API}${path}`,{credentials:'include',cache:'no-store',...init,headers:{...(init.body?{'content-type':'application/json'}:{}),...init.headers}})
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw Object.assign(new Error(data.error||`Request failed (${response.status})`),{status:response.status})
  return data as T
}
const post=<T,>(path:string,value:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(value)})
const stamp=(seconds:number)=>new Date(seconds*1000).toLocaleDateString()
const sectionLabels:Record<Section,string>={dashboard:'Dashboard',publishers:'Publishers',users:'Users',invitations:'Invitations',publications:'Publications',messages:'Messages'}
const tabs=Object.keys(sectionLabels) as Section[]
const field='w-full min-w-0 border-2 border-[#111] bg-white px-3 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_#f6b48c]'
const button='border-2 border-[#111] px-3 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40'

export default function MarketplaceAdminPage(){
  const {data:session,isPending}=marketplaceAuth.useSession()
  const [authorized,setAuthorized]=useState<boolean|null>(null)
  const [section,setSection]=useState<Section>('dashboard')
  const [dashboard,setDashboard]=useState<Dashboard|null>(null)
  const [publishers,setPublishers]=useState<Publisher[]>([])
  const [users,setUsers]=useState<User[]>([])
  const [invitations,setInvitations]=useState<Invitation[]>([])
  const [publications,setPublications]=useState<Publication[]>([])
  const [conversations,setConversations]=useState<Conversation[]>([])
  const [conversationId,setConversationId]=useState('')
  const [messages,setMessages]=useState<Message[]>([])
  const [newSubject,setNewSubject]=useState('')
  const [newConversationPublisher,setNewConversationPublisher]=useState('')
  const [messageText,setMessageText]=useState('')
  const [inviteEmail,setInviteEmail]=useState('')
  const [oneTimeInvite,setOneTimeInvite]=useState<{email:string;inviteToken:string}|null>(null)
  const [evidence,setEvidence]=useState<Evidence|null>(null)
  const [evidenceVersion,setEvidenceVersion]=useState('')
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  const refresh=useCallback(async()=>{
    if(!session?.user)return
    try{
      const counts=await api<Dashboard>('/v1/admin/dashboard')
      setAuthorized(true);setDashboard(counts)
      const [p,u,i,v,c]=await Promise.all([
        api<{items:Publisher[]}>('/v1/admin/publishers'),
        api<{items:User[]}>('/v1/admin/users'),
        api<{items:Invitation[]}>('/v1/admin/invitations'),
        api<{items:Publication[]}>('/v1/admin/publications'),
        api<{items:Conversation[]}>('/v1/conversations'),
      ])
      setPublishers(p.items);setUsers(u.items);setInvitations(i.items);setPublications(v.items);setConversations(c.items);setError('')
    }catch(e){
      if((e as {status?:number}).status===401||(e as {status?:number}).status===403)setAuthorized(false)
      else setError(e instanceof Error?e.message:'Unable to load admin data')
    }finally{setLoading(false)}
  },[session?.user])

  useEffect(()=>{if(session?.user)void refresh()},[refresh,session?.user])
  useEffect(()=>{
    if(!session?.user||!authorized)return
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh()},30000)
    return ()=>window.clearInterval(timer)
  },[session?.user,authorized,refresh])

  async function signIn(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('')
    try{const result=await marketplaceAuth.signIn.email({email,password});if(result.error)throw Error(result.error.message||'Sign-in failed');window.location.reload()}
    catch(e){setError(e instanceof Error?e.message:'Sign-in failed')}finally{setBusy(false)}
  }
  async function passkeySignIn(){
    setBusy(true);setError('')
    try{const result=await marketplaceAuth.signIn.passkey();if(result.error)throw Error(result.error.message||'Passkey failed');window.location.reload()}
    catch(e){setError(e instanceof Error?e.message:'Passkey failed')}finally{setBusy(false)}
  }
  async function mutation(fn:()=>Promise<unknown>){
    setBusy(true);setError('')
    try{await fn();await refresh()}catch(e){setError(e instanceof Error?e.message:'Action failed')}finally{setBusy(false)}
  }
  async function decidePublisher(publisher:Publisher,status:string){
    if(!window.confirm(`Change ${publisher.display_name} to ${status.replaceAll('_',' ')}? This action is recorded in the audit log.`))return
    await mutation(()=>post(`/v1/admin/publishers/${encodeURIComponent(publisher.id)}/decision`,{status}))
  }
  async function createInvite(event:React.FormEvent){
    event.preventDefault()
    await mutation(async()=>{
      const created=await post<{email:string;inviteToken:string}>('/v1/admin/invitations',{email:inviteEmail})
      setOneTimeInvite(created);setInviteEmail('')
    })
  }
  async function chooseConversation(id:string){
    setConversationId(id);setMessages([])
    try{const r=await api<{items:Message[]}>(`/v1/conversations/${encodeURIComponent(id)}/messages`);setMessages(r.items)}
    catch(e){setError(e instanceof Error?e.message:'Cannot load messages')}
  }
  async function startConversation(event:React.FormEvent){
    event.preventDefault()
    await mutation(async()=>{
      const result=await post<{id:string}>('/v1/conversations',{publisherId:newConversationPublisher,subject:newSubject})
      setNewSubject('');await chooseConversation(result.id)
    })
  }
  async function sendMessage(event:React.FormEvent){
    event.preventDefault()
    if(!conversationId)return
    await mutation(async()=>{
      await post(`/v1/conversations/${encodeURIComponent(conversationId)}/messages`,{body:messageText})
      setMessageText('');await chooseConversation(conversationId)
    })
  }
  async function loadEvidence(id:string){
    setBusy(true);setError('')
    try{const result=await api<Evidence>(`/v1/admin/publications/${encodeURIComponent(id)}/evidence`);setEvidence(result);setEvidenceVersion(id)}
    catch(e){setError(e instanceof Error?e.message:'Could not load evidence')}
    finally{setBusy(false)}
  }
  async function publicationAction(publication:Publication,operation:'approve'|'reject'|'retry'){
    if(!window.confirm(`${operation.toUpperCase()} ${publication.artifact} v${publication.version}? This will change its publication state.`))return
    await mutation(()=>operation==='retry'?post(`/v1/admin/publications/${publication.id}/retry`,{}):post(`/v1/admin/publications/${publication.id}/decision`,{decision:operation}))
  }
  const selectedConversation=conversations.find(c=>c.id===conversationId)
  const selectedPublisher=publishers.find(p=>p.id===selectedConversation?.publisher_id)
  const evidencePassing=evidence?.assessments.some(x=>x.outcome==='PASS')&&!!evidence.scan&&!!evidence.sigstore

  return <main className="site-page-grid min-h-[calc(100svh-67px)] bg-[#fffaf6] px-4 py-9 text-[#111]">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-[#111] pb-5">
        <div><a href="/marketplace" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#a6461d]"><ArrowLeft className="h-4 w-4"/> Publisher overview</a><p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[.17em] text-[#a6461d]">Beag Labs / Restricted Control Plane</p><h1 className="mt-1 text-4xl font-black tracking-tight">Marketplace administration</h1></div>
        {authorized&&<button onClick={()=>void refresh()} className={`${button} inline-flex items-center gap-2 bg-white`}><RefreshCw className="h-4 w-4"/> Refresh</button>}
      </div>
      {isPending||session?.user&&loading?<p>Checking access…</p>:!session?.user?<div className="max-w-md border-[3px] border-[#111] bg-white p-7 shadow-[5px_5px_0_#111]"><h2 className="text-2xl font-black">Administrator sign-in</h2><p className="mt-2 text-sm text-[#555]">Sign in to your existing Beag Labs account. Access is determined by its database role.</p><form onSubmit={signIn} className="mt-5 grid gap-3"><input type="email" aria-label="Email" placeholder="Work email" required value={email} onChange={e=>setEmail(e.target.value)} className={field}/><input type="password" aria-label="Password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} className={field}/><button disabled={busy} className={`${button} bg-[#f9e2d5]`}>Sign in</button></form><button disabled={busy} onClick={passkeySignIn} className={`${button} mt-3 flex w-full items-center justify-center gap-2 bg-white`}><Fingerprint className="h-4 w-4"/> Use passkey</button></div>:authorized===false?<div className="max-w-xl border-[3px] border-[#111] bg-white p-7"><ShieldAlert className="h-8 w-8 text-[#a0442d]"/><h2 className="mt-2 text-2xl font-black">Administrator access required</h2><p className="mt-2 text-sm text-[#555]">Your account is signed in, but the Marketplace API did not authorize an administrator role. No admin records were loaded.</p></div>:authorized?<div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Admin sections" className="flex flex-wrap gap-2 self-start lg:flex-col">{tabs.map(tab=><button key={tab} onClick={()=>setSection(tab)} aria-current={section===tab?'page':undefined} className={`${button} text-left ${section===tab?'bg-[#f9e2d5]':'bg-white'}`}>{sectionLabels[tab]}{tab==='publishers'&&dashboard?.pending.count?` · ${dashboard.pending.count}`:''}</button>)}</nav>
        <div className="min-w-0 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] sm:p-7">
          <h2 className="mb-5 text-2xl font-black">{sectionLabels[section]}</h2>
          {section==='dashboard'&&<><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
            ['Publishers',dashboard?.publishers.count||0],['Awaiting review',dashboard?.pending.count||0],['Artifacts',dashboard?.artifacts.count||0],['Conversations',dashboard?.conversations.count||0],
          ].map(([label,value])=><div key={label} className="border-2 border-[#111] bg-[#fff6ef] p-4"><p className="font-mono text-[10px] font-bold uppercase text-[#666]">{label}</p><p className="mt-2 text-4xl font-black">{value}</p></div>)}</div><p className="mt-5 text-sm leading-6 text-[#555]">Select Publishers to review applications, Publications to inspect evidence, or Messages to communicate with vendors. Actions are recorded by the API.</p></>}
          {section==='publishers'&&<div className="grid gap-3">{publishers.length===0?<p className="text-sm text-[#666]">No publisher applications.</p>:publishers.map(p=><div key={p.id} className="border-2 border-[#111] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{p.display_name}</h3><p className="mt-1 text-xs text-[#555]">{p.first_name} {p.last_name} · {p.email} · {p.country}</p><p className="mt-1 font-mono text-[10px] text-[#777]">{p.type} · {stamp(p.created_at)} · {p.id}</p></div><span className="bg-[#fff0e4] px-3 py-1 text-xs font-bold uppercase">{p.status.replaceAll('_',' ')}</span></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy||p.status==='approved'} onClick={()=>void decidePublisher(p,'approved')} className={`${button} bg-[#e5f4e7]`}>Approve</button><button disabled={busy} onClick={()=>void decidePublisher(p,'changes_requested')} className={`${button} bg-white`}>Request changes</button><button disabled={busy} onClick={()=>void decidePublisher(p,'rejected')} className={`${button} bg-white`}>Reject</button><button disabled={busy} onClick={()=>void decidePublisher(p,'suspended')} className={`${button} bg-white`}>Suspend</button></div></div>)}</div>}
          {section==='users'&&<><p className="mb-4 text-xs text-[#666]">Accounts and assigned roles. Role changes are intentionally not available in this UI.</p><div className="overflow-x-auto"><table className="w-full min-w-[530px] text-left text-sm"><thead className="border-b-2 border-[#111] text-xs uppercase"><tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-b border-[#ddd]"><td className="py-3">{u.name}</td><td>{u.email}</td><td>{u.role||'member'}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></>}
          {section==='invitations'&&<><form onSubmit={createInvite} className="flex flex-wrap gap-2"><input type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="publisher@example.com" aria-label="Invite email" className={`${field} flex-1`}/><button disabled={busy} className={`${button} bg-[#f9e2d5]`}>Create invitation</button></form><p className="mt-2 text-xs text-[#777]">Invitations expire after seven days. Creating one does not send an email automatically.</p>{oneTimeInvite&&<div className="mt-4 border-2 border-[#216a40] bg-[#e8f5e9] p-4"><p className="font-bold">Invitation created for {oneTimeInvite.email}</p><p className="mt-1 text-xs">Copy this one-time token now; it won't be shown again.</p><code className="mt-3 block break-all bg-white p-2 text-xs">{oneTimeInvite.inviteToken}</code><button onClick={()=>void navigator.clipboard.writeText(oneTimeInvite.inviteToken)} className={`${button} mt-2 inline-flex items-center gap-2 bg-white`}><ClipboardCopy className="h-4 w-4"/> Copy token</button></div>}<div className="mt-5 grid gap-2">{invitations.map(i=><div key={i.id} className="flex flex-wrap justify-between gap-2 border-b border-[#ddd] py-2 text-sm"><span>{i.email}</span><span className="text-[#666]">{i.used_at?'Accepted':i.expires_at<Date.now()/1000?'Expired':`Expires ${stamp(i.expires_at)}`}</span></div>)}</div></>}
          {section==='publications'&&<div className="grid gap-3">{publications.length===0?<p className="text-sm text-[#666]">No publication submissions.</p>:publications.map(p=><div key={p.id} className="border-2 border-[#111] p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-black">{p.artifact} <span className="font-mono text-sm">v{p.version}</span></h3><p className="mt-1 text-xs text-[#555]">{p.publisher} · {stamp(p.created_at)}</p><code className="mt-2 block max-w-xl break-all text-[10px] text-[#777]">SHA256: {p.sha256}</code></div><span className="h-fit bg-[#fff0e4] px-3 py-1 text-xs font-bold uppercase">{p.status}</span></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void loadEvidence(p.id)} className={`${button} bg-white`}>View evidence</button><button disabled={busy||p.status!=='review'||evidenceVersion!==p.id||!evidencePassing} onClick={()=>void publicationAction(p,'approve')} className={`${button} bg-[#e5f4e7]`}>Approve</button><button disabled={busy||p.status!=='review'} onClick={()=>void publicationAction(p,'reject')} className={`${button} bg-white`}>Reject</button><button disabled={busy||!['review','rejected','scanning'].includes(p.status)} onClick={()=>void publicationAction(p,'retry')} className={`${button} bg-white`}>Retry scan</button></div></div>)}</div>}
          {section==='publications'&&evidence&&<div className="mt-5 border-[3px] border-[#111] bg-[#faf8f3] p-4"><h3 className="font-black">Security evidence · {evidence.version.version}</h3><p className="mt-2 text-xs">{evidence.assessments.length} assessment(s) · {evidence.scan?'Scan present':'No scan'} · {evidence.sigstore?'Sigstore bundle present':'No Sigstore bundle'}</p><div className="mt-3 max-h-72 overflow-auto border border-[#999] bg-white p-3"><pre className="whitespace-pre-wrap break-words text-[11px]">{JSON.stringify({assessments:evidence.assessments,scan:evidence.scan,sigstore:evidence.sigstore},null,2)}</pre></div></div>}
          {section==='messages'&&<div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]"><div><form onSubmit={startConversation} className="grid gap-2 border-2 border-[#111] bg-[#fff6ef] p-3"><label className="text-xs font-bold uppercase">New conversation</label><select required value={newConversationPublisher} onChange={e=>setNewConversationPublisher(e.target.value)} className={field}><option value="">Choose publisher</option>{publishers.map(p=><option value={p.id} key={p.id}>{p.display_name}</option>)}</select><input required value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="Subject" maxLength={250} className={field}/><button disabled={busy} className={`${button} bg-[#f9e2d5]`}>Create thread</button></form><div className="mt-3 grid gap-2">{conversations.map(c=><button key={c.id} onClick={()=>void chooseConversation(c.id)} className={`border-2 border-[#111] p-3 text-left ${conversationId===c.id?'bg-[#f9e2d5]':'bg-white'}`}><span className="block text-xs font-bold">{c.subject}</span><span className="mt-1 block text-[10px] text-[#666]">{publishers.find(p=>p.id===c.publisher_id)?.display_name||c.publisher_id}</span></button>)}</div></div><div className="min-w-0 border-2 border-[#111] p-4">{!conversationId?<p className="text-sm text-[#666]">Select a thread or create one to message a publisher.</p>:<><h3 className="font-black">{selectedConversation?.subject}</h3><p className="mt-1 text-xs text-[#777]">{selectedPublisher?.display_name||'Publisher conversation'}</p><div className="mt-4 flex max-h-80 min-h-32 flex-col gap-3 overflow-auto">{messages.map(m=><div key={m.id} className="bg-[#f6f3ee] p-3"><p className="text-sm whitespace-pre-wrap break-words">{m.body}</p><p className="mt-2 text-[10px] text-[#777]">{stamp(m.created_at)}</p></div>)}</div><form onSubmit={sendMessage} className="mt-4 grid gap-2"><textarea required value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Write a message to the publisher…" maxLength={10000} rows={3} className={field}/><button disabled={busy} className={`${button} bg-[#f9e2d5]`}>Send message</button></form></>}</div></div>}
        </div>
      </div>:null}
      {error&&<p role="alert" className="mt-5 border-2 border-[#9d331c] bg-[#fff0e8] p-3 text-sm font-bold text-[#9d331c]">{error}</p>}
    </div>
  </main>
}
