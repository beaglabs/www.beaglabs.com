"use client"

import Link from "next/link"
import { TrialCtaLink } from "@/components/trial-cta-link"
import { ArrowRight } from "lucide-react"
import { HeroShowcase } from "@/components/hero-showcase"
import { Space_Grotesk } from "next/font/google"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-hero" })

export function HeroSection() {
  return <section className={`${spaceGrotesk.variable} relative overflow-hidden border-b-[3px] border-[#111] bg-[#ffffff] pt-6 md:pt-10 font-mono text-[#111]`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <video className="h-full w-full object-cover opacity-70 motion-reduce:hidden" src="/hero/clip-1.mp4" poster="/hero/poster-1.jpg" autoPlay muted loop playsInline preload="metadata" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hidden h-full w-full object-cover opacity-70 motion-reduce:block" src="/hero/poster-1.jpg" alt="" />
      <div className="absolute inset-0 bg-[#ffffff]/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffffff]/70 via-transparent to-[#ffffff]/80" />
      <div className="marketing-grid absolute inset-0" />
    </div>
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-16 lg:gap-16 lg:px-9 lg:py-20">
      <div className="max-w-[960px]">
        <span className="nb-label mb-7 inline-block !bg-[#ff5f1f]">Papyrus · Customer-hosted software</span>
        <h1 className="mb-7 font-[family-name:var(--font-hero)] text-[52px] font-bold leading-[.95] tracking-[-0.04em] sm:text-[72px] lg:text-[88px]">Agentic Solutions for SLED and Federal</h1>
        <div className="mb-7 h-[3px] w-full max-w-[540px] bg-[#111]" />
        <p className="mb-9 max-w-[580px] text-[16px] font-medium leading-[1.7] text-[#333]">
          Give Papyrus a document, a legacy workflow, or an internal process. It helps turn repetitive work into governed, reviewable actions on your own infrastructure.
        </p>
        <div className="flex flex-wrap gap-3">
          <TrialCtaLink placement="hero" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#ff5f1f] px-5 py-3.5 text-xs font-black uppercase tracking-wide shadow-[4px_4px_0_#111] hover:bg-[#ffdfcf]">Start a one-month trial <ArrowRight className="h-4 w-4" /></TrialCtaLink>
          <Link href="/products/papyrus" className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-5 py-3.5 text-xs font-black uppercase tracking-wide hover:bg-[#faf0eb]">Explore Papyrus</Link>
        </div>
        <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-wide text-[#555]">Your infrastructure · Your data · Human approvals</p>
      </div>
      <div className="min-w-0 w-full"><HeroShowcase /></div>
    </div>
  </section>
}
