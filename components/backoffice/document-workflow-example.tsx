'use client'

import { useState } from 'react'
import { ArrowRight, FileText } from 'lucide-react'

const fields = [
  { label: 'Invoice number', key: 'reference', value: 'INV-1042', explanation: 'A stable reference connects the source document to the work item.' },
  { label: 'Supplier', key: 'supplier', value: 'Example Supplies', explanation: 'The supplier name is proposed from the document and remains available for review.' },
  { label: 'Total', key: 'amount', value: '$240.00', explanation: 'The displayed total becomes a numeric amount with an explicit currency.' },
  { label: 'Purchase order', key: 'purchaseOrder', value: 'Not provided', explanation: 'A missing value stays null. The workflow must ask for review instead of inventing a reference.' },
] as const

export function DocumentWorkflowExample() {
  const [selected, setSelected] = useState(0)
  const [purchaseOrder, setPurchaseOrder] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [prepared, setPrepared] = useState(false)
  const [error, setError] = useState('')
  const record = { reference: 'INV-1042', supplier: 'Example Supplies', amount: 240, currency: 'USD', purchaseOrder: reviewed ? purchaseOrder.trim() : null, status: prepared ? 'handoff_prepared' : reviewed ? 'reviewed' : 'needs_review' }
  function reset() { setSelected(0); setPurchaseOrder(''); setReviewed(false); setPrepared(false); setError('') }
  return <section className="border-y-[3px] border-[#111] bg-[#fafaf9] px-6 py-20 lg:px-9"><div className="mx-auto max-w-[1440px]">
    <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#a43d11]">One document. A reviewable workflow.</p>
    <h2 className="display-black mt-4 text-4xl sm:text-5xl">Turn an invoice into structured work.</h2>
    <p className="mt-6 max-w-[850px] text-base leading-8 text-[#444]">Select a field to follow it from the source document into a structured record. A missing purchase order creates an exception. Resolve it in the demo review step before preparing the handoff.</p>
    <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1.2fr)] lg:items-start">
      <div className="min-w-0 border-[3px] border-[#111] bg-white"><div className="flex items-center gap-2 border-b-2 border-[#111] px-5 py-4 font-mono text-xs font-bold"><FileText size={16} />01 / Example invoice</div><div className="p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Example Supplies / Fictional document</p><h3 className="mb-7 mt-3 text-3xl font-black">INVOICE</h3><div className="space-y-3">{fields.map((field,i) => <button key={field.key} onClick={() => setSelected(i)} aria-pressed={selected === i} className={`flex w-full flex-wrap justify-between gap-3 border-2 px-4 py-3 text-left text-sm ${selected === i ? 'border-[#111] bg-[#ff5f1f]' : 'border-[#ddd] hover:border-[#111]'}`}><span>{field.label}</span><strong>{field.value}</strong></button>)}</div><p className="mt-7 border-t border-[#ddd] pt-4 text-xs leading-6 text-[#666]">The original invoice stays unchanged. A review decision is attached to the work record.</p></div></div>
      <ArrowRight aria-hidden="true" className="hidden justify-self-center self-center text-[#a43d11] lg:block" />
      <div className="min-w-0 border-[3px] border-[#111] bg-white"><div className="border-b-2 border-[#111] px-5 py-4 font-mono text-xs font-bold">02 / Structured work item</div><div className="p-5 sm:p-7"><div className="border-l-4 border-[#ff5f1f] bg-[#fafaf9] p-5"><p className="font-mono text-sm font-bold">{fields[selected].label} → {fields[selected].key}</p><p className="mt-3 text-sm leading-7 text-[#555]">{fields[selected].explanation}</p></div><pre aria-label="Structured invoice record" className="mt-6 overflow-x-auto border-2 border-[#111] p-4 text-xs leading-6">{JSON.stringify(record,null,2)}</pre><p className="mt-5 text-xs leading-6 text-[#666]">This record is assembled from fixed example values. The demonstration does not extract or validate a real invoice.</p></div></div>
    </div>
    <div className="mt-6 grid min-w-0 gap-6 border-[3px] border-[#111] bg-white p-5 sm:p-7 lg:grid-cols-2">
      <div><p className="font-mono text-xs font-bold text-[#a43d11]">03 / Resolve the exception</p><h3 className="mt-3 text-2xl font-black">Keep the decision with a person.</h3><form className="mt-5" onSubmit={event => { event.preventDefault(); if (!/^PO-[0-9]{4}$/.test(purchaseOrder.trim())) { setError('Enter an example reference in the format PO-1042.'); return } setError(''); setReviewed(true) }}><label htmlFor="office-example-po" className="block text-sm font-bold">Reviewer-supplied purchase order</label><input id="office-example-po" value={purchaseOrder} onChange={event => { setPurchaseOrder(event.target.value); setReviewed(false); setPrepared(false); setError('') }} aria-invalid={!!error} aria-describedby="office-example-po-help" className="mt-2 w-full border-2 border-[#111] p-3 font-mono text-sm" placeholder="PO-1042" /><p id="office-example-po-help" className="mt-2 text-xs leading-6 text-[#666]">Use a fictional reference such as PO-1042. No purchasing system is checked.</p>{error && <p role="alert" className="mt-3 text-sm font-bold text-[#a43d11]">{error}</p>}<button className="mt-4 border-2 border-[#111] bg-[#ff5f1f] px-4 py-3 text-xs font-black">Record demo review</button></form></div>
      <div className="min-w-0 border-2 border-[#111] bg-[#fafaf9] p-5"><p className="font-mono text-xs font-bold text-[#a43d11]">04 / Prepare the handoff</p><p role="status" className="mt-4 text-sm leading-7">{prepared ? 'A demo accounts-payable work item is ready. The source reference and review decision travel with it. No payment or external submission occurred.' : reviewed ? 'Demo review recorded. You can now prepare the work item for accounts payable.' : 'Handoff blocked: the purchase-order exception needs review.'}</p><button disabled={!reviewed || prepared} onClick={() => setPrepared(true)} className="mt-5 border-2 border-[#111] bg-[#ff5f1f] px-4 py-3 text-xs font-black disabled:opacity-40">Prepare demo handoff</button><button onClick={reset} className="ml-4 mt-5 text-xs font-bold underline underline-offset-4">Reset example</button></div>
    </div>
    <p className="mt-5 text-xs leading-6 text-[#666]">Interactive illustration with fictional records. All changes stay in this preview; no document service, purchasing system, or payment API is contacted.</p>
  </div></section>
}
