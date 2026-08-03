import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { trainingConcepts } from "@/data/training/concepts"

interface ConceptPageProps {
  params: Promise<{ concept: string }>
}

export function generateStaticParams() {
  return trainingConcepts.map((c) => ({ concept: c.slug }))
}

export async function generateMetadata({
  params,
}: ConceptPageProps): Promise<Metadata> {
  const { concept } = await params
  const c = trainingConcepts.find((t) => t.slug === concept)

  if (!c) return { title: "Not Found" }

  return {
    title: `${c.title} Training — Beag Labs`,
    description: c.description.slice(0, 160),
    alternates: {
      canonical: `https://www.beaglabs.com/training/${c.slug}`,
    },
    openGraph: {
      title: `${c.title} — Beag Labs Training`,
      description: c.description.slice(0, 160),
      url: `https://www.beaglabs.com/training/${c.slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Beag Labs" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.title} — Beag Labs Training`,
      description: c.description.slice(0, 160),
      images: ["/og-image.png"],
    },
  }
}

function PaperIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function HfIcon() {
  return (
    <img
      src="https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.png"
      alt="Hugging Face"
      className="h-4 w-4"
    />
  )
}

export default async function ConceptPage({ params }: ConceptPageProps) {
  const { concept } = await params
  const c = trainingConcepts.find((t) => t.slug === concept)

  if (!c) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${c.title} Training`,
    description: c.description,
    about: { "@type": "Thing", name: c.title },
  }

  const hasLinks = c.keyPapers.length > 0 || c.openSource.length > 0 || c.huggingface.length > 0

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Training", url: "/training" },
              { name: c.title, url: `/training/${c.slug}` },
            ]}
          />
          <div className="mt-8 flex flex-col gap-12 lg:flex-row lg:gap-24">
            <div className="min-w-0 lg:max-w-[720px]">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="nb-label text-[10px]">{c.part}</span>
                <span className="text-[13px] font-bold tracking-[0.06em] text-[#666]">{c.complexity}</span>
              </div>
              <h1 className="mb-5 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
                {c.title}
              </h1>
              <p className="text-[17px] leading-[1.72] text-[#404040] font-medium">
                {c.description}
              </p>
            </div>

            <aside className="w-full shrink-0 lg:w-[340px] lg:ml-16">
              <div className="nb-card space-y-6 border-[#ff5f1f] bg-white p-6">
                <div>
                  <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#ff5f1f]">At a Glance</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-[#eee] pb-2 text-[12px]">
                      <span className="font-semibold text-[#666]">Category</span>
                      <span className="font-bold text-[#111]">{c.part}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#eee] pb-2 text-[12px]">
                      <span className="font-semibold text-[#666]">Type</span>
                      <span className="font-bold capitalize text-[#111]">{c.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#666]">Complexity</span>
                      <span className="font-bold text-[#111]">{c.complexity}</span>
                    </div>
                  </div>
                </div>

                {c.prerequisites.length > 0 && (
                  <div>
                    <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#ff5f1f]">Prerequisites</div>
                    <div className="flex flex-wrap gap-2">
                      {c.prerequisites.map((p, i) => (
                        <span key={i} className="inline-block border-[2px] border-[#111] bg-[#FAFAF9] px-3 py-1.5 text-[11px] font-bold text-[#111]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.useCases.length > 0 && (
                  <div>
                    <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#ff5f1f]">Common Uses</div>
                    <ul className="space-y-2">
                      {c.useCases.map((uc, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[12px] leading-[1.5] text-[#333]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-[2px] border-[#ff5f1f] bg-[#ff5f1f] text-[9px] font-extrabold text-white">
                            {i + 1}
                          </span>
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
      
      {/* Links & Resources */}
      {hasLinks && (
        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-20 lg:px-9 lg:py-24">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
              Resources
            </div>
            <h2 className="mb-12 max-w-[520px] text-[34px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[42px]">
              Papers, code, and datasets
            </h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {c.keyPapers.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <PaperIcon />
                    <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#111]">Research Papers</span>
                  </div>
                  <ul className="space-y-3">
                    {c.keyPapers.map((p) => (
                      <li key={p.url}>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nb-card block bg-white p-4 transition-all hover:translate-x-0.5"
                        >
                          <p className="text-[13px] font-bold leading-[1.4] text-[#111]">{p.title}</p>
                          <p className="mt-1 text-[11px] font-mono text-[#999]">
                            Read on arXiv ↗
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.openSource.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <GithubIcon />
                    <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#111]">Open Source</span>
                  </div>
                  <ul className="space-y-3">
                    {c.openSource.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nb-card block bg-white p-4 transition-all hover:translate-x-0.5"
                        >
                          <p className="text-[13px] font-bold leading-[1.4] text-[#111]">{r.label}</p>
                          <p className="mt-1 text-[11px] font-mono text-[#999]">
                            View on GitHub ↗
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.huggingface.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <HfIcon />
                    <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#111]">Datasets & Models</span>
                  </div>
                  <ul className="space-y-3">
                    {c.huggingface.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nb-card block bg-white p-4 transition-all hover:translate-x-0.5"
                        >
                          <p className="text-[13px] font-bold leading-[1.4] text-[#111]">{r.label}</p>
                          <p className="mt-1 text-[11px] font-mono text-[#999]">
                            View on Hugging Face ↗
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}



      {/* Dynamic CTA */}
      <section className="border-t-[3px] border-[#111] bg-[#111] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
            Get started
          </div>
          {c.category === "dataset" ? (
            <>
              <h2 className="mb-4 max-w-[720px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-white lg:text-[48px]">
                Want a custom dataset for this?
              </h2>
              <p className="mb-8 max-w-[560px] text-[16px] leading-[1.65] text-[#C9C9C9] font-medium">
                We build high-quality synthetic and curated datasets
                for {c.title.toLowerCase()} and other training techniques.
                Tell us about your data needs.
              </p>
            </>
          ) : (
            <>
              <h2 className="mb-4 max-w-[720px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-white lg:text-[48px]">
                Want to explore this concept?
              </h2>
              <p className="mb-8 max-w-[560px] text-[16px] leading-[1.65] text-[#C9C9C9] font-medium">
                Whether you&apos;re evaluating {c.title.toLowerCase()} for
                your workflow or need help implementing it, we can help.
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-4">
            <Link
              href="mailto:james@beaglabs.com"
              className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
            >
              Chat with us &rarr;
            </Link>
            <Link
              href="/cookbook"
              className="nb-btn-outline inline-flex items-center gap-2 bg-white px-8 py-4 text-[12px] uppercase"
            >
              Get the cookbook &rarr;
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
