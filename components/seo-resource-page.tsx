import Link from 'next/link'
import { ArrowUpRight, FileCode2, FileText, Workflow } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { SiteFooter } from '@/components/site-footer'
import { Breadcrumbs } from '@/components/breadcrumbs'

export type SEOCard = {title:string; description:string; href:string; tag?:string}
type Props = { eyebrow:string; title:string; intro:string; path:string; cards:SEOCard[]; heading:string; context:string; steps?:{title:string;description:string}[]; faqs?:{question:string;answer:string}[] }
const lanes = [
 {title:'Document automation',href:'/solutions/document-automation',Icon:FileText,description:'Transform PDFs, office files and institutional records into workflows.'},
 {title:'Internal app factory',href:'/solutions/internal-app-factory',Icon:Workflow,description:'Create practical business applications from requirements and existing systems.'},
 {title:'Agentic modernization',href:'/solutions/agentic-modernization',Icon:FileCode2,description:'Adapt legacy processes and interfaces without unnecessary replacement.'},
]
export function SEOResourcePage({eyebrow,title,intro,path,cards,heading,context,steps,faqs}:Props){
 return <main className="bg-[#fafaf9] text-[#111]">
  <AnnouncementBanner/><Navbar bannerHeight={38}/>
  <section className="relative overflow-hidden border-b-[3px] border-[#111] px-6 pb-16 pt-36 lg:px-9 lg:pb-24">
    <div className="pointer-events-none absolute inset-0 opacity-[.12]" style={{backgroundImage:'linear-gradient(#111 1px,transparent 1px),linear-gradient(90deg,#111 1px,transparent 1px)',backgroundSize:'32px 32px'}}/>
    <div className="relative mx-auto max-w-[1440px]">
      <Breadcrumbs items={[{name:'Home',url:'/'},{name:eyebrow,url:path}]}/>
      <div className="mb-5 inline-flex border-2 border-[#111] bg-[#ff5f1f] px-3 py-1 font-mono text-xs font-black uppercase tracking-widest">{eyebrow}</div>
      <h1 className="max-w-[1080px] text-[44px] font-black uppercase leading-[.98] tracking-[-.05em] sm:text-[64px] lg:text-[82px]">{title}</h1>
      <p className="mt-8 max-w-[820px] text-lg font-medium leading-relaxed text-[#333]">{intro}</p>
      <div className="mt-9 flex flex-wrap gap-3"><Link className="nb-btn-orange px-6 py-3 text-xs uppercase" href="/products/papyrus">Explore Papyrus →</Link><Link className="nb-btn-white px-6 py-3 text-xs uppercase" href="/contact">Discuss your workflow →</Link></div>
    </div>
  </section>
  <section className="border-b-[3px] border-[#111] bg-white px-6 py-16 lg:px-9">
    <div className="mx-auto max-w-[1440px]">
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ae420f]">Three connected capabilities</span>
      <div className="mt-6 grid gap-5 md:grid-cols-3">{lanes.map(({title,href,Icon,description})=><Link href={href} key={title} className="group relative flex min-h-56 flex-col justify-between overflow-hidden border-[3px] border-[#111] bg-[#fafaf9] p-6 shadow-[6px_6px_0_#111] transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ff5f1f] motion-reduce:transform-none">
        <div className="flex items-start justify-between"><Icon className="h-9 w-9 text-[#111]"/><ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"/></div><div><h2 className="text-2xl font-black">{title}</h2><p className="mt-3 text-sm font-medium leading-6 text-[#444]">{description}</p></div>
      </Link>)}</div>
    </div>
  </section>
  <section className="border-b-[3px] border-[#111] px-6 py-16 lg:px-9"><div className="mx-auto max-w-[1440px]">
    <h2 className="max-w-[800px] text-4xl font-black tracking-tight">{heading}</h2><p className="mt-4 max-w-[800px] text-base leading-7 text-[#444]">{context}</p>
    <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{cards.map((card,i)=><Link key={card.href+card.title} href={card.href} className="group flex min-h-56 flex-col border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0_#111] transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ff5f1f] motion-reduce:transform-none">
      <span className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[#b13d08]">{card.tag||'Explore'} / {String(i+1).padStart(2,'0')}</span>
      <h3 className="mt-5 text-xl font-extrabold leading-tight">{card.title}</h3><p className="mt-3 text-sm font-medium leading-6 text-[#555]">{card.description}</p><span className="mt-auto pt-6 text-xs font-black uppercase">Read more <ArrowUpRight className="inline h-4 w-4"/></span>
    </Link>)}</div>
  </div></section>
  {steps?.length ? <section className="border-b-[3px] border-[#111] bg-white px-6 py-16 lg:px-9"><div className="mx-auto max-w-[1440px]"><h2 className="text-4xl font-black">How the workflow fits together</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{steps.map((s,i)=><article key={s.title} className="border-[3px] border-[#111] p-6"><span className="font-mono text-xl font-black text-[#b13d08]">{String(i+1).padStart(2,'0')}</span><h3 className="mt-5 text-xl font-bold">{s.title}</h3><p className="mt-3 text-sm leading-6 text-[#444]">{s.description}</p></article>)}</div></div></section>:null}
  {faqs?.length ? <section className="border-b-[3px] border-[#111] px-6 py-16 lg:px-9"><div className="mx-auto max-w-[1000px]"><h2 className="text-4xl font-black">Common questions</h2><div className="mt-8 space-y-3">{faqs.map(f=><details key={f.question} className="group border-[3px] border-[#111] bg-white p-5"><summary className="cursor-pointer font-bold marker:text-[#ff5f1f]">{f.question}</summary><p className="mt-4 text-sm leading-7 text-[#444]">{f.answer}</p></details>)}</div></div></section>:null}
  <section className="bg-[#ff5f1f] px-6 py-16 lg:px-9"><div className="mx-auto max-w-[1440px]"><h2 className="max-w-[850px] text-4xl font-black lg:text-6xl">Modernize the work. Keep control of the environment.</h2><p className="mt-5 max-w-[750px] text-base font-medium leading-7">Papyrus brings document workflows, application creation and legacy integration together in a customer-hosted agentic environment.</p><Link href="/products/papyrus" className="nb-btn-white mt-8 inline-flex px-6 py-3 text-xs uppercase">See the platform →</Link></div></section>
  <SiteFooter/>
 </main>
}
