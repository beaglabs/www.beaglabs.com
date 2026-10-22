'use client'

import { useState } from 'react'
import { DemoWindow, Segmented } from '@/components/demos/demo-window'

const FIELDS: [string, string, string][] = [
  ['name', 'Text', 'required'],
  ['tax_id', 'Text', 'required · masked'],
  ['remit_address', 'Address', ''],
  ['payment_terms', 'Choice', 'Net 15 · Net 30 · Net 45'],
  ['legal_entities', 'Relation', '→ Legal entity, many'],
  ['w9', 'File', 'PDF · verified'],
]

const SOURCES: [string, string, string, string][] = [
  ['Dynamics 365', 'Vendor account', 'V-00118', 'read + write'],
  ['Oracle NetSuite', 'Vendor internalId', '4518', 'read + write'],
  ['Mainframe AP', 'VENDOR NO', '004518', 'read · writes via approval'],
  ['SharePoint', 'Vendor folder', '/Vendors/Acme', 'read'],
]

/** Papyrus Classes: your own record type, its fields, and the source identities it reconciles. */
export function ClassInspector() {
  const [tab, setTab] = useState<'fields' | 'sources' | 'json'>('sources')

  return <DemoWindow title="Class · Vendor">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#111] px-4 py-3">
      <Segmented label="Class view" value={tab} onChange={setTab} options={[['fields', 'Fields'], ['sources', 'Sources'], ['json', 'JSON']]} />
      <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#555]">1,284 records · synced 2 min ago</span>
    </div>
    <div className="p-4">
      {tab === 'fields' && <ul className="divide-y-2 divide-[#111]/10 border-2 border-[#111]">
        {FIELDS.map(([name, kind, note]) => <li key={name} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2">
          <span><span className="font-mono text-[12px] font-bold">{name}</span>{note && <span className="block text-[11px] text-[#666]">{note}</span>}</span>
          <span className="border-2 border-[#111] bg-[#fff1e9] px-2 py-0.5 font-mono text-[10px] font-bold uppercase">{kind}</span>
        </li>)}
      </ul>}
      {tab === 'sources' && <div>
        <p className="mb-3 text-[13px] leading-6"><b>Acme Supply Co.</b> is one Vendor in Papyrus and four records in the systems that hold it.</p>
        <ul className="space-y-2">
          {SOURCES.map(([system, key, id, access]) => <li key={system} className="grid grid-cols-[1fr_auto] items-center gap-3 border-2 border-[#111] px-3 py-2">
            <span><span className="block text-[13px] font-extrabold">{system}</span><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#666]">{key} · {access}</span></span>
            <span className="font-mono text-[13px] font-bold text-[#c2410c]">{id}</span>
          </li>)}
        </ul>
      </div>}
      {tab === 'json' && <pre className="max-h-[300px] overflow-auto border-2 border-[#111] bg-[#f4f2ef] p-3 font-mono text-[10px] leading-[1.55]">{JSON.stringify({
        class: 'vendor', label: 'Vendor',
        fields: Object.fromEntries(FIELDS.map(([name, kind]) => [name, kind.toLowerCase()])),
        identities: { dynamics365: 'V-00118', netsuite: '4518', mainframe_ap: '004518' },
      }, null, 2)}</pre>}
    </div>
  </DemoWindow>
}
