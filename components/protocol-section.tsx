"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

const protocols = [
  {
    id: "sbom",
    title: "SBOM GENERATION",
    code: "SPDX / CYCLONE DX",
    content: "Automatically generate Software Bill of Materials for every build. Know exactly what dependencies you're shipping and where they came from.",
  },
  {
    id: "cve",
    title: "CVE DETECTION",
    code: "REAL-TIME FEEDS",
    content: "Continuous monitoring against the latest vulnerability databases. Get alerted the moment a CVE affects one of your dependencies.",
  },
  {
    id: "malware",
    title: "MALWARE ANALYSIS",
    code: "HEURISTIC + STATIC",
    content: "Static and heuristic analysis detects typosquatting, obfuscated code, and known malicious patterns before they enter your codebase.",
  },
]

export function ProtocolSection() {
  const [activeProtocol, setActiveProtocol] = useState("sbom")

  return (
    <section className="bg-neutral-50 py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topo" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#000" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="30" fill="none" stroke="#000" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="20" fill="none" stroke="#000" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-black/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-black/50">
              INSTALL-TIME RISK ANALYSIS
            </span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tight mb-4">
            <TextScramble text="SANDBOXED DECISION ENGINE" scrambleOnHover autoStart={false} />
          </h2>
          <p className="text-black/50 font-mono text-sm max-w-xl">
            The most advanced install-time risk analysis engine, ensuring your software supply chain remains secure from the moment it's installed.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Accordion */}
          <div className="space-y-0">
            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className={`border-b border-black/10 transition-all ${
                  activeProtocol === protocol.id ? "bg-white" : ""
                }`}
              >
                <button
                  onClick={() => setActiveProtocol(protocol.id)}
                  className="w-full py-6 px-6 flex items-center justify-between text-left group"
                >
                  <div>
                    <span className="font-mono text-xs tracking-[0.2em] text-black/40 block mb-1">
                      [ {protocol.code} ]
                    </span>
                    <span className="text-lg font-semibold text-black group-hover:text-black/80 transition-colors">
                      {protocol.title}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-black/50 transition-transform ${
                      activeProtocol === protocol.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
                
                {activeProtocol === protocol.id && (
                  <div className="px-6 pb-6">
                    <p className="text-black/60 font-mono text-sm leading-relaxed">
                      {protocol.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Visual */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 border border-black/20 flex items-center justify-center">
                <Image
                  src="/images/gardens-logo.png"
                  alt="SSCS"
                  width={180}
                  height={180}
                  className="opacity-80"
                />
              </div>
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-black/40" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-black/40" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-black/40" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-black/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
