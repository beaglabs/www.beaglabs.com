import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'

export type SolutionPageContent = {
  eyebrow: string
  title: string
  description: string
  steps: readonly { title: string; description: string }[]
  result: string
}

export function SolutionPage({ content }: { content: SolutionPageContent }) {
  return <main className="min-h-screen bg-[#fdeee1] text-[#1a1714]">

    <section className="site-hero relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#fffaf3] pt-8">
      <div className="relative mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
        <Link href="/products/papyrus" className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider underline underline-offset-4">Papyrus / Solutions</Link>
        <div className="max-w-4xl"><span className="nb-label mb-6 inline-block bg-[#e5632f]">{content.eyebrow}</span>
          <h1 className="display-black max-w-4xl text-[length:min(3.3rem,9vw)] md:text-[clamp(3.3rem,7vw,6.5rem)] leading-[.95]">{content.title}</h1>
          <p className="mt-8 max-w-3xl text-lg font-semibold leading-relaxed text-[#4a3d33]">{content.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/#compute-credit" className="inline-flex items-center gap-2 border-[3px] border-[#1a1714] bg-[#e5632f] px-6 py-4 text-xs font-black uppercase shadow-[4px_4px_0_#1a1714]">Get $1,000 compute credit <ArrowRight size={17}/></a>
            <Link href="/contact" className="inline-flex items-center gap-2 border-[3px] border-[#1a1714] bg-[#fffaf3] px-6 py-4 text-xs font-black uppercase">Talk to us</Link>
          </div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
      <p className="mb-3 font-mono text-xs font-black uppercase tracking-widest text-[#b2391a]">How it works</p>
      <h2 className="display-black mb-10 text-[length:min(3rem,9vw)] leading-[1.1]">A practical path to production.</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {content.steps.map((step, index) => <article key={step.title} className="flex flex-col border-[3px] border-[#1a1714] bg-[#fffaf3] p-7 shadow-[6px_6px_0_#1a1714]">
          <span className="mb-9 font-mono text-sm font-black text-[#b2391a]">0{index + 1}</span>
          <h3 className="mb-4 text-2xl font-black">{step.title}</h3>
          <p className="text-sm font-medium leading-7 text-[#5b4a3d]">{step.description}</p>
          <CheckCircle2 className="mt-auto pt-7 text-[#e5632f]" size={44}/>
        </article>)}
      </div>
    </section>
    <section className="border-y-[3px] border-[#1a1714] bg-[#e5632f]"><div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-9">
      <div><p className="font-mono text-xs font-black uppercase tracking-widest">Built with Papyrus</p><h2 className="display-black mt-3 text-[length:min(2.25rem,9vw)] leading-[1.1] lg:text-5xl">{content.result}</h2></div>
      <Link href="/products/papyrus" className="inline-flex shrink-0 items-center gap-3 self-start border-[3px] border-[#1a1714] bg-[#fffaf3] px-6 py-4 text-xs font-black uppercase shadow-[4px_4px_0_#1a1714]">Explore Papyrus <ArrowRight size={18}/></Link>
    </div></section>
    <SiteFooter />
  </main>
}
