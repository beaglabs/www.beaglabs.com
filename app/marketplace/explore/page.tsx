'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ShieldCheck, Package, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type Release = {
  id:string;version:string;sha256:string;artifact_id:string;name:string;
  type:'mcpb'|'skill';publisher_slug:string;publisher:string;
  billing_model:'free'|'one_time'|'monthly'|'annual'|null;
  amount_cents:number|null;currency:string|null;
}
const API='https://api.beaglabs.com'
function price(release:Release){
  if(!release.billing_model)return 'Pricing pending'
  if(release.billing_model==='free')return 'Free'
  const amount='$'+((release.amount_cents||0)/100).toFixed(2)
  return amount+(release.billing_model==='one_time'?' one-time':release.billing_model==='monthly'?'/month':'/year')
}

export default function MarketplaceExplorePage(){
  const [items,setItems]=useState<Release[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [filter,setFilter]=useState<'all'|'mcpb'|'skill'>('all')
  async function refresh(){
    setLoading(true);setError('')
    try{
      const response=await fetch(API+'/v1/public/releases',{cache:'no-store'})
      if(!response.ok)throw Error('The marketplace is temporarily unavailable.')
      const body=await response.json() as {items?:Release[]}
      setItems(body.items||[])
    }catch(e){setError(e instanceof Error?e.message:'Unable to load releases')}
    finally{setLoading(false)}
  }
  useEffect(()=>{void refresh()},[])
  const visible=items.filter(x=>filter==='all'||x.type===filter)
  return <main className="site-page-grid min-h-screen bg-[#fffaf6] px-4 py-10 text-[#111]">
    <div className="mx-auto max-w-6xl">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-xs font-bold underline"><ArrowLeft size={14}/> Publisher portal</Link>
      <div className="mt-5 border-b-[3px] border-[#111] pb-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[#a6461d]">Beag Marketplace / Catalog</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">Tools that passed<span className="text-[#e96830]">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm text-[#555]">Only artifacts that passed our automated static and AI security review appear here. PASS is a screening result, not a guarantee of safety or formal certification.</p>
      </div>
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">{(['all','mcpb','skill'] as const).map(kind=><button key={kind} onClick={()=>setFilter(kind)} className={`border-2 border-[#111] px-4 py-2 text-xs font-black uppercase ${filter===kind?'bg-[#ffbd98]':'bg-white'}`}>{kind==='all'?'All':kind==='mcpb'?'MCPB':'Agent Skills'}</button>)}</div>
        <button onClick={()=>void refresh()} className="flex items-center gap-2 border-2 border-[#111] bg-white px-3 py-2 text-xs font-black uppercase"><RefreshCw size={13}/> Refresh</button>
      </div>
      {error&&<p role="alert" className="border-2 border-[#9d2c12] bg-[#ffe6dd] p-4 text-sm">{error}</p>}
      {loading?<p className="py-16 text-center text-sm">Loading verified listings…</p>:
        visible.length===0?<div className="border-[3px] border-[#111] bg-white p-12 text-center"><Package className="mx-auto text-[#df7238]"/><h2 className="mt-3 text-xl font-black">No passing releases yet</h2><p className="mt-2 text-sm text-[#666]">New listings appear only after their automated review passes.</p></div>:
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visible.map(item=><article key={item.id} className="flex flex-col border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111]">
          <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] font-black uppercase text-[#666]">{item.type==='mcpb'?'MCP Bundle':'Agent Skill'} · v{item.version}</span><span className="inline-flex items-center gap-1 border border-[#111] bg-[#dff0df] px-2 py-1 text-[10px] font-black"><ShieldCheck size={12}/> PASS</span></div>
          <h2 className="mt-4 text-xl font-black">{item.name}</h2>
          <p className="mt-1 text-xs text-[#666]">by {item.publisher}</p>
          <p className="mt-auto pt-6 text-xl font-black">{price(item)}</p>
          <p className="mt-3 truncate font-mono text-[10px] text-[#888]">SHA-256 {item.sha256}</p>
          <a href={API+'/v1/public/releases/'+encodeURIComponent(item.id)+'/evidence'} target="_blank" rel="noopener noreferrer" className="mt-4 border-2 border-[#111] bg-[#ffbd98] px-3 py-2 text-center text-xs font-black uppercase">View security evidence</a>
          <p className="mt-2 text-[11px] text-[#777]">Checkout and buyer entitlements are not yet enabled.</p>
        </article>)}</div>}
    </div>
  </main>
}
