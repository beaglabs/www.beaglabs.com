'use client'

import Link from 'next/link'
import { useState, type ComponentType, type KeyboardEvent } from 'react'
import { ArrowRight, FileText, PanelsTopLeft, Terminal } from 'lucide-react'
import { ExtractionReview } from '@/components/demos/extraction-review'
import { AppGenerator } from '@/components/demos/app-generator'
import { LegacyBridge } from '@/components/demos/legacy-bridge'
import { ProjectGallery } from '@/components/project-gallery'

const FEATURES: { number: string; kicker: string; title: string; copy: string; result: string; href: string; Icon: typeof FileText; steps: string[]; Demo: ComponentType }[] = [
  {
    number: '01', kicker: 'Document automation', title: 'We learn your paperwork, then automate it.',
    copy: 'We study how documents really move through your organization and test extraction on your own files. Then we ship structured, reviewable workflows your team runs every day.',
    result: 'Your documents → structured work', href: '/solutions/document-automation', Icon: FileText,
    steps: ['Study real documents', 'Prove extraction on your files', 'Ship reviewed workflows'], Demo: ExtractionReview,
  },
  {
    number: '02', kicker: 'Internal applications', title: 'Describe the process. We ship the app.',
    copy: 'We sit with the people who run the process, then produce the forms, dashboards, and tools for it. Built, tested, and deployed in weeks, and improved as you use them.',
    result: 'A process → working software', href: '/solutions/internal-app-factory', Icon: PanelsTopLeft,
    steps: ['Map the process with your team', 'Generate and test the app', 'Deploy, measure, improve'], Demo: AppGenerator,
  },
  {
    number: '03', kicker: 'Legacy modernization', title: 'We figure out the old system so you keep it.',
    copy: 'We dig into terminals and SOAP/XML services, document what they actually do, and wrap them in governed APIs and modern screens. Your systems of record stay in place.',
    result: 'Legacy systems → modern services', href: '/solutions/agentic-modernization', Icon: Terminal,
    steps: ['Investigate the system', 'Expose governed APIs', 'Give operators a better UX'], Demo: LegacyBridge,
  },
]

/** The services highlight: how we work, one solution at a time with its live demo, then the range of projects we build. */
export function ModernizationFeatureCarousel() {
  const [active, setActive] = useState(0)
  const f = FEATURES[active]
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = (active + (event.key === 'ArrowRight' ? 1 : FEATURES.length - 1)) % FEATURES.length
    setActive(next)
    document.getElementById(`solution-tab-${next}`)?.focus()
  }

  return <section id="capabilities" className="site-hero relative border-b-[3px] border-[#111] px-6 py-20 text-[#111] lg:px-9 lg:py-28" aria-label="How we work">
    <div className="relative mx-auto max-w-[1440px]">
      <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:gap-16">
        <div>
          <span className="nb-label mb-5 inline-block">How we work</span>
          <h2 className="display-black text-[length:min(45px,9vw)] leading-[.95] sm:text-[64px] lg:text-[76px]">We work the problem. Then we ship the system.</h2>
        </div>
        <p className="border-l-[3px] border-[#ff5f1f] bg-white pl-4 text-base font-medium leading-relaxed text-[#111]">Every engagement starts by understanding the mission and the systems behind it. Then our engineers and superintelligent agents turn that understanding into software your team runs, again and again.</p>
      </div>

      <div className="border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111]">
        <div role="tablist" aria-label="Solutions" onKeyDown={onKey} className="grid grid-cols-1 border-b-[3px] border-[#111] sm:grid-cols-3">
          {FEATURES.map((item, i) => {
            const on = i === active
            return <button
              key={item.number} id={`solution-tab-${i}`} type="button" role="tab" aria-selected={on} aria-controls="solution-panel" tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={`flex items-center gap-4 px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[#ff5f1f] ${i > 0 ? 'border-t-[3px] border-[#111] sm:border-l-[3px] sm:border-t-0' : ''} ${on ? 'bg-[#111] text-white' : 'bg-white text-[#111] hover:bg-[#fff1e9]'}`}
            >
              <span className={`font-mono text-[28px] font-bold leading-none ${on ? 'text-[#ff5f1f]' : 'text-[#c2410c]'}`}>{item.number}</span>
              <span className="min-w-0">
                <span className="block text-[16px] font-extrabold leading-tight">{item.kicker}</span>
                <span className={`mt-0.5 block truncate text-[12px] ${on ? 'text-[#cfcfcf]' : 'text-[#555]'}`}>{item.result}</span>
              </span>
              <item.Icon aria-hidden="true" size={20} strokeWidth={2.5} className={`ml-auto hidden shrink-0 lg:block ${on ? 'text-[#ff5f1f]' : 'text-[#111]/40'}`} />
            </button>
          })}
        </div>

        <div id="solution-panel" role="tabpanel" aria-labelledby={`solution-tab-${active}`} className="grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12">
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-wider text-[#222]">
              <f.Icon size={18} strokeWidth={2.5} className="text-[#ff5f1f]" /> {f.number} / {f.kicker}
            </div>
            <h3 className="text-balance text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[36px]">{f.title}</h3>
            <p className="mt-4 text-base leading-7 text-[#222]">{f.copy}</p>
            <ol className="mt-7 space-y-2">
              {f.steps.map((step, n) => <li key={step} className="flex items-center gap-3 border-2 border-[#111] bg-[#fff1e9] px-3 py-2 text-[13px] font-bold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#111] font-mono text-[11px] text-white">{n + 1}</span>{step}
              </li>)}
            </ol>
            <div className="mt-8 lg:mt-auto lg:pt-8">
              <Link href={f.href} className="nb-btn-orange inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wide">Explore solution <ArrowRight size={15} /></Link>
            </div>
          </div>
          <div className="min-w-0"><f.Demo key={f.number} /></div>
        </div>
      </div>

      <div className="mt-24"><ProjectGallery /></div>
    </div>
  </section>
}
