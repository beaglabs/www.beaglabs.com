'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, ArrowUpRight, ChevronDown } from 'lucide-react'

const GROUPS = [
  { name: 'Solutions', links: [
    { title: 'Document Automation', href: '/solutions/document-automation', description: 'Turn documents into structured, actionable workflows.' },
    { title: 'Internal App Factory', href: '/solutions/internal-app-factory', description: 'Create governed internal applications.' },
    { title: 'Agentic Modernization', href: '/solutions/agentic-modernization', description: 'Modernize existing processes and legacy interfaces.' },
    { title: 'Use Cases', href: '/use-cases', description: 'Explore industry workflows.' },
  ] },
  { name: 'Explore', links: [
    { title: 'Papyrus', href: '/products/papyrus', description: 'See the agentic modernization factory.' },
    { title: 'Capabilities', href: '/capabilities', description: 'Explore technical capabilities.' },
    { title: 'Trust & Security', href: '/trust/papyrus', description: 'Review the Papyrus trust model.' },
  ] },
  { name: 'Resources', links: [
    { title: 'Blog', href: '/blog', description: 'Ideas, announcements, and engineering notes.' },
    { title: 'Glossary', href: '/glossary', description: 'Understand the terminology.' },
    { title: 'Comparisons', href: '/compare', description: 'Compare approaches and technologies.' },
  ] },
  { name: 'Company', links: [
    { title: 'Partners', href: '/partners', description: 'Collaborate and deliver with Beag Labs.' },
    { title: 'Support', href: '/support', description: 'Commercial and government support.' },
    { title: 'Contact', href: '/contact', description: 'Speak with our team.' },
  ] },
] as const

/** Floating prompt-sized navigation, shared across all marketing pages. */
export function Navbar({ bannerHeight = 0 }: { bannerHeight?: number }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <nav ref={root} aria-label="Primary" className="fixed right-3 z-50 w-fit max-w-[calc(100vw-1.5rem)] sm:right-6" style={{ top: bannerHeight + 14 }}>
      <div className="flex h-12 items-center gap-1 rounded-xl border-2 border-[#111] bg-white p-1 shadow-[4px_4px_0_#111]">
        <Link href="/" aria-label="Beag Labs home" onClick={() => setOpen(false)} className="flex h-9 items-center justify-center rounded-lg border-2 border-[#111] bg-[#ff5f1f] px-2.5 text-sm font-black tracking-tight text-[#111] hover:bg-[#ffdeca]">B_</Link>
        <button type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="floating-site-navigation" onClick={() => setOpen(value => !value)} className="flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#111] hover:bg-[#f3f3f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Menu <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <Link href="/products/papyrus" onClick={() => setOpen(false)} className="flex h-9 items-center gap-1.5 rounded-lg border-2 border-[#111] bg-[#ff5f1f] px-3 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#111] hover:bg-[#ffdeca]">
          <span className="hidden min-[360px]:inline">Papyrus</span><ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      {open && (
        <div id="floating-site-navigation" className="absolute right-0 top-[calc(100%+10px)] max-h-[min(72dvh,610px)] w-[min(92vw,540px)] overflow-y-auto rounded-xl border-[3px] border-[#111] bg-white p-3 shadow-[6px_6px_0_#111]">
          <div className="mb-3 flex items-center justify-between border-b-2 border-[#111] px-2 pb-3">
            <strong className="text-xs font-black uppercase tracking-[.12em]">Navigate Beag Labs</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1.5 hover:bg-[#f3f3f3]"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GROUPS.map(group => (
              <section key={group.name}>
                <h2 className="mb-1 px-2 text-[10px] font-black uppercase tracking-[.12em] text-[#666]">{group.name}</h2>
                {group.links.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-lg border-2 border-transparent p-2 text-[#111] hover:border-[#111] hover:bg-[#fff0e5] focus-visible:border-[#111] focus-visible:bg-[#fff0e5]">
                    <span className="block text-xs font-extrabold">{link.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-[#555]">{link.description}</span>
                  </Link>
                ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
