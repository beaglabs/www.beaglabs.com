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
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="px-6 pt-32 pb-20 lg:px-9 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-3xl">
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

          <Breadcrumbs items={breadcrumbItems} />

          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            {term.category}
          </p>

          <h1 className="mb-6 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            {term.term}
          </h1>

          <p className="mb-10 text-[18px] leading-[1.75] text-[#404040] font-medium">
            {term.shortDefinition}
          </p>

          <div className="nb-section-divider mb-10" />

          <div className="mb-12">
            <h2 className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
              Definition
            </h2>
            <div className="space-y-5">
              {term.definition.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[16px] leading-[1.82] text-[#404040] font-medium"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
              Key Points
            </h2>
            <ul className="space-y-3">
              {term.keyPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[15px] leading-[1.7] text-[#404040] font-medium"
                >
                  <span className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#FF5F1F]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {term.exampleUseCase && (
            <div className="mb-12 rounded-[16px] border border-[rgba(17,17,17,0.08)] bg-[#f1ede7] p-6 lg:p-7">
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                Example Use Case
              </h2>
              <p className="text-[15px] leading-[1.82] text-[#555]">
                {term.exampleUseCase}
              </p>
            </div>
          )}

          {related.length > 0 && (
            <div>
              <h2 className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                Related Terms
              </h2>
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

          <div className="nb-section-divider mt-12 pt-8">
            <Link
              href="/glossary"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#C7661D] transition-colors hover:text-[#FF5F1F]"
            >
              ← Back to Glossary
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
