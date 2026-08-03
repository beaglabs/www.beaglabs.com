import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { industries } from "@/data/use-cases/industries"

interface UseCasePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return industries.map((industry) => ({
    slug: industry.slug,
  }))
}

export async function generateMetadata({
  params,
}: UseCasePageProps): Promise<Metadata> {
  const { slug } = await params
  const industry = industries.find((i) => i.slug === slug)

  if (!industry) {
    return { title: "Not Found" }
  }

  return {
    title: industry.title,
    description: industry.metaDescription,
    alternates: {
      canonical: `https://www.beaglabs.com/use-cases/${slug}`,
    },
    openGraph: {
      title: `${industry.title} — Beag Labs`,
      description: industry.metaDescription,
      url: `https://www.beaglabs.com/use-cases/${slug}`,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Beag Labs — ${industry.industry}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${industry.title} — Beag Labs`,
      description: industry.metaDescription,
      images: ["/og-image.png"],
    },
  }
}

export default async function UseCaseDetailPage({
  params,
}: UseCasePageProps) {
  const { slug } = await params
  const industry = industries.find((i) => i.slug === slug)

  if (!industry) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: industry.title,
    description: industry.metaDescription,
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Use Cases", url: "/use-cases" },
              { name: industry.industry, url: `/use-cases/${industry.slug}` },
            ]}
          />
          <div className="mt-8 mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            {industry.industry}
          </div>
          <h1 className="mb-5 max-w-[820px] text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            {industry.title}
          </h1>
          <p className="max-w-[640px] text-[17px] leading-[1.72] text-[#404040] font-medium">
            {industry.heroDescription}
          </p>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Use Cases
          </div>
          <h2 className="mb-12 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            What you can automate.
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {industry.useCases.map((uc) => (
              <div key={uc.title} className="nb-card group bg-white p-8">
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#111]">
                  {uc.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-[#444] font-medium">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
                Benefits
              </div>
              <h2 className="max-w-[470px] text-[34px] font-extrabold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
                Why teams choose Beag Labs.
              </h2>
            </div>
            <ul className="space-y-4">
              {industry.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 border-b border-[rgba(17,17,17,0.08)] pb-4"
                >
                  <span className="mt-0.5 text-[#ff5f1f] shrink-0 text-[18px]">
                    &#10003;
                  </span>
                  <span className="text-[16px] font-bold leading-[1.5] text-[#111]">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Compliance &amp; Security
          </div>
          <h2 className="mb-12 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Built for your security requirements.
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {industry.compliance.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border-[3px] border-[#111] bg-white px-6 py-5"
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center border-[2px] border-[#111] bg-[#ff5f1f] text-[14px] font-extrabold text-[#111]">
                  &#10003;
                </span>
                <span className="text-[15px] font-bold leading-[1.4] text-[#111]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-[3px] border-[#111] bg-[#111] text-white px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
              Get started
            </div>
            <h2 className="mb-4 max-w-[720px] text-[42px] font-extrabold leading-[0.96] tracking-[-0.05em] text-white lg:text-[56px]">
              {industry.ctaText}
            </h2>
            <p className="max-w-[560px] text-[18px] leading-[1.65] text-[#C9C9C9] font-medium">
              Talk to us about your classification, extraction, or relevance
              workload. We&apos;ll show you how a custom SLM deployed in your
              environment beats a frontier API on cost, speed, and privacy.
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-start gap-4 lg:justify-end">
            <a
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
            >
              Talk to us <span className="text-lg">&rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
