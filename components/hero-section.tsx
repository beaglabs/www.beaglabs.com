"use client"

import Link from "next/link"
import { BrutalistPhoto } from "@/components/brutalist-photo"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#FAFAF9] pt-[calc(4rem+2.375rem)]">
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-24 lg:grid-cols-[1fr_minmax(320px,520px)] lg:gap-16 lg:px-9 lg:py-14">
        <div className="max-w-[760px]">
          <span className="nb-label mb-6 inline-block">
            Custom AI. On Your Infra.
          </span>

          <h1 className="mb-6 max-w-[820px] text-[52px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[64px] lg:text-[80px]">
            Mission-Ready Agentic Dominance
          </h1>

          <p className="mb-10 max-w-[650px] text-[18px] leading-[1.65] text-[#404040] font-medium">
            We develop tools and infrastructure aligned with frameworks like NIST AI RMF to help high-trust organizations get commercial-level agent capabilities on their own infrastructure. 
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/products/papyrus"
              className="group inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.06em] text-[#111] shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#ff5f1f]"
            >
              View Papyrus
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#111] px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#ff5f1f]"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </Link>
          </div>
        </div>

        <BrutalistPhoto
          src="https://images.pexels.com/photos/3318582/pexels-photo-3318582.jpeg"
          alt="Industrial machinery in a regulated environment"
          badge="ON-PREM · AIR-GAPPED"
          meta="beaglabs / home"
          rounded
          className="hidden lg:flex mx-auto w-full max-w-[520px]"
        />
      </div>
    </section>
  )
}
