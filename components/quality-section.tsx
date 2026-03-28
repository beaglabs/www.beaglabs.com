"use client"

import { Bell, Compass, Moon, UserPlus } from "lucide-react"
import { TextScramble } from "./text-scramble"

const features = [
  {
    icon: Bell,
    eyebrow: "STAY INFORMED",
    title: "Smart Alerts",
    code: "NOTIFY",
    description: "Intelligent notifications that respect your focus. Get alerts for what matters, silence the noise.",
  },
  {
    icon: Compass,
    eyebrow: "EXPLORE NETWORKS",
    title: "Discovery",
    code: "SEARCH",
    description: "Find communities aligned with your interests. Curated recommendations based on your affinity graph.",
  },
  {
    icon: Moon,
    eyebrow: "REST MODE",
    title: "Quiet Hours",
    code: "DND",
    description: "Schedule downtime for uninterrupted rest. Your messages wait patiently until you return.",
  },
  {
    icon: UserPlus,
    eyebrow: "GROW TOGETHER",
    title: "Easy Invites",
    code: "SHARE",
    description: "One-tap invitations with secure verification. Expand your trusted network effortlessly.",
  },
]

export function QualitySection() {
  return (
    <section className="bg-[#141414] py-32 px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-[#F5E6C8]/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/50">
              QUALITY OF LIFE
            </span>
            <div className="w-12 h-px bg-[#F5E6C8]/30" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight mb-4">
            <TextScramble text="THE MESSAGING APP" scrambleOnHover autoStart={false} />
          </h2>
          <h3 className="text-3xl lg:text-4xl font-bold text-[#F5E6C8]/70 tracking-tight">
            {"YOU'VE ALWAYS WANTED"}
          </h3>
          <p className="text-[#F5E6C8]/50 font-mono text-sm mt-6 max-w-xl mx-auto">
            Gardens delivers the kind of features you&apos;ve been missing from other messaging apps.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-[#0f0f0f] border border-[#F5E6C8]/10 p-8 group hover:border-[#F5E6C8]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/40">
                  {feature.eyebrow}
                </span>
                <span className="font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/30">
                  [ {feature.code} ]
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-[#F5E6C8]/20 flex items-center justify-center shrink-0 group-hover:border-[#F5E6C8]/40 group-hover:bg-[#F5E6C8]/5 transition-all">
                  <feature.icon className="w-4 h-4 text-[#F5E6C8]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#F5E6C8] mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-[#F5E6C8]/50 font-mono text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom index */}
              <div className="mt-6 pt-4 border-t border-[#F5E6C8]/10">
                <span className="font-mono text-xs text-[#F5E6C8]/30">
                  MODULE_0{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
