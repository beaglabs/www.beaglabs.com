"use client"

import { Package, Terminal, Shield, GitBranch } from "lucide-react"
import { TextScramble } from "./text-scramble"

const features = [
  {
    icon: Package,
    title: "MULTI-ECOSYSTEM",
    code: "NPM + RUST + MAVEN",
    description: "Scan dependencies across NPM, Rust Cargo, Maven, Python PyPI, and Docker registries. One tool, complete coverage.",
  },
  {
    icon: Terminal,
    title: "NPM LIFECYCLE HOOKS",
    code: "PREINSTALL / POSTINSTALL",
    description: "Deep integration with NPM lifecycle hooks to intercept and analyze scripts before they execute. Stop malicious install scripts cold.",
  },
  {
    icon: Shield,
    title: "ZERO CONFIG",
    code: "GITHUB ACTIONS",
    description: "Drop-in GitHub Action that scans every PR and commit. No complex setup required — just add the workflow and go.",
  },
  {
    icon: GitBranch,
    title: "VS CODE EXTENSION",
    code: "REAL-TIME",
    description: "Get instant feedback in your editor. Highlight vulnerable packages, view CVE details, and apply fixes without leaving VS Code.",
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-white py-32 px-8 lg:px-16">
      {/* Section header */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-black/30" />
          <span className="font-mono text-sm tracking-[0.3em] text-black/50">
            CORE CAPABILITIES
          </span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight">
          <TextScramble text="BUILT FOR SECURITY" scrambleOnHover autoStart={false} />
        </h2>
      </div>

      {/* Features grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-black/10">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="bg-white p-8 lg:p-12 group hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 border border-black/30 flex items-center justify-center group-hover:border-black/60 group-hover:bg-black/5 transition-all">
                <feature.icon className="w-5 h-5 text-black" />
              </div>
              <span className="font-mono text-xs tracking-[0.2em] text-black/40">
                0{index + 1}
              </span>
            </div>

            <div className="mb-4">
              <span className="font-mono text-xs tracking-[0.2em] text-black/50 block mb-2">
                [ {feature.code} ]
              </span>
              <h3 className="text-xl lg:text-2xl font-bold text-black tracking-tight">
                {feature.title}
              </h3>
            </div>

            <p className="text-black/60 leading-relaxed font-mono text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
