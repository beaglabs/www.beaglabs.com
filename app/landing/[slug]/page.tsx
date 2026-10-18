import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AnnouncementBanner } from "@/components/announcement-banner"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { PageHero } from "@/components/page-hero"
import { SiteFooter } from "@/components/site-footer"
import { TrialCtaLink } from "@/components/trial-cta-link"
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
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        label={page.label}
        title={page.title}
        description={page.heroDescription}
        above={
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: page.label, url: `/landing/${page.slug}` },
            ]}
          />
        }
      />

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            The challenge
          </div>
          <h2 className="mb-12 max-w-[700px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            The back office runs on rekeying.
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {page.problem.map((item) => (
              <div key={item.title} className="nb-card bg-white p-8">
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#111]">
                  {item.title}
                </h3>
                <p className="text-[14px] font-medium leading-[1.7] text-[#444]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-white px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            What agents do
          </div>
          <h2 className="mb-12 max-w-[600px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Agents do the work. Staff approve.
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {page.capabilities.map((item) => (
              <div key={item.title} className="nb-card bg-[#FAFAF9] p-8">
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#111]">
                  {item.title}
                </h3>
                <p className="text-[14px] font-medium leading-[1.7] text-[#444]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Deployment
          </div>
          <h2 className="mb-12 max-w-[700px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Your Papyrus, at your own address.
          </h2>
          <div className="grid border-l-[3px] border-t-[3px] border-[#111] md:grid-cols-3">
            {page.deployment.map((item, i) => (
              <article
                key={item.title}
                className="border-b-[3px] border-r-[3px] border-[#111] bg-white p-6 lg:p-8"
              >
                <div className="mb-6 font-mono text-xs font-bold text-[#b63700]">
                  0{i + 1} / 0{page.deployment.length}
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#555]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-white px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
                Example workflows
              </div>
              <h2 className="max-w-[470px] text-[34px] font-extrabold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
                Start where the paperwork piles up.
              </h2>
            </div>
            <ul className="space-y-4">
              {page.workflows.map((workflow) => (
                <li
                  key={workflow}
                  className="flex items-start gap-3 border-b border-[rgba(17,17,17,0.08)] pb-4"
                >
                  <span className="mt-0.5 shrink-0 text-[18px] text-[#ff5f1f]">
                    &#10003;
                  </span>
                  <span className="text-[16px] font-bold leading-[1.5] text-[#111]">
                    {workflow}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Controls
          </div>
          <h2 className="mb-12 max-w-[600px] text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Built for oversight.
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {page.guardrails.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border-[3px] border-[#111] bg-white px-6 py-5"
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center border-[2px] border-[#111] bg-[#ff5f1f] text-[14px] font-extrabold text-[#111]">
                  &#10003;
                </span>
                <span className="text-[15px] font-bold leading-[1.4] text-[#111]">
                  {item}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-[820px] text-xs leading-6 text-[#555]">
            {page.disclaimer}
          </p>
        </div>
      </section>

      <section className="nb-section-divider bg-white px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            FAQ
          </div>
          <h2 className="mb-10 text-[length:min(38px,9vw)] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Common questions.
          </h2>
          <div className="border-t-[3px] border-[#111]">
            {page.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b-[3px] border-[#111] py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-extrabold tracking-[-0.01em]">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="font-mono text-xl text-[#ff5f1f] group-open:hidden"
                  >
                    +
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden font-mono text-xl text-[#ff5f1f] group-open:inline"
                  >
                    &minus;
                  </span>
                </summary>
                <p className="mt-4 max-w-[760px] text-[15px] font-medium leading-[1.7] text-[#444]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-[3px] border-[#111] bg-[#111] px-6 py-24 text-white lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
              Try Papyrus now
            </div>
            <h2 className="mb-4 max-w-[720px] text-[length:min(42px,9vw)] font-extrabold leading-[0.96] tracking-[-0.05em] text-white lg:text-[56px]">
              {page.ctaTitle}
            </h2>
            <p className="max-w-[560px] text-[18px] font-medium leading-[1.65] text-[#C9C9C9]">
              {page.ctaDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-start gap-4 lg:justify-end">
            <TrialCtaLink
              placement="final"
              className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
            >
              Try Papyrus now <span className="text-lg">&rarr;</span>
            </TrialCtaLink>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
