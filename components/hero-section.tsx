"use client"

import { ArrowRight } from "lucide-react"
import { EdgyHero } from "@/components/edgy-hero"
import { BriefRequestForm } from "@/components/brief-request-form"

export function HeroSection() {
  return (
    <EdgyHero
      id="solution-brief"
      height="full"
      size="xl"
      background="ember"
      eyebrow="Beag Labs · Federal + SLED"
      before="We build"
      slab="superintelligent"
      after="solutions."
      description="Our firm uses deep expertise and solutioneering paired with superintelligent agents to deploy advanced solutions for federal and SLED."
      next={{ href: "#capabilities", label: "How we work" }}
      asideLabel="Solution brief · 4-page PDF"
      aside={<>
        <BriefRequestForm briefType="services" placement="hero" stacked />
        <a
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 border-b-2 border-[#111] pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#111] hover:border-[#c2410c] hover:text-[#c2410c]"
        >
          Get started with commercial <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
        </a>
      </>}
    />
  )
}
