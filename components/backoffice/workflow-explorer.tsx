'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, RotateCcw } from 'lucide-react'

type Mode = 'backoffice' | 'modernization'
const factorySteps = [
  { title: 'Inspect', tool: 'Read screen', action: 'Read the example case intake screen and identify the request reference, applicant and status.', artifact: 'A captured screen with source fields', detail: 'A read operation observes the current screen. No host record changes.' },
  { title: 'Map', tool: 'Describe operation', action: 'Map reference and applicant to input fields. Define the expected confirmation screen.', artifact: 'Inputs, outputs and navigation rules', detail: 'Screen mapping turns a known transaction into a defined operation. Unexpected screens stop the flow.' },
  { title: 'Connect', tool: 'Call adapter', action: 'Expose lookup_request(reference) through a typed interface.', artifact: 'A structured result with source context', detail: 'The adapter owns the host session and protocol. The agent sees a limited tool with explicit inputs and outputs.' },
  { title: 'Build', tool: 'Compose interface', action: 'Present the same request through a browser form with identity and validation.', artifact: 'An internal request application', detail: 'The browser is a new front door. Existing business rules and the system of record remain accountable.' },
  { title: 'Validate', tool: 'Run test fixtures', action: 'Check a known reference, a missing reference, and an unexpected host response.', artifact: 'A reviewable validation report', detail: 'A plausible interface is not enough. Compare actual behavior to approved expectations before deployment.' },
  { title: 'Approve', tool: 'Request approval', action: 'An authorized reviewer checks the mapping, test report and proposed rollout.', artifact: 'An explicit release decision', detail: 'Approval does not execute a production change in this demonstration. Real deployment needs an owner and a recovery plan.' },
]
const officeSteps = [
  { title: 'Intake', tool: 'Read document', action: 'Open a fictional invoice and preserve its source reference.', artifact: 'An intake record linked to the document', detail: 'The source document remains available so a reviewer can inspect the original evidence.' },
  { title: 'Extract', tool: 'Extract fields', action: 'Identify supplier, invoice reference and amount using a defined schema.', artifact: 'Structured fields and source evidence', detail: 'Extraction proposes values. Missing or ambiguous information must remain visible.' },
  { title: 'Check', tool: 'Validate request', action: 'Compare the proposed values against the workflow’s required fields.', artifact: 'An exception queue', detail: 'This example has a missing purchase-order reference. It cannot proceed as a clean invoice.' },
  { title: 'Review', tool: 'Request review', action: 'Ask an authorized operator to resolve the missing reference.', artifact: 'A human decision attached to the request', detail: 'The agent can prepare the work, but it cannot invent the missing approval or financial reference.' },
  { title: 'Route', tool: 'Prepare handoff', action: 'Prepare an accounts-payable work item after the review gate.', artifact: 'A proposed handoff, not a payment', detail: 'Real routing depends on verified integrations and the customer’s access controls. No financial action occurs here.' },
  { title: 'Record', tool: 'Write evidence', action: 'Assemble the source, extracted values, exception and review outcome.', artifact: 'A traceable work packet', detail: 'The final artifact should explain what happened and what still requires attention.' },
]

function BrowserFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className="min-w-0 overflow-hidden border-[3px] border-[#111] bg-white shadow-[5px_5px_0_#111]">
    <div className="flex items-center gap-3 border-b-2 border-[#111] bg-[#fafaf9] px-4 py-3"><div aria-hidden="true" className="flex gap-1.5">{['#ff5f57','#febc2e','#28c840'].map(color => <span key={color} className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />)}</div><span className="min-w-0 truncate font-mono text-[10px] text-[#444]">{label} · simulation</span></div>
    {children}
  </div>
}

