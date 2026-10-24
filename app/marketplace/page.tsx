'use client'

import { useCallback, useEffect, useState } from 'react'
import { marketplaceAuth } from '@/lib/marketplace-auth'
import { ArrowRight, CheckCircle2, Fingerprint, RefreshCw, ShieldCheck, Shield } from 'lucide-react'

const API = 'https://api.beaglabs.com'
type Publisher = { id: string; slug: string; display_name: string; type: 'company' | 'individual'; status: string; verified_at: number | null }
type StripeState = { status: string; configured?: boolean; stale?: boolean; detailsSubmitted?: boolean; payoutsEnabled?: boolean }
type Conversation = { id:string; publisher_id:string; subject:string; created_at:number }
type Message = { id:string; body:string; sender_user_id:string; created_at:number }

async function getApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { credentials: 'include', cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data as T
}

function publisherLabel(status: string) {
  switch (status) {
    case 'approved': return 'Verified publisher'
    case 'under_review': return 'Application under review'
    case 'rejected': return 'Application requires follow-up'
    default: return status.replaceAll('_', ' ')
  }
}

function stripeLabel(state?: StripeState) {
  if (!state) return 'Checking'
  if (state.stale) return 'Status temporarily unavailable'
  switch (state.status) {
    case 'complete': return 'Ready for payouts (sandbox)'
    case 'requirements_due': return state.detailsSubmitted ? 'Stripe verification pending' : 'More information needed'
    case 'started': return 'Onboarding started'
    case 'not_started': return 'Not connected'
    default: return state.status.replaceAll('_', ' ')
  }
}

