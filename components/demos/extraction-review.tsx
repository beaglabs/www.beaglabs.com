'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { DemoWindow } from '@/components/demos/demo-window'

type Field = { key: string; label: string; value: string; confidence: number; box: { top: number; left: number; width: number; height: number } }

const FIELDS: Field[] = [
  { key: 'applicant', label: 'Applicant', value: 'Riverside Builders LLC', confidence: 99, box: { top: 18, left: 8, width: 58, height: 7 } },
  { key: 'parcel', label: 'Parcel ID', value: '044-221-0907', confidence: 97, box: { top: 30, left: 8, width: 36, height: 7 } },
  { key: 'value', label: 'Project value', value: '$412,500', confidence: 94, box: { top: 30, left: 52, width: 38, height: 7 } },
  { key: 'license', label: 'Contractor license', value: 'C-10 8841?2', confidence: 71, box: { top: 42, left: 8, width: 44, height: 7 } },
  { key: 'scope', label: 'Scope of work', value: 'Two-story addition, 1,840 sq ft', confidence: 92, box: { top: 54, left: 8, width: 82, height: 13 } },
]

/** Document automation: extracted fields beside the source page, low-confidence fields held for a person. */
export function ExtractionReview() {
  const [active, setActive] = useState('license')
  const [fixed, setFixed] = useState(false)
  const [approved, setApproved] = useState(false)
  const fields = FIELDS.map((f) => f.key === 'license' && fixed ? { ...f, value: 'C-10 884172', confidence: 100 } : f)
  const current = fields.find((f) => f.key === active)!
  const needsReview = fields.filter((f) => f.confidence < 90).length

  return <DemoWindow title="Extraction review · building-permit-2291.pdf">
    <div className="grid gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* the source page */}
      <div className="relative border-b-[3px] border-[#111] bg-[#f4f2ef] p-4 md:border-b-0 md:border-r-[3px]">
        <div className="relative mx-auto aspect-[8.5/11] w-full max-w-[260px] border-2 border-[#111] bg-white p-3">
          <div className="h-2 w-1/2 bg-[#111]" />
          <div className="mt-1.5 h-1 w-1/3 bg-[#bbb]" />
          {[18, 30, 42, 54, 60, 74, 80, 86].map((top, i) => <div key={i} className="absolute left-[8%] h-[3%] bg-[#d9d9d9]" style={{ top: `${top + 2}%`, width: `${[52, 30, 40, 76, 60, 70, 46, 30][i]}%` }} />)}
          <div className="absolute bottom-[6%] right-[8%] h-[6%] w-[28%] border-b-2 border-[#111]" />
          {fields.map((f) => <button
            key={f.key} type="button" aria-label={`Show ${f.label} on the page`} onClick={() => setActive(f.key)}
            className={`absolute transition-all ${active === f.key ? 'border-2 border-[#ff5f1f] bg-[#ff5f1f]/15' : f.confidence < 90 ? 'border-2 border-dashed border-[#c2410c]/60' : 'border border-[#111]/20'}`}
            style={{ top: `${f.box.top}%`, left: `${f.box.left}%`, width: `${f.box.width}%`, height: `${f.box.height}%` }}
          />)}
        </div>
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[#555]">Page 1 of 3 · source evidence</p>
      </div>

      {/* the extracted record */}
      <div className="flex flex-col">
        <ul className="divide-y-2 divide-[#111]/10">
          {fields.map((f) => <li key={f.key}>
            <button type="button" onClick={() => setActive(f.key)} className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors ${active === f.key ? 'bg-[#fff1e9]' : 'hover:bg-[#f7f7f7]'}`}>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-[.12em] text-[#666]">{f.label}</span>
                <span className="block truncate text-[14px] font-semibold">{f.value}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-16 border border-[#111] bg-white"><span className={`block h-full ${f.confidence < 90 ? 'bg-[#c2410c]' : 'bg-[#111]'}`} style={{ width: `${f.confidence}%` }} /></span>
                <span className={`w-9 text-right font-mono text-[11px] font-bold ${f.confidence < 90 ? 'text-[#c2410c]' : ''}`}>{f.confidence}%</span>
              </span>
            </button>
          </li>)}
        </ul>
        <div className="mt-auto border-t-[3px] border-[#111] p-4">
          {current.confidence < 90 && !fixed
            ? <div className="flex flex-wrap items-center gap-3"><p className="flex-1 text-[13px] font-semibold"><span className="text-[#c2410c]">Held for review:</span> one digit is unreadable. Confirm against the state license lookup.</p>
              <button type="button" onClick={() => setFixed(true)} className="nb-btn-white px-3 py-2 font-mono text-[10px] uppercase tracking-[.1em]">Use C-10 884172</button></div>
            : approved
              ? <p className="flex items-center gap-2 text-[13px] font-bold"><Check className="h-4 w-4 text-[#16a34a]" strokeWidth={3} /> Posted to the permitting system · reviewer and evidence recorded</p>
              : <div className="flex flex-wrap items-center gap-3"><p className="flex-1 text-[13px] font-semibold">{needsReview ? `${needsReview} field needs review before posting.` : 'All fields verified against the page.'}</p>
                <button type="button" disabled={needsReview > 0} onClick={() => setApproved(true)} className="nb-btn-orange px-3 py-2 font-mono text-[10px] uppercase tracking-[.1em] disabled:opacity-40">Approve and post</button></div>}
        </div>
      </div>
    </div>
  </DemoWindow>
}
