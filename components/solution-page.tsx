import Link from 'next/link'
import { ArrowRight, ClipboardList, FileCheck2, Server, ShieldCheck } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { EdgyHero, heroButtonPrimary, heroButtonSecondary } from '@/components/edgy-hero'
import { ExtractionReview } from '@/components/demos/extraction-review'
import { AppGenerator } from '@/components/demos/app-generator'
import { LegacyBridge } from '@/components/demos/legacy-bridge'
import { ProjectGrid } from '@/components/project-gallery'

const DEMOS = { extraction: ExtractionReview, apps: AppGenerator, legacy: LegacyBridge } as const

export type SolutionPageContent = {
  eyebrow: string
  title: string
  /** The hero headline in three parts; the middle one sits on the black slab. */
  headline: readonly [string, string, string]
  description: string
  steps: readonly { title: string; description: string }[]
  result: string
  /** The live demo shown beside the hero. */
  demo: keyof typeof DEMOS
  /** Three short outcomes under the hero copy. */
  highlights: readonly string[]
  /** Project-gallery kinds that belong to this solution. */
  projects: readonly string[]
}

const DELIVERABLES = [
  { Icon: ClipboardList, title: 'Discovery memo', copy: 'The process, the systems involved and the approach we recommend, written for your program team.' },
  { Icon: Server, title: 'Working software', copy: 'Running in your environment against real cases, not a demo on our laptop.' },
  { Icon: FileCheck2, title: 'Deployment assets', copy: 'Infrastructure, configuration and a runbook your team can own and operate.' },
  { Icon: ShieldCheck, title: 'Evidence package', copy: 'Tests, review records and documentation ready for your approvers and assessors.' },
]

/** A solution area: live demo up top, the path to production, the projects it covers, and what every engagement delivers. */
export function SolutionPage({ content }: { content: SolutionPageContent }) {
  const Demo = DEMOS[content.demo]
  return <main className="min-h-screen bg-[#fafaf9] text-[#111]">

    <EdgyHero
      background="dusk"
      size="md"
      asideWidth="wide"
      asideBare
      breadcrumb={<nav aria-label="Breadcrumb"><Link href="/#capabilities" className="underline underline-offset-4 hover:text-[#ffb894]">Solutions</Link> <span className="text-[#ff5f1f]">/</span> {content.eyebrow}</nav>}
      eyebrow={content.eyebrow}
      before={content.headline[0]}
      slab={content.headline[1]}
      after={content.headline[2]}
      description={<>
        <p>{content.description}</p>
        <ul className="mt-4 space-y-2 border-t border-white/20 pt-4">
          {content.highlights.map((h) => <li key={h} className="flex items-start gap-3 text-[15px]"><span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 bg-[#ff5f1f]" />{h}</li>)}
        </ul>
      </>}
      actions={<>
        <a href="/#solution-brief" className={heroButtonPrimary}>Request a solution brief <ArrowRight size={17} /></a>
        <Link href="/contact" className={heroButtonSecondary}>Talk to us</Link>
      </>}
      next={{ href: "#how-it-works", label: "How it works" }}
      aside={<div><p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[.14em] text-white">Try it · working demo on sample data</p><Demo /></div>}
    />

    <section id="how-it-works" className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="nb-label mb-4 inline-block">How it works</span>
          <h2 className="display-black text-[length:min(3rem,9vw)] leading-[1]">A practical path to production.</h2>
        </div>
        <p className="max-w-[420px] text-[15px] font-medium leading-7 text-[#333]">Each step ends with something you can see and test. Nothing moves to the next step until your team signs off.</p>
      </div>
      <ol className="grid gap-0 border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111] md:grid-cols-3">
        {content.steps.map((step, index) => <li key={step.title} className={`relative flex flex-col p-7 ${index > 0 ? 'border-t-[3px] border-[#111] md:border-l-[3px] md:border-t-0' : ''}`}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-[#111] font-mono text-[15px] font-bold text-[#ff5f1f]">0{index + 1}</span>
            {index < content.steps.length - 1 && <span aria-hidden="true" className="hidden h-[3px] flex-1 bg-[repeating-linear-gradient(90deg,#111_0_8px,transparent_8px_14px)] md:block" />}
          </div>
          <h3 className="mb-3 text-[22px] font-extrabold leading-tight">{step.title}</h3>
          <p className="text-[15px] leading-7 text-[#444]">{step.description}</p>
        </li>)}
      </ol>
    </section>

    <section className="site-hero border-y-[3px] border-[#111] px-6 py-20 lg:px-9">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="nb-label mb-4 inline-block">What we build</span>
            <h2 className="display-black text-[length:min(2.6rem,8vw)] leading-[1]">Projects in this area</h2>
          </div>
          <Link href="/#capabilities" className="inline-flex items-center gap-2 border-b-2 border-[#111] pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] hover:border-[#ff5f1f] hover:text-[#c2410c]">See every project type <ArrowRight size={14} /></Link>
        </div>
        <ProjectGrid only={content.projects} />
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
      <span className="nb-label mb-4 inline-block">Every engagement includes</span>
      <h2 className="display-black mb-10 text-[length:min(2.6rem,8vw)] leading-[1]">What you walk away with</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DELIVERABLES.map(({ Icon, title, copy }) => <article key={title} className="nb-card bg-white p-6">
          <Icon className="mb-5 h-7 w-7 text-[#ff5f1f]" strokeWidth={2.5} />
          <h3 className="mb-2 text-[19px] font-extrabold">{title}</h3>
          <p className="text-[14px] leading-6 text-[#444]">{copy}</p>
        </article>)}
      </div>
    </section>

    <section className="border-y-[3px] border-[#111] bg-[#ff5f1f]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-9">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-widest">Next step</p>
          <h2 className="display-black mt-3 text-[length:min(2.25rem,9vw)] leading-[1.05] lg:text-5xl">{content.result}</h2>
          <p className="mt-3 max-w-2xl text-[15px] font-semibold leading-7">Delivered by Beag Labs engineers with superintelligent agents, and run on Papyrus inside your boundary.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-4">
          <a href="/#solution-brief" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#111] px-6 py-4 text-xs font-black uppercase text-white shadow-[4px_4px_0_#fff]">Request a solution brief <ArrowRight size={17} /></a>
          <Link href="/products/papyrus" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-6 py-4 text-xs font-black uppercase shadow-[4px_4px_0_#111]">Explore Papyrus <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
    <SiteFooter />
  </main>
}
