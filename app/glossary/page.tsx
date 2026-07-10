import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { glossaryTerms, glossaryCategories } from "@/data/glossary/terms"

export const metadata: Metadata = {
  title: "ML/AI Glossary — Beag Labs",
  description:
    "A comprehensive glossary of machine learning and AI terminology — from LoRA and GRPO to flow matching and world models. Clear, technically precise definitions for practitioners.",
  alternates: {
    canonical: "https://www.beaglabs.com/glossary",
  },
  openGraph: {
    title: "ML/AI Glossary — Beag Labs",
    description:
      "A comprehensive glossary of machine learning and AI terminology — from LoRA and GRPO to flow matching and world models. Clear, technically precise definitions for practitioners.",
    url: "https://www.beaglabs.com/glossary",
    siteName: "Beag Labs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beag Labs — ML/AI Glossary",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ML/AI Glossary — Beag Labs",
    description:
      "A comprehensive glossary of machine learning and AI terminology — from LoRA and GRPO to flow matching and world models.",
    images: ["/og-image.png"],
  },
}

export default function GlossaryPage() {
  const termsByCategory = glossaryCategories.map((category) => ({
    category,
    terms: glossaryTerms.filter((t) => t.category === category),
  }))

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="px-6 pt-32 pb-16 lg:px-9 lg:pt-36 lg:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 border-b-[3px] border-[#111] pb-10">
            <span className="nb-label mb-5 inline-block">Reference</span>
            <h1 className="mb-3 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              Glossary
            </h1>
            <p className="max-w-[560px] text-[17px] leading-[1.72] text-[#404040] font-medium">
              A comprehensive reference for machine learning and AI terminology —
              from training algorithms and model architectures to optimization,
              deployment, and inference techniques. Each entry includes precise
              definitions, key points, and related concepts.
            </p>
          </div>

          {termsByCategory.map(({ category, terms }) => {
            if (terms.length === 0) return null
            return (
              <div key={category} className="mb-14">
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
                    {category}
                  </h2>
                  <div className="nb-section-divider flex-1" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#999]">
                    {terms.length} {terms.length === 1 ? "term" : "terms"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {terms.map((term) => (
                    <Link
                      key={term.slug}
                      href={`/glossary/${term.slug}`}
                      className="nb-card block bg-white p-6"
                    >
                      <h3 className="mb-2 text-[18px] font-extrabold tracking-[-0.02em] text-[#111]">
                        {term.term}
                      </h3>
                      <p className="text-[14px] leading-[1.65] text-[#555] font-medium">
                        {term.shortDefinition}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
