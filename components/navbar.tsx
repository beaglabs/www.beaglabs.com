"use client"

import Link from "next/link"
import Image from "next/image"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Untitled design(18).png"
              alt="Beag Labs"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="font-mono text-sm font-semibold tracking-[-0.01em] text-[#0a0a0a]">
              BEAG LABS
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="#services" className="font-mono text-xs tracking-wide text-[#6B7280] hover:text-[#0a0a0a] transition-colors">
              Services
            </Link>
            <Link href="/projects" className="font-mono text-xs tracking-wide text-[#6B7280] hover:text-[#0a0a0a] transition-colors">
              Projects
            </Link>
            <Link
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs tracking-wide text-[#FF5F1F] border border-[#FF5F1F] px-4 py-2 hover:bg-[#FF5F1F] hover:text-white transition-all"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
