import Image from "next/image"
import Link from "next/link"

export function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(0,0,0,0.08)] bg-[rgba(248,247,243,0.84)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-9">
        <Link href="/" className="flex items-center gap-3 text-[#111]">
          <Image
            src="/logo.png"
            alt="Beag Labs"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
          <span className="text-[13px] font-bold tracking-[0.08em]">
            BEAG LABS
          </span>
        </Link>

        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/research"
            className="text-[11px] uppercase tracking-[0.1em] text-[#595959] transition-colors duration-200 hover:text-[#111]"
          >
            Research
          </Link>
          <Link
            href="#capabilities"
            className="text-[11px] uppercase tracking-[0.1em] text-[#595959] transition-colors duration-200 hover:text-[#111]"
          >
            Capabilities
          </Link>
          <a
            href="https://cal.com/comradelemoncake/meet-the-founder"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#111] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-[#2a2a2a]"
          >
            Talk to us
          </a>
        </div>
      </div>
    </nav>
  )
}
