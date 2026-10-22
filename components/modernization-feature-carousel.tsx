'use client'


import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight, FileText, PanelsTopLeft, Terminal } from 'lucide-react'
import { StickySection } from '@/components/ui/feature-sticky-section'

const FEATURES = [
  {
    number: '01', video: '/hero/solution-documents.mp4', poster: '/hero/solution-documents.jpg', kicker: 'Document automation', title: 'We learn your paperwork, then automate it.',
    copy: 'We study how documents really move through your organization and test extraction on your own files. Then we ship structured, reviewable workflows your team runs every day.',
    result: 'Your documents → structured work', href: '/solutions/document-automation', Icon: FileText,
    steps: ['Study real documents', 'Prove extraction on your files', 'Ship reviewed workflows'],
  },
  {
    number: '02', video: '/hero/solution-apps.mp4', poster: '/hero/solution-apps.jpg', kicker: 'Internal applications', title: 'Describe the process. We ship the app.',
    copy: 'We sit with the people who run the process, then produce the forms, dashboards, and tools for it. Built, tested, and deployed in weeks, and improved as you use them.',
    result: 'A process → working software', href: '/solutions/internal-app-factory', Icon: PanelsTopLeft,
    steps: ['Map the process with your team', 'Generate and test the app', 'Deploy, measure, improve'],
  },
  {
    number: '03', video: '/hero/solution-legacy.mp4', poster: '/hero/solution-legacy.jpg', kicker: 'Legacy modernization', title: 'We figure out the old system so you keep it.',
    copy: 'We dig into terminals and SOAP/XML services, document what they actually do, and wrap them in governed APIs and modern screens. Your systems of record stay in place.',
    result: 'Legacy systems → modern services', href: '/solutions/agentic-modernization', Icon: Terminal,
    steps: ['Investigate the system', 'Expose governed APIs', 'Give operators a better UX'],
  },
]

function PanelVideo({ src, poster, caption }: { src: string, poster: string, caption: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {})
      else el.pause()
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [src])
  return <figure>
    <div className="overflow-hidden border-[3px] border-[#111] bg-[#f5f0e8] shadow-[8px_8px_0_#111]">
      <video ref={ref} className="aspect-video w-full object-cover" src={src} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />
    </div>
    <figcaption className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#222]">{caption}</figcaption>
  </figure>
}

export function ModernizationFeatureCarousel() {
  return <section id="capabilities" className="relative border-b-[3px] border-[#111] bg-[#ffe7da] px-6 py-20 text-[#111] lg:px-9 lg:py-28" aria-label="How we work">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <video className="h-full w-full object-cover opacity-50 motion-reduce:hidden" src="/hero/clip-2.mp4" poster="/hero/poster-2.jpg" autoPlay muted loop playsInline preload="metadata" />
      <img className="hidden h-full w-full object-cover opacity-50 motion-reduce:block" src="/hero/poster-2.jpg" alt="" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#ffe7da]/95 via-[#ffe7da]/90 to-[#ffe7da]/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffe7da]/70 via-transparent to-[#ffe7da]/80" />
    </div>
    <div className="relative mx-auto max-w-[1440px]">
      <div className="mb-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:gap-16">
        <div>
          <span className="nb-label mb-5 inline-block !bg-[#ff5f1f]">How we work</span>
          <h2 className="display-black text-[length:min(45px,9vw)] leading-[.95] sm:text-[64px] lg:text-[76px]">We work the problem. Then we ship the system.</h2>
        </div>
        <p className="text-base font-medium leading-relaxed text-[#111]">Every engagement starts by understanding the mission and the systems behind it. Then our engineers and superintelligent agents turn that understanding into software your team runs, again and again.</p>
      </div>

      <StickySection.Root className="border-t border-[#111]/30">
        <div className="flex">
          <aside className="sticky top-28 hidden w-72 shrink-0 self-start py-10 pr-10 md:block" aria-label="Solutions">
            <StickySection.List className="flex flex-col">
              {FEATURES.map((f, i) => <StickySection.Item key={f.number} index={i} className="group border-l-2 border-[#111]/20 transition-colors data-[state=active]:border-[#ff5f1f]">
                <StickySection.Trigger index={i} className="block w-full cursor-pointer py-3 pl-5 text-left opacity-70 transition-opacity hover:opacity-100 group-data-[state=active]:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5f1f]">
                  <span className="block font-mono text-[11px] font-semibold tracking-wider text-[#c2410c]">{f.number}</span>
                  <span className="mt-0.5 block text-[15px] font-semibold text-[#111]">{f.kicker}</span>
                </StickySection.Trigger>
              </StickySection.Item>)}
            </StickySection.List>
          </aside>

          <StickySection.Content className="w-full min-w-0 md:border-l md:border-[#111]/30">
            {FEATURES.map((f, i) => <StickySection.Panel key={f.number} index={i} className={`scroll-mt-12 px-0 py-10 md:px-12 md:py-12 ${i < FEATURES.length - 1 ? 'border-b border-[#111]/30' : ''}`}>
              <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16">
                <div className="flex flex-col">
                  <div className="mb-6 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#222]">
                    <f.Icon size={18} strokeWidth={2} className="text-[#ff5f1f]" /> {f.number} / {f.kicker}
                  </div>
                  <h3 className="max-w-md text-balance text-[32px] font-bold leading-[1.1] tracking-tight text-[#111] sm:text-[40px]">{f.title}</h3>
                  <p className="mt-5 max-w-md text-base leading-7 text-[#111]">{f.copy}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-10">
                    <Link href={f.href} className="inline-flex items-center gap-2 border-2 border-[#111] bg-[#ff5f1f] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#111] transition-colors hover:bg-[#ff7a45]">Explore solution <ArrowRight size={15} /></Link>
                    <span className="text-sm font-medium text-[#222]">{f.result}</span>
                  </div>
                </div>
                <PanelVideo src={f.video} poster={f.poster} caption={f.steps.join(' → ')} />
              </div>
            </StickySection.Panel>)}
          </StickySection.Content>
        </div>
      </StickySection.Root>
    </div>
  </section>
}
