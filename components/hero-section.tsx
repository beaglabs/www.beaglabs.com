"use client"

import Link from "next/link"
import { BrutalistPhoto } from "@/components/brutalist-photo"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#ff5f1f] pt-[calc(4rem+2.375rem)] text-[#111]">
      <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[9%] hidden w-px bg-[#111]/20 lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[34%] hidden w-px bg-[#111]/20 lg:block" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[1.15fr_minmax(360px,500px)] lg:gap-16 lg:px-9 lg:py-16">
        <div className="max-w-[820px]">
          <span className="nb-label mb-7 inline-block !bg-white">
            Custom AI. On Your Infra.
          </span>

          <h1 className="display-black mb-7 max-w-[860px] text-[60px] leading-[0.88] text-[#111] sm:text-[76px] lg:text-[104px]">
            Mission-Ready Agentic Dominance
          </h1>

          <div className="mb-8 h-[3px] w-full max-w-[690px] bg-[#111]" />

          <p className="mb-10 max-w-[680px] text-[18px] font-semibold leading-[1.55] text-[#181818] lg:text-[20px]">
            We develop tools and infrastructure aligned with frameworks like NIST AI RMF to help high-trust organizations get commercial-level agent capabilities on their own infrastructure.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/products/papyrus"
              className="group inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-6 py-4 text-[13px] font-extrabold uppercase tracking-[0.07em] text-[#111] shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#111]"
            >
              View Papyrus
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#111] px-6 py-4 text-[13px] font-extrabold uppercase tracking-[0.07em] text-white shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-white hover:text-[#111] hover:shadow-[6px_6px_0px_0px_#111]"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
              </svg>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 border-t-[2px] border-[#111]/60 pt-4 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#111]">
            <span>Governed AI</span>
            <span>On-prem</span>
            <span>Disconnected-ready</span>
            <span>Customer-controlled</span>
          </div>
        </div>

        <div className="relative lg:pr-3">
          <div aria-hidden="true" className="absolute -bottom-8 -left-8 hidden h-28 w-28 border-[3px] border-[#111] bg-white lg:block" />
          <BrutalistPhoto
            src="https://images.pexels.com/photos/3318582/pexels-photo-3318582.jpeg"
            alt="Industrial machinery in a regulated environment"
            badge="ON-PREM · AIR-GAPPED"
            meta="BEAG LABS / 2026"
            aspect="portrait"
            shadowSize="xl"
            imageClassName="grayscale contrast-125"
            className="mx-auto w-full max-w-[500px]"
          />
        </div>
      </div>
    </section>
  )
}
