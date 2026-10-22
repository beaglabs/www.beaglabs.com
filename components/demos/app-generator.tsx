'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, LoaderCircle } from 'lucide-react'
import { DemoWindow, Segmented } from '@/components/demos/demo-window'
import { Map } from '@/components/ui/map'
import { SatelliteOrbits, type SatelliteOrbitData } from '@/components/ui/satellite-orbit'

type Tracked = SatelliteOrbitData & { name: string; orbitColor: string }

const SATELLITES: readonly Tracked[] = [
  { name: 'GPS IIF-12', inclination: 55, ascendingNode: 220, orbitColor: '#ff5f1f', orbitGlowColor: 'rgba(255, 95, 31, 0.16)' },
  { name: 'DMSP F18', inclination: 98.9, ascendingNode: 140, orbitColor: '#111111', orbitGlowColor: 'rgba(17, 17, 17, 0.12)' },
  { name: 'WGS-10', inclination: 0.1, ascendingNode: 0, orbitColor: '#c2410c', orbitGlowColor: 'rgba(194, 65, 12, 0.14)' },
  { name: 'AEHF-6', inclination: 5, ascendingNode: 80, orbitColor: '#6b7280', orbitGlowColor: 'rgba(107, 114, 128, 0.14)' },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

/** The pass scheduler's dashboard: the constellation on a globe (flightcn satellite orbits), toggled by chip. */
function OrbitDashboard() {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState<readonly string[]>(SATELLITES.map((s) => s.name))
  const shown = SATELLITES.filter((s) => visible.includes(s.name))
  const toggle = (name: string) => setVisible((names) => names.includes(name) ? names.filter((n) => n !== name) : [...names, name])

  return <div className="relative h-[300px] border-2 border-[#111] bg-[#f4f2ef]">
    <Map theme="light" center={[-40, 20]} zoom={0.9} projection={{ type: 'globe' }} scrollZoom={false} className="h-full w-full">
      <SatelliteOrbits orbits={shown} showLabel animate={reduced ? false : { duration: 24000 }} />
    </Map>
    <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
      {SATELLITES.map((s) => {
        const on = visible.includes(s.name)
        return <button key={s.name} type="button" aria-pressed={on} onClick={() => toggle(s.name)} className={`flex items-center gap-1.5 border-2 border-[#111] px-2 py-0.5 font-mono text-[10px] font-bold ${on ? 'bg-white' : 'bg-white/60 text-[#888]'}`}>
          <span aria-hidden="true" className="h-2 w-2 border border-[#111]" style={{ background: on ? s.orbitColor : 'transparent' }} />{s.name}
        </button>
      })}
    </div>
  </div>
}

const APPS = {
  passes: {
    prompt: 'Schedule ground-station contacts for our constellation and route pass requests to the mission planner for approval',
    name: 'Satellite pass scheduler',
    fields: [['Satellite', 'From the space catalog'], ['Ground station', 'Schriever · Pituffik · Diego Garcia'], ['Priority', 'Routine · Priority · Immediate']],
    queue: [['PR-0412', 'GPS IIF-12 · Pituffik', 'Approved'], ['PR-0413', 'WGS-10 · Diego Garcia', 'Deconflicting'], ['PR-0414', 'DMSP F18 · Schriever', 'New']],
    kpis: null,
  },
  maintenance: {
    prompt: 'Route aircraft maintenance discrepancies through work orders, parts requests and QA sign-off',
    name: 'Maintenance work orders',
    fields: [['Aircraft', 'Tail number'], ['Discrepancy', 'Write-up + photos'], ['QA sign-off', 'Inspector, CAC-signed']],
    queue: [['WO-2291', 'Tail 87-0123 · hydraulic leak', 'Awaiting parts'], ['WO-2292', 'Tail 91-0457 · radar fault', 'QA inspection'], ['WO-2293', 'Tail 88-0211 · tire wear', 'Open']],
    kpis: [['Mission capable', '78%'], ['Open work orders', '23'], ['Awaiting parts', '6']],
  },
  access: {
    prompt: 'Process DD 2875 system access requests with supervisor, security manager and ISSO approvals',
    name: 'System access requests',
    fields: [['Requester', 'Name + CAC email'], ['System and role', 'From the system inventory'], ['Approvals', 'Supervisor → Security mgr → ISSO']],
    queue: [['SAAR-1180', 'SIPR mail · user', 'Awaiting ISSO'], ['SAAR-1181', 'GCSS-Army · supply clerk', 'Security manager'], ['SAAR-1182', 'DTS · approver', 'Provisioned']],
    kpis: [['Open requests', '41'], ['Median approval', '1.8 days'], ['Expiring this month', '12']],
  },
} as const
type AppKey = keyof typeof APPS
type View = 'dashboard' | 'form' | 'queue'

/** Internal applications: a plain-language mission process turns into a working form, queue and dashboard. */
export function AppGenerator() {
  const [app, setApp] = useState<AppKey>('passes')
  const [building, setBuilding] = useState(false)
  const [view, setView] = useState<View>('dashboard')

  useEffect(() => {
    if (!building) return
    const timer = window.setTimeout(() => setBuilding(false), 900)
    return () => window.clearTimeout(timer)
  }, [building])

  const spec = APPS[app]
  const generate = (key: AppKey) => { setApp(key); setView('dashboard'); setBuilding(true) }

  return <DemoWindow title="App factory · describe the mission process">
    <div className="border-b-[3px] border-[#111] p-4">
      <div className="flex items-stretch border-2 border-[#111]">
        <p className="min-h-[44px] flex-1 px-3 py-2.5 text-[14px] font-semibold leading-snug">{spec.prompt}</p>
        <button type="button" onClick={() => generate(app)} className="flex shrink-0 items-center gap-1.5 border-l-2 border-[#111] bg-[#ff5f1f] px-3 font-mono text-[10px] font-bold uppercase tracking-[.1em] hover:bg-[#111] hover:text-white">
          {building ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Build
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(APPS) as AppKey[]).map((key) => <button key={key} type="button" onClick={() => generate(key)} className={`border-2 px-2.5 py-1 text-[12px] font-semibold ${app === key ? 'border-[#111] bg-[#111] text-white' : 'border-[#111]/30 hover:border-[#111]'}`}>{APPS[key].name}</button>)}
      </div>
    </div>

    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Segmented label="Generated app" value={view} onChange={setView} options={[['dashboard', 'Dashboard'], ['form', 'Form'], ['queue', 'Queue']]} />
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#555]">
          {building ? <><LoaderCircle className="h-3 w-3 animate-spin" /> Building</> : <><Check className="h-3 w-3 text-[#16a34a]" strokeWidth={4} /> {spec.name}</>}
        </span>
      </div>
      <div className={`transition-opacity ${building ? 'opacity-30' : 'opacity-100'}`}>
        {view === 'dashboard' && (spec.kpis
          ? <dl className="grid grid-cols-3 gap-[2px] border-2 border-[#111] bg-[#111]">
            {spec.kpis.map(([k, v]) => <div key={k} className="bg-white px-3 py-4"><dt className="font-mono text-[9px] uppercase tracking-[.12em] text-[#666]">{k}</dt><dd className="text-[24px] font-extrabold">{v}</dd></div>)}
          </dl>
          : <OrbitDashboard />)}
        {view === 'form' && <div className="space-y-2.5 border-2 border-[#111] p-4">
          {spec.fields.map(([label, kind]) => <div key={label}>
            <span className="block font-mono text-[9px] uppercase tracking-[.12em] text-[#666]">{label}</span>
            <span className="mt-0.5 block border border-[#111]/40 px-2 py-1.5 text-[13px] text-[#777]">{kind}</span>
          </div>)}
        </div>}
        {view === 'queue' && <ul className="divide-y-2 divide-[#111]/10 border-2 border-[#111]">
          {spec.queue.map(([id, title, status]) => <li key={id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="font-mono text-[11px] font-bold text-[#c2410c]">{id}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{title}</span>
            <span className="shrink-0 border border-[#111] px-1.5 font-mono text-[10px] uppercase">{status}</span>
          </li>)}
        </ul>}
      </div>
    </div>
  </DemoWindow>
}
