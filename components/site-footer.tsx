"use client"

import Image from "next/image"

export function SiteFooter() {
  return (
    <footer className="bg-white py-16 px-6 lg:px-8 border-t border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/Untitled design(18).png"
              alt="Beag Labs"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="font-mono text-sm font-semibold tracking-[-0.01em] text-[#0a0a0a]">
              BEAG LABS
            </span>
          </div>
          <p className="text-sm text-[#6B7280] leading-[1.8] font-light max-w-xs">
            Applied AI research lab and consulting studio.
          </p>
        </div>

        <div className="pt-8 border-t border-[#E5E7EB] flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-widest text-[#C0C0C0]">
            &copy; 2026 BEAG LABS. ALL RIGHTS RESERVED.
          </p>
          <a
            href="https://github.com/beaglabs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-widest text-[#C0C0C0] hover:text-[#0a0a0a] transition-colors"
          >
            GITHUB
          </a>
        </div>
      </div>
    </footer>
  )
}
