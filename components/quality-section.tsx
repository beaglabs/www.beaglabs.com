"use client"

import { FileCode, Bug, Lock, GitPullRequest } from "lucide-react"
import { TextScramble } from "./text-scramble"

const features = [
  {
    icon: FileCode,
    eyebrow: "LANGUAGE SUPPORT",
    title: "NPM, Rust, Maven",
    code: "JS + RUST + JAVA",
    description: "Deep analysis of package.json, Cargo.toml, and pom.xml files. Catch vulnerable dependencies before they ship.",
  },
  {
    icon: Bug,
    eyebrow: "PYTHON + DOCKER",
    title: "PyPI & Containers",
    code: "PY + DOCKER",
    description: "Scan requirements.txt, pyproject.toml, and Docker images for known vulnerabilities and misconfigurations.",
  },
  {
    icon: Lock,
    eyebrow: "NPM HOOKS",
    title: "Lifecycle Protection",
    code: "HOOKS",
    description: "Intercept and audit NPM preinstall, postinstall, and pre/post publish hooks to prevent malicious script execution.",
  },
  {
    icon: GitPullRequest,
    eyebrow: "CI/CD INTEGRATION",
    title: "GitHub Actions Native",
    code: "ACTIONS",
    description: "Native GitHub Action with PR annotations. Block merges that introduce vulnerable dependencies automatically.",
  },
]

export function QualitySection() {
  return (
    <section className="bg-neutral-50 py-32 px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-black/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-black/50">
              SUPPORTED ECOSYSTEMS
            </span>
            <div className="w-12 h-px bg-black/30" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight mb-4">
            <TextScramble text="THE DEPENDENCY RISK FIREWALL" scrambleOnHover autoStart={false} />
          </h2>
          <h3 className="text-3xl lg:text-4xl font-bold text-black/70 tracking-tight">
            {"YOU'VE ALWAYS NEEDED"}
          </h3>
          <p className="text-black/50 font-mono text-sm mt-6 max-w-xl mx-auto">
            Gardens delivers the kind of supply chain protection you&apos;ve been missing from other security tools.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white border border-black/10 p-8 group hover:border-black/30 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-mono text-xs tracking-[0.2em] text-black/40">
                  {feature.eyebrow}
                </span>
                <span className="font-mono text-xs tracking-[0.2em] text-black/30">
                  [ {feature.code} ]
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-black/20 flex items-center justify-center shrink-0 group-hover:border-black/40 group-hover:bg-black/5 transition-all">
                  <feature.icon className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-black/50 font-mono text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom index */}
              <div className="mt-6 pt-4 border-t border-black/10">
                <span className="font-mono text-xs text-black/30">
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
