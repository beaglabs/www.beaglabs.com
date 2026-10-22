'use client'

import { useEffect, useState } from 'react'
import { Check, FileText, Pause, Play } from 'lucide-react'
import { DemoWindow, shortHash } from '@/components/demos/demo-window'

const STEPS = ['Ingest', 'Resolve', 'Reconcile', 'Approve', 'Write back'] as const

const LINES: [string, number, number, number][] = [
  ['Janitorial supplies, case', 40, 38.5, 38.5],
  ['Floor scrubber pads', 12, 22.0, 22.0],
  ['HVAC filters 20x25', 60, 14.25, 14.67],
]

function Panel({ step, approved, onApprove }: { step: number; approved: boolean; onApprove: () => void }) {
  if (step === 0) return <div className="grid gap-4 sm:grid-cols-2">
    <div className="border-2 border-[#111]">
      <p className="border-b-2 border-[#111] bg-[#f4f2ef] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.1em]">ap@agency.gov · 09:14</p>
      <div className="p-3 text-[12px] leading-5"><b>Acme Supply Co.</b><br />Invoice INV-88213 for October deliveries to both campuses.
        <span className="mt-2 flex items-center gap-2 border-2 border-[#111] px-2 py-1 font-mono text-[11px] font-bold"><FileText className="h-3.5 w-3.5" /> INV-88213.pdf</span></div>
    </div>
    <dl className="grid grid-cols-2 content-start gap-2">
      {[['Invoice', 'INV-88213'], ['Total', '$18,240.17'], ['Lines', '3'], ['Ship-to', '2 campuses']].map(([k, v]) => <div key={k} className="border-2 border-[#111] p-2"><dt className="font-mono text-[9px] uppercase tracking-[.12em] text-[#666]">{k}</dt><dd className="text-[14px] font-extrabold">{v}</dd></div>)}
    </dl>
  </div>
  if (step === 1) return <div className="space-y-2">
    {[['Vendor', 'Acme Supply Co.', 'Vendor class · 3 source records', 99], ['Ship-to North campus', 'Beag Holdings East', 'Legal entity · Dynamics 365', 97], ['Ship-to South campus', 'Beag Holdings West', 'Legal entity · NetSuite', 96]].map(([from, to, note, conf]) => <div key={from as string} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 border-2 border-[#111] px-3 py-2 text-[12px]">
      <span className="font-semibold">{from}</span><span aria-hidden="true">→</span>
      <span><b>{to}</b><span className="block font-mono text-[9px] uppercase text-[#666]">{note}</span></span>
      <span className="font-mono text-[11px] font-bold">{conf}%</span>
    </div>)}
  </div>
  if (step === 2) return <div className="overflow-x-auto">
    <table className="w-full min-w-[420px] border-collapse text-[12px]">
      <thead><tr className="border-b-2 border-[#111] text-left font-mono text-[10px] uppercase tracking-[.1em]"><th className="py-1.5">Line</th><th>Qty</th><th>PO price</th><th>Invoice</th><th className="w-[130px]">Variance · 2% tolerance</th></tr></thead>
      <tbody>{LINES.map(([line, qty, po, inv]) => {
        const v = Math.abs(inv - po) / po * 100
        return <tr key={line} className="border-b border-[#111]/10">
          <td className="py-2 font-semibold">{line}</td><td>{qty}</td><td>${po.toFixed(2)}</td><td>${inv.toFixed(2)}</td>
          <td><span className="relative block h-3 border border-[#111] bg-white"><span className={`block h-full ${v > 2 ? 'bg-[#dc2626]' : v > 0 ? 'bg-[#ff5f1f]' : 'bg-[#111]'}`} style={{ width: `${Math.max(4, Math.min(100, v / 4 * 100))}%` }} /><span className="absolute inset-y-0 left-1/2 w-[2px] bg-[#111]" /></span><span className="font-mono text-[10px]">{v.toFixed(1)}%</span></td>
        </tr>
      })}</tbody>
    </table>
    <p className="mt-3 text-[12px] font-semibold">HVAC filters are 2.9% over the PO price, above tolerance, so this invoice goes to a person.</p>
  </div>
  if (step === 3) return <div className="flex flex-wrap items-start gap-4">
    <div className="w-[230px] border-[3px] border-[#111] shadow-[4px_4px_0_#111]">
      <div className="flex items-center justify-between border-b-2 border-[#111] px-3 py-1.5"><b className="text-[12px]">Controller review</b><span className="bg-[#111] px-1 font-mono text-[9px] text-white">1 of 2</span></div>
      <div className="space-y-1 p-3 text-[11px] font-semibold"><span className="inline-block border border-[#111] bg-[#fff1e9] px-1.5 font-mono text-[9px]">if variance &gt; 2%</span><div>Maria Chen</div><div>Priya Patel</div><div className="font-mono text-[9px] uppercase text-[#666]">SLA 4 hours</div></div>
    </div>
    <div className="min-w-[200px] flex-1">
      <p className="text-[13px] leading-6">The agent paused with the evidence attached: the invoice, PO-7741, receipt GR-1180 and the vendor's price notice.</p>
      {approved ? <p className="mt-3 flex items-center gap-2 text-[13px] font-bold"><Check className="h-4 w-4 text-[#16a34a]" strokeWidth={3} /> Approved by Maria Chen · 09:41</p>
        : <button type="button" onClick={onApprove} className="nb-btn-orange mt-3 px-3 py-2 font-mono text-[10px] uppercase">Approve the variance</button>}
    </div>
  </div>
  return <div className="grid gap-3 sm:grid-cols-2">
    {[['Dynamics 365', 'Beag Holdings East', '$11,620.55'], ['NetSuite', 'Beag Holdings West', '$6,619.62']].map(([sys, entity, amount]) => <div key={sys} className="border-2 border-[#111]">
      <p className="flex items-center justify-between border-b-2 border-[#111] bg-[#dcfce7] px-3 py-1.5 text-[12px] font-extrabold">{sys}<Check className="h-4 w-4" strokeWidth={3} /></p>
      <div className="p-3 text-[12px]"><b>{entity}</b><br />Vendor bill · {amount}<span className="mt-1 block font-mono text-[10px] text-[#666]">ledger {shortHash(sys + amount)}</span></div>
    </div>)}
  </div>
}

/** Agentic ERP: one multi-entity invoice, step by step, with the exception routed to a person. */
export function InvoiceRun() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    if (!playing) return
    if (step === 3 && !approved) { setPlaying(false); return }
    if (step >= STEPS.length - 1) { setPlaying(false); return }
    const t = window.setTimeout(() => setStep((s) => s + 1), 1600)
    return () => window.clearTimeout(t)
  }, [playing, step, approved])

  const play = () => { if (step >= STEPS.length - 1) { setStep(0); setApproved(false) } setPlaying(true) }

  return <DemoWindow title="Run · INV-88213 · two legal entities">
    <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-[#111] px-4 py-3">
      <button type="button" onClick={() => playing ? setPlaying(false) : play()} className="nb-btn-orange flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase">{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{playing ? 'Pause' : 'Run'}</button>
      <ol className="flex flex-1 flex-wrap gap-1.5">
        {STEPS.map((s, i) => <li key={s}><button type="button" onClick={() => { setPlaying(false); setStep(i) }} className={`flex items-center gap-1.5 border-2 border-[#111] px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${i === step ? 'bg-[#111] text-white' : i < step ? 'bg-[#fff1e9]' : 'bg-white'}`}>
          <span className={i === step ? 'text-[#ff8a5c]' : 'text-[#c2410c]'}>{i + 1}</span>{s}
        </button></li>)}
      </ol>
    </div>
    <div className="min-h-[230px] p-4"><Panel step={step} approved={approved} onApprove={() => { setApproved(true); setPlaying(true) }} /></div>
  </DemoWindow>
}
