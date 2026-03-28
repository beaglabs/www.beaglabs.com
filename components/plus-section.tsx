"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

export function PlusSection() {
  const [email, setEmail] = useState("")

  return (
    <section className="bg-[#1a1a1a] py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Diagonal accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F5E6C8]/5 transform skew-x-12 origin-top-right" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#F5E6C8]/30" />
              <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/50">
                ENHANCED ACCESS
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight mb-4">
              <TextScramble text="EXPERIENCE" scrambleOnHover autoStart={false} />
            </h2>

            <div className="flex items-center gap-4 mb-8">
              <Image
                src="/images/gardens-logo.png"
                alt="Gardens"
                width={40}
                height={40}
              />
              <span className="text-3xl font-bold text-[#F5E6C8]">Plus</span>
            </div>

            <p className="text-[#F5E6C8]/60 font-mono text-sm leading-relaxed mb-8 max-w-md">
              Be among the first to try Gardens Plus for free by signing up for the beta today. 
              Get early access to premium features and priority support.
            </p>

            {/* Email signup */}
            <div className="max-w-md">
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-[#141414] border border-[#F5E6C8]/20 px-4 py-3 font-mono text-sm text-[#F5E6C8] placeholder:text-[#F5E6C8]/30 focus:outline-none focus:border-[#F5E6C8]/40 transition-colors"
                />
                <button className="bg-[#F5E6C8] text-[#141414] px-6 py-3 font-mono text-sm font-semibold tracking-wider flex items-center gap-2 hover:bg-[#F5E6C8]/90 transition-colors">
                  JOIN
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="font-mono text-xs text-[#F5E6C8]/40 mt-3 tracking-wide">
                [ EARLY ACCESS PROGRAM ]
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-6">
            {[
              { label: "PRIORITY SUPPORT", code: "24/7" },
              { label: "EXTENDED STORAGE", code: "100GB" },
              { label: "CUSTOM DOMAINS", code: "UNLIMITED" },
              { label: "ADVANCED ANALYTICS", code: "BETA" },
            ].map((feature, index) => (
              <div
                key={feature.label}
                className="flex items-center justify-between py-4 border-b border-[#F5E6C8]/10 group hover:border-[#F5E6C8]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#F5E6C8]/40">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-sm text-[#F5E6C8]">
                    {feature.label}
                  </span>
                </div>
                <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/50">
                  [ {feature.code} ]
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
