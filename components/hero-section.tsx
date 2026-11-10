"use client"

import { ArrowRight } from "lucide-react"
import { EdgyHero } from "@/components/edgy-hero"
import { GroovyNeon } from "@/components/groovy-neon"
import { BriefRequestForm } from "@/components/brief-request-form"

export function HeroSection() {
  return (
    <EdgyHero
      id="solution-brief"
      height="full"
      size="xl"
      background="ember"
      eyebrow="Beag Labs · Federal + SLED"
      before="Building"
      slab={<GroovyNeon text="groovy" />}
      slabStyle="neon"
      after="superintelligence"
      description="Our firm uses deep expertise and solutioneering paired with agentic support to deploy advanced solutions for federal and SLED. Our main product is Papyrus, the STIG-hardened superintelligent harness runtime built for the ATO from commit #001."
      asideWidth="below"
      asideLabel="Solution brief · 4-page PDF"
      aside={<>
        <BriefRequestForm briefType="services" placement="hero" stacked />
        <a
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 border-b-2 border-[#1a1714] pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#1a1714] hover:border-[#c2410c] hover:text-[#c2410c]"
        >
          Get started with commercial <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
        </a>
      </>}
    />
  )
}
