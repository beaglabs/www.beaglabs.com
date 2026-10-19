'use client'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Layers3, GitBranch, ShieldCheck, Plug, Files, Database } from 'lucide-react'
export type View = 'classes'|'workflow'
export function PapyrusFrame({active,onChange,children}:{active:View;onChange:(view:View)=>void;children:ReactNode}){
 const nav=[{id:'classes' as const,label:'Classes',Icon:Layers3},{id:'workflow' as const,label:'Factories',Icon:GitBranch}]
 return <div className="overflow-hidden border-[2px] border-[#111] bg-white shadow-[8px_8px_0_#111]">
  <header className="flex h-14 items-center justify-between border-b-2 border-[#111] bg-white px-4">
   <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center border-2 border-[#111] bg-[#ff5f1f] text-sm font-black">P</span><span className="text-sm font-black tracking-tight">Papyrus</span><span className="hidden border-l border-[#ddd] pl-3 text-xs text-[#666] sm:block">Enterprise workspace</span></div>
   <span className="border border-[#111] px-2 py-1 font-mono text-[10px] font-bold uppercase">Demonstration data</span>
  </header>
  <div className="grid min-h-[560px] md:grid-cols-[192px_minmax(0,1fr)]">
   <aside className="border-b-2 border-[#111] bg-[#fafafa] px-3 py-5 md:border-b-0 md:border-r-2">
    <p className="mb-4 px-3 font-mono text-[10px] font-black uppercase tracking-wider text-[#666]">Workspace</p>
    <div className="flex gap-2 md:block">{nav.map(({id,label,Icon})=><button type="button" key={id} onClick={()=>onChange(id)} aria-pressed={active===id} className={`relative mb-2 flex min-w-0 flex-1 items-center gap-2 border-2 px-3 py-2.5 text-left text-xs font-bold md:w-full ${active===id?'border-[#111] bg-[#f9e2d5]':'border-transparent hover:bg-[#eee]'}`}><Icon className="h-4 w-4 shrink-0"/>{label}{active===id&&<motion.span layoutId="papyrus-nav-indicator" className="absolute inset-y-0 left-0 w-[3px] bg-[#ff5f1f]"/>}</button>)}</div>
    <div className="mt-7 hidden space-y-3 border-t border-[#ddd] px-3 pt-5 text-xs text-[#666] md:block"><div className="flex items-center gap-2"><Database className="h-4 w-4"/> Data</div><div className="flex items-center gap-2"><Files className="h-4 w-4"/> Artifacts</div><div className="flex items-center gap-2"><Plug className="h-4 w-4"/> Connections</div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Governance</div></div>
   </aside>
   <div className="min-w-0 bg-white p-4 sm:p-6">{children}</div>
  </div>
 </div>
}
