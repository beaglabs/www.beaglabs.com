"use client"

import Link from "next/link"
import { BrutalistPhoto } from "@/components/brutalist-photo"

const CERTS = [
  {
    label: 'HUBZone Certified',
    src: 'https://www.wildflowerintl.com/wp-content/uploads/2024/02/HubZoneCertified.png',
  },
  {
    label: 'SBA',
    src: 'https://images.seeklogo.com/logo-png/33/2/small-business-administration-logo-png_seeklogo-331699.png',
  },
]

const CAPABILITIES = [
  {
    label: 'Legacy Data Extraction',
    href: '/capability/modernization',
  },
  {
    label: 'AI-Enabled Software Development',
    href: '/capability/spec-drive-development',
  },
  {
    label: 'Agent UX Consulting',
    href: '/capability/agent-ux',
  },
  {
    label: 'SLM Feasibility & Savings',
    href: '/capability/slm-feasibility',
  },
  {
    label: 'SLM Deployments',
    href: '/capability/slm-deployment',
  },
] as const

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#FAFAF9] pt-[calc(4rem+2.375rem)]">
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-24 lg:grid-cols-[1fr_minmax(320px,520px)] lg:gap-16 lg:px-9 lg:py-14">
        <div className="max-w-[760px]">
          <span className="nb-label mb-6 inline-block">
            Custom AI. On Your Infra.
          </span>

          <h1 className="mb-6 max-w-[820px] text-[52px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[64px] lg:text-[80px]">
            Condensed Intelligence for Regulated Industries.
          </h1>

          <p className="mb-10 max-w-[650px] text-[18px] leading-[1.65] text-[#404040] font-medium">
            We use QAT and other techniques to enable high-trust industries to deploy LLMs and SLMs within their own VPCs, on-prem, or in air-gapped environments.
          </p>

          <div className="mb-8 w-full max-w-[640px]">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
                Our capabilities
              </span>
              <span className="block h-px flex-1 max-w-[40px] bg-[#111]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">
                05 / 05
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {CAPABILITIES.map((cap) => (
                <Link
                  key={cap.href}
                  href={cap.href}
                  className="group inline-flex items-center gap-2 border-[3px] border-[#111] bg-white px-4 py-3 text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#111] shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#ff5f1f]"
                >
                  {cap.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
              Certified
            </span>
            {CERTS.map((cert) => (
              <div
                key={cert.label}
                className="flex h-12 items-center justify-center border-[2px] border-[#111] bg-white px-3 shadow-[3px_3px_0px_0px_#111]"
                title={cert.label}
              >
                <img
                  src={cert.src}
                  alt={cert.label}
                  className="block h-9 w-auto max-w-[120px] object-contain"
                  loading="lazy"
                />
              </div>
            ))}
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
