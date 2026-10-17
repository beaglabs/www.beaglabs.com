'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, Building2, Compass, Layers, type LucideIcon } from 'lucide-react'

type Group = {
  name: string
  icon: LucideIcon
  links: readonly { title: string; href: string; description: string }[]
}

const GROUPS: readonly Group[] = [
  { name: 'Solutions', icon: Layers, links: [
    { title: 'Agentic Back Office', href: '/solutions/agentic-back-office', description: 'Document work, decisions, and governed tools.' },
    { title: 'Modernization Factory', href: '/solutions/agentic-modernization-factory', description: 'Follow the terminal-to-browser workflow.' },
    { title: 'Document Automation', href: '/solutions/document-automation', description: 'Turn documents into structured, actionable workflows.' },
    { title: 'Internal App Factory', href: '/solutions/internal-app-factory', description: 'Create governed internal applications.' },
    { title: 'Agentic Modernization', href: '/solutions/agentic-modernization', description: 'Modernize existing processes and legacy interfaces.' },
    { title: 'Use Cases', href: '/use-cases', description: 'Explore industry workflows.' },
  ] },
  { name: 'Explore', icon: Compass, links: [
    { title: 'Papyrus', href: '/products/papyrus', description: 'See the agentic modernization factory.' },
    { title: 'Capabilities', href: '/capabilities', description: 'Explore technical capabilities.' },
    { title: 'Trust & Security', href: '/trust/papyrus', description: 'Review the Papyrus trust model.' },
  ] },
  { name: 'Resources', icon: BookOpen, links: [
    { title: 'Blog', href: '/blog', description: 'Ideas, announcements, and engineering notes.' },
    { title: 'Comparisons', href: '/compare', description: 'Compare approaches and technologies.' },
  ] },
  { name: 'Company', icon: Building2, links: [
    { title: 'Support', href: '/support', description: 'Commercial and government support.' },
    { title: 'Contact', href: '/contact', description: 'Speak with our team.' },
  ] },
]

const tileClass = 'flex h-11 w-11 items-center justify-center rounded-[12px] border-2 border-[#111] shadow-[3px_3px_0_#ff5f1f] transition md:h-14 md:w-14 md:rounded-[14px] md:shadow-[4px_4px_0_#ff5f1f]'
const labelClass = 'mt-1.5 hidden font-mono text-[9px] font-bold uppercase tracking-[.08em] text-[#bbb] md:block'

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => setOpen(null), [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <nav ref={navRef} aria-label="Primary" className="fixed inset-y-0 left-0 z-50 flex w-16 flex-col items-center gap-3 border-r-[3px] border-[#111] bg-[#111] py-3 md:w-[88px] md:gap-4 md:py-4">
      <Link href="/" aria-label="Beag Labs home" className={`${tileClass} mb-2 bg-[#ff5f1f] !shadow-[3px_3px_0_#fff] hover:-translate-x-px hover:-translate-y-px md:!shadow-[4px_4px_0_#fff]`}>
        <span className="text-[15px] font-extrabold tracking-[-.04em] text-[#111] md:text-[18px]">B_</span>
      </Link>

      {GROUPS.map(group => {
        const Icon = group.icon
        const isOpen = open === group.name
        const isActive = group.links.some(link => pathname === link.href || pathname.startsWith(`${link.href}/`))
        const panelId = `nav-panel-${group.name.toLowerCase()}`
        return (
          <div key={group.name} className="relative flex flex-col items-center">
            <button
              type="button"
              aria-label={group.name}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : group.name)}
              className={`${tileClass} relative ${isOpen ? 'translate-x-px translate-y-px bg-[#ff5f1f] !shadow-[2px_2px_0_#ff5f1f]' : 'bg-white hover:-translate-x-px hover:-translate-y-px hover:bg-[#ffdfcf]'}`}
            >
              <Icon className="h-5 w-5 text-[#111] md:h-6 md:w-6" strokeWidth={2.25} />
              {isActive && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#111] bg-[#ff5f1f]" />}
            </button>
            <span className={labelClass}>{group.name}</span>

            {isOpen && (
              <div id={panelId} className="absolute left-full top-0 z-50 ml-4 w-[min(calc(100vw-6rem),360px)] rounded-[14px] border-[3px] border-[#111] bg-white p-2 text-[#111] shadow-[6px_6px_0_#111] md:ml-5">
                <p className="px-3 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#555]">{group.name}</p>
                <ul className="grid gap-1">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => setOpen(null)} className="block rounded-[10px] border-2 border-transparent p-3 outline-none hover:border-[#111] hover:bg-[#ffdfcf] focus-visible:border-[#111] focus-visible:bg-[#ffdfcf]">
                        <span className="block text-xs font-extrabold uppercase tracking-wide">{link.title}</span>
                        <span className="mt-1 block text-xs font-medium leading-5 text-[#555]">{link.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-auto flex flex-col items-center">
        <Link href="/products/papyrus" aria-label="See Papyrus" className={`${tileClass} bg-white hover:-translate-x-px hover:-translate-y-px`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/papyrus-logo.png" alt="" className="h-6 w-6 rounded-[4px] border border-[#111] md:h-8 md:w-8" />
        </Link>
        <span className={labelClass}>Papyrus</span>
      </div>
    </nav>
  )
}
