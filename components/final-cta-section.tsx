import Link from 'next/link'
import { ArrowUpRight, FileText, AppWindow, TerminalSquare, ShieldCheck } from 'lucide-react'
export function FinalCTASection(){
const cells=[{Icon:FileText,title:'Documents',body:'Extract and organize'},{Icon:AppWindow,title:'Internal apps',body:'Build what is missing'},{Icon:TerminalSquare,title:'Legacy systems',body:'Wrap and modernize'},{Icon:ShieldCheck,title:'Governance',body:'Review before action'}]
return <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-white px-6 py-20 text-[#111] lg:px-9 lg:py-28">
 <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-25"/>
 <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1fr_1fr]">
  <div><span className="nb-label mb-6 inline-block bg-[#ff5f1f]">Try Papyrus</span><h2 className="display-black max-w-[700px] text-[56px] leading-[.92] sm:text-[72px]">Start a one-month trial.</h2><p className="mt-7 max-w-[620px] text-lg font-semibold leading-relaxed text-[#333]">Pick a workflow that wastes your team's time. Explore document automation, internal apps and modernization in your own environment.</p><Link href="/contact?interest=one-month-trial" className="nb-btn-orange mt-8 inline-flex items-center gap-3 px-6 py-4 text-xs uppercase">Request a trial <ArrowUpRight className="size-4"/></Link><p className="mt-4 text-xs font-medium text-[#555]">We'll confirm trial eligibility, scope and terms before provisioning.</p></div>
  <div className="border-[3px] border-[#111] bg-white p-5 shadow-[9px_9px_0_#111]">
   <div className="mb-5 border-b-[3px] border-[#111] pb-4 font-mono text-xs font-black uppercase tracking-widest">One workspace / four building blocks</div>
   <div className="grid grid-cols-2 gap-3">{cells.map(({Icon,title,body},i)=><div key={title} className="flex min-h-40 flex-col justify-between border-[3px] border-[#111] bg-[#fff4ef] p-4"><div className="flex items-start justify-between"><Icon className="size-8"/><span className="font-mono text-xs font-black">0{i+1}</span></div><div><h3 className="text-base font-black">{title}</h3><p className="mt-1 text-xs font-medium text-[#555]">{body}</p></div></div>)}</div>
   <div className="mt-3 border-[3px] border-[#111] bg-[#ff5f1f] px-4 py-3 font-mono text-xs font-black uppercase">Connected through Papyrus →</div>
  </div>
 </div>
</section>
}