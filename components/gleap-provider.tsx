'use client'

import { useEffect, useCallback } from 'react'
import Gleap from 'gleap'
import { ArrowUpRight } from 'lucide-react'
import posthog from 'posthog-js'

let gleapReady = false

export function GleapCTA() {
  const openGleap = useCallback(() => {
    posthog.capture('gleap_cta_opened', { topic: 'forward_deployed_ml_engineering' })
    if (typeof window !== 'undefined' && (window as any).Gleap) {
      ;(window as any).Gleap.open()
    }
  }, [])

  return (
    <section className="relative bg-[#FAFAF9] py-24 lg:py-28 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
              Forward Deployed ML Engineering
            </div>
            <h2 className="text-[28px] lg:text-[32px] font-medium text-[#111] tracking-[-0.02em] leading-[1.2]">
              Learn about the
              <br />
              benefits of
              <br />
              scientific domain models
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-7 flex items-end">
            <p className="text-[15px] text-[#555] leading-[1.75]">
              We embed with teams to build domain-specific ML systems that are
              grounded in real scientific workflows. Ask how forward-deployed
              ML engineering can turn scientific domain models into faster,
              more reliable research and product outcomes.
            </p>
          </div>
        </div>

        <button
          onClick={openGleap}
          className="group w-full border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.10)] hover:shadow-sm transition-all duration-300 text-left p-10 lg:p-14 cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
                Get in touch
              </div>
              <h3 className="text-2xl lg:text-[28px] font-medium text-[#111] tracking-[-0.02em] mb-4">
                Ask about Forward Deployed ML Engineering
              </h3>
              <p className="text-[15px] text-[#555] leading-[1.75] max-w-2xl">
                Chat with us about scientific domain models, embedded ML
                engineering, or bringing specialized research systems into
                production.
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#999] group-hover:text-[#FF5F1F] transition-colors flex-shrink-0 mt-2" />
          </div>
        </button>
      </div>
    </section>
  )
}

export function GleapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!gleapReady && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GLEAP_API_KEY) {
      Gleap.initialize(process.env.NEXT_PUBLIC_GLEAP_API_KEY)
      gleapReady = true
    }
  }, [])

  return <>{children}</>
}
