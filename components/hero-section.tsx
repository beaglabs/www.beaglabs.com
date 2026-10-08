import Link from 'next/link'
import { ArrowUpRight, FileText, Blocks, Workflow } from 'lucide-react'
const features=[
 {icon:FileText,name:'Document automation',body:'Turn PDFs and office files into useful, structured work.',href:'/solutions/document-automation'},
 {icon:Blocks,name:'Internal app creation',body:'Build interfaces for the processes your team runs every day.',href:'/solutions/internal-app-factory'},
 {icon:Workflow,name:'Legacy modernization',body:'Put modern APIs and apps around existing systems.',href:'/solutions/agentic-modernization'},
]
export function HeroSection(){
return <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-white pt-[calc(4rem+2.375rem)] text-[#111]">
 <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-30"/>
 <div className="relative mx-auto grid min-h-[640px] max-w-[1440px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-9 lg:py-28">
  <div>
   <span className="nb-label mb-7 inline-block bg-[#ff5f1f]">Practical, customer-hosted AI</span>
   <h1 className="display-black max-w-[900px] text-[64px] leading-[.9] sm:text-[82px] lg:text-[100px]">Solving the boring problems.</h1>
   <p className="mt-8 max-w-[650px] text-[19px] font-semibold leading-relaxed text-[#333]">Documents that take hours. Internal tools that never get built. Legacy systems nobody wants to touch. We make the work easier with governed AI on your infrastructure.</p>
   <div className="mt-9 flex flex-wrap gap-4">
    <Link href="/contact?interest=one-month-trial" className="nb-btn-orange inline-flex items-center gap-2 px-6 py-4 text-xs uppercase">Start a one-month trial <ArrowUpRight className="size-4"/></Link>
    <Link href="/capabilities" className="nb-btn-white inline-flex items-center px-6 py-4 text-xs uppercase">Explore solutions →</Link>
   </div>
   <p className="mt-5 font-mono text-xs font-medium text-[#555]">Trial availability and terms confirmed on request.</p>
  </div>
  <div className="relative border-[3px] border-[#111] bg-white p-4 shadow-[10px_10px_0_#ff5f1f] sm:p-6">
   <div className="mb-5 flex items-center justify-between border-b-[3px] border-[#111] pb-4"><span className="font-mono text-xs font-black uppercase tracking-widest">Work, simplified</span><span className="flex gap-1"><i className="size-3 border-2 border-[#111] bg-[#ff5f1f]"/><i className="size-3 border-2 border-[#111]"/><i className="size-3 border-2 border-[#111]"/></span></div>
   <div className="space-y-3">{features.map(({icon:Icon,name,body,href},index)=><Link key={href} href={href} className="group flex items-start gap-4 border-2 border-[#111] bg-[#fafaf9] p-4 transition-transform hover:-translate-y-1 hover:bg-[#fff0e8] focus-visible:outline-4 focus-visible:outline-[#ff5f1f] motion-reduce:transform-none">
    <span className="flex size-12 shrink-0 items-center justify-center border-2 border-[#111] bg-[#ff5f1f]"><Icon className="size-6"/></span>
    <span className="flex-1"><span className="block text-base font-black">{name}</span><span className="mt-1 block text-sm leading-relaxed text-[#444]">{body}</span></span>
    <span className="font-mono text-xs font-black">0{index+1}</span>
   </Link>)}</div>
   <div className="mt-5 border-[3px] border-[#111] bg-[#111] p-4 text-white"><span className="font-mono text-[10px] uppercase tracking-widest text-[#ffad8a]">Deployment</span><p className="mt-1 text-base font-bold">Your environment. Your controls.</p></div>
  </div>
 </div>
</section>
}