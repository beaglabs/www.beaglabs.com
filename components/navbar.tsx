import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Papyrus', href: '/products/papyrus' },
  { label: 'Trust', href: '/trust/papyrus' },
  { label: 'Cookbook', href: '/cookbook' },
] as const

export function Navbar({ bannerHeight = 0 }: { bannerHeight?: number }) {
  return (
    <nav
      className="fixed inset-x-0 z-50 border-b-[3px] border-[#111] bg-[#FAFAF9]"
      style={{ top: bannerHeight }}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-9">
        <Link href="/" className="flex items-center gap-3 text-[#111]">
          <span className="bg-[#111] text-[#FAFAF9] px-2.5 py-1 text-[18px] font-extrabold tracking-[-0.04em]">
            B_
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[#555] lg:inline">
            Beag Labs
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-[#111] border-b-2 border-transparent transition-all hover:border-[#ff5f1f] hover:text-[#ff5f1f] sm:inline"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:james@beaglabs.com"
            className="border-[3px] border-[#111] bg-[#ff5f1f] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#111] shadow-[3px_3px_0px_0px_#111] transition-all hover:shadow-[5px_5px_0px_0px_#111] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px]"
          >
            Talk to us
          </a>
        </div>
      </div>
    </nav>
  )
}
