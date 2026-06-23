"use client"

import Image from "next/image"
import posthog from "posthog-js"

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#FAFAF9] flex items-center overflow-hidden pt-14">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
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
          {/* Left column */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-8 font-medium">
              Applied AI Research Laboratory
            </div>

            <h1 className="text-[44px] lg:text-[56px] font-medium tracking-[-0.025em] leading-[1.12] text-[#111] mb-8">
              We advance the
              <br />
              frontier of artificial
              <br />
              intelligence.
            </h1>

            <p className="text-base text-[#555] max-w-[440px] leading-[1.75] mb-10">
              Beag Labs is an AI research lab and consulting studio. We build datasets, train models, and deploy intelligent systems — from robotics to language model fine-tuning.
            </p>

            <div className="flex items-center gap-6">
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-sm font-medium text-white bg-[#111] hover:bg-[#333] px-7 py-3.5 rounded-full transition-colors duration-200"
                onClick={() => posthog.capture('engagement_cta_clicked', { location: 'hero' })}
              >
                Start an engagement
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/projects"
                className="text-sm font-medium text-[#555] hover:text-[#111] transition-colors duration-200"
                onClick={() => posthog.capture('projects_link_clicked', { location: 'hero' })}
              >
                View projects →
              </a>
            </div>
          </div>

          {/* Right column — logo */}
          <div className="hidden lg:flex items-center justify-center relative h-[520px]">
            <Image
              src="/logo.png"
              alt="Beag Labs"
              width={400}
              height={400}
              className="w-[320px] h-[320px] object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Bottom-left corner label */}
      <div className="absolute bottom-6 left-6 font-mono text-[9px] tracking-[0.15em] text-[#999]">
        BEAG LABS / AI RESEARCH
      </div>
    </section>
  )
}
