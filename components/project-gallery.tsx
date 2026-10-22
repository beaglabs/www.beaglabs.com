import type { ReactNode } from 'react'

/* Tiny live visuals, one per kind of project. Pure CSS/SVG, so they cost nothing to load. */
const bars = (n: number, color = '#111') => <div aria-hidden="true" className="flex h-10 items-end gap-[3px]">
  {Array.from({ length: n }, (_, i) => <span key={i} className="w-[5px] origin-bottom motion-safe:animate-[demo-bars_1.4s_ease-in-out_infinite]" style={{ height: `${30 + ((i * 37) % 70)}%`, background: color, animationDelay: `${(i * 0.11) % 1.2}s` }} />)}
</div>

const VISUALS: Record<string, ReactNode> = {
  intake: <div aria-hidden="true" className="space-y-1.5">{[70, 45, 85].map((w, i) => <div key={i} className="h-2.5 border border-[#111]" style={{ width: `${w}%` }} />)}<div className="h-3 w-12 border border-[#111] bg-[#ff5f1f]" /></div>,
  ap: <div aria-hidden="true" className="space-y-1">{[['PO', 92], ['GR', 88], ['INV', 95]].map(([k, v]) => <div key={k} className="flex items-center gap-2"><span className="w-7 font-mono text-[9px]">{k}</span><span className="h-2 flex-1 border border-[#111]"><span className="block h-full bg-[#111]" style={{ width: `${v}%` }} /></span></div>)}</div>,
  records: <div aria-hidden="true" className="grid grid-cols-3 gap-1.5">{[3, 2, 1].map((n, c) => <div key={c} className="space-y-1">{Array.from({ length: n }, (_, i) => <div key={i} className={`h-3 border border-[#111] ${c === 2 ? 'bg-[#ff5f1f]' : 'bg-white'}`} />)}</div>)}</div>,
  inspection: <div aria-hidden="true" className="space-y-1">{['Railing', 'Drainage', 'Lighting'].map((k, i) => <div key={k} className="flex items-center gap-2 text-[10px] font-semibold"><span className={`flex h-3 w-3 items-center justify-center border border-[#111] text-[8px] ${i < 2 ? 'bg-[#111] text-white' : ''}`}>{i < 2 ? '✓' : ''}</span>{k}</div>)}</div>,
  bridge: <pre aria-hidden="true" className="bg-[#0b0b0b] px-2 py-1.5 font-mono text-[9px] leading-[1.4] text-[#4ade80]">{'VENDOR NO: 004518\nSTATUS   : ACTIVE\n→ GET /vendors/004518'}<span className="motion-safe:animate-[demo-blink_1s_steps(1)_infinite]">▌</span></pre>,
  casework: <div aria-hidden="true" className="space-y-1.5"><div className="w-4/5 border border-[#111] bg-[#f4f2ef] px-2 py-1 text-[9px]">Is household eligible?</div><div className="ml-auto w-4/5 border border-[#111] bg-[#111] px-2 py-1 text-[9px] text-white">Likely yes · 2 docs missing</div></div>,
  dispatch: <svg aria-hidden="true" viewBox="0 0 160 48" className="h-12 w-full"><path id="route" d="M8 40 C 50 0, 110 0, 152 30" fill="none" stroke="#111" strokeWidth="2" strokeDasharray="4 3" /><circle cx="8" cy="40" r="4" fill="#111" /><circle cx="152" cy="30" r="4" fill="#111" /><circle r="4.5" fill="#ff5f1f" stroke="#111" strokeWidth="1.5" className="motion-safe:animate-[demo-travel_3s_linear_infinite]" style={{ offsetPath: 'path("M8 40 C 50 0, 110 0, 152 30")' }} /></svg>,
  dashboards: <svg aria-hidden="true" viewBox="0 0 160 48" className="h-12 w-full"><polyline points="0,40 20,34 40,36 60,22 80,26 100,14 120,18 140,8 160,10" fill="none" stroke="#111" strokeWidth="2.5" /><line x1="0" x2="160" y1="20" y2="20" stroke="#ff5f1f" strokeWidth="1.5" strokeDasharray="3 3" /></svg>,
  migration: <div aria-hidden="true" className="space-y-0.5 font-mono text-[9px]"><div className="bg-[#fde2e2] px-1.5 line-through">− cust_nm: "SMITH J"</div><div className="bg-[#dcfce7] px-1.5">+ name: "Jordan Smith"</div><div className="px-1.5 text-[#777]">  account: 7710-22</div></div>,
  voice: bars(18, '#ff5f1f'),
}

