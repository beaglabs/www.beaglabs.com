import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContactForm } from "@/components/contact-form"
import { contactTopics } from "@/data/contact/topics"

interface ContactPageProps {
  params: Promise<{ topic: string }>
}

export function generateStaticParams() {
  return contactTopics.map((t) => ({
    topic: t.slug,
  }))
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { topic } = await params
  const ct = contactTopics.find((t) => t.slug === topic)

  if (!ct) return { title: "Not Found" }

  return {
    title: ct.title,
    description: ct.metaDescription,
    alternates: {
      canonical: `https://www.beaglabs.com/contact/${topic}`,
    },
    openGraph: {
      title: ct.title,
      description: ct.metaDescription,
      url: `https://www.beaglabs.com/contact/${topic}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `Beag Labs — Contact` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ct.title,
      description: ct.metaDescription,
      images: ["/og-image.png"],
    },
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { topic } = await params
  const ct = contactTopics.find((t) => t.slug === topic)

  if (!ct) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: ct.title,
    description: ct.metaDescription,
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 pt-44 pb-20 lg:px-9 lg:pt-52 lg:pb-28">
        <div className="mx-auto max-w-[1440px]">
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Contact", url: `/contact/${topic}` },
              { name: topic === "fine-tuning" ? "Fine-Tuning" : topic === "qat" ? "Quantization-Aware Training" : "Agentic Support", url: `/contact/${topic}` },
            ]}
          />
          <div className="mt-8 mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Get started
          </div>
          <h1 className="mb-5 max-w-[820px] text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            {ct.heroTitle}
          </h1>
          <p className="max-w-[640px] text-[17px] leading-[1.72] text-[#404040] font-medium">
            {ct.heroDescription}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            What you get
          </div>
          <h2 className="mb-12 max-w-[520px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            {ct.subtitle}
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {ct.features.map((f) => (
              <div key={f.title} className="nb-card group bg-white p-8">
                <span className="mb-4 block text-2xl">{f.icon}</span>
                <h3 className="mb-3 text-[18px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#111]">
                  {f.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-[#444] font-medium">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 pt-20 pb-24 lg:px-9 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Tell us about your project
          </div>
          <ContactForm topic={topic} />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
