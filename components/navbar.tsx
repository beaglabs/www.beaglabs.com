'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CreditClaimForm } from '@/components/credit-claim-form'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

const GROUPS = [
  { name: 'Explore', links: [
    { title: 'Agentic ERP', href: '/agentic-erp', description: 'Model-aware orchestration across your existing systems of record.' },
    { title: 'Papyrus', href: '/products/papyrus', description: 'Explore Papyrus and its Classes, agents, and workflows.' },
    { title: 'Capabilities', href: '/capabilities', description: 'Explore technical capabilities.' },
    { title: 'Trust & Security', href: '/trust/papyrus', description: 'Review the Papyrus trust model.' },
  ] },
  { name: 'Resources', links: [
    { title: 'Blog', href: '/blog', description: 'Ideas, announcements, and engineering notes.' },
    { title: 'Comparisons', href: '/compare', description: 'Compare approaches and technologies.' },
  ] },
  { name: 'Company', links: [
    { title: 'Support', href: '/support', description: 'Commercial and government support.' },
    { title: 'Contact', href: '/contact', description: 'Speak with our team.' },
  ] },
] as const

const triggerClass = 'rounded-full border-2 border-transparent bg-transparent px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#1a1714] shadow-none hover:border-[#1a1714] hover:bg-[#fffaf3] focus:bg-[#fffaf3] data-[state=open]:border-[#1a1714] data-[state=open]:bg-[#fffaf3] data-[state=open]:text-[#1a1714]'
const itemClass = 'block rounded-xl border-2 border-transparent p-3 text-[#1a1714] outline-none hover:border-[#1a1714] hover:bg-[#f7c995] focus:border-[#1a1714] focus:bg-[#f7c995]'

export function Navbar({ bannerHeight = 0 }: { bannerHeight?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 z-50 border-b-[3px] border-[#1a1714] bg-[#fdeee1] text-[#1a1714]" style={{ top: bannerHeight }}>
      <div className="flex h-16 w-full items-center gap-3 px-3 lg:px-4">
        <Link href="/" aria-label="Beag Labs home" className="flex shrink-0 items-center gap-2.5 text-[#1a1714]">
          <Image src="/brand/beag-mark.png" alt="" width={44} height={44} priority className="h-11 w-11 transition-transform duration-300 hover:-rotate-6" />
          <span className="hidden font-display text-[18px] font-black uppercase tracking-[0.02em] sm:inline">Beag Labs</span>
        </Link>
        <div className="ml-3 hidden items-center gap-3 md:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {GROUPS.map(group => (
                <NavigationMenuItem key={group.name}>
                  <NavigationMenuTrigger className={triggerClass}>{group.name}</NavigationMenuTrigger>
                  <NavigationMenuContent className="!left-0 !right-auto !top-full !mt-2 !w-[min(88vw,440px)] !rounded-2xl !border-[3px] !border-[#1a1714] !bg-[#fffaf3] !p-2 !text-[#1a1714] !shadow-[6px_6px_0_#1a1714]">
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {group.links.map(link => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link href={link.href} className={itemClass}>
                              <span className="block text-xs font-extrabold uppercase tracking-wide">{link.title}</span>
                              <span className="mt-1 block text-xs font-medium leading-5 text-[#5b4a3d]">{link.description}</span>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CreditClaimForm placement="nav" compact />
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1714] bg-[#fffaf3] md:hidden" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="mobile-site-navigation" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div id="mobile-site-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t-[3px] border-[#1a1714] bg-[#fffaf3] px-6 py-4 md:hidden">
          {GROUPS.map(group => (
            <details key={group.name} className="border-b-2 border-[#1a1714] py-2" open={group.name === 'Solutions'}>
              <summary className="cursor-pointer py-2 text-xs font-black uppercase tracking-wider">{group.name}</summary>
              <div className="grid gap-1 pb-2">
                {group.links.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block p-2 hover:bg-[#f7c995] focus:bg-[#f7c995]">
                  <span className="block text-sm font-bold">{link.title}</span><span className="text-xs text-[#5b4a3d]">{link.description}</span>
                </Link>)}
              </div>
            </details>
          ))}
        </div>
      )}
    </nav>
  )
}
