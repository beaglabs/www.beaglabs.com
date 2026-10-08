'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

const GROUPS = [
  { name: 'Solutions', links: [
    { title: 'Document Automation', href: '/products/papyrus#documents', description: 'Turn documents into structured, actionable workflows.' },
    { title: 'Internal App Factory', href: '/products/papyrus#factory', description: 'Create governed internal applications.' },
    { title: 'Agentic Modernization', href: '/products/papyrus', description: 'Modernize existing processes and legacy interfaces.' },
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

const triggerClass = 'rounded-none border-2 border-transparent bg-transparent px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#111] shadow-none hover:border-[#111] hover:bg-white focus:bg-white data-[state=open]:border-[#111] data-[state=open]:bg-white data-[state=open]:text-[#111]'
const itemClass = 'block rounded-none border-2 border-transparent p-3 text-[#111] outline-none hover:border-[#111] hover:bg-[#ffdfcf] focus:border-[#111] focus:bg-[#ffdfcf]'

export function Navbar({ bannerHeight = 0 }: { bannerHeight?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 z-50 border-b-[3px] border-[#111] bg-[#ff5f1f] text-[#111]" style={{ top: bannerHeight }}>
      <div className="flex h-16 w-full items-center gap-3 px-3 lg:px-4">
        <Link href="/" aria-label="Beag Labs home" className="flex shrink-0 items-center text-[#111]">
          <span className="border-2 border-[#111] bg-[#111] px-2.5 py-1 text-[18px] font-extrabold tracking-[-.04em] text-white">B_</span>
        </Link>
        <div className="ml-3 hidden items-center gap-3 md:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {GROUPS.map(group => (
                <NavigationMenuItem key={group.name}>
                  <NavigationMenuTrigger className={triggerClass}>{group.name}</NavigationMenuTrigger>
                  <NavigationMenuContent className="!left-0 !right-auto !top-full !mt-2 !w-[min(88vw,440px)] !rounded-none !border-[3px] !border-[#111] !bg-white !p-2 !text-[#111] !shadow-[6px_6px_0_#111]">
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {group.links.map(link => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link href={link.href} className={itemClass}>
                              <span className="block text-xs font-extrabold uppercase tracking-wide">{link.title}</span>
                              <span className="mt-1 block text-xs font-medium leading-5 text-[#555]">{link.description}</span>
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
          <Link href="/products/papyrus" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#111] shadow-[3px_3px_0_#111] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#111] sm:px-4">
            <img src="/papyrus-logo.svg" alt="" className="h-4 w-4" /> See Papyrus
          </Link>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center border-2 border-[#111] bg-white md:hidden" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="mobile-site-navigation" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div id="mobile-site-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t-[3px] border-[#111] bg-white px-6 py-4 md:hidden">
          {GROUPS.map(group => (
            <details key={group.name} className="border-b-2 border-[#111] py-2" open={group.name === 'Solutions'}>
              <summary className="cursor-pointer py-2 text-xs font-black uppercase tracking-wider">{group.name}</summary>
              <div className="grid gap-1 pb-2">
                {group.links.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block p-2 hover:bg-[#ffdfcf] focus:bg-[#ffdfcf]">
                  <span className="block text-sm font-bold">{link.title}</span><span className="text-xs text-[#555]">{link.description}</span>
                </Link>)}
              </div>
            </details>
          ))}
        </div>
      )}
    </nav>
  )
}
