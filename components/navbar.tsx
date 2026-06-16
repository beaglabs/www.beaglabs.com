"use client"

import Link from "next/link"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo mark */}
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold tracking-[-0.05em] text-[#111]">
              B_
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-8">
            <Link
              href="/blog"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Blog
            </Link>
            <Link
              href="/research"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Research
            </Link>
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
