'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, FileText, PanelsTopLeft, Terminal, Workflow } from 'lucide-react'

const FEATURES = [
  {
    number: '01', kicker: 'DOCUMENT AUTOMATION', title: 'Put your documents to work.',
    copy: 'Turn PDFs, forms, and office files into structured information, reviewable actions, and repeatable workflows.',
    result: 'Documents → structured work', href: '/solutions/document-automation',
    Icon: FileText,
    lines: ['Read source documents', 'Extract and normalize fields', 'Review evidence and approve'],
    code: ['SOURCE / CONTRACT-INTAKE.PDF', 'extract → obligations', 'normalize → approved schema', 'review → human decision'],
  },
  {
    number: '02', kicker: 'INTERNAL APP FACTORY', title: 'Build around how your team works.',
    copy: 'Create useful apps, forms, and dashboards for the processes your organization already runs.',
    result: 'Requirements → internal apps', href: '/solutions/internal-app-factory',
    Icon: PanelsTopLeft,
    lines: ['Describe a business process', 'Generate usable interfaces', 'Validate, deploy, iterate'],
    code: ['INPUT / WORKFLOW REQUIREMENTS', 'compose → application', 'connect → existing data', 'deploy → your environment'],
  },
  {
    number: '03', kicker: 'LEGACY MODERNIZATION', title: 'Modernize without starting over.',
    copy: 'Make terminals and SOAP/XML services usable through modern APIs and browser interfaces, while preserving systems of record.',
    result: 'Legacy systems → modern services', href: '/solutions/agentic-modernization',
    Icon: Terminal,
    lines: ['Connect existing systems', 'Expose governed API interfaces', 'Give operators a better UX'],
    code: ['LEGACY / TN3270 + SOAP', 'adapt → canonical data', 'publish → OpenAPI endpoint', 'build → React interface'],
  },
]

export function ModernizationFeatureCarousel() {
  const [active, setActive] = useState(0)
  const current = FEATURES[active]
  const Icon = current.Icon
  const go = (offset: number) => setActive(i => (i + offset + FEATURES.length) % FEATURES.length)
  return <section id="capabilities" className="border-b-[3px] border-[#111] bg-[#fafaf9] px-6 py-20 lg:px-9 lg:py-28" aria-label="Modernization solutions">
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-10 max-w-4xl">
        <span className="nb-label mb-5 inline-block !bg-[#ff5f1f]">What we modernize</span>
        <h2 className="display-black text-[45px] leading-[.95] sm:text-[64px] lg:text-[76px]">Better workflows. Not bigger problems.</h2>
        <p className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-[#444]">We connect your documents, applications, and legacy systems—then build practical ways for your team to use them.</p>
      </div>
      <div className="flex flex-wrap gap-2 pb-5" role="tablist" aria-label="Select a modernization solution">
        {FEATURES.map((feature, index) => <button key={feature.number} type="button" role="tab" id={`modernization-tab-${index}`} aria-selected={index === active} aria-controls="modernization-panel" onClick={() => setActive(index)} className={`border-[3px] border-[#111] px-4 py-3 text-left font-mono text-[11px] font-black uppercase tracking-wide transition-colors focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ff5f1f] ${active === index ? 'bg-[#ff5f1f] shadow-[4px_4px_0_#111]' : 'bg-white hover:bg-[#ffe7da]'}`}>
          <span className="mr-3">{feature.number}</span>{feature.kicker}
        </button>)}
      </div>
      <div id="modernization-panel" role="tabpanel" aria-labelledby={`modernization-tab-${active}`} className="grid overflow-hidden border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111] lg:grid-cols-2">
        <div className="flex min-h-[470px] flex-col p-7 sm:p-12">
          <div className="mb-10 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f]"><Icon size={27} strokeWidth={2.4}/></div><span className="font-mono text-xs font-black tracking-widest">{current.number} / SOLUTION</span></div>
          <h3 className="display-black max-w-xl text-[42px] leading-[.98] sm:text-[58px]">{current.title}</h3>
          <p className="mt-6 max-w-xl text-base font-medium leading-7 text-[#444]">{current.copy}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-6 pt-10">
            <Link href={current.href} className="inline-flex items-center gap-3 border-[3px] border-[#111] bg-[#ff5f1f] px-5 py-3 font-mono text-[11px] font-black uppercase shadow-[4px_4px_0_#111] transition hover:-translate-y-px">Explore solution <ArrowRight size={17}/></Link>
            <div className="flex gap-2"><button type="button" aria-label="Previous solution" onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center border-[3px] border-[#111] bg-white hover:bg-[#ffe7da]"><ArrowLeft size={18}/></button><button type="button" aria-label="Next solution" onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center border-[3px] border-[#111] bg-white hover:bg-[#ffe7da]"><ArrowRight size={18}/></button></div>
          </div>
        </div>
        <div className="flex min-h-[470px] flex-col border-t-[3px] border-[#111] bg-[#fff3eb] p-6 lg:border-l-[3px] lg:border-t-0 lg:p-10">
          <div className="flex items-center justify-between border-[3px] border-[#111] bg-white px-4 py-3 font-mono text-xs font-black"><span className="flex items-center gap-2"><Workflow size={16}/> WORKFLOW / {current.number}</span><span className="bg-[#d9f99d] px-2 py-1 text-[10px]">REVIEWABLE</span></div>
          <div className="flex flex-col gap-3 border-x-[3px] border-b-[3px] border-[#111] bg-white p-5">
            {current.lines.map((line, i) => <div key={line} className="flex items-center gap-3 border-2 border-[#111] bg-[#fafaf9] px-4 py-4 font-semibold"><span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#111] bg-[#ff5f1f]"><Check size={15} strokeWidth={3}/></span><span>{line}</span><span className="ml-auto font-mono text-[10px] text-[#777]">0{i+1}</span></div>)}
          </div>
          <div className="mt-5 border-[3px] border-[#111] bg-[#171717] p-5 font-mono text-[12px] leading-7 text-[#e6ffe6] shadow-[5px_5px_0_#ff5f1f]" aria-label="Example modernization workflow">
            {current.code.map((line,i)=><div key={line} className={i===0 ? 'text-[#ffad84]' : ''}>{i===0 ? '> ' : '  '}{line}</div>)}
          </div>
          <div className="mt-auto pt-5 font-mono text-xs font-black uppercase tracking-wider">{current.result}</div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between"><span className="font-mono text-xs font-bold">0{active+1} / 0{FEATURES.length}</span><div className="flex gap-2" aria-label="Feature progress">{FEATURES.map((feature,i)=><button type="button" onClick={()=>setActive(i)} aria-label={`Show ${feature.kicker}`} key={feature.number} className={`h-2.5 w-16 border border-[#111] ${active===i ? 'bg-[#ff5f1f]' : 'bg-white'}`} />)}</div></div>
    </div>
  </section>
}
