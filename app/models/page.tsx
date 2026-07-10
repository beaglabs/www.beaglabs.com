import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { modelFamilies as models } from "@/data/models/models"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Models",
  description:
    "Pre-packaged SLMs and LoRAs for compliance, security, legal, and healthcare. Small models trained for your domain, deployed on your infrastructure — no vendor lock-in.",
  path: "/models",
  label: "Model Catalog",
})

const approach = [
  {
    step: "1",
    title: "Pre-trained domain adapters",
    desc: "Each model ships with pre-trained LoRA adapters that understand your domain's vocabulary, taxonomies, and judgment patterns out of the box.",
  },
  {
    step: "2",
    title: "Fine-tuned on your data",
    desc: "We further tune each model on your proprietary data using our disagreement engine — only the 2-5% of edge cases reach human review.",
  },
  {
    step: "3",
    title: "Deployed on your infrastructure",
    desc: "Export as ONNX and deploy anywhere. You own the fine-tuned weights. Your inference data never leaves your environment.",
  },
]

export default function ModelsPage() {
  const servicesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: models.map((model, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: model.name,
        description: model.description,
        url: `https://www.beaglabs.com/models/${model.slug}`,
        provider: {
          '@type': 'Organization',
          name: 'Beag Labs',
          url: 'https://www.beaglabs.com',
        },
        serviceType: 'Small Language Model Training and Deployment',
        areaServed: 'Worldwide',
      },
    })),
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      {/* Model cards */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Model Catalog</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Four domain families. One pipeline.
          </h2>
          <p className="mb-16 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Every model follows the same recipe: pre-trained domain adapters,
            fine-tuned on your data, exported as ONNX, deployed on your
            infrastructure.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {models.map((model) => (
              <Link
                key={model.slug}
                href={`/models/${model.slug}`}
                className="nb-card group block p-8 lg:p-10 transition-transform hover:-translate-y-1"
                style={{ background: model.bg }}
              >
                <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111]">
                    {model.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 border-[3px] border-[#111] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#111] shadow-[2px_2px_0px_0px_#111] ${model.statusColor}`}
                  >
                    <span className="inline-block w-2 h-2 bg-[#111]" />
                    {model.status}
                  </span>
                </div>

                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">
                  Target: {model.target}
                </div>

                <p className="mb-6 text-[15px] leading-[1.7] text-[#444] font-medium">
                  {model.description}
                </p>

                <div className="border-t-[3px] border-[#111] pt-5">
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">
                    Capabilities
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {model.capabilities.map((cap) => (
                      <li
                        key={cap}
                        className="text-[13px] font-bold text-[#111] flex items-start gap-2"
                      >
                        <span className="text-[#FF5F1F] mt-0.5 shrink-0">
                          &#x25A0;
                        </span>
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#FF5F1F] group-hover:text-[#C7661D]">
                  Learn more &rarr;
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How we build them */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Approach</span>
          <h2 className="mb-16 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Pre-trained. Fine-tuned. Yours.
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {approach.map((a) => (
              <div
                key={a.step}
                className="nb-card group p-8 bg-white"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#FF5F1F] text-[18px] font-extrabold text-[#111]">
                  {a.step}
                </div>
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] text-[#111]">
                  {a.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-[#444] font-medium">
                  {a.desc}
                </p>
              </div>
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
              Ready to put a domain model to work?
            </h2>
            <p className="max-w-[560px] text-[18px] leading-[1.65] text-[#C9C9C9] font-medium">
              Compliance is shipping first. Security, legal, and healthcare
              are queued behind it. Talk to us about your use case and
              timeline.
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
