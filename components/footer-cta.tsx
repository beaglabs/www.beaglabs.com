"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

export function FooterCTA() {
  const [email, setEmail] = useState("")

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
          <Image
            src="/images/gardens-logo.png"
            alt="Gardens"
            width={32}
            height={32}
          />
          <span className="font-mono text-sm text-[#F5E6C8]/70">Gardens</span>
          <span className="font-mono text-xs text-[#F5E6C8]/40 ml-8">Roadmap</span>
          <button className="font-mono text-xs text-[#F5E6C8] border border-[#F5E6C8]/30 px-4 py-2 hover:bg-[#F5E6C8]/5 transition-colors ml-4">
            JOIN BETA
            <ArrowRight className="w-3 h-3 inline ml-2" />
          </button>
        </div>

        {/* Email signup */}
        <div className="max-w-md mx-auto mb-4">
          <div className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-[#141414] border border-[#F5E6C8]/20 px-4 py-3 font-mono text-sm text-[#F5E6C8] placeholder:text-[#F5E6C8]/30 focus:outline-none focus:border-[#F5E6C8]/40 transition-colors"
            />
            <button className="bg-[#F5E6C8] text-[#141414] px-6 py-3 font-mono text-sm font-semibold tracking-wider flex items-center gap-2 hover:bg-[#F5E6C8]/90 transition-colors">
              ENTER
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="font-mono text-xs text-[#F5E6C8]/40 tracking-wide">
          [ BY SIGNING UP, YOU AGREE TO OUR PRIVACY POLICY ]
        </p>
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
                width={36}
                height={36}
              />
              <span className="font-mono text-lg font-semibold text-[#F5E6C8]">
                Gardens
              </span>
            </div>
            <p className="font-mono text-xs text-[#F5E6C8]/40 mb-4">
              MADE WITH SECURITY IN MIND
            </p>
            
            {/* Mini signup */}
            <div className="flex max-w-xs">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent border border-[#F5E6C8]/20 px-3 py-2 font-mono text-xs text-[#F5E6C8] placeholder:text-[#F5E6C8]/30 focus:outline-none focus:border-[#F5E6C8]/40 transition-colors"
              />
              <button className="border border-[#F5E6C8]/20 border-l-0 px-3 py-2 font-mono text-xs text-[#F5E6C8] hover:bg-[#F5E6C8]/5 transition-colors">
                JOIN
                <ArrowRight className="w-3 h-3 inline ml-1" />
              </button>
            </div>
            <p className="font-mono text-[10px] text-[#F5E6C8]/30 mt-2">
              [ PRIVACY POLICY ]
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/40 block mb-4">
                LINKS
              </span>
              <div className="space-y-2">
                <a href="#" className="font-mono text-xs text-[#F5E6C8]/60 hover:text-[#F5E6C8] block transition-colors">
                  Jobs
                </a>
                <a href="#" className="font-mono text-xs text-[#F5E6C8]/60 hover:text-[#F5E6C8] block transition-colors">
                  Imprint
                </a>
                <a href="#" className="font-mono text-xs text-[#F5E6C8]/60 hover:text-[#F5E6C8] block transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
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
          </div>
          <p className="font-mono text-xs text-[#F5E6C8]/30">
            &copy; Gardens Software, 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
