'use client'

import { useId, useState, type FormEvent } from 'react'
import { ArrowRight, Check, Download, LoaderCircle, Mail } from 'lucide-react'
import { analytics } from '@/lib/analytics'

export type BriefType = 'papyrus' | 'services'

const BRIEF_PDF: Record<BriefType, string> = {
  papyrus: '/briefs/papyrus-solution-brief.pdf',
  services: '/briefs/beag-labs-solution-brief.pdf',
}

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** "Request a solution brief": work email, a marketing opt-in radio, and the brief for this page sent by Customer.io. */
export function BriefRequestForm({ briefType, placement }: { briefType: BriefType; placement: 'hero' | 'nav' | 'page-hero' }) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [marketing, setMarketing] = useState<'yes' | 'no'>('no')
  const [founder, setFounder] = useState(false)
  const [state, setState] = useState<'idle' | 'invalid' | 'loading' | 'done' | 'error'>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'loading' || state === 'done') return
    const address = email.trim()
    if (!EMAIL.test(address)) { setState('invalid'); return }
    setState('loading')
    const marketingOptIn = marketing === 'yes'
    try {
      const response = await fetch('/api/brief/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address, briefType, marketingOptIn, ccOptIn: founder, page: window.location.pathname }),
      })
      if (!response.ok) throw new Error('brief request failed')
      analytics.briefRequested({ placement, briefType, marketingOptIn, ccOptIn: founder, page: window.location.pathname })
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return <div role="status" className="w-full border-[3px] border-[#111] bg-white text-left shadow-[5px_5px_0_#111]">
      <div className="flex items-center gap-3 bg-[#16a34a] px-5 py-4 text-white">
        <Check className="h-5 w-5 shrink-0" strokeWidth={3} />
        <p className="text-sm font-extrabold uppercase tracking-wide">Your brief is on its way to {email.trim()}{founder ? ' · James will be in touch' : ''}</p>
      </div>
      <a href={BRIEF_PDF[briefType]} target="_blank" rel="noopener" className="flex items-center gap-2 border-t-[3px] border-[#111] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[.06em] text-[#111] hover:bg-[#ffdfcf]">
        <Download className="h-4 w-4" strokeWidth={3} /> Or download it now
      </a>
    </div>
  }

  const problem = state === 'invalid' || state === 'error'
  const hint = state === 'invalid' ? 'Enter a work email like you@agency.gov.' : state === 'error' ? "That didn't go through. Check the email and try again." : 'One email with the PDF · No spam'

  return <form onSubmit={submit} noValidate aria-label="Request a solution brief" className="w-full text-left">
    <label htmlFor={id} className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[.14em] text-[#111]">Work email</label>
    <div className={`flex flex-col border-[3px] bg-white shadow-[5px_5px_0_#111] transition-shadow focus-within:shadow-[7px_7px_0_#ff5f1f] sm:flex-row ${problem ? 'border-[#c2410c]' : 'border-[#111]'}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
        <Mail className="h-5 w-5 shrink-0 text-[#111]" strokeWidth={2.5} aria-hidden="true" />
        <input
          id={id} type="email" inputMode="email" required autoComplete="email" spellCheck={false}
          placeholder="you@agency.gov" value={email} aria-invalid={problem || undefined} aria-describedby={`${id}-hint`}
          onChange={(event) => { setEmail(event.target.value); if (problem) setState('idle') }}
          className="h-[56px] min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-[#111] placeholder:font-medium placeholder:text-[#8a8a8a] focus:outline-none"
        />
      </div>
      <button type="submit" disabled={state === 'loading'} className="inline-flex h-[56px] shrink-0 items-center justify-center gap-2 border-t-[3px] border-[#111] bg-[#ff5f1f] px-5 text-[12px] font-black uppercase tracking-[.06em] text-[#111] transition-colors hover:bg-[#111] hover:text-white focus-visible:bg-[#111] focus-visible:text-white focus-visible:outline-none disabled:cursor-wait disabled:opacity-80 sm:border-l-[3px] sm:border-t-0">
        {state === 'loading'
          ? <><LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={3} aria-hidden="true" /> Sending…</>
          : <>Request a solution brief <ArrowRight className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></>}
      </button>
    </div>
    <fieldset className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
      <legend className="sr-only">Marketing emails</legend>
      {([['yes', 'Yes, send me Beag Labs updates'], ['no', 'No, just the brief']] as const).map(([value, label]) => (
        <label key={value} className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#111]">
          <input type="radio" name={`${id}-marketing`} value={value} checked={marketing === value} onChange={() => setMarketing(value)} className="h-4 w-4 accent-[#ff5f1f]" />
          {label}
        </label>
      ))}
    </fieldset>
    <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#111]">
      <input type="checkbox" checked={founder} onChange={(event) => setFounder(event.target.checked)} className="h-4 w-4 accent-[#ff5f1f]" />
      Have our founder reach out about this
    </label>
    <p id={`${id}-hint`} role={problem ? 'alert' : undefined} className={`mt-3 font-mono text-[10px] font-bold uppercase tracking-wide ${problem ? 'text-[#c2410c]' : 'text-[#555]'}`}>{hint}</p>
  </form>
}
