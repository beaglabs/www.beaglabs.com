"use client"

import { Lock, Users, Shield, Fingerprint } from "lucide-react"
import { TextScramble } from "./text-scramble"

const features = [
  {
    icon: Lock,
    title: "E2E ENCRYPTION",
    code: "AES-256-GCM",
    description: "Every message encrypted with Message Layer Security protocol. Your conversations remain private, always.",
  },
  {
    icon: Users,
    title: "AFFINITY GROUPS",
    code: "UNLIMITED",
    description: "Create and join communities built around shared interests. Verified membership, trusted connections.",
  },
  {
    icon: Shield,
    title: "ZERO KNOWLEDGE",
    code: "ZK-PROOF",
    description: "We cannot read your messages. Not now, not ever. Your keys, your data, your control.",
  },
  {
    icon: Fingerprint,
    title: "DEVICE VERIFY",
    code: "MULTI-DEVICE",
    description: "Seamless synchronization across all your devices with cryptographic verification.",
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#141414] py-32 px-8 lg:px-16">
      {/* Section header */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-[#F5E6C8]/30" />
          <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/50">
            CORE CAPABILITIES
          </span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight">
          <TextScramble text="BUILT FOR PRIVACY" scrambleOnHover autoStart={false} />
        </h2>
      </div>

      {/* Features grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-[#F5E6C8]/10">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="bg-[#141414] p-8 lg:p-12 group hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 border border-[#F5E6C8]/30 flex items-center justify-center group-hover:border-[#F5E6C8]/60 group-hover:bg-[#F5E6C8]/5 transition-all">
                <feature.icon className="w-5 h-5 text-[#F5E6C8]" />
              </div>
              <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/40">
                0{index + 1}
              </span>
            </div>

            <div className="mb-4">
              <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/50 block mb-2">
                [ {feature.code} ]
              </span>
              <h3 className="text-xl lg:text-2xl font-bold text-[#F5E6C8] tracking-tight">
                {feature.title}
              </h3>
            </div>

            <p className="text-[#F5E6C8]/60 leading-relaxed font-mono text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
