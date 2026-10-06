'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ArrowRight, Check, LockKeyhole, LogOut, RotateCcw, Terminal } from 'lucide-react'
import { FlowDots } from './document-demo'
import styles from './modernization-demos.module.css'

type RequestRecord = { name: string; service: string; reference: string }

export function LegacyAppDemo() {
  const [auth, setAuth] = useState<'signed-out' | 'authorize' | 'signed-in'>('signed-out')
  const [record, setRecord] = useState<RequestRecord | null>(null)
  const [name, setName] = useState('Alex Morgan')
  const [service, setService] = useState('Records request')
  const [sequence, setSequence] = useState(1042)
  const heading = useRef<HTMLHeadingElement>(null)

  function authenticate() {
    setAuth('signed-in')
    requestAnimationFrame(() => heading.current?.focus())
  }
  function reset() {
    setAuth('signed-out'); setRecord(null); setName('Alex Morgan'); setService('Records request'); setSequence(1042)
  }

  return (
    <div className="border-[3px] border-[#111] bg-[#efede7] shadow-[8px_8px_0_#111]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#111] bg-white px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[.12em]">
        <span>02 / Legacy system enablement</span><button onClick={reset} className="flex items-center gap-2 hover:underline"><RotateCcw className="h-3 w-3" aria-hidden="true" />Reset demo</button>
      </div>
      <div className="grid items-center p-5 lg:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] lg:p-7">
        <div className="min-w-0 self-stretch border-[3px] border-[#111] bg-[#101b15] text-[#8cf4aa]">
          <div className="flex items-center justify-between border-b border-[#335c42] bg-[#162b1e] px-4 py-3 font-mono text-[10px] uppercase tracking-wider"><span className="flex items-center gap-2"><Terminal className="h-4 w-4" aria-hidden="true" />TN3270 / CASEINTK</span><span>Mock host</span></div>
          <div className={`${styles.scan} p-5 font-mono text-[11px] leading-7 sm:p-7 sm:text-xs`}>
            <div className="mb-6 flex justify-between border-b border-[#335c42] pb-3"><span>PUBLIC SERVICES</span><span>SCREEN 01</span></div>
            <p>TRANSACTION: NEW SERVICE REQUEST</p>
            <p className="mt-5">APPLICANT:</p><p className="break-words text-white">{record?.name.toUpperCase() || '________________________'}</p>
            <p className="mt-3">SERVICE TYPE:</p><p className="text-white">{record?.service.toUpperCase() || '________________________'}</p>
            <p className="mt-3">REFERENCE: {record?.reference || 'PENDING'}</p>
            <p className="mt-5 border-y border-[#335c42] py-3" aria-live="polite">{record ? 'RECORD SAVED. ROUTED TO CASE QUEUE.' : 'READY. AWAITING AUTHENTICATED INPUT.'}</p>
            <p className="mt-6 text-[#73b889]">PF1 HELP · PF3 EXIT · ENTER SAVE</p>
            <span className={`${styles.cursor} mt-4 inline-block h-3 w-2 bg-[#8cf4aa]`} aria-hidden="true" />
          </div>
          <p className="border-t border-[#335c42] px-5 py-4 text-xs leading-5 text-[#b3cbbb]">Keep the system of record. Give people a better way to use it.</p>
        </div>
        <FlowDots />
        <div className="min-w-0 self-stretch border-[3px] border-[#111] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-[#111] bg-[#f9f9f9] px-4 py-3"><span className="font-mono text-[10px] font-bold uppercase tracking-wider">Factory app / Service intake</span><Image src="/products/papyrus/uswds.png" alt="USWDS" width={80} height={30} className="h-6 w-16 object-contain" /></div>
          <div className={`${styles.form} p-5 sm:p-7`}>
            {auth === 'signed-out' ? <>
              <div className="mb-6 inline-flex border-2 border-[#111] bg-[#ffe0d2] p-3"><LockKeyhole className="h-6 w-6" aria-hidden="true" /></div>
              <h3 className="text-2xl font-bold tracking-tight">A modern front door.</h3>
              <p className="mt-3 text-sm leading-6 text-[#565c65]">The generated app asks you to sign in before you can create a service request.</p>
              <button onClick={() => setAuth('authorize')} className="mt-7 flex w-full items-center justify-between gap-3 border-2 border-[#162e51] bg-[#162e51] px-4 py-4 text-sm font-bold text-white hover:bg-[#005ea2]">Try Login.gov sign-in<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              <div className="mt-6 flex items-center gap-4"><Image src="/products/papyrus/login-gov.png" alt="Login.gov" width={320} height={320} className="h-7 w-28 object-cover" /><span className="text-[#aaa]">+</span><Image src="/products/papyrus/openid.png" alt="OpenID Connect" width={40} height={40} className="h-8 w-8 object-contain" /><span className="text-xs font-bold">OIDC</span></div>
            </> : auth === 'authorize' ? <>
              <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#005ea2]">Demo identity / authorization</p>
              <Image src="/products/papyrus/login-gov.png" alt="Login.gov" width={320} height={320} className="mb-6 h-10 w-36 object-cover" />
              <h3 className="text-2xl font-bold tracking-tight">Continue as Alex Morgan?</h3>
              <p className="mt-3 text-sm leading-6 text-[#565c65]">This example uses a fictional identity. The app receives a signed-in session through an OpenID Connect flow.</p>
              <dl className="mt-5 border-l-4 border-[#005ea2] bg-[#eff6fb] p-4 text-xs leading-6"><dt className="font-bold">Requesting app</dt><dd>Service intake</dd><dt className="mt-2 font-bold">Shared with app</dt><dd>Demo identity and signed-in status</dd></dl>
              <button onClick={authenticate} className="mt-6 w-full bg-[#005ea2] px-4 py-3 text-sm font-bold text-white hover:bg-[#162e51]">Continue with demo identity</button>
              <button onClick={() => setAuth('signed-out')} className="mt-3 text-sm font-bold text-[#005ea2] underline">Cancel</button>
            </> : <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-l-4 border-[#00a91c] bg-[#ecf3ec] p-3 text-xs"><span className="flex items-center gap-2 font-bold"><Check className="h-4 w-4" aria-hidden="true" />Demo identity connected</span><button onClick={() => { setAuth('signed-out'); setRecord(null) }} aria-label="Sign out of demo" className="p-1"><LogOut className="h-4 w-4" /></button></div>
              <h3 ref={heading} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">Request a service</h3>
              {record ? <div role="status" className="mt-5 border-l-4 border-[#00a91c] bg-[#ecf3ec] p-5"><h4 className="font-bold">Request submitted</h4><p className="mt-2 text-sm leading-6">Reference <strong>{record.reference}</strong> is now in the terminal’s case queue.</p><button onClick={() => setRecord(null)} className="mt-4 text-sm font-bold text-[#005ea2] underline">Create another request</button></div> : <form onSubmit={event => { event.preventDefault(); setRecord({ name: name.trim(), service, reference: `SR-${sequence}` }); setSequence(value => value + 1) }}>
                <fieldset><legend className="mt-2 text-xs leading-5 text-[#565c65]">All fields are required. Use fictional information.</legend>
                  <label htmlFor="applicant-name">Applicant name</label><input id="applicant-name" name="name" autoComplete="off" required maxLength={70} pattern=".*\S.*" value={name} onChange={event => setName(event.target.value)} />
                  <label htmlFor="service-type">Service type</label><select id="service-type" name="service" required value={service} onChange={event => setService(event.target.value)}><option>Records request</option><option>Permit inquiry</option><option>Benefits status</option></select>
                  <button type="submit" className="mt-6 w-full bg-[#005ea2] px-4 py-3 text-sm font-bold text-white hover:bg-[#162e51]">Submit request to legacy system</button>
                </fieldset>
              </form>}
            </>}
            <p className="mt-6 border-t border-[#dfe1e2] pt-4 text-[11px] leading-5 text-[#565c65]">Interactive mock · USWDS-inspired form · simulated Login.gov / OIDC. No real sign-in or host connection.</p>
          </div>
        </div>
      </div>
      <div className="grid border-t-[3px] border-[#111] bg-white md:grid-cols-3">{['01 / Identity opens the app', '02 / The form captures a request', '03 / The legacy record updates'].map(text => <p key={text} className="border-b-2 border-[#111] px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-wider last:border-b-0 md:border-b-0 md:border-r-2 md:last:border-r-0">{text}</p>)}</div>
    </div>
  )
}
