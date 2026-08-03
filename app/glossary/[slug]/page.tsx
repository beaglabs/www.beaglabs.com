import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { Breadcrumbs } from "@/components/breadcrumbs"
import {
  glossaryTerms,
  getGlossaryTerm,
  getRelatedTerms,
} from "@/data/glossary/terms"

interface GlossaryTermPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return glossaryTerms.map((term) => ({
    slug: term.slug,
  }))
}

export async function generateMetadata({
  params,
}: GlossaryTermPageProps): Promise<Metadata> {
  const { slug } = await params
  const term = getGlossaryTerm(slug)

  if (!term) {
    return { title: "Not Found" }
  }

  const canonical = `https://www.beaglabs.com/glossary/${slug}`

  return {
    title: `${term.term} — Beag Labs Glossary`,
    description: term.shortDefinition,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${term.term} — Beag Labs Glossary`,
      description: term.shortDefinition,
      url: canonical,
      siteName: "Beag Labs",
      type: "article",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Beag Labs — ${term.term}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${term.term} — Beag Labs Glossary`,
      description: term.shortDefinition,
      images: ["/og-image.png"],
    },
  }
}

export default async function GlossaryTermPage({
  params,
}: GlossaryTermPageProps) {
  const { slug } = await params
  const term = getGlossaryTerm(slug)

  if (!term) {
    notFound()
  }

  const related = getRelatedTerms(term.relatedTerms)

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Glossary", url: "/glossary" },
    { name: term.term, url: `/glossary/${slug}` },
  ]

  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.shortDefinition,
    termCode: term.slug,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Beag Labs ML/AI Glossary",
      url: "https://www.beaglabs.com/glossary",
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `https://www.beaglabs.com${item.url}`,
    })),
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(definedTermJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="px-6 pt-32 pb-20 lg:px-9 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-[1440px]">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="mx-auto max-w-[840px]">
            <div className="nb-card bg-white p-8 lg:p-12">
              <span className="nb-label mb-5 inline-block">
                {term.category}
              </span>

              <h1 className="mb-4 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
                {term.term}
              </h1>

              <p className="mb-8 max-w-[680px] text-[17px] leading-[1.65] font-medium text-[#404040]">
                {term.shortDefinition}
              </p>

              <div className="nb-section-divider mb-10" />

              <div className="mb-12">
                <span className="nb-label mb-5 inline-block">Definition</span>
                <div className="space-y-6">
                  {term.definition.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-[16px] leading-[1.82] font-medium text-[#404040]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mb-12">
                <span className="nb-label mb-5 inline-block">Key Points</span>
                <ul className="space-y-3">
                  {term.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[15px] leading-[1.7] font-medium text-[#404040]"
                    >
                      <span className="mt-0.5 shrink-0 text-[14px] text-[#ff5f1f]">
                        &#x25A0;
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {term.exampleUseCase && (
                <div className="mb-12 border-[3px] border-[#111] bg-[#FAFAF9] p-6 lg:p-8">
                  <span className="nb-label mb-4 inline-block">
                    Example Use Case
                  </span>
                  <p className="text-[15px] leading-[1.82] font-medium text-[#404040]">
                    {term.exampleUseCase}
                  </p>
                </div>
              )}

              {related.length > 0 && (
                <div className="mb-10">
                  <span className="nb-label mb-5 inline-block">
                    Related Terms
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {related.map((rel) => (
                      <Link
                        key={rel.slug}
                        href={`/glossary/${rel.slug}`}
                        className="nb-card inline-block bg-white px-4 py-2 text-[13px] font-bold tracking-[-0.01em] text-[#111]"
                      >
                        {rel.term}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="nb-section-divider pt-8">
                <Link
                  href="/glossary"
                  className="nb-btn inline-flex items-center gap-2 px-6 py-3 text-[11px] font-extrabold uppercase"
                >
                  <span aria-hidden="true">&larr;</span>
                  Back to Glossary
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
