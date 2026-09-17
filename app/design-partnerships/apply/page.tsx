import type { Metadata } from "next"
import Link from "next/link"

import { PilotApplication } from "@/components/pilot-application"
import { SiteFooter } from "@/components/site-footer"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Apply to the Domain Intelligence Pilot",
  description:
    "Apply for the 12-week Domain Intelligence Pilot. Eleven questions on your domain, your data, your deployment target, and your timeline — answered on one page or in three steps.",
  path: "/design-partnerships/apply",
  label: "Pilot Program",
  ogDescription:
    "Tell us the domain, the data, and where it has to run. We use these answers to decide whether the pilot is a fit and what to scope it against.",
})

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#111]">
      <section className="px-6 pt-20 pb-14 lg:px-9 lg:pt-28 lg:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <nav className="mb-10 font-mono text-[10px] uppercase tracking-[0.26em] text-[#7c7c7c]">
            <Link href="/design-partnerships" className="hover:text-[#111]">
              Design partnerships
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#111]">Apply</span>
          </nav>

          <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-16">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
                Domain Intelligence Pilot
              </div>
              <h1 className="mb-5 max-w-[560px] text-[40px] leading-[0.98] font-bold tracking-[-0.055em] text-balance lg:text-[54px]">
                Apply for the pilot.
              </h1>
              <p className="mb-8 max-w-[460px] text-[17px] leading-[1.72] text-[#4e4e4e] text-pretty">
                Twelve weeks, one domain, deployed in your environment. The questions below
                are the ones that tell us whether the pilot is a fit — and if it is, they
                are also the first draft of the scope.
              </p>

              <dl className="max-w-[460px] border-t border-[rgba(0,0,0,0.12)] text-[14px]">
                {[
                  ["Response time", "Two business days"],
                  ["Engagement", "12 weeks, fixed scope"],
                  ["Deployment", "Your cloud, on-prem, or air-gapped"],
                  ["Nothing to install", "Answers are reviewed by an engineer, not a bot"],
                ].map(([term, detail]) => (
                  <div
                    key={term}
                    className="flex items-baseline justify-between gap-6 border-b border-[rgba(0,0,0,0.12)] py-3"
                  >
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#7c7c7c]">
                      {term}
                    </dt>
                    <dd className="text-right text-[#111]">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <PilotApplication />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