export function WorkflowExplorer({ mode }: { mode: Mode }) {
  const [active, setActive] = useState(0)
  const [approved, setApproved] = useState(false)
  const [reference, setReference] = useState('SR-1042')
  const [searched, setSearched] = useState(false)
  const steps = mode === 'modernization' ? factorySteps : officeSteps
  const step = steps[active]
  const found = reference.trim().toUpperCase() === 'SR-1042'
  function select(index: number) { setActive(index); setApproved(false); setSearched(false) }

  return <div className="overflow-hidden border-[3px] border-[#111] bg-[#fafaf9] shadow-[7px_7px_0_#111]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#111] bg-[#111] px-5 py-4 text-white"><span className="font-mono text-xs font-bold uppercase tracking-wider">Interactive walkthrough / fictional data</span><button onClick={() => { select(0); setReference('SR-1042') }} className="flex items-center gap-2 text-xs underline underline-offset-4"><RotateCcw size={14} />Reset</button></div>
    <div role="tablist" aria-label="Workflow stages" className="grid grid-cols-2 border-b-[3px] border-[#111] sm:grid-cols-3 lg:grid-cols-6">{steps.map((s, i) => <button key={s.title} id={`${mode}-tab-${i}`} role="tab" aria-selected={active === i} aria-controls={`${mode}-panel`} onClick={() => select(i)} onKeyDown={event => { if (['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 5 : (active + (event.key === 'ArrowRight' ? 1 : 5)) % 6; select(next); document.getElementById(`${mode}-tab-${next}`)?.focus() } }} tabIndex={active === i ? 0 : -1} className={`border-b border-r border-[#111] px-4 py-4 text-left text-sm font-black focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#ff5f1f] ${active === i ? 'bg-[#ff5f1f]' : 'bg-white hover:bg-[#ffe5d6]'}`}><span className="mr-2 font-mono text-[10px]">0{i + 1}</span>{s.title}</button>)}</div>
    <div id={`${mode}-panel`} role="tabpanel" aria-labelledby={`${mode}-tab-${active}`} className="grid min-w-0 gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        {mode === 'modernization' && active < 3 ? <div className="overflow-hidden border-[3px] border-[#111] bg-[#0d1d15] text-[#9bf6b4] shadow-[5px_5px_0_#111]"><div className="border-b border-[#42624b] px-4 py-3 font-mono text-[10px]">TN3270 / EXAMPLE CASE INTAKE</div><div className="space-y-3 p-5 font-mono text-xs leading-6 sm:p-8"><p>PUBLIC SERVICES — REQUEST LOOKUP</p><p className={active === 1 ? 'bg-[#9bf6b4] px-2 text-[#0d1d15]' : ''}>REFERENCE: SR-1042</p><p>APPLICANT: ALEX MORGAN</p><p>STATUS: AWAITING REVIEW</p><p className="border-t border-[#42624b] pt-5 text-[10px]">PF3 = BACK · ENTER = LOOKUP</p>{active === 2 && <pre className="overflow-x-auto border border-[#42624b] p-3 text-[11px]">{'lookup_request("SR-1042")\n→ { status: "awaiting_review" }'}</pre>}</div></div> : <BrowserFrame label={mode === 'modernization' ? 'Request workspace' : 'Invoice workspace'}><div className="p-5 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-wider text-[#a43d11]">{mode === 'modernization' ? 'Records request' : 'Invoice / INV-1042'}</p><h3 className="mt-3 text-2xl font-black">{mode === 'modernization' ? 'A usable front door.' : 'From document to decision.'}</h3>
        {mode === 'modernization' && active === 3 ? <form className="mt-5 space-y-3" onSubmit={event => { event.preventDefault(); setSearched(true) }}><label htmlFor="factory-reference" className="block text-sm font-bold">Request reference</label><input id="factory-reference" value={reference} onChange={event => { setReference(event.target.value); setSearched(false) }} className="w-full border-2 border-[#111] p-3 font-mono text-sm" /><button className="border-2 border-[#111] bg-[#ff5f1f] px-4 py-2 text-sm font-black">Look up mock request</button>{searched && <p role="status" className="border-l-4 border-[#ff5f1f] bg-[#f5f2eb] p-3 text-sm">{found ? 'SR-1042 · Alex Morgan · Awaiting review' : 'Reference not found. Send to an operator; do not invent a record.'}</p>}</form> : <div className="mt-5 space-y-3 text-sm">{mode === 'backoffice' ? <><div className="flex justify-between gap-3 border-b border-[#ddd] pb-2"><span>Supplier</span><strong>Example Supplies</strong></div><div className="flex justify-between border-b border-[#ddd] pb-2"><span>Amount</span><strong>$240.00</strong></div><p className="border-l-4 border-[#ff5f1f] bg-[#fff1e9] p-3">{active < 2 ? 'Purchase-order reference: missing' : 'Exception: purchase-order reference needs review.'}</p></> : <><p className="flex items-center gap-2"><Check size={16} />Known reference: expected result</p><p className="flex items-center gap-2"><Check size={16} />Missing reference: handled explicitly</p><p className="flex items-center gap-2"><Check size={16} />Unexpected screen: stop and review</p><p className="text-xs text-[#666]">Illustrative fixtures, not an executed host test.</p></>}</div>}
        {((mode === 'modernization' && active === 5) || (mode === 'backoffice' && active === 3)) && <button onClick={() => setApproved(true)} disabled={approved} className="mt-5 flex items-center gap-2 border-2 border-[#111] bg-[#111] px-4 py-3 text-sm font-bold text-white disabled:bg-[#35553f]"><LockKeyhole size={16} />{approved ? 'Demo review acknowledged' : 'Acknowledge demo review'}</button>}
        {approved && <p role="status" className="mt-3 text-sm">Decision recorded in this preview only. No host update, payment, or deployment occurred.</p>}
        </div></BrowserFrame>}
        <p className="mt-5 text-xs leading-5 text-[#555]">Simulated educational flow. No live document processing, sign-in, connector, or mainframe session.</p>
      </div>
      <div className="min-w-0"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#a43d11]">Step 0{active + 1} / {step.tool}</p><h3 className="mt-3 text-3xl font-black tracking-tight">{step.action}</h3><p className="mt-5 text-sm leading-7 text-[#444]">{step.detail}</p><div className="mt-6 border-l-4 border-[#ff5f1f] bg-white p-5"><p className="font-mono text-[10px] uppercase tracking-widest">What comes out</p><p className="mt-2 text-lg font-bold">{step.artifact}</p></div><div className="mt-8 flex justify-between gap-3"><button disabled={active === 0} onClick={() => select(active - 1)} className="flex items-center gap-2 border-2 border-[#111] bg-white px-3 py-2 text-xs font-bold disabled:opacity-40"><ArrowLeft size={14} />Previous</button><button disabled={active === 5} onClick={() => select(active + 1)} className="flex items-center gap-2 border-2 border-[#111] bg-[#ff5f1f] px-3 py-2 text-xs font-bold disabled:opacity-40">Next step<ArrowRight size={14} /></button></div></div>
    </div>
  </div>
}
