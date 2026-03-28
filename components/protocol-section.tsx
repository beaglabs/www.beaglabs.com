"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

const protocols = [
  {
    id: "mls",
    title: "MESSAGE LAYER SECURITY",
    code: "RFC 9420",
    content: "The MLS protocol provides end-to-end security for group messaging. It ensures that even if the server is compromised, your messages remain encrypted and unreadable to anyone except group members.",
  },
  {
    id: "forward",
    title: "FORWARD SECRECY",
    code: "FS-ENABLED",
    content: "Every message uses unique encryption keys. Even if a key is compromised in the future, past messages remain secure. Your conversation history is protected by design.",
  },
  {
    id: "post",
    title: "POST-COMPROMISE SECURITY",
    code: "PCS-ACTIVE",
    content: "If a device is compromised, the system automatically heals. New keys are generated, and future messages are secured without any action required from you.",
  },
]

export function ProtocolSection() {
  const [activeProtocol, setActiveProtocol] = useState("mls")

  return (
    <section className="bg-[#0f0f0f] py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topo" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F5E6C8" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="30" fill="none" stroke="#F5E6C8" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="20" fill="none" stroke="#F5E6C8" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-[#F5E6C8]/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/50">
              SECURITY PROTOCOL
            </span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-[#F5E6C8] tracking-tight mb-4">
            <TextScramble text="GARDENS IS KING" scrambleOnHover autoStart={false} />
          </h2>
          <p className="text-[#F5E6C8]/50 font-mono text-sm max-w-xl">
            Careful attention to every cryptographic detail has led to the creation of the most secure messaging platform you&apos;ll ever use.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Accordion */}
          <div className="space-y-0">
            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className={`border-b border-[#F5E6C8]/10 transition-all ${
                  activeProtocol === protocol.id ? "bg-[#1a1a1a]" : ""
                }`}
              >
                <button
                  onClick={() => setActiveProtocol(protocol.id)}
                  className="w-full py-6 px-6 flex items-center justify-between text-left group"
                >
                  <div>
                    <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/40 block mb-1">
                      [ {protocol.code} ]
                    </span>
                    <span className="text-lg font-semibold text-[#F5E6C8] group-hover:text-[#F5E6C8]/80 transition-colors">
                      {protocol.title}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-[#F5E6C8]/50 transition-transform ${
                      activeProtocol === protocol.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
                
                {activeProtocol === protocol.id && (
                  <div className="px-6 pb-6">
                    <p className="text-[#F5E6C8]/60 font-mono text-sm leading-relaxed">
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
              <div className="w-64 h-64 border border-[#F5E6C8]/20 flex items-center justify-center">
                <Image
                  src="/images/gardens-logo.png"
                  alt="Gardens"
                  width={180}
                  height={180}
                  className="opacity-80"
                />
              </div>
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-[#F5E6C8]/40" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-[#F5E6C8]/40" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-[#F5E6C8]/40" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-[#F5E6C8]/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
