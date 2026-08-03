import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { BrutalistPhoto } from "@/components/brutalist-photo"
import { comparisons } from "@/data/comparisons/comparisons"

export const metadata: Metadata = {
  title: "Comparisons — Beag Labs",
  description:
    "Side-by-side comparisons of Beag Labs custom SLMs vs frontier APIs and cloud AI. Cost, privacy, latency, customization, compliance, model ownership, and vendor lock-in.",
  alternates: {
    canonical: "https://www.beaglabs.com/compare",
  },
  openGraph: {
    title: "Comparisons — Beag Labs",
    description:
      "Side-by-side comparisons of Beag Labs custom SLMs vs frontier APIs and cloud AI. Cost, privacy, latency, customization, compliance, model ownership, and vendor lock-in.",
    url: "https://www.beaglabs.com/compare",
    siteName: "Beag Labs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beag Labs — Comparisons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Comparisons — Beag Labs",
    description:
      "Side-by-side comparisons of Beag Labs custom SLMs vs frontier APIs and cloud AI.",
    images: ["/og-image.png"],
  },
}

export default function ComparePage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="px-6 pt-32 pb-16 lg:px-9 lg:pt-36 lg:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 grid grid-cols-1 items-center gap-12 border-b-[3px] border-[#111] pb-10 lg:grid-cols-[1.3fr_minmax(360px,480px)]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="nb-label">Comparisons</span>
                <span className="block h-px w-10 bg-[#111]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">side by side</span>
              </div>
              <h1 className="mb-3 text-[42px] font-extrabold leading-[1.02] tracking-[-0.05em] text-[#111] sm:text-[52px] lg:text-[64px]">
                Custom SLMs vs the alternatives.
              </h1>
              <p className="max-w-[560px] text-[17px] leading-[1.72] text-[#404040] font-medium">
                Side-by-side comparisons of Beag Labs custom small language models
                against frontier APIs and cloud-hosted AI. Cost, privacy, latency,
                customization, compliance, model ownership, and vendor lock-in —
                broken down feature by feature.
              </p>
            </div>
            <BrutalistPhoto
              src="https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg"
              alt="Analytics dashboard on a screen"
              badge="VS"
              meta="beaglabs / compare"
              rounded
              className="mx-auto w-full max-w-[440px]"
              shadowSize="md"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}`}
                className="nb-card group block bg-white p-6"
              >
                <h2 className="mb-3 text-[20px] font-extrabold tracking-[-0.02em] text-[#111]">
                  {comparison.title}
                </h2>
                <p className="text-[14px] leading-[1.65] text-[#555] font-medium">
                  {comparison.metaDescription}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#ff5f1f]">
                  Read comparison
                  <span className="text-lg transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
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
