'use client'
import { useId, useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { analytics } from '@/lib/analytics'
import { papyrusSignupUrl } from '@/lib/papyrus-links'

const valid = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
export function CreditClaimForm({placement='page-hero',compact=false}:{placement?:'nav'|'page-hero'|'section';compact?:boolean}) {
  const id=useId()
  const [email,setEmail]=useState('')
  const [state,setState]=useState<'idle'|'invalid'|'loading'|'done'|'error'>('idle')
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(state==='loading'||state==='done')return
    const address=email.trim()
    if(!valid.test(address)){setState('invalid');return}
    setState('loading')
    try{
      const response=await fetch('/api/newsletter/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:address,offer:'papyrus-compute-credit'})})
      if(!response.ok)throw new Error('Credit request failed')
      analytics.creditEmailSubmitted(address,{placement,page:window.location.pathname,destination:'papyrus.beaglabs.com'})
      setState('done')
      window.location.assign(papyrusSignupUrl(address))
    }catch{setState('error')}
  }
  const failed=state==='invalid'||state==='error'
  return <form onSubmit={submit} noValidate aria-label="Claim Papyrus compute credit" className={compact?'flex min-w-0 items-center gap-0':'mt-8 w-full max-w-[700px]'}>
    {!compact&&<label htmlFor={id} className="mb-2 block font-mono text-xs font-black uppercase">Work email</label>}
    <div className="flex min-w-0 flex-wrap border-[3px] border-black bg-white shadow-[4px_4px_0_#111]">
      <input id={id} type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={event=>{setEmail(event.target.value);if(failed)setState('idle')}} aria-invalid={failed} aria-label={compact?'Work email':undefined} className={compact?'h-10 w-[135px] min-w-0 bg-white px-2 text-xs font-semibold outline-none lg:w-[185px]':'h-14 min-w-[180px] flex-1 bg-white px-4 text-base font-semibold outline-none'} />
      <button disabled={state==='loading'||state==='done'} type="submit" className={compact?'flex h-10 items-center gap-1 border-l-[3px] border-black bg-[#ff5f1f] px-2 text-[10px] font-black uppercase lg:px-3':'flex h-14 items-center gap-2 border-l-[3px] border-black bg-[#ff5f1f] px-5 text-xs font-black uppercase'}>{state==='loading'?<LoaderCircle className="h-4 w-4 animate-spin"/>:state==='done'?'Sent ✓':<>Claim $1,000 credit <ArrowRight className="h-4 w-4"/></>}</button>
    </div>
    {!compact&&<p className="mt-3 text-xs font-semibold">{failed?(state==='invalid'?'Enter a valid work email.':'Could not request the credit. Please retry.'):'$1,000 Papyrus compute credit · No card required'}</p>}
    {compact&&failed&&<span role="alert" className="sr-only">{state==='invalid'?'Enter a valid work email.':'Credit request failed.'}</span>}
  </form>
}
