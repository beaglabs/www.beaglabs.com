import type { Metadata } from "next"
import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { industries } from "@/data/use-cases/industries"

export const metadata: Metadata = {
  title: "Use Cases",
  description:
    "Custom small language models for legal, healthcare, finance, and government & defense. Classification, extraction, and relevance tasks — deployed on-prem, air-gapped, or in your VPC.",
  alternates: {
    canonical: "https://www.beaglabs.com/use-cases",
  },
  openGraph: {
    title: "Use Cases — Beag Labs",
    description:
      "Custom small language models for legal, healthcare, finance, and government & defense. Classification, extraction, and relevance tasks — deployed on-prem, air-gapped, or in your VPC.",
    url: "https://www.beaglabs.com/use-cases",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beag Labs — Use Cases",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Use Cases — Beag Labs",
    description:
      "Custom small language models for legal, healthcare, finance, and government & defense. Classification, extraction, and relevance tasks — deployed on-prem, air-gapped, or in your VPC.",
    images: ["/og-image.png"],
  },
}

export default function UseCasesPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Use Cases</span>
          <h1 className="mb-4 max-w-[820px] text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            Domain-specific AI for regulated industries.
          </h1>
          <p className="max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Custom small language models for classification, extraction, and
            relevance — trained on your data, deployed on your infrastructure.
            No APIs. No data leakage. You own the model.
          </p>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {industries.map((industry) => (
              <Link
                key={industry.slug}
                href={`/use-cases/${industry.slug}`}
                className="nb-card group block bg-white p-8 lg:p-10"
              >
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
                  {industry.industry}
                </div>
                <h2 className="mb-4 text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111]">
                  {industry.title}
                </h2>
                <p className="mb-6 text-[15px] leading-[1.7] text-[#444] font-medium">
                  {industry.heroDescription}
                </p>
                <div className="border-t-[3px] border-[#111] pt-5">
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">
                    Use Cases
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {industry.useCases.map((uc) => (
                      <li
                        key={uc.title}
                        className="text-[13px] font-bold text-[#111] flex items-start gap-2"
                      >
                        <span className="text-[#FF5F1F] mt-0.5 shrink-0">
                          &#x25A0;
                        </span>
                        {uc.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#FF5F1F]">
                  Explore {industry.industry}
                  <span className="text-lg">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
