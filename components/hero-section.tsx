"use client"

import { Dithering } from "@paper-design/shaders-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white flex items-center overflow-hidden pt-14">
      <div className="absolute inset-0 opacity-[0.035]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="herogrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#0a0a0a" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#herogrid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="font-mono text-xs tracking-widest text-[#FF5F1F] uppercase mb-10">
              Applied AI Research Laboratory
            </div>

            <h1 className="text-4xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-[-0.04em] leading-[1.1] text-[#0a0a0a] mb-8">
              We advance the
              <br />
              frontier of artificial
              <br />
              <span className="text-[#FF5F1F]">intelligence.</span>
            </h1>

            <p className="text-base text-[#6B7280] max-w-lg leading-[1.8] mb-12 font-light">
              Beag Labs is an AI research lab and consulting studio. We build datasets, train models, and deploy intelligent systems — from robotics to language model fine-tuning.
            </p>

            <div className="flex items-center gap-6">
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 font-mono text-xs tracking-wide text-white bg-[#0a0a0a] px-7 py-4 hover:bg-[#FF5F1F] transition-colors"
              >
                START AN ENGAGEMENT
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/projects"
                className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-[#0a0a0a] hover:text-[#FF5F1F] transition-colors"
              >
                VIEW PROJECTS
                <span className="text-[#FF5F1F]">&rarr;</span>
              </a>
            </div>
          </div>

          <div className="hidden lg:block relative h-[520px]">
            <div className="absolute inset-0 overflow-hidden">
              <Dithering
                colorBack="#0a0a0a"
                colorFront="#FF5F1F"
                shape="warp"
                type="4x4"
                size={3}
                speed={0.4}
                scale={1.2}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12rem] font-bold tracking-[-0.05em] text-white mix-blend-difference select-none">
                B_
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 font-mono text-[10px] tracking-widest text-[#C0C0C0]">
        BEAG LABS / AI RESEARCH
      </div>
    </section>
  )
}
