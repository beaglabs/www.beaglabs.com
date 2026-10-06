'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, RotateCcw, Send } from 'lucide-react'
import styles from './modernization-demos.module.css'
import { FluidRendering } from '@/components/ui/illustration-fluid-rendering'
import { DynamicIsland, DynamicIslandProvider, DynamicContainer, useDynamicIslandSize } from '@/components/ui/dynamic-island'

function DocumentStatus({ busy, complete }: { busy: boolean; complete: boolean }) {
  const { setSize } = useDynamicIslandSize()
  useEffect(() => { setSize(busy ? 'large' : 'compactLong') }, [busy, setSize])
  return <DynamicIsland id="document-status"><DynamicContainer className="flex h-full items-center justify-center gap-3 px-4 font-mono text-xs font-bold"><span className={`h-2 w-2 bg-[#111] ${busy ? 'animate-pulse motion-reduce:animate-none' : ''}`} />{busy ? 'Reading → comparing → drafting' : complete ? 'Source-linked output ready' : 'Your documents. Ready to query.'}</DynamicContainer></DynamicIsland>
}

const examples = [
  { prompt: 'Break these documents into requirements.', heading: 'A requirements register, grounded in the source.', rows: [
    ['REQ-001', 'Applicants can submit a service request online.', 'Program brief.pdf · p. 4'],
    ['REQ-002', 'Route each request to an assigned case owner.', 'Intake policy.docx · §2'],
    ['REQ-003', 'Track delivery milestones and flag overdue work.', 'Delivery plan.xlsx · Milestones!B7'],
  ] },
  { prompt: 'Find gaps between the policy and delivery plan.', heading: 'Two gaps to resolve before delivery.', rows: [
    ['GAP-001', 'The policy requires a case owner; the plan has no assignment step.', 'Intake policy.docx · §2 ↔ Delivery plan.xlsx · Tasks!A8'],
    ['GAP-002', 'The brief requires online intake; the plan only covers manual entry.', 'Program brief.pdf · p. 4 ↔ Delivery plan.xlsx · Tasks!A3'],
  ] },
  { prompt: 'Create acceptance criteria for the intake app.', heading: 'Acceptance criteria your team can act on.', rows: [
    ['AC-001', 'Given a complete request, submission creates a reference number.', 'Program brief.pdf · p. 4'],
    ['AC-002', 'Given a new request, a case owner can review its status.', 'Intake policy.docx · §2'],
    ['AC-003', 'Given an overdue milestone, the dashboard flags it for review.', 'Delivery plan.xlsx · Milestones!B7'],
  ] },
]

export function FlowDots() {
  return <div className={styles.flow} aria-hidden="true"><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></div>
}

