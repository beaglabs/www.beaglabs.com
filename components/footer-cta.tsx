"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { TextScramble } from "./text-scramble"

export function FooterCTA() {
  return (
    <section className="bg-[#1a1a1a] py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-[#F5E6C8]/20" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-[#F5E6C8]/20" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-[#F5E6C8]/20" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-[#F5E6C8]/20" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl lg:text-6xl font-bold text-[#F5E6C8] tracking-tight mb-8">
          <TextScramble text="GARDENS IS WAITING" scrambleOnHover autoStart={false} />
        </h2>

        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
          </span>
          <span className="font-mono text-sm text-[#F5E6C8]/70">Gardens</span>
          <span className="font-mono text-xs text-[#F5E6C8]/40 ml-8">Roadmap</span>
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[#F5E6C8] border border-[#F5E6C8]/30 px-4 py-2 hover:bg-[#F5E6C8]/5 transition-colors ml-4"
          >
            DOWNLOAD NOW
            <ArrowRight className="w-3 h-3 inline ml-2" />
          </a>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#0f0f0f] py-16 px-8 lg:px-16 border-t border-[#F5E6C8]/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* Logo and info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/gardens-logo.png"
                alt="Gardens"
                width={64}
                height={64}
              />
              <span className="font-mono text-lg font-semibold text-[#F5E6C8]">
                Gardens
              </span>
            </div>
            <p className="font-mono text-xs text-[#F5E6C8]/40 mb-4">
              MADE WITH SECURITY IN MIND
            </p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#F5E6C8]/10 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#F5E6C8]/30">
              [ SECURE ]
            </span>
            <span className="font-mono text-xs text-[#F5E6C8]/30">
              [ PRIVATE ]
            </span>
            <Link href="/privacy" className="font-mono text-xs text-[#F5E6C8]/30 hover:text-[#F5E6C8]/60 transition-colors">
              PRIVACY POLICY
            </Link>
            <Link href="/terms" className="font-mono text-xs text-[#F5E6C8]/30 hover:text-[#F5E6C8]/60 transition-colors">
              TERMS OF SERVICE
            </Link>
          </div>
          <p className="font-mono text-xs text-[#F5E6C8]/30">
            &copy; Gardens Software, 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
