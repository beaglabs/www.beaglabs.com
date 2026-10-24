'use client'

import { useEffect, useState } from 'react'
import { marketplaceAuth } from '@/lib/marketplace-auth'
import { ArrowRight, Fingerprint, ShieldCheck } from 'lucide-react'

const API = 'https://api.beaglabs.com'
const inputClass = 'w-full border-[3px] border-[#111] bg-white px-4 py-3 text-sm outline-none focus:shadow-[4px_4px_0_#ff5f1f]'
const buttonClass = 'w-full border-[3px] border-[#111] bg-[#ff5f1f] px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-[#f67a46] disabled:opacity-50'

export default function MarketplaceDeviceAuthorization() {
  const [device, setDevice] = useState('')
  useEffect(() => { setDevice(new URLSearchParams(window.location.search).get('device') || '') }, [])
  const { data: session, isPending } = marketplaceAuth.useSession()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState('')

  async function handleCredentials(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      if(mode==='register') {
        const response = await fetch(`${API}/api/auth/sign-up/email`, { method:'POST', credentials:'include', headers:{'content-type':'application/json','x-registration-invite':invite}, body:JSON.stringify({name,email,password}) })
        const body=await response.json().catch(()=>({}))
        if(!response.ok)throw new Error(body.message || body.error || 'Registration failed')
      } else {
        const result=await marketplaceAuth.signIn.email({email,password})
        if(result.error)throw new Error(result.error.message || 'Sign-in failed')
      }
      window.location.reload()
    } catch(e) {setError(e instanceof Error?e.message:'Could not sign in')} finally {setBusy(false)}
  }

  async function handlePasskeySignIn() {
    setBusy(true);setError('')
    try {const result=await marketplaceAuth.signIn.passkey();if(result.error)throw new Error(result.error.message || 'Passkey authentication failed');window.location.reload()}
    catch(e){setError(e instanceof Error?e.message:'Passkey authentication failed')}finally{setBusy(false)}
  }

  async function handleApprove(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError('')
    try {
      if(!/^[0-9]{4}-[0-9]{4}$/.test(code))throw new Error('Enter the eight-digit code from the local wizard.')
      const response=await fetch(`${API}/v1/onboarding/devices/${encodeURIComponent(device)}/approve`,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({userCode:code})})
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body.error || 'Approval was not accepted')
      setApproved(true)
    } catch(e){setError(e instanceof Error?e.message:'Approval failed')}finally{setBusy(false)}
  }

  async function addPasskey(){setBusy(true);setError('');try{const result=await marketplaceAuth.passkey.addPasskey({name:'Marketplace passkey'});if(result.error)throw new Error(result.error.message||'Could not register passkey')}catch(e){setError(e instanceof Error?e.message:'Passkey registration failed')}finally{setBusy(false)}}

  return <main className="site-page-grid min-h-[calc(100vh-67px)] bg-[#fff9f4] px-4 py-14 text-[#111]" style={{backgroundImage:'linear-gradient(#1111110c 1px,transparent 1px),linear-gradient(90deg,#1111110c 1px,transparent 1px)',backgroundSize:'30px 30px'}}>
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 border-[3px] border-[#111] bg-[#f9e2d5] p-7 shadow-[7px_7px_0_#111]"><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#ba4516]">Beag Labs / Trusted browser authorization</p><h1 className="mt-3 font-bold text-4xl uppercase leading-none tracking-tight">Authorize your<br/>publisher wizard.</h1><p className="mt-3 text-sm leading-6 text-[#444]">This page verifies your account on beaglabs.com. Your local onboarding wizard receives a short-lived permission token, never your browser session.</p></div>
      <div className="border-[3px] border-[#111] bg-white p-7 shadow-[7px_7px_0_#111]">
        {!device?<p className="text-sm">No device request was provided. Start the Beag Labs Publisher Onboarding Skill on your computer first.</p>:isPending?<p>Checking your session…</p>:approved?<div className="space-y-4"><ShieldCheck className="h-10 w-10 text-[#16804a]"/><h2 className="text-2xl font-black uppercase">Device approved.</h2><p className="text-sm leading-6 text-[#555]">Return to the localhost wizard. It will automatically continue to the Company or Individual application form.</p><button type="button" onClick={addPasskey} disabled={busy} className={buttonClass}>Add another passkey (optional)</button></div>:session?.user?<div className="space-y-5"><div className="border-2 border-[#111] bg-[#f3f3f3] p-4"><p className="font-mono text-[10px] font-bold uppercase">Signed in as</p><p className="mt-1 font-bold">{session.user.email}</p></div><form onSubmit={handleApprove} className="space-y-4"><label className="block text-xs font-black uppercase">Verification code from localhost:4000<input autoComplete="one-time-code" placeholder="0000-0000" value={code} onChange={e=>setCode(e.target.value)} className={`${inputClass} mt-2 font-mono text-2xl tracking-[.15em]`} maxLength={9} required /></label><p className="text-xs leading-5 text-[#555]">Only approve if you started this onboarding request yourself. Match the code displayed in your local wizard.</p><button disabled={busy} className={buttonClass}>Approve publisher wizard <ArrowRight className="ml-2 inline h-4 w-4"/></button></form><button disabled={busy} onClick={addPasskey} className="text-xs font-bold underline">Register a passkey on this account</button></div>:<div><div className="mb-5 flex gap-2"><button onClick={()=>setMode('login')} className={`border-2 border-[#111] px-4 py-2 text-xs font-black uppercase ${mode==='login'?'bg-[#ff5f1f]':'bg-white'}`}>Sign in</button><button onClick={()=>setMode('register')} className={`border-2 border-[#111] px-4 py-2 text-xs font-black uppercase ${mode==='register'?'bg-[#ff5f1f]':'bg-white'}`}>Register with invite</button></div><form onSubmit={handleCredentials} className="space-y-3">{mode==='register'&&<label className="block text-xs font-bold uppercase">Full name<input className={`${inputClass} mt-2`} value={name} onChange={e=>setName(e.target.value)} required /></label>}<label className="block text-xs font-bold uppercase">Email<input type="email" className={`${inputClass} mt-2`} value={email} onChange={e=>setEmail(e.target.value)} required /></label><label className="block text-xs font-bold uppercase">Password<input type="password" className={`${inputClass} mt-2`} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required /></label>{mode==='register'&&<label className="block text-xs font-bold uppercase">Invitation / owner bootstrap secret<input type="password" className={`${inputClass} mt-2`} value={invite} onChange={e=>setInvite(e.target.value)} required /></label>}<button className={buttonClass} disabled={busy}>{mode==='login'?'Sign in securely':'Create invited account'}</button></form>{mode==='login'&&<button type="button" disabled={busy} onClick={handlePasskeySignIn} className="mt-3 flex w-full items-center justify-center gap-2 border-[3px] border-[#111] bg-white px-4 py-3 text-xs font-black uppercase"><Fingerprint className="h-4 w-4"/> Sign in with passkey</button>}</div>}
        {error&&<p role="alert" className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      </div>
      <p className="mt-7 text-center font-mono text-[10px] uppercase tracking-wide text-[#777]">Secure Beag Labs Origin · WebAuthn · Scoped Device Authorization</p>
    </div>
  </main>
}