const PROJECTS: [string, string, string, string][] = [
  ['intake', 'Grant + permit intake', 'Portals that collect applications, check them, and route them to the right reviewer.', 'Public works · Planning'],
  ['ap', 'Invoice matching', 'Two- and three-way matching across POs, receipts and invoices, with exceptions sent to people.', 'Finance · Procurement'],
  ['records', 'Records request tracking', 'Public records and FOIA queues with deadlines, redaction review and response packets.', 'Clerk · Legal'],
  ['inspection', 'Field inspection apps', 'Tablet checklists for crews that file photos, defects and sign-off back to the asset register.', 'Facilities · Transportation'],
  ['bridge', 'Mainframe + SOAP bridges', 'Governed APIs and modern screens in front of terminals and XML services that must stay put.', 'IT modernization'],
  ['casework', 'Casework assistants', 'Agents that gather documents, pre-check eligibility and draft determinations for a caseworker.', 'Health + human services'],
  ['dispatch', 'Work orders + dispatch', 'Requests turned into routed work orders, crew assignments and status updates for residents.', 'Utilities · Public works'],
  ['dashboards', 'Reconciliation dashboards', 'Daily reconciliations between ledgers and bank files, with variances explained, not just flagged.', 'Treasury · Accounting'],
  ['migration', 'Data migration', 'Moving records between systems with field-level diffs a person reviews before anything is written.', 'ERP + CRM change'],
  ['voice', 'Call + voice intake', 'Phone and voicemail intake transcribed into structured requests and routed to the right queue.', 'Constituent services'],
]

/** The project cards alone, optionally limited to some kinds, for solution pages. */
export function ProjectGrid({ only }: { only?: readonly string[] }) {
  const projects = only ? PROJECTS.filter(([key]) => only.includes(key)) : PROJECTS
  const cols = projects.length >= 5 ? 'lg:grid-cols-5' : projects.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
  return <ul className={`grid grid-cols-1 gap-[3px] border-[3px] border-[#111] bg-[#111] shadow-[8px_8px_0_#111] sm:grid-cols-2 ${cols}`}>
    {projects.map(([key, title, copy, sector]) => <li key={key} className="group flex flex-col bg-white p-5 transition-colors hover:bg-[#fff1e9]">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#c2410c]">{sector}</span>
      <h4 className="mt-1.5 text-[17px] font-extrabold leading-tight">{title}</h4>
      <div className="my-4 flex min-h-[52px] items-center"><div className="w-full">{VISUALS[key]}</div></div>
      <p className="mt-auto text-[13px] leading-6 text-[#444]">{copy}</p>
    </li>)}
  </ul>
}

/** "What we build": the range of projects, each with a small live visual. */
export function ProjectGallery() {
  return <div>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="nb-label mb-4 inline-block">What we build</span>
        <h3 className="display-black text-[length:min(36px,8vw)] leading-[.95] sm:text-[48px]">Projects across the back office</h3>
      </div>
      <p className="max-w-[440px] text-[15px] font-medium leading-7 text-[#333]">A sample of the work we take on for agencies, departments and the primes who serve them. Each one starts from the systems you already run.</p>
    </div>
    <ProjectGrid />
  </div>
}
