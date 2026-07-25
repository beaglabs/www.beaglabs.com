import type { Metadata } from "next"
import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { contactTopics } from "@/data/contact/topics"

export const metadata: Metadata = {
  title: "Contact — Beag Labs",
  description: "Get in touch about fine-tuning, quantization-aware training, or AI support agents.",
  alternates: { canonical: "https://www.beaglabs.com/contact" },
  openGraph: {
    title: "Contact — Beag Labs",
    description: "Get in touch about fine-tuning, quantization-aware training, or AI support agents.",
    url: "https://www.beaglabs.com/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Beag Labs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Beag Labs",
    description: "Get in touch about fine-tuning, quantization-aware training, or AI support agents.",
    images: ["/og-image.png"],
  },
}

export default function ContactPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="nb-section-divider bg-[#FAFAF9] px-6 pb-24 pt-44 lg:px-9 lg:pb-28 lg:pt-52">
        <div className="mx-auto max-w-[1440px]">
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Contact", url: "/contact" },
            ]}
          />
          <div className="mt-8 mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Get in touch
          </div>
          <h1 className="mb-5 max-w-[820px] text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            Tell us what you&apos;re building.
          </h1>
          <p className="mb-16 max-w-[640px] text-[17px] leading-[1.72] text-[#404040] font-medium">
            Fine-tuning, quantization, AI support agents — or something else entirely.
            Pick the path that fits your project.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {contactTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/contact/${topic.slug}`}
                className="nb-card group bg-white p-8 transition-all hover:translate-x-0.5"
              >
                <span className="mb-4 block text-3xl">{topic.features[0].icon}</span>
                <h2 className="mb-3 text-[22px] font-extrabold tracking-[-0.03em] text-[#111]">
                  {topic.title.replace(" — Beag Labs", "")}
                </h2>
                <p className="mb-6 text-[14px] leading-[1.7] text-[#555] font-medium">
                  {topic.heroDescription.slice(0, 180)}…
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FF5F1F] group-hover:gap-2 transition-all">
                  {topic.ctaText} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
