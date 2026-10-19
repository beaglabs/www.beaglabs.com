'use client'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown, CheckCircle2, CirclePause, ShieldCheck } from 'lucide-react'
const steps=[['Receive invoice','document.intake','Source document'],['Resolve entity','class.lookup','Vendor + legal entity'],['Reconcile records','system.query','ERP and legacy records'],['Approval gate','human.approval','Finance review'],['Write to ledger','system.write','Authorized system of record']]
export function WorkflowShowcase({replay}:{replay:number}){
 const reduced=useReducedMotion()
 return <motion.div key={replay} initial={reduced?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.3}}>
  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ddd] pb-5"><div><p className="text-[11px] font-semibold text-[#666]">Factories / Artifact</p><h3 className="mt-2 text-2xl font-extrabold">Workflow Designer</h3><p className="mt-1 text-xs text-[#666]">Declared workflow · inspection mode</p></div><span className="border border-[#111] bg-[#f9e2d5] px-3 py-1.5 font-mono text-[10px] font-bold">5 STEPS</span></header>
  <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_190px]">
   <div className="relative space-y-3">{steps.map(([title,kind,description],index)=> <div key={title} className="relative">
    <motion.div initial={reduced?false:{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{delay:reduced?0:.2+index*.3,duration:.24}} className={`relative flex items-center gap-3 border p-3.5 ${index===3?'border-[#ff5f1f] bg-[#fff3eb]':'border-[#c7c7c7] bg-white'}`}>
     <span className="grid h-8 w-8 shrink-0 place-items-center border border-[#111] bg-[#fafafa] font-mono text-xs font-bold">{index+1}</span>
     <div className="min-w-0 flex-1"><h4 className="text-sm font-extrabold">{title}</h4><p className="mt-1 truncate font-mono text-[10px] text-[#777]">{kind} · {description}</p></div>
     {index<3?<CheckCircle2 className="h-4 w-4 shrink-0 text-[#217647]" aria-label="Complete"/>:<CirclePause className="h-4 w-4 shrink-0 text-[#b33d0d]" aria-label="Approval pending"/>}
     {index===3&&!reduced&&<motion.div className="pointer-events-none absolute inset-0 border-2 border-[#ff5f1f]" animate={{opacity:[.15,.95,.15]}} transition={{duration:2,repeat:Infinity}}/>}
    </motion.div>
    {index<steps.length-1&&<div className="flex h-5 justify-start pl-5"><motion.div initial={reduced?false:{scaleY:0}} animate={{scaleY:1}} style={{transformOrigin:'top'}} transition={{delay:reduced?0:.35+index*.3}} className="flex flex-col items-center"><span className="h-3 w-px bg-[#ff5f1f]"/><ArrowDown className="h-3 w-3 text-[#ff5f1f]"/></motion.div></div>}
   </div>)}</div>
   <aside className="border border-[#d1d1d1] bg-[#fafafa] p-4"><p className="font-mono text-[10px] font-bold uppercase text-[#555]">Governance</p><ShieldCheck className="mt-4 h-7 w-7 text-[#b33d0d]"/><h4 className="mt-3 text-sm font-extrabold">Human approval</h4><p className="mt-2 text-xs leading-5 text-[#666]">The final system write remains held until a reviewer approves the exception.</p><div className="mt-5 border-t border-[#ddd] pt-4"><div className="flex items-center gap-2 text-[11px]"><span className="h-2 w-2 rounded-full bg-[#e8a33e]"/> Awaiting review</div><p className="mt-3 font-mono text-[10px] text-[#888]">No external write executed</p></div></aside>
  </div>
 </motion.div>
}
