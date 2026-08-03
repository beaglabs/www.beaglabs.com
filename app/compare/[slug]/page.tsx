import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { comparisons } from "@/data/comparisons/comparisons"

interface ComparisonPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return comparisons.map((comparison) => ({
    slug: comparison.slug,
  }))
}

export async function generateMetadata({
  params,
}: ComparisonPageProps): Promise<Metadata> {
  const { slug } = await params
  const comparison = comparisons.find((c) => c.slug === slug)

  if (!comparison) {
    return { title: "Not Found" }
  }

  const canonical = `https://www.beaglabs.com/compare/${slug}`

  return {
    title: `${comparison.title} — Beag Labs`,
    description: comparison.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${comparison.title} — Beag Labs`,
      description: comparison.metaDescription,
      url: canonical,
      siteName: "Beag Labs",
      type: "article",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Beag Labs — ${comparison.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${comparison.title} — Beag Labs`,
      description: comparison.metaDescription,
      images: ["/og-image.png"],
    },
  }
}

export default async function ComparisonDetailPage({
  params,
}: ComparisonPageProps) {
  const { slug } = await params
  const comparison = comparisons.find((c) => c.slug === slug)

  if (!comparison) {
    notFound()
  }

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Comparisons", url: "/compare" },
    { name: comparison.title, url: `/compare/${slug}` },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: comparison.title,
    description: comparison.metaDescription,
    author: {
      '@type': 'Organization',
      name: 'Beag Labs',
      url: 'https://www.beaglabs.com',
    },
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="px-6 pt-32 pb-20 lg:px-9 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-[1440px]">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <Breadcrumbs items={breadcrumbItems} />

          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Comparison
          </p>

          <h1 className="mb-6 max-w-[820px] text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            {comparison.title}
          </h1>

          <p className="mb-12 max-w-[640px] text-[17px] leading-[1.72] text-[#404040] font-medium">
            {comparison.metaDescription}
          </p>

          {/* Pros & Cons Grid */}
          <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[
              { option: comparison.optionA, accent: true },
              { option: comparison.optionB, accent: false },
            ].map(({ option, accent }) => (
              <div key={option.name} className="nb-card bg-white p-8">
                <div
                  className={`mb-2 font-mono text-[10px] uppercase tracking-[0.26em] ${accent ? "text-[#ff5f1f]" : "text-[#6B6B6B]"}`}
                >
                  {accent ? "Option A" : "Option B"}
                </div>
                <h2 className="mb-4 text-[24px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111]">
                  {option.name}
                </h2>
                <p className="mb-6 text-[14px] leading-[1.7] text-[#555] font-medium">
                  {option.description}
                </p>

                <div className="mb-5">
                  <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#111]">
                    Pros
                  </div>
                  <ul className="space-y-2.5">
                    {option.pros.map((pro, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[14px] leading-[1.6] text-[#404040] font-medium"
                      >
                        <span className="mt-[3px] text-[#ff5f1f] shrink-0 text-[14px]">
                          &#10003;
                        </span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">
                    Cons
                  </div>
                  <ul className="space-y-2.5">
                    {option.cons.map((con, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[14px] leading-[1.6] text-[#404040] font-medium"
                      >
                        <span className="mt-[3px] text-[#999] shrink-0 text-[14px]">
                          &#x2715;
                        </span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-[3px] border-[#111]">
                    <th className="py-4 pr-4 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">
                      Feature
                    </th>
                    <th className="py-4 px-4 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff5f1f]">
                      {comparison.optionA.name}
                    </th>
                    <th className="py-4 pl-4 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">
                      {comparison.optionB.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.comparisonTable.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[rgba(17,17,17,0.08)]"
                    >
                      <td className="py-4 pr-4 text-[14px] font-extrabold text-[#111] align-top">
                        {row.feature}
                      </td>
                      <td className="py-4 px-4 text-[14px] leading-[1.6] text-[#404040] font-medium align-top">
                        {row.optionA}
                      </td>
                      <td className="py-4 pl-4 text-[14px] leading-[1.6] text-[#404040] font-medium align-top">
                        {row.optionB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verdict */}
          <div className="mb-16 max-w-[820px]">
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
              Verdict
            </h2>
            <div className="space-y-5">
              {comparison.verdict.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[16px] leading-[1.82] text-[#404040] font-medium"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="border-t-[3px] border-[#111] pt-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
                  Get started
                </div>
                <h2 className="max-w-[560px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[34px]">
                  See if a custom SLM fits your workload.
                </h2>
              </div>
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

          <div className="nb-section-divider mt-12 pt-8">
            <Link
              href="/compare"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#ff5f1f] transition-colors hover:text-[#ff5f1f]"
            >
              &larr; Back to Comparisons
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
