import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SiteFooter } from '@/components/site-footer'
import { TrialCtaLink } from '@/components/trial-cta-link'

export type SolutionPageContent = {
  eyebrow: string
  title: string
  description: string
  steps: readonly { title: string; description: string }[]
  result: string
}

export function SolutionPage({ content }: { content: SolutionPageContent }) {
  return <main className="min-h-screen bg-[#fafaf9] text-[#111]">

    <PageHero label={content.eyebrow} title={content.title} description={content.description} />
    <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
      <p className="mb-3 font-mono text-xs font-black uppercase tracking-widest text-[#a43d11]">How it works</p>
      <h2 className="display-black mb-10 text-[length:min(3rem,9vw)] leading-[1.1]">A practical path to production.</h2>
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
      <div><p className="font-mono text-xs font-black uppercase tracking-widest">Run it on Papyrus</p><h2 className="display-black mt-3 text-[length:min(2.25rem,9vw)] leading-[1.1] lg:text-5xl">{content.result}</h2></div>
      <TrialCtaLink placement="section" className="inline-flex shrink-0 items-center gap-3 self-start border-[3px] border-[#111] bg-white px-6 py-4 text-xs font-black uppercase shadow-[4px_4px_0_#111]">Try Papyrus now <ArrowRight size={18}/></TrialCtaLink>
    </div></section>
    <SiteFooter />
  </main>
}
