import Link from "next/link"

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
        </Link>

        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/blog"
            className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#111] border-b-2 border-transparent transition-all hover:border-[#FF5F1F]"
          >
            Blog
          </Link>
          <Link
            href="/cookbook"
            className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#111] border-b-2 border-transparent transition-all hover:border-[#FF5F1F]"
          >
            Cookbook
          </Link>
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="border-[3px] border-[#111] bg-[#FF5F1F] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#111] shadow-[3px_3px_0px_0px_#111] transition-all hover:shadow-[5px_5px_0px_0px_#111] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px]"
          >
            Talk to us
          </a>
        </div>
      </div>
    </nav>
  )
}
