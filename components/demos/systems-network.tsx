'use client'

import { useState } from 'react'
import { DemoWindow } from '@/components/demos/demo-window'

type System = { id: string; name: string; kind: string; x: number; y: number; reads: string; writes: string }

const HUB = { x: 380, y: 200 }
const SYSTEMS: System[] = [
  { id: 'd365', name: 'Dynamics 365', kind: 'ERP · East entity', x: 110, y: 70, reads: 'Vendors, POs, receipts', writes: 'Vendor bills, journal entries' },
  { id: 'netsuite', name: 'NetSuite', kind: 'ERP · West entity', x: 650, y: 70, reads: 'Vendors, open bills', writes: 'Vendor bills, payments' },
  { id: 'mainframe', name: 'Mainframe AP', kind: 'Legacy · 3270', x: 90, y: 330, reads: 'Vendor master, balances', writes: 'Terms changes, by approval' },
  { id: 'sharepoint', name: 'SharePoint', kind: 'Documents', x: 380, y: 360, reads: 'Contracts, W-9s, COIs', writes: 'Filed evidence packets' },
  { id: 'inbox', name: 'AP inbox', kind: 'Exchange', x: 670, y: 330, reads: 'Invoices, remittances', writes: 'Replies to vendors' },
  { id: 'odoo', name: 'Odoo', kind: 'ERP · subsidiary', x: 380, y: 40, reads: 'Inventory, receipts', writes: 'Receipts' },
]

const curve = (s: System) => {
  const mx = (s.x + HUB.x) / 2, my = (s.y + HUB.y) / 2
  const bend = (s.x < HUB.x ? -1 : 1) * 40
  return `M${s.x} ${s.y} Q ${mx + bend} ${my - 30} ${HUB.x} ${HUB.y}`
}

/** Agentic ERP: Papyrus between the systems of record, reading everywhere and writing only through approvals. */
export function SystemsNetwork() {
  const [active, setActive] = useState('netsuite')
  const current = SYSTEMS.find((s) => s.id === active)!

  return <DemoWindow title="Systems of record · live routes">
    <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="marketing-grid border-b-[3px] border-[#111] bg-[#fafaf9] lg:border-b-0 lg:border-r-[3px]">
        <svg viewBox="0 0 760 400" className="h-auto w-full" role="img" aria-label="Papyrus connected to six systems of record">
          {SYSTEMS.map((s, i) => {
            const d = curve(s)
            const on = s.id === active
            return <g key={s.id}>
              <path d={d} fill="none" stroke={on ? '#ff5f1f' : '#111'} strokeWidth={on ? 3 : 2} strokeDasharray={on ? undefined : '6 5'} />
              <circle r="5" fill="#111" className="motion-safe:animate-[demo-travel_3.2s_linear_infinite]" style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 0.5}s` }} />
              <circle r="5.5" fill="#ff5f1f" stroke="#111" strokeWidth="1.5" className="motion-safe:animate-[demo-travel_3.2s_linear_infinite]" style={{ offsetPath: `path("${d}")`, animationDirection: 'reverse', animationDelay: `${i * 0.5 + 1.6}s`, opacity: on ? 1 : 0.35 }} />
            </g>
          })}
          {SYSTEMS.map((s) => {
            const on = s.id === active
            return <g key={s.id} role="button" tabIndex={0} aria-label={s.name} className="cursor-pointer focus:outline-none" onClick={() => setActive(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActive(s.id) }}>
              <rect x={s.x - 72} y={s.y - 22} width="144" height="44" fill={on ? '#111' : '#fff'} stroke="#111" strokeWidth="3" />
              <text x={s.x} y={s.y - 3} textAnchor="middle" fontSize="13" fontWeight="800" fill={on ? '#fff' : '#111'}>{s.name}</text>
              <text x={s.x} y={s.y + 13} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono), monospace" fill={on ? '#ffb894' : '#666'}>{s.kind.toUpperCase()}</text>
            </g>
          })}
          <rect x={HUB.x - 94} y={HUB.y - 24} width="200" height="60" fill="#111" />
          <rect x={HUB.x - 100} y={HUB.y - 30} width="200" height="60" fill="#ff5f1f" stroke="#111" strokeWidth="3" />
          <text x={HUB.x} y={HUB.y - 4} textAnchor="middle" fontSize="18" fontWeight="900" fill="#111">PAPYRUS</text>
          <text x={HUB.x} y={HUB.y + 14} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono), monospace" fill="#111">CLASSES · AGENTS · APPROVALS</text>
        </svg>
      </div>
      <div className="flex flex-col p-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#c2410c]">{current.kind}</p>
        <p className="mt-1 text-[20px] font-extrabold leading-tight">{current.name}</p>
        <dl className="mt-4 space-y-3">
          <div className="border-2 border-[#111] p-3"><dt className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.12em]"><i className="block h-2.5 w-2.5 rounded-full bg-[#111]" /> Papyrus reads</dt><dd className="mt-1 text-[13px] font-semibold">{current.reads}</dd></div>
          <div className="border-2 border-[#111] bg-[#fff1e9] p-3"><dt className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.12em]"><i className="block h-2.5 w-2.5 rounded-full border border-[#111] bg-[#ff5f1f]" /> Governed writes</dt><dd className="mt-1 text-[13px] font-semibold">{current.writes}</dd></div>
        </dl>
        <p className="mt-auto pt-4 text-[12px] leading-5 text-[#555]">Click a system. Each stays the system of record; Papyrus writes back only after an approval.</p>
      </div>
    </div>
  </DemoWindow>
}
