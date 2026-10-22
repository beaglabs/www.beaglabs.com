'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { DemoWindow, shortHash } from '@/components/demos/demo-window'

const DIFF: [string, string | null, string][] = [
  ['Vendor', 'Acme Supply Co.', 'Acme Supply Co.'],
  ['Legal entity', null, 'Beag Holdings East'],
  ['Amount', null, '$18,240.17'],
  ['Matched PO', null, 'PO-7741'],
  ['GL account', '6100 · Supplies', '6120 · Facilities supplies'],
  ['Due date', null, 'Nov 20, 2026'],
]

const PRIOR = [
  { id: 'A-2203', action: 'Update vendor terms · NetSuite', by: 'Priya Patel' },
  { id: 'A-2204', action: 'Create receipt · Dynamics 365', by: 'Sam Okafor' },
]

/** The Papyrus action ledger: an agent's proposed write as a reviewable diff, then a hash-chained record. */
export function ActionLedger() {
  const [state, setState] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const chain = PRIOR.reduce<{ id: string; action: string; by: string; hash: string; prev: string }[]>((rows, row) => {
    const prev = rows.at(-1)?.hash ?? '00000000'
    return [...rows, { ...row, prev, hash: shortHash(prev + row.id + row.action) }]
  }, [])
  const last = chain.at(-1)!.hash
  const entry = state === 'approved' ? { id: 'A-2205', action: 'Create vendor bill · NetSuite', by: 'Maria Chen', prev: last, hash: shortHash(last + 'A-2205') } : null

  return <DemoWindow title="Action ledger · proposed write">
    <div className="border-b-[3px] border-[#111] px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#c2410c]">Proposed by the AP agent · awaiting Papyrus.Action.Approve</p>
      <p className="mt-1 text-[15px] font-extrabold">Create vendor bill VB-20931 in NetSuite</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse font-mono text-[11px]">
        <thead><tr className="border-b-2 border-[#111] bg-[#f4f2ef] text-left uppercase tracking-[.1em]"><th className="px-4 py-2">Field</th><th className="px-2 py-2">Before</th><th className="px-2 py-2">After</th></tr></thead>
        <tbody>
          {DIFF.map(([field, before, after]) => {
            const changed = before !== after
            return <tr key={field} className="border-b border-[#111]/10">
              <td className="px-4 py-1.5 font-bold">{field}</td>
              <td className={`px-2 py-1.5 ${changed && before ? 'bg-[#fde2e2] line-through' : 'text-[#999]'}`}>{before ?? '∅'}</td>
              <td className={`px-2 py-1.5 ${changed ? 'bg-[#dcfce7] font-bold' : ''}`}>{after}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    <div className="flex gap-3 border-y-[3px] border-[#111] bg-[#fff1e9] px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#111] bg-[#111] font-mono text-[9px] font-bold text-white">AI</span>
      <p className="text-[12px] leading-5"><b>Three-way match passed.</b> PO-7741, receipt GR-1180 and the invoice agree within $0.42. GL moved to 6120 because the PO line is facilities supplies.</p>
    </div>
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      {state === 'pending' ? <>
        <button type="button" onClick={() => setState('approved')} className="nb-btn-orange flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase"><Check className="h-3.5 w-3.5" strokeWidth={3} /> Approve</button>
        <button type="button" onClick={() => setState('rejected')} className="nb-btn-white flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase"><X className="h-3.5 w-3.5" strokeWidth={3} /> Reject</button>
        <span className="ml-auto font-mono text-[10px] uppercase text-[#666]">Approver: Maria Chen</span>
      </> : <p className="flex flex-1 items-center gap-2 text-[12px] font-bold">{state === 'approved' ? <><Check className="h-4 w-4 text-[#16a34a]" strokeWidth={3} /> Released to the leased executor · bill created</> : <><X className="h-4 w-4 text-[#dc2626]" strokeWidth={3} /> Rejected · nothing written, agent notified</>}
        <button type="button" onClick={() => setState('pending')} className="ml-auto font-mono text-[10px] uppercase underline">Reset</button></p>}
    </div>
    <ol className="border-t-[3px] border-[#111] bg-[#0b0b0b] px-4 py-3 font-mono text-[10px] leading-[1.7] text-[#d6d6d6]">
      {[...chain, ...(entry ? [entry] : [])].map((r) => <li key={r.id} className={r === entry ? 'text-[#ff8a5c]' : ''}>
        <span className="text-white">{r.id}</span> {r.action} · {r.by} <span className="text-[#777]">prev {r.prev} → </span>{r.hash}
      </li>)}
    </ol>
  </DemoWindow>
}
