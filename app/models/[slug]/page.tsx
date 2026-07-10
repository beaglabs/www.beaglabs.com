import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { modelFamilies } from "@/data/models/models"

interface ModelDetailPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return modelFamilies.map((model) => ({ slug: model.slug }))
}

export async function generateMetadata({
  params,
}: ModelDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const model = modelFamilies.find((m) => m.slug === slug)

  if (!model) {
    return { title: "Model Not Found" }
  }

  const canonical = `https://www.beaglabs.com/models/${model.slug}`

  return {
    title: `${model.name} — Beag Labs`,
    description: model.description,
    alternates: { canonical },
    openGraph: {
      title: `${model.name} — Beag Labs`,
      description: model.description,
      url: canonical,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${model.name} — Beag Labs`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${model.name} — Beag Labs`,
      description: model.description,
      images: ["/og-image.png"],
    },
  }
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { slug } = await params
  const model = modelFamilies.find((m) => m.slug === slug)

  if (!model) {
    notFound()
  }

  const otherModels = modelFamilies.filter((m) => m.slug !== model.slug)

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    applicationCategory: "AI/ML",
    operatingSystem: "Linux, macOS, Windows",
    description: model.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Custom deployment — contact for pricing",
    },
    publisher: {
      "@type": "Organization",
      name: "Beag Labs",
      url: "https://www.beaglabs.com",
    },
  }

  const faqSchema =
    model.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: model.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      {/* Model header */}
      <section className="bg-[#FAFAF9] px-6 pt-10 pb-16 lg:px-9 lg:pt-12 lg:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Models", url: "/models" },
              { name: model.name, url: `/models/${model.slug}` },
            ]}
          />

          <div
            className="nb-card p-8 lg:p-12"
            style={{ background: model.bg }}
          >
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <span className="nb-label inline-block">Model Family</span>
              <span
                className={`inline-flex items-center gap-1.5 border-[3px] border-[#111] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#111] shadow-[2px_2px_0px_0px_#111] ${model.statusColor}`}
              >
                <span className="inline-block w-2 h-2 bg-[#111]" />
                {model.status}
              </span>
            </div>

            <h1 className="mb-4 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              {model.name}
            </h1>

            <div className="mb-6 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">
              Target: {model.target}
            </div>

            <p className="max-w-[680px] text-[17px] leading-[1.65] text-[#404040] font-medium">
              {model.description}
            </p>
          </div>
        </div>
      </section>

      {/* Long description */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-[760px]">
            <span className="nb-label mb-5 inline-block">Overview</span>
            <h2 className="mb-8 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] lg:text-[38px]">
              What this model does
            </h2>
            <div className="space-y-6">
              {model.longDescription.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[16px] leading-[1.82] text-[#404040] font-medium"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Capabilities</span>
          <h2 className="mb-12 max-w-[600px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] lg:text-[38px]">
            What it can do out of the box
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {model.capabilities.map((cap) => (
              <div
                key={cap}
                className="nb-card flex items-start gap-4 p-6 bg-white"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-[#111] bg-[#FF5F1F] text-[16px] font-extrabold text-[#111]"
                >
                  &#x25A0;
                </div>
                <p className="text-[15px] font-bold leading-[1.5] text-[#111] pt-1.5">
                  {cap}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Use Cases</span>
          <h2 className="mb-12 max-w-[600px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] lg:text-[38px]">
            How teams use it
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {model.useCases.map((uc, i) => (
              <div
                key={uc.title}
                className="nb-card p-8 bg-white"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center border-[3px] border-[#111] bg-[#111] text-[13px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-[20px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111]">
                    {uc.title}
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.7] text-[#444] font-medium">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment options */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Deployment</span>
          <h2 className="mb-12 max-w-[600px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] lg:text-[38px]">
            Where it runs
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {model.deploymentOptions.map((option) => (
              <div
                key={option}
                className="nb-card flex items-start gap-3 p-6 bg-white"
              >
                <span className="text-[#FF5F1F] mt-0.5 shrink-0 text-[14px]">
                  &#x25A0;
                </span>
                <p className="text-[14px] font-bold leading-[1.5] text-[#111]">
                  {option}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">FAQ</span>
          <h2 className="mb-12 max-w-[600px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] lg:text-[38px]">
            Questions and answers
          </h2>

          <div className="mx-auto max-w-[840px] space-y-4">
            {model.faqs.map((faq) => (
              <div
                key={faq.question}
                className="nb-card p-8 bg-white"
              >
                <h3 className="mb-3 text-[18px] font-extrabold leading-[1.2] tracking-[-0.03em] text-[#111]">
                  {faq.question}
                </h3>
                <p className="text-[15px] leading-[1.75] text-[#444] font-medium">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other models */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Explore</span>
          <h2 className="mb-12 max-w-[600px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] lg:text-[38px]">
            Other model families
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {otherModels.map((m) => (
              <Link
                key={m.slug}
                href={`/models/${m.slug}`}
                className="nb-card group block p-8 transition-transform hover:-translate-y-1"
                style={{ background: m.bg }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-[20px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111]">
                    {m.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 border-[3px] border-[#111] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#111] shadow-[2px_2px_0px_0px_#111] ${m.statusColor}`}
                  >
                    <span className="inline-block w-1.5 h-1.5 bg-[#111]" />
                    {m.status}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.6] text-[#444] font-medium mb-4">
                  {m.description}
                </p>
                <span className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#FF5F1F] group-hover:text-[#C7661D]">
                  Learn more &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-[3px] border-[#111] bg-[#111] text-white px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block bg-[#FF5F1F] text-[#111] border-[#FF5F1F] shadow-[3px_3px_0px_0px_#FF5F1F]/20">
              Get started
            </span>
            <h2 className="mb-4 max-w-[720px] text-[42px] font-extrabold leading-[0.96] tracking-[-0.05em] text-white lg:text-[56px]">
              Ready to put {model.name} to work?
            </h2>
            <p className="max-w-[560px] text-[18px] leading-[1.65] text-[#C9C9C9] font-medium">
              Status: {model.status}. Talk to us about your use case, data, and
              deployment environment — we&apos;ll map out a fine-tuning and
              delivery timeline.
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
