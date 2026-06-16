"use client"

import Link from "next/link"
import Image from "next/image"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + wordmark */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Beag Labs"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="text-sm font-medium tracking-[-0.01em] text-[#111]">
              Beag Labs
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-8">
            <Link
              href="#services"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Services
            </Link>
            <Link
              href="/projects"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Projects
            </Link>
            <Link
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-white bg-[#111] hover:bg-[#333] px-5 py-2 rounded-full transition-colors duration-200"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