export default function MarketplacePublisherOverview() {
  const { data: session, isPending } = marketplaceAuth.useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [stripeStates, setStripeStates] = useState<Record<string, StripeState>>({})
  const [loaded, setLoaded] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedThread, setSelectedThread] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')

  const refresh = useCallback(async () => {
    if (!session?.user) return
    try {
      const response = await getApi<{ items: Publisher[] }>('/v1/me/publishers')
      const items = response.items || []
      setPublishers(items)
      const statuses = await Promise.all(items.map(async publisher => {
        try { return [publisher.id, await getApi<StripeState>(`/v1/onboarding/publishers/${encodeURIComponent(publisher.id)}/connect`)] as const }
        catch { return [publisher.id, { status: 'unavailable', stale: true }] as const }
      }))
      setStripeStates(Object.fromEntries(statuses))
      const [admin, inbox] = await Promise.all([
        getApi('/v1/admin/dashboard').then(() => true).catch(() => false),
        getApi<{items:Conversation[]}>('/v1/conversations').catch(() => ({items:[]})),
      ])
      setIsAdmin(admin);setConversations(inbox.items)
      setUpdatedAt(new Date())
      setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load your publisher profiles') }
    finally { setLoaded(true) }
  }, [session?.user])

  useEffect(() => {
    if (!session?.user) return
    void refresh()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 30000)
    const focus = () => void refresh()
    window.addEventListener('focus', focus)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', focus) }
  }, [session?.user, refresh])

  async function signIn(event: React.FormEvent) {
    event.preventDefault();setBusy(true);setError('')
    try {
      const result = await marketplaceAuth.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message || 'Sign-in failed')
      window.location.reload()
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign-in failed') }
    finally { setBusy(false) }
  }

  async function signInPasskey() {
    setBusy(true);setError('')
    try {
      const result = await marketplaceAuth.signIn.passkey()
      if (result.error) throw new Error(result.error.message || 'Passkey authentication failed')
      window.location.reload()
    } catch (e) { setError(e instanceof Error ? e.message : 'Passkey authentication failed') }
    finally { setBusy(false) }
  }

  async function openThread(id:string){
    setSelectedThread(id)
    try{const data=await getApi<{items:Message[]}>(`/v1/conversations/${encodeURIComponent(id)}/messages`);setMessages(data.items)}
    catch(e){setError(e instanceof Error?e.message:'Could not load messages')}
  }
  async function sendReply(event:React.FormEvent){
    event.preventDefault();if(!selectedThread)return;setBusy(true)
    try{
      const response=await fetch(`${API}/v1/conversations/${encodeURIComponent(selectedThread)}/messages`,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({body:reply})})
      const result=await response.json().catch(()=>({}))
      if(!response.ok)throw Error(result.error||'Could not send message')
      setReply('');await openThread(selectedThread)
    }catch(e){setError(e instanceof Error?e.message:'Could not send reply')}
    finally{setBusy(false)}
  }

  return <main className="site-page-grid min-h-[calc(100svh-67px)] bg-[#fffaf6] px-5 py-12 text-[#111]">
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b-[3px] border-[#111] pb-6">
        <div><p className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[#bb4d1e]">Beag Labs / Marketplace</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Publisher overview</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#555]">Your publisher application lives here. You only complete onboarding once.</p></div>
        {session?.user && <button onClick={() => void marketplaceAuth.signOut().then(() => window.location.reload())} className="border-2 border-[#111] bg-white px-4 py-2 text-xs font-bold uppercase">Sign out</button>}
      </div>

      {isPending ? <p>Checking your account…</p> : !session?.user ? <div className="max-w-md border-[3px] border-[#111] bg-white p-7 shadow-[5px_5px_0_#111]">
        <ShieldCheck className="mb-3 h-7 w-7 text-[#bc4b1d]"/><h2 className="text-2xl font-black">Welcome back.</h2>
        <p className="mt-2 text-sm leading-6 text-[#555]">Sign in with your existing publisher account. You don't need to register again.</p>
        <form onSubmit={signIn} className="mt-6 space-y-3"><label className="block text-xs font-bold uppercase">Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full border-2 border-[#111] px-3 py-3 text-sm normal-case" /></label><label className="block text-xs font-bold uppercase">Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full border-2 border-[#111] px-3 py-3 text-sm normal-case" /></label><button disabled={busy} className="w-full border-2 border-[#111] bg-[#f9e2d5] px-4 py-3 text-xs font-black uppercase">Sign in <ArrowRight className="ml-2 inline h-4 w-4" /></button></form>
        <button disabled={busy} onClick={signInPasskey} className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-[#111] bg-white px-4 py-3 text-xs font-bold uppercase"><Fingerprint className="h-4 w-4"/> Sign in with passkey</button>
      </div> : <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#555]">Signed in as <strong>{session.user.email}</strong></p><div className="flex flex-wrap gap-2">{isAdmin&&<a href="/marketplace/admin" className="inline-flex items-center gap-2 border-2 border-[#111] bg-[#f9e2d5] px-3 py-2 text-xs font-bold uppercase"><Shield className="h-4 w-4"/> Admin</a>}<button onClick={() => void refresh()} className="inline-flex items-center gap-2 border-2 border-[#111] bg-white px-3 py-2 text-xs font-bold uppercase"><RefreshCw className="h-4 w-4"/> Refresh status</button></div></div>
        {!loaded ? <p>Loading saved publisher profiles…</p> : publishers.length===0 ? <div className="border-[3px] border-[#111] bg-white p-7"><h2 className="text-2xl font-black">No publisher application yet</h2><p className="mt-2 text-sm text-[#555]">The local onboarding Skill is used once for your first application. After submission, return here to track it.</p></div> : <div className="grid gap-5">{publishers.map(publisher => <section key={publisher.id} className="border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0_#111]">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#ba4c20]">{publisher.type} publisher</p><h2 className="mt-1 text-2xl font-black">{publisher.display_name}</h2><p className="mt-2 font-mono text-[10px] text-[#777]">{publisher.id}</p></div><div className={`inline-flex items-center gap-2 border-2 px-3 py-2 text-xs font-black uppercase ${publisher.status==='approved'?'border-[#216a40] bg-[#e6f4e9] text-[#216a40]':'border-[#111] bg-[#f9e2d5]'}`}>{publisher.status==='approved'&&<CheckCircle2 className="h-4 w-4"/>}{publisherLabel(publisher.status)}</div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="border-2 border-[#111] bg-[#fffaf6] p-4"><p className="font-mono text-[10px] font-bold uppercase text-[#555]">Publisher verification</p><p className="mt-2 font-bold">{publisherLabel(publisher.status)}</p><p className="mt-1 text-xs leading-5 text-[#666]">{publisher.status==='approved'?'Your publisher identity has been approved.':'Beag Labs will review your application. No resubmission is needed.'}</p></div><div className="border-2 border-[#111] bg-[#fffaf6] p-4"><p className="font-mono text-[10px] font-bold uppercase text-[#555]">Stripe Connect</p><p className="mt-2 font-bold">{stripeLabel(stripeStates[publisher.id])}</p><p className="mt-1 text-xs leading-5 text-[#666]">{stripeStates[publisher.id]?.status==='complete'?'Sandbox payout setup is complete.':'Your payout setup is tracked separately from publisher verification.'}</p></div></div>
        </section>)}</div>}
        {conversations.length>0&&<section className="mt-7 border-[3px] border-[#111] bg-white p-6"><h2 className="text-2xl font-black">Messages from Beag Labs</h2><p className="mt-1 text-sm text-[#666]">These conversations stay with your publisher account.</p><div className="mt-4 grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]"><div className="grid content-start gap-2">{conversations.map(c=><button key={c.id} onClick={()=>void openThread(c.id)} className={`border-2 border-[#111] p-3 text-left text-sm font-bold ${selectedThread===c.id?'bg-[#f9e2d5]':'bg-white'}`}>{c.subject}</button>)}</div><div className="border-2 border-[#111] p-4">{!selectedThread?<p className="text-sm text-[#666]">Select a message to read and reply.</p>:<><div className="grid max-h-72 gap-3 overflow-auto">{messages.map(m=><div key={m.id} className="bg-[#f8f4ef] p-3"><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p><p className="mt-2 text-[10px] text-[#666]">{m.sender_user_id===session.user.id?'You':'Beag Labs'} · {new Date(m.created_at*1000).toLocaleString()}</p></div>)}</div><form onSubmit={sendReply} className="mt-3 grid gap-2"><textarea required value={reply} onChange={e=>setReply(e.target.value)} rows={3} maxLength={10000} placeholder="Reply to Beag Labs…" className="w-full border-2 border-[#111] p-3 text-sm"/><button disabled={busy} className="border-2 border-[#111] bg-[#f9e2d5] px-4 py-2 text-xs font-bold uppercase">Send reply</button></form></>}</div></div></section>}
        {updatedAt&&<p className="mt-5 text-xs text-[#777]">Automatically refreshed while this page is open · Last checked {updatedAt.toLocaleTimeString()}</p>}
      </>}
      {error&&<p role="alert" className="mt-4 border-2 border-[#9d331c] bg-[#fff0e8] p-3 text-sm font-bold text-[#9d331c]">{error}</p>}
    </div>
  </main>
}
