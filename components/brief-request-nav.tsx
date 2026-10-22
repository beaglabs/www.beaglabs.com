'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import { BriefRequestForm, type BriefType } from '@/components/brief-request-form'

const PAPYRUS_PAGES = ['/products/papyrus', '/agentic-erp']

/** The navbar's "Request a solution brief": opens the form in a panel, with the Papyrus brief on Papyrus pages. */
export function BriefRequestNav() {
  const pathname = usePathname() ?? '/'
  const briefType: BriefType = PAPYRUS_PAGES.some((page) => pathname.startsWith(page)) ? 'papyrus' : 'services'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  return <div ref={ref} className="relative">
    <button
      type="button" aria-expanded={open} aria-controls="nav-solution-brief" onClick={() => setOpen((v) => !v)}
      className="inline-flex h-10 items-center gap-1.5 border-[3px] border-[#111] bg-white px-3 text-[10px] font-black uppercase tracking-[.06em] text-[#111] shadow-[3px_3px_0_#111] hover:bg-[#111] hover:text-white lg:text-[11px]"
    >
      <span className="hidden sm:inline">Request a solution brief</span><span className="sm:hidden">Get the brief</span> <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
    {open && <div id="nav-solution-brief" className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,520px)] border-[3px] border-[#111] bg-white p-5 text-[#111] shadow-[8px_8px_0_#111]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[.14em] text-[#c2410c]">{briefType === 'papyrus' ? 'Papyrus solution brief' : 'Beag Labs solution brief'}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#333]">A 4-page PDF on {briefType === 'papyrus' ? 'how Papyrus automates back-office work inside your boundary' : 'how we deliver superintelligent solutions for federal and SLED'}.</p>
        </div>
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="border-2 border-[#111] p-1 hover:bg-[#ffdfcf]"><X className="h-4 w-4" /></button>
      </div>
      <BriefRequestForm briefType={briefType} placement="nav" />
    </div>}
  </div>
}
