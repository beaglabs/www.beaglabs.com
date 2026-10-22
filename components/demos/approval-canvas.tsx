'use client'

import { Fragment, useMemo, useState } from 'react'
import { ArrowRight, Check, Clock, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { DemoWindow, Segmented } from '@/components/demos/demo-window'

type Step = { id: string; name: string; approvers: string[]; quorum: number; condition?: string; sla: string }
type Mark = 'added' | 'changed' | 'removed'

const START: Step[] = [
  { id: 'manager', name: 'Budget owner review', approvers: ['Alex Rivera'], quorum: 1, sla: '1 day' },
  { id: 'finance', name: 'Finance review', approvers: ['Priya Patel', 'Sam Okafor', 'Maria Chen'], quorum: 1, sla: '2 days' },
  { id: 'director', name: 'Director sign-off', approvers: [], quorum: 1, condition: 'amount > $25,000', sla: '3 days' },
]

const EDITS: { text: string; apply: (steps: Step[]) => { steps: Step[]; marks: Record<string, Mark> } }[] = [
  {
    text: 'Above $50k also require the CFO',
    apply: (steps) => ({ steps: [...steps, { id: 'cfo', name: 'CFO approval', approvers: ['Dana Brooks'], quorum: 1, condition: 'amount > $50,000', sla: '2 days' }], marks: { cfo: 'added' } }),
  },
  {
    text: 'Require 2 of the approvers on Finance review',
    apply: (steps) => ({ steps: steps.map((s) => s.id === 'finance' ? { ...s, quorum: 2 } : s), marks: { finance: 'changed' } }),
  },
  {
    text: 'Assign Jordan Lee to the Director sign-off',
    apply: (steps) => ({ steps: steps.map((s) => s.id === 'director' ? { ...s, approvers: ['Jordan Lee'] } : s), marks: { director: 'changed' } }),
  },
  {
    text: 'Remove the Director sign-off',
    apply: (steps) => ({ steps, marks: { director: 'removed' } }),
  },
]

function lint(steps: Step[]) {
  const issues: { level: 'error' | 'warning'; step: string; text: string }[] = []
  for (const s of steps) {
    if (s.approvers.length === 0) issues.push({ level: 'error', step: s.id, text: `${s.name} has an unassigned seat, so it can never complete.` })
    if (s.approvers.length && s.quorum > s.approvers.length) issues.push({ level: 'error', step: s.id, text: `${s.name} needs ${s.quorum} approvals but has ${s.approvers.length} approvers.` })
  }
  if (!steps.some((s) => s.condition?.includes('$50,000'))) issues.push({ level: 'warning', step: 'director', text: 'No control above $50,000. Policy recommends a second executive approval.' })
  return issues
}

const ring: Record<Mark, string> = { added: 'outline outline-[3px] outline-offset-4 outline-[#16a34a]', changed: 'outline outline-[3px] outline-offset-4 outline-[#ff5f1f]', removed: 'opacity-50 outline outline-[3px] outline-dashed outline-offset-4 outline-[#dc2626]' }

/** Papyrus workflows: an approval policy as a canvas, edited in plain English behind a review-the-diff gate. */
export function ApprovalCanvas() {
  const [steps, setSteps] = useState<Step[]>(START)
  const [proposal, setProposal] = useState<{ text: string; steps: Step[]; marks: Record<string, Mark> } | null>(null)
  const [tab, setTab] = useState<'edit' | 'validation' | 'json'>('edit')
  const [focus, setFocus] = useState<string | null>(null)

  const shown = proposal?.steps ?? steps
  const marks = proposal?.marks ?? {}
  const applied = (p: NonNullable<typeof proposal>) => p.steps.filter((s) => p.marks[s.id] !== 'removed')
  const issues = useMemo(() => lint(proposal ? applied(proposal) : steps), [proposal, steps])
  const propose = (edit: (typeof EDITS)[number]) => { setProposal({ text: edit.text, ...edit.apply(steps) }); setTab('edit') }

  return <DemoWindow title="Workflow · Procurement approvals">
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="marketing-grid relative overflow-x-auto border-b-[3px] border-[#111] bg-[#fafaf9] p-5 lg:border-b-0 lg:border-r-[3px]">
        <div className="mb-4 flex items-center gap-3">
          <span className="border-2 border-[#111] bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[.1em]">Trigger · purchase request submitted</span>
          <button type="button" onClick={() => { setSteps(START); setProposal(null); setFocus(null) }} className="ml-auto flex items-center gap-1.5 border-2 border-[#111] bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase hover:bg-[#ffdfcf]"><RotateCcw className="h-3 w-3" /> Reset</button>
        </div>
        <div className="flex min-w-max items-center gap-3 py-4 pr-4">
          {shown.map((s) => {
            const seats = Math.max(s.quorum, 1)
            const flagged = issues.some((i) => i.step === s.id && i.level === 'error')
            return <Fragment key={s.id}>
              <div className={`w-[168px] shrink-0 border-[3px] bg-white transition-all ${flagged ? 'border-[#dc2626]' : 'border-[#111]'} ${marks[s.id] ? ring[marks[s.id]] : ''} ${focus === s.id ? 'shadow-[5px_5px_0_#ff5f1f]' : 'shadow-[4px_4px_0_#111]'}`}>
                <div className="flex items-center justify-between border-b-2 border-[#111] px-2.5 py-1.5">
                  <span className="truncate text-[12px] font-extrabold">{s.name}</span>
                  <span className="shrink-0 border border-[#111] bg-[#111] px-1 font-mono text-[9px] font-bold text-white">{s.quorum} of {Math.max(s.approvers.length, seats)}</span>
                </div>
                <div className="space-y-1 px-2.5 py-2">
                  {s.condition && <span className="mb-1 inline-block border border-[#111] bg-[#fff1e9] px-1.5 font-mono text-[9px] font-bold">if {s.condition}</span>}
                  {s.approvers.length ? s.approvers.map((a) => <div key={a} className="flex items-center gap-1.5 text-[11px] font-semibold"><span className="flex h-4 w-4 items-center justify-center bg-[#111] font-mono text-[8px] text-white">{a.split(' ').map((w) => w[0]).join('')}</span>{a}</div>)
                    : <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#dc2626]"><span className="h-4 w-4 border border-dashed border-[#dc2626]" />Unassigned seat</div>}
                  <div className="flex items-center gap-1 pt-1 font-mono text-[9px] uppercase text-[#666]"><Clock className="h-3 w-3" /> SLA {s.sla}</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={3} />
            </Fragment>
          })}
          <span className="flex items-center gap-1.5 border-[3px] border-[#111] bg-[#16a34a] px-3 py-2 text-[12px] font-extrabold text-white shadow-[4px_4px_0_#111]"><Check className="h-4 w-4" strokeWidth={3} /> Post to ERP</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#555]">Green: added · orange: changed · dashed red: removed</p>
      </div>

      <div className="flex flex-col">
        <div className="border-b-[3px] border-[#111] p-3">
          <Segmented label="Panel" value={tab} onChange={setTab} options={[['edit', 'Edit in English'], ['validation', `Validation ${issues.length}`], ['json', 'JSON']]} />
        </div>
        <div className="flex-1 p-4">
          {tab === 'edit' && (proposal
            ? <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#c2410c]">Proposed change</p>
              <p className="mt-1 text-[14px] font-bold">“{proposal.text}”</p>
              <p className="mt-2 text-[12px] leading-5 text-[#444]">Review the change on the canvas. Nothing applies until a person accepts it.</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => { setSteps(applied(proposal)); setProposal(null) }} className="nb-btn-orange px-3 py-2 font-mono text-[10px] uppercase">Apply</button>
                <button type="button" onClick={() => setProposal(null)} className="nb-btn-white px-3 py-2 font-mono text-[10px] uppercase">Discard</button>
              </div>
            </div>
            : <div>
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#555]"><Sparkles className="h-3.5 w-3.5 text-[#ff5f1f]" /> Ask for a change</p>
              <div className="mt-3 flex flex-col gap-2">
                {EDITS.map((e) => <button key={e.text} type="button" onClick={() => propose(e)} className="border-2 border-[#111]/25 px-3 py-2 text-left text-[12px] font-semibold hover:border-[#111] hover:bg-[#fff1e9]">{e.text}</button>)}
              </div>
            </div>)}
          {tab === 'validation' && <ul className="space-y-2">
            {issues.length === 0 && <li className="flex items-center gap-2 text-[13px] font-bold"><Check className="h-4 w-4 text-[#16a34a]" /> Policy passes every check.</li>}
            {issues.map((i) => <li key={i.text}><button type="button" onClick={() => setFocus(i.step)} className="flex w-full gap-2 border-2 border-[#111] p-2.5 text-left text-[12px] leading-5 hover:bg-[#fff1e9]">
              <TriangleAlert className={`mt-0.5 h-4 w-4 shrink-0 ${i.level === 'error' ? 'text-[#dc2626]' : 'text-[#c2410c]'}`} /><span><b className="uppercase">{i.level}</b> · {i.text}</span>
            </button></li>)}
          </ul>}
          {tab === 'json' && <pre className="max-h-[260px] overflow-auto border-2 border-[#111] bg-[#f4f2ef] p-3 font-mono text-[10px] leading-[1.5]">{JSON.stringify({ trigger: 'purchase_request.submitted', steps: (proposal ? applied(proposal) : steps).map(({ id, quorum, approvers, condition, sla }) => ({ id, quorum, approvers, ...(condition ? { condition } : {}), sla })) }, null, 2)}</pre>}
        </div>
      </div>
    </div>
  </DemoWindow>
}
