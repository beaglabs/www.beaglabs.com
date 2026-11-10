import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AnnouncementBanner } from "@/components/announcement-banner"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { PhotoSlide } from "@/components/landing/photo-slide"
import { SiteFooter } from "@/components/site-footer"
import { landingPages } from "@/data/landing/pages"
import { BASE_URL, pageMetadata } from "@/lib/seo"

interface LandingPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return landingPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = landingPages.find((p) => p.slug === slug)

  if (!page) {
    return { title: "Not Found" }
  }

  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/landing/${page.slug}`,
    label: page.label,
  })
}

export default async function LandingDetailPage({ params }: LandingPageProps) {
  const { slug } = await params
  const page = landingPages.find((p) => p.slug === slug)

  if (!page) {
    notFound()
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.metaDescription,
      url: `${BASE_URL}/landing/${page.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ]

  return (
    <main className="bg-[#FDEEE1] text-[#1a1714]">
      <AnnouncementBanner />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="site-hero nb-section-divider bg-[#FDEEE1] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div>
            <Breadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: page.label, url: `/landing/${page.slug}` },
              ]}
            />
            <div className="mt-8 mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
              {page.label}
            </div>
            <h1 className="mb-5 max-w-[760px] text-[length:min(42px,9vw)] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#1a1714] lg:text-[56px]">
              {page.title}
            </h1>
            <p className="max-w-[640px] text-[17px] font-medium leading-[1.72] text-[#4a3d33]">
              {page.heroDescription}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/contact"
                className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
              >
                Talk to us <span className="text-lg">&rarr;</span>
              </a>
              <a
                href="/products/papyrus"
                className="inline-flex items-center gap-2 border-[3px] border-[#1a1714] bg-[#fffaf3] px-8 py-4 text-[12px] font-bold uppercase tracking-wider text-[#1a1714]"
              >
                See Papyrus
              </a>
            </div>
          </div>
          <div className="min-w-0">
            <PhotoSlide slides={page.heroSlides} />
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FDEEE1] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
            The challenge
          </div>
          <h2 className="mb-12 max-w-[700px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#1a1714] lg:text-[48px]">
            Agencies need AI that fits how government actually buys and runs
            software.
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {page.problem.map((item) => (
              <div key={item.title} className="nb-card bg-[#fffaf3] p-8">
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#1a1714]">
                  {item.title}
                </h3>
                <p className="text-[14px] font-medium leading-[1.7] text-[#4a3d33]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#fffaf3] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
            What agents do
          </div>
          <h2 className="mb-12 max-w-[600px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#1a1714] lg:text-[48px]">
            Agents prepare the work. Staff decide.
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {page.capabilities.map((item) => (
              <div key={item.title} className="nb-card bg-[#FDEEE1] p-8">
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#1a1714]">
                  {item.title}
                </h3>
                <p className="text-[14px] font-medium leading-[1.7] text-[#4a3d33]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FDEEE1] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
            Deployment
          </div>
          <h2 className="mb-12 max-w-[700px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#1a1714] lg:text-[48px]">
            Self-hosted means inside your boundary.
          </h2>
          <div className="grid border-l-[3px] border-t-[3px] border-[#1a1714] md:grid-cols-3">
            {page.deployment.map((item, i) => (
              <article
                key={item.title}
                className="border-b-[3px] border-r-[3px] border-[#1a1714] bg-[#fffaf3] p-6 lg:p-8"
              >
                <div className="mb-6 font-mono text-xs font-bold text-[#b63700]">
                  0{i + 1} / 0{page.deployment.length}
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#5b4a3d]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#fffaf3] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
                Example workflows
              </div>
              <h2 className="max-w-[470px] text-[34px] font-extrabold leading-[1.03] tracking-[-0.045em] text-[#1a1714] lg:text-[42px]">
                Start where the paperwork piles up.
              </h2>
            </div>
            <ul className="space-y-4">
              {page.workflows.map((workflow) => (
                <li
                  key={workflow}
                  className="flex items-start gap-3 border-b border-[rgba(17,17,17,0.08)] pb-4"
                >
                  <span className="mt-0.5 shrink-0 text-[18px] text-[#e5632f]">
                    &#10003;
                  </span>
                  <span className="text-[16px] font-bold leading-[1.5] text-[#1a1714]">
                    {workflow}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FDEEE1] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
            Controls
          </div>
          <h2 className="mb-12 max-w-[600px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#1a1714] lg:text-[48px]">
            Built for oversight.
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {page.guardrails.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border-[3px] border-[#1a1714] bg-[#fffaf3] px-6 py-5"
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center border-[2px] border-[#1a1714] bg-[#e5632f] text-[14px] font-extrabold text-[#1a1714]">
                  &#10003;
                </span>
                <span className="text-[15px] font-bold leading-[1.4] text-[#1a1714]">
                  {item}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-[820px] text-xs leading-6 text-[#5b4a3d]">
            {page.disclaimer}
          </p>
        </div>
      </section>

      <section className="nb-section-divider bg-[#fffaf3] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#e5632f]">
            FAQ
          </div>
          <h2 className="mb-10 text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#1a1714] lg:text-[48px]">
            Common questions.
          </h2>
          <div className="border-t-[3px] border-[#1a1714]">
            {page.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b-[3px] border-[#1a1714] py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-extrabold tracking-[-0.01em]">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="font-mono text-xl text-[#e5632f] group-open:hidden"
                  >
                    +
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden font-mono text-xl text-[#e5632f] group-open:inline"
                  >
                    &minus;
                  </span>
                </summary>
                <p className="mt-4 max-w-[760px] text-[15px] font-medium leading-[1.7] text-[#4a3d33]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-[3px] border-[#1a1714] bg-[#1a1714] px-6 py-24 text-[#fffaf3] lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
              Get started
            </div>
            <h2 className="mb-4 max-w-[720px] text-[length:min(42px,9vw)] font-extrabold leading-[0.96] tracking-[-0.05em] text-[#fffaf3] lg:text-[56px]">
              {page.ctaTitle}
            </h2>
            <p className="max-w-[560px] text-[18px] font-medium leading-[1.65] text-[#C9C9C9]">
              {page.ctaDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-start gap-4 lg:justify-end">
            <a
              href="/contact"
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
