import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export type SolutionPageContent = {
  eyebrow: string
  title: string
  description: string
  steps: readonly { title: string; description: string }[]
  result: string
}

export function SolutionPage({ content }: { content: SolutionPageContent }) {
  return <main className="min-h-screen bg-[#fafaf9] text-[#111]">
    <Navbar />
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-white pt-24">
      <div aria-hidden="true" className="marketing-grid absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
        <Link href="/products/papyrus" className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider underline underline-offset-4">Papyrus / Solutions</Link>
        <div className="max-w-4xl"><span className="nb-label mb-6 inline-block bg-[#ff5f1f]">{content.eyebrow}</span>
          <h1 className="display-black max-w-4xl text-[clamp(3.3rem,7vw,6.5rem)] leading-[.95]">{content.title}</h1>
          <p className="mt-8 max-w-3xl text-lg font-semibold leading-relaxed text-[#444]">{content.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/provision/commercial" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#ff5f1f] px-6 py-4 text-xs font-black uppercase shadow-[4px_4px_0_#111]">Start a one-month trial <ArrowRight size={17}/></Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-6 py-4 text-xs font-black uppercase">Talk to us</Link>
          </div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
      <p className="mb-3 font-mono text-xs font-black uppercase tracking-widest text-[#a43d11]">How it works</p>
      <h2 className="display-black mb-10 text-5xl">A practical path to production.</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {content.steps.map((step, index) => <article key={step.title} className="flex flex-col border-[3px] border-[#111] bg-white p-7 shadow-[6px_6px_0_#111]">
          <span className="mb-9 font-mono text-sm font-black text-[#a43d11]">0{index + 1}</span>
          <h3 className="mb-4 text-2xl font-black">{step.title}</h3>
          <p className="text-sm font-medium leading-7 text-[#555]">{step.description}</p>
          <CheckCircle2 className="mt-auto pt-7 text-[#ff5f1f]" size={44}/>
        </article>)}
      </div>
    </section>
    <section className="border-y-[3px] border-[#111] bg-[#ff5f1f]"><div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-9">
      <div><p className="font-mono text-xs font-black uppercase tracking-widest">Built with Papyrus</p><h2 className="display-black mt-3 text-4xl lg:text-5xl">{content.result}</h2></div>
      <Link href="/products/papyrus" className="inline-flex shrink-0 items-center gap-3 self-start border-[3px] border-[#111] bg-white px-6 py-4 text-xs font-black uppercase shadow-[4px_4px_0_#111]">Explore Papyrus <ArrowRight size={18}/></Link>
    </div></section>
    <SiteFooter />
  </main>
}
