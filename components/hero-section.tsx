"use client"

import { ArrowRight } from "lucide-react"
import { HeroBackdrop } from "@/components/hero-backdrop"
import { BriefRequestForm } from "@/components/brief-request-form"
import { papyrusSignupUrl } from "@/lib/papyrus-links"

export function HeroSection() {
  return (
    <section id="solution-brief" className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#000000] text-[#111]">
      <HeroBackdrop />

      {/* Copy sits in a solid card, so the dots stay crisp everywhere else */}
      <div className="relative z-20 mx-auto flex min-h-[calc(100svh-67px)] max-w-[880px] flex-col items-center justify-center px-6 py-20">
        <div className="w-full border-[3px] border-[#111] bg-white px-6 py-10 text-center shadow-[10px_10px_0_#111] sm:px-12 sm:py-12">
          <span className="nb-label mb-6 inline-block !bg-[#ff5f1f]">Beag Labs · Federal + SLED</span>

          <h1 className="display-black mb-6 text-[length:min(48px,9.2vw)] leading-[.92] [overflow-wrap:normal] sm:text-[64px] lg:text-[76px]">
            We build superintelligent solutions
          </h1>

          <div className="mx-auto mb-6 h-[3px] w-full max-w-[420px] bg-[#111]" />

          <p className="mx-auto mb-8 max-w-[600px] text-[16px] font-semibold leading-[1.65] text-[#333] sm:text-[18px]">
            Our firm uses deep expertise and solutioneering paired with superintelligent agents to deploy advanced solutions for federal and SLED.
          </p>

          <div className="mx-auto max-w-[600px]">
            <BriefRequestForm briefType="services" placement="hero" />
          </div>

          <a
            href={papyrusSignupUrl()}
            className="mt-6 inline-flex items-center gap-2 border-b-2 border-[#111] pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#111] hover:border-[#ff5f1f] hover:text-[#ff5f1f]"
          >
            Get started with commercial <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
          </a>
        </div>
      </div>
    </section>
  )
}