export function DocumentDemo() {
  const [query, setQuery] = useState(examples[0].prompt)
  const [result, setResult] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function run() {
    if (busy || !query.trim()) return
    setBusy(true)
    setResult(null)
    const lower = query.toLowerCase()
    const selected = /gap|conflict|difference/.test(lower) ? 1 : /acceptance|criteria|test/.test(lower) ? 2 : 0
    timer.current = setTimeout(() => { setResult(selected); setBusy(false) }, 1100)
  }

  return (
    <div className="border-[3px] border-[#111] bg-[#f0eee8] shadow-[8px_8px_0_#111]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#111] bg-white px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[.12em]">
        <span>01 / Document automation</span><span className="flex items-center gap-2"><span className="h-2 w-2 bg-[#ff5f1f]" />Interactive example · sample documents</span>
      </div>
      <div className="grid items-center gap-7 p-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:p-7">
        <div className="min-w-0">
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest">Your existing knowledge → working context</p>
          <FluidRendering className="h-auto w-full overflow-visible" cardFill="white" cardStroke="#111" connectorFill="#ff5f1f" connectorStroke="#111" connectorLineColor="#111" mutedTextColor="#111" textColor="#111" topIcon={<text y="10" fontSize="12" fill="#111">✓</text>} upperMidIcon={<text y="10" fontSize="12" fill="#111">?</text>} lowerMidIcon={<text y="10" fontSize="12" fill="#111">↗</text>} bottomIcon={<text y="10" fontSize="12" fill="#111">✓</text>} />
          <p className="mt-4 text-xs leading-5 text-[#555]">Program brief.pdf · Intake policy.docx · Delivery plan.xlsx / CSV</p>
          <p className="mt-2 text-[10px] text-[#777]">File icons: <a href="https://www.flaticon.com/free-icon/pdf_337946" className="underline">Dimitry Miroliubov</a>, <a href="https://www.flaticon.com/free-icon/docx_7817499" className="underline">Freepik (DOCX)</a> &amp; <a href="https://www.flaticon.com/free-icon/csv_8242984" className="underline">mpanicon (CSV)</a> via Flaticon.</p>
        </div>
        <div className="min-w-0 border-[3px] border-[#111] bg-white p-4">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"><span className="h-2 w-2 bg-[#ff5f1f]" />Ask Papyrus</p>
          <form onSubmit={event => { event.preventDefault(); run() }}>
            <label htmlFor="document-prompt" className="sr-only">Document prompt</label>
            <textarea id="document-prompt" value={query} onChange={event => setQuery(event.target.value)} rows={3} maxLength={300} required className="w-full resize-none border-2 border-[#111] bg-[#fafaf9] p-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5f1f]" />
            <button disabled={busy} type="submit" className="nb-btn-orange mt-3 flex w-full items-center justify-between px-3 py-3 text-xs disabled:opacity-60">{busy ? 'Reading sample sources…' : 'Run example'}<Send className="h-4 w-4" aria-hidden="true" /></button>
          </form>
        </div>
      </div>
      <div className="px-5 pb-6"><DynamicIslandProvider initialSize="compactLong"><DocumentStatus busy={busy} complete={result !== null} /></DynamicIslandProvider></div>
      <div className="flex flex-wrap items-center gap-2 px-5 pb-5 lg:px-7">
        <span className="mr-1 font-mono text-[10px] uppercase text-[#555]">Try a prompt</span>
        {examples.map((example, index) => <button key={example.prompt} disabled={busy} onClick={() => { setQuery(example.prompt); setResult(null) }} className="border-2 border-[#111] bg-white px-3 py-2 text-[11px] font-bold transition-colors hover:bg-[#ff5f1f] disabled:opacity-60">{['Requirements', 'Find gaps', 'Acceptance criteria'][index]}<ArrowRight className="ml-2 inline h-3 w-3" aria-hidden="true" /></button>)}
      </div>
      <div aria-live="polite" aria-busy={busy} className="border-t-[3px] border-[#111] bg-white p-5 lg:p-7">
        {result === null ? <p className="text-sm text-[#555]">{busy ? 'Organizing context → comparing source documents → drafting an output.' : 'Run an example to see source-linked requirements, gaps, or acceptance criteria.'}</p> : <>
          <div className="mb-5 flex items-start justify-between gap-3"><h3 className="text-lg font-extrabold">{examples[result].heading}</h3><button aria-label="Reset document example" onClick={() => { setResult(null); setQuery(examples[0].prompt) }} className="p-1"><RotateCcw className="h-4 w-4" /></button></div>
          <div className="grid gap-3 md:grid-cols-3">{examples[result].rows.map(([id, requirement, source]) => <article key={id} className="border-2 border-[#111] bg-[#fafaf9] p-4"><p className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#b63700]"><Check className="h-3 w-3" aria-hidden="true" />{id}</p><p className="my-3 text-sm font-semibold leading-6">{requirement}</p><p className="border-t border-[#ccc] pt-3 font-mono text-[10px] leading-5 text-[#555]">{source}</p></article>)}</div>
          <p className="mt-4 text-xs text-[#666]">Illustrative outputs from the sample documents. In Papyrus, your source material becomes the working context.</p>
        </>}
      </div>
    </div>
  )
}
