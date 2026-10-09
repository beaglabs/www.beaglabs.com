"use client"

import Link from "next/link"
import { TrialCtaLink } from "@/components/trial-cta-link"
import { ArrowRight } from "lucide-react"
import { PapyrusDemo } from "@/components/papyrus-demo"

export function HeroSection() {
  return <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-white pt-[calc(4rem+2.375rem)] text-[#111]">
    <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0" />
    <div className="relative z-10 mx-auto grid min-h-[min(760px,100vh)] max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:px-9 lg:py-20">
      <div className="max-w-[680px]">
        <span className="nb-label mb-7 inline-block !bg-[#ff5f1f]">Papyrus · Customer-hosted software</span>
        <h1 className="display-black mb-7 text-[58px] leading-[.92] sm:text-[76px] lg:text-[88px]">Solving the boring problems.</h1>
        <div className="mb-7 h-[3px] w-full max-w-[540px] bg-[#111]" />
        <p className="mb-9 max-w-[580px] text-[18px] font-semibold leading-[1.6] text-[#333]">
          Give Papyrus a document, a legacy workflow, or an internal process. It helps turn repetitive work into governed, reviewable actions on your own infrastructure.
        </p>
        <div className="flex flex-wrap gap-3">
          <TrialCtaLink placement="hero" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#ff5f1f] px-5 py-3.5 text-xs font-black uppercase tracking-wide shadow-[4px_4px_0_#111] hover:bg-[#ffdfcf]">Start a one-month trial <ArrowRight className="h-4 w-4" /></TrialCtaLink>
          <Link href="/products/papyrus" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-5 py-3.5 text-xs font-black uppercase tracking-wide hover:bg-[#faf0eb]">Explore Papyrus</Link>
        </div>
        <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-wide text-[#555]">Your infrastructure · Your data · Human approvals</p>
      </div>
      <div className="min-w-0"><PapyrusDemo /></div>
    </div>
  </section>
}
