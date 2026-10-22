'use client'

import { useState } from 'react'
import { DemoWindow, Segmented } from '@/components/demos/demo-window'

const RECORD = { vendor: '004518', name: 'ACME SUPPLY CO', status: 'ACTIVE', terms: 'NET 30', balance: '18,240.17', lastPaid: '2026-10-02' }

/** Legacy modernization: one mainframe record seen as the 3270 screen, a modern screen, and a governed API. */
export function LegacyBridge() {
  const [view, setView] = useState<'terminal' | 'modern' | 'api'>('terminal')

  return <DemoWindow title="Legacy bridge · AP vendor inquiry">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#111] px-4 py-3">
      <Segmented label="View" value={view} onChange={setView} options={[['terminal', '3270 screen'], ['modern', 'Modern screen'], ['api', 'Governed API']]} />
      <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#555]">Same record · system of record unchanged</span>
    </div>
    <div className="min-h-[300px] p-4">
      {view === 'terminal' && <pre className="overflow-x-auto border-2 border-[#111] bg-[#0b0b0b] p-4 font-mono text-[12px] leading-[1.55] text-[#4ade80]">{`APVND01                 VENDOR INQUIRY                  10/21/26
                                                        14:02:11
 VENDOR NO . . . . : `}<span className="bg-[#4ade80] text-black">{RECORD.vendor}</span>{`
 NAME  . . . . . . : ${RECORD.name}
 STATUS  . . . . . : ${RECORD.status}
 TERMS . . . . . . : ${RECORD.terms}
 OPEN BALANCE  . . : ${RECORD.balance}
 LAST PAYMENT  . . : ${RECORD.lastPaid}

 `}<span className="text-white">{`ENTER=INQUIRE  PF3=EXIT  PF7=BACK  PF8=FWD  PF12=CANCEL`}</span></pre>}

      {view === 'modern' && <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="border-2 border-[#111]">
          <div className="flex items-center justify-between border-b-2 border-[#111] bg-[#fff1e9] px-4 py-2">
            <p className="text-[15px] font-extrabold">Acme Supply Co.</p>
            <span className="border-2 border-[#111] bg-[#16a34a] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">Active</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
            {[['Vendor number', RECORD.vendor], ['Payment terms', 'Net 30'], ['Open balance', `$${RECORD.balance}`], ['Last payment', 'Oct 2, 2026']].map(([k, v]) => <div key={k}>
              <dt className="font-mono text-[10px] uppercase tracking-[.12em] text-[#666]">{k}</dt><dd className="text-[14px] font-semibold">{v}</dd>
            </div>)}
          </dl>
        </div>
        <div className="flex flex-col gap-2 sm:w-[170px]">
          {['Open invoices (4)', 'Payment history', 'Request terms change'].map((a, i) => <button key={a} type="button" className={`${i === 2 ? 'nb-btn-orange' : 'nb-btn-white'} px-3 py-2 text-left text-[12px]`}>{a}</button>)}
          <p className="text-[11px] leading-5 text-[#555]">Changes go through an approval before the screen is driven.</p>
        </div>
      </div>}

      {view === 'api' && <div className="grid gap-3">
        <p className="font-mono text-[12px]"><span className="border-2 border-[#111] bg-[#111] px-1.5 py-0.5 font-bold text-white">GET</span> /api/ap/vendors/{RECORD.vendor}</p>
        <pre className="overflow-x-auto border-2 border-[#111] bg-[#f4f2ef] p-4 font-mono text-[12px] leading-[1.6]">{JSON.stringify({ vendorNumber: RECORD.vendor, name: 'Acme Supply Co.', status: 'active', paymentTerms: 'NET30', openBalance: 18240.17, lastPaymentDate: '2026-10-02', source: { system: 'mainframe-ap', screen: 'APVND01' } }, null, 2)}</pre>
        <p className="text-[12px] text-[#555]">Read access is scoped per caller. Writes such as a terms change become proposals that a person approves.</p>
      </div>}
    </div>
  </DemoWindow>
}
