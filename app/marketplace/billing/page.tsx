'use client'

import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {marketplaceAuth} from '@/lib/marketplace-auth'

const API='https://api.beaglabs.com'
type Publisher={id:string;display_name:string;role:string;status:string}
type Entitlements={buyerAccess:boolean;publisherPlans:Array<{publisher_id:string;plan:string;status:string}>}
const button='border-2 border-[#111] bg-[#ffbd98] px-4 py-3 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#ffd3ba]'

export default function MarketplaceBillingPage(){
  const {data:session,isPending}=marketplaceAuth.useSession()
  const [publishers,setPublishers]=useState<Publisher[]>([])
  const [entitlements,setEntitlements]=useState<Entitlements>({buyerAccess:false,publisherPlans:[]})
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const refresh=useCallback(async()=>{
    if(!session?.user){setLoading(false);return}
    setLoading(true)
    try{
      const [p,e]=await Promise.all([
        fetch(`${API}/v1/me/publishers`,{credentials:'include',cache:'no-store'}),
        fetch(`${API}/v1/billing/entitlements`,{credentials:'include',cache:'no-store'}),
      ])
      if(!p.ok||!e.ok)throw Error('Unable to load billing information.')
      setPublishers(((await p.json()) as {items:Publisher[]}).items||[])
      setEntitlements(await e.json() as Entitlements)
    }catch(e){setError(e instanceof Error?e.message:'Unable to load billing information.')}
    finally{setLoading(false)}
  },[session?.user])
  useEffect(()=>{void refresh()},[refresh])

  async function redirectToStripe(path:string,body:object,key:string){
    setBusy(key);setError('')
    try{
      const response=await fetch(API+path,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
      const json=await response.json().catch(()=>({})) as {url?:string;error?:string}
      if(!response.ok||!json.url)throw Error(json.error||'Unable to start billing.')
      if(!json.url.startsWith('https://'))throw Error('Unexpected payment destination.')
      window.location.assign(json.url)
    }catch(e){setError(e instanceof Error?e.message:'Billing is temporarily unavailable.');setBusy('')}
  }
  const publisherPlan=(id:string)=>entitlements.publisherPlans.find(p=>p.publisher_id===id)

  return <main className="site-page-grid min-h-screen bg-[#fffaf6] px-4 py-10 text-[#111]">
    <div className="mx-auto max-w-5xl">
      <Link href="/marketplace" className="text-xs font-black underline">← Marketplace</Link>
      <header className="mt-6 border-b-[3px] border-[#111] pb-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[#a6461d]">Beag Labs / Billing</p>
        <h1 className="mt-2 text-4xl font-black">Marketplace access<span className="text-[#e96830]">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm text-[#555]">Beag access subscriptions are separate from prices publishers set for their individual artifacts. Publishers keep Stripe Connect for artifact sales.</p>
      </header>
      {!isPending&&!session?.user&&<div className="mt-6 border-2 border-[#111] bg-white p-6"><p className="text-sm font-bold">Sign in to your Marketplace account to subscribe or manage billing.</p><Link href="/marketplace" className={`${button} mt-4 inline-block`}>Sign in</Link></div>}
      {session?.user&&<>
        {loading?<p className="mt-6 text-sm">Loading billing details…</p>:<>
          <section className="mt-7 border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0_#111]">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">Buyer access</h2><span className="border border-[#111] bg-[#fff0e4] px-3 py-1 text-xs font-bold">{entitlements.buyerAccess?'Active':'Not subscribed'}</span></div>
            <p className="mt-2 text-3xl font-black">$5,400 <span className="text-sm font-normal text-[#555]">/ month</span></p>
            <p className="mt-3 text-sm text-[#555]">General marketplace buyer access. Paid publisher artifacts are purchased separately according to their listed prices.</p>
            <button disabled={!!busy} onClick={()=>void redirectToStripe(entitlements.buyerAccess?'/v1/billing/portal':'/v1/billing/checkout',entitlements.buyerAccess?{}:{plan:'buyer'},'buyer')} className={`${button} mt-5`}>{busy==='buyer'?'Opening Stripe…':entitlements.buyerAccess?'Manage buyer subscription':'Subscribe as buyer'}</button>
          </section>
          <section className="mt-8">
            <h2 className="text-2xl font-black">Publisher subscriptions</h2>
            <p className="mt-2 text-sm text-[#555]">Free private uploads and assessments do not require a listing subscription. Public PASS listings require one of the following plans.</p>
            {publishers.length===0?<p className="mt-5 border-2 border-[#111] bg-white p-5 text-sm">No publisher organizations found. <Link className="underline" href="/marketplace">Apply as a publisher</Link> first.</p>:
              publishers.map(pub=>{
                const subscribed=publisherPlan(pub.id)
                return <div key={pub.id} className="mt-5 border-[3px] border-[#111] bg-white p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black">{pub.display_name}</h3><span className="text-xs font-bold uppercase">{subscribed?`${subscribed.plan.replaceAll('_',' ')} · Active`:'No active listing subscription'}</span></div>
                  {subscribed?<button disabled={!!busy} className={button} onClick={()=>void redirectToStripe('/v1/billing/portal',{publisherId:pub.id},`portal-${pub.id}`)}>{busy===`portal-${pub.id}`?'Opening Stripe…':'Manage billing'}</button>:
                    <div className="grid gap-3 md:grid-cols-2">
                      {([{plan:'publisher',price:'$199',detail:'Public PASS listings and publisher distribution.'},{plan:'hosted_publisher',price:'$499',detail:'Public PASS listings and eligibility for remote hosting when launched.'}] as const).map(opt=><div key={opt.plan} className="border-2 border-[#111] bg-[#fff7f1] p-4"><p className="font-black">{opt.plan==='publisher'?'Publisher':'Hosted Publisher'}</p><p className="mt-1 text-2xl font-black">{opt.price}<span className="text-xs font-normal"> / month</span></p><p className="mt-2 min-h-10 text-xs text-[#555]">{opt.detail}</p><button disabled={!!busy||!['owner','admin'].includes(pub.role)} onClick={()=>void redirectToStripe('/v1/billing/checkout',{plan:opt.plan,publisherId:pub.id},`${opt.plan}-${pub.id}`)} className={`${button} mt-4 w-full`}>{busy===`${opt.plan}-${pub.id}`?'Opening Stripe…':'Subscribe'}</button></div>) }
                    </div>}
                </div>
              })}
          </section>
        </>}
      </>}
      {error&&<p role="alert" className="mt-6 border-2 border-red-800 bg-red-50 p-4 text-sm font-bold text-red-900">{error}</p>}
    </div>
  </main>
}
