import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { AnnouncementBanner } from '@/components/announcement-banner'
import { SiteFooter } from '@/components/site-footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { capabilities, capabilityBySlug } from '@/data/capabilities'
import { company } from '@/data/company'
import { pageMetadata } from '@/lib/seo'

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return capabilities.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const cap = capabilityBySlug(slug)
  if (!cap) return {}
  return pageMetadata({
    title: cap.title,
    description: cap.metaDescription,
    path: `/capability/${cap.slug}`,
    label: cap.eyebrow || 'Capability',
  })
}

export default async function CapabilityPage({ params }: { params: Params }) {
  const { slug } = await params
  const cap = capabilityBySlug(slug)
  if (!cap) notFound()

  return (
    <main className="bg-[#FDEEE1] text-[#1a1714]">
      <AnnouncementBanner />


      {/* ─── HERO ─── */}
      <section className="site-hero relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#FDEEE1]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_minmax(420px,560px)] lg:gap-16 lg:px-9 lg:pb-24 lg:pt-14">
          <div className="max-w-[760px]">
            <Breadcrumbs
              items={[
                { name: 'Home', url: '/' },
                { name: 'Capabilities', url: '/capabilities' },
                { name: cap.title, url: `/capability/${cap.slug}` },
              ]}
            />
            <div className="mt-8 mb-6 flex items-center gap-3">
              <span className="nb-label">{cap.eyebrow}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5b4a3d]">
                {cap.number} / {String(capabilities.length).padStart(2, '0')}
              </span>
            </div>

            <h1 className="mb-6 text-[length:min(44px,9vw)] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#1a1714] sm:text-[56px] lg:text-[72px]">
              {cap.title}
            </h1>

            <p className="mb-6 max-w-[640px] text-[20px] font-extrabold leading-[1.3] tracking-[-0.015em] text-[#1a1714] sm:text-[22px]">
              {cap.subtitle}
            </p>

            <p className="mb-10 max-w-[640px] text-[16px] leading-[1.65] text-[#4a3d33] font-medium">
              {cap.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/contact"
                className="nb-btn-orange group inline-flex items-center gap-2 px-6 py-3 text-[12px]"
              >
                {cap.cta.headline}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                </svg>
              </a>
              <a
                href="/capabilities/modernization.pdf"
                download
                className="inline-flex items-center gap-2 border-[3px] border-[#1a1714] bg-[#fffaf3] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#1a1714] shadow-[3px_3px_0px_0px_#1a1714] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#e5632f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                </svg>
                Download PDF brief
              </a>
            </div>
          </div>

          {/* Brutalist photo */}
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -top-4 -left-4 z-10 border-[3px] border-[#1a1714] bg-[#e5632f] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1a1714] shadow-[4px_4px_0px_0px_#1a1714]">
              {cap.hero.badge}
            </div>
            <div className="aspect-square overflow-hidden border-[3px] border-[#1a1714] bg-[#1a1714] shadow-[10px_10px_0px_0px_#e5632f]">
              <img
                src={cap.hero.src}
                alt={cap.hero.alt}
                className="h-full w-full object-cover grayscale-[15%] contrast-[1.05]"
              />
            </div>
            <div className="absolute -bottom-3 -right-3 z-10 border-[3px] border-[#1a1714] bg-[#fffaf3] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1a1714] shadow-[4px_4px_0px_0px_#1a1714]">
              beaglabs / {cap.slug}
            </div>
          </div>
        </div>
      </section>

      {/* ─── INCLUDES ─── */}
      <section className="border-b-[3px] border-[#1a1714] bg-[#fffaf3] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-3 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e5632f]">
                What&apos;s included
              </span>
              <h2 className="max-w-[640px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#1a1714] sm:text-[40px]">
                The whole vertical slice, not a fragment.
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5b4a3d]">
              {cap.includes.length} sections
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cap.includes.map((card) => (
              <article
                key={card.title}
                className="flex flex-col border-[3px] border-[#1a1714] bg-[#FDEEE1] p-7 shadow-[6px_6px_0px_0px_#1a1714]"
              >
                <h3 className="mb-3 text-[20px] font-extrabold tracking-[-0.02em] text-[#1a1714]">
                  {card.title}
                </h3>
                <p className="mb-5 text-[14px] leading-[1.65] text-[#4a3d33] font-medium">
                  {card.blurb}
                </p>
                <ul className="mt-auto space-y-2.5">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[13px] leading-[1.5] text-[#1a1714]">
                      <span className="mt-1.5 inline-block size-2 shrink-0 bg-[#e5632f]" />
                      <span className="font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESS ─── */}
      <section className="border-b-[3px] border-[#1a1714] bg-[#FDEEE1] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12">
            <span className="mb-3 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e5632f]">
              How we work
            </span>
            <h2 className="max-w-[640px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#1a1714] sm:text-[40px]">
              Three steps. No surprises.
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {cap.process.map((p, i) => (
              <li
                key={p.step}
                className="relative flex flex-col border-[3px] border-[#1a1714] bg-[#fffaf3] p-7 shadow-[6px_6px_0px_0px_#1a1714]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[#1a1714] bg-[#e5632f] font-mono text-[14px] font-extrabold text-[#1a1714]">
                    {p.step}
                  </span>
                  {i < cap.process.length - 1 && (
                    <span className="hidden h-[3px] flex-1 bg-[#1a1714] md:block" />
                  )}
                </div>
                <h3 className="mb-2 text-[22px] font-extrabold tracking-[-0.02em] text-[#1a1714]">
                  {p.title}
                </h3>
                <p className="text-[14px] leading-[1.6] text-[#4a3d33] font-medium">
                  {p.blurb}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── PROOF ─── */}
      <section className="border-b-[3px] border-[#1a1714] bg-[#1a1714] text-[#fffaf3] px-6 py-16 lg:px-9 lg:py-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 md:grid-cols-3">
          {cap.proof.map((m) => (
            <div key={m.label} className="flex flex-col items-start border-l-[3px] border-[#e5632f] pl-5">
              <span className="text-[56px] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-[68px]">
                {m.metric}
              </span>
              <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#e5632f]">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#e5632f] px-6 py-20 lg:px-9 lg:py-28">
        <div className="absolute -right-20 -top-20 size-[360px] border-[3px] border-[#1a1714] bg-[#fffaf3] shadow-[8px_8px_0px_0px_#1a1714] rotate-6 hidden lg:block" />
        <div className="absolute -right-10 bottom-10 size-[180px] border-[3px] border-[#1a1714] bg-[#1a1714] shadow-[8px_8px_0px_0px_#1a1714] -rotate-6 hidden lg:block" />

        <div className="relative mx-auto max-w-[1440px]">
          <span className="mb-4 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#1a1714]">
            Next step
          </span>
          <h2 className="mb-5 max-w-[820px] text-[length:min(36px,9vw)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#1a1714] sm:text-[48px]">
            {cap.cta.headline}
          </h2>
          <p className="mb-10 max-w-[640px] text-[16px] leading-[1.6] text-[#1a1714] font-medium">
            {cap.cta.blurb}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/contact"
              className="nb-btn group inline-flex items-center gap-2 bg-[#1a1714] px-6 py-3 text-[12px] text-[#fffaf3]"
            >
              Email james@beaglabs.com
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ─── OTHER CAPABILITIES ─── */}
      <section className="border-b-[3px] border-[#1a1714] bg-[#FDEEE1] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10">
            <span className="mb-3 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e5632f]">
              Other capabilities
            </span>
            <h2 className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#1a1714] sm:text-[32px]">
              {cap.number === '05' ? 'Start at the beginning' : 'Pick the next one'}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities
              .filter((c) => c.slug !== cap.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/capability/${c.slug}`}
                  className="group flex flex-col border-[3px] border-[#1a1714] bg-[#fffaf3] p-5 shadow-[5px_5px_0px_0px_#1a1714] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[7px_7px_0px_0px_#e5632f]"
                >
                  <div className="mb-3 aspect-[4/3] overflow-hidden border-[2px] border-[#1a1714]">
                    <img
                      src={c.hero.src}
                      alt={c.hero.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5b4a3d]">
                    {c.number} · {c.eyebrow.replace('Capability · ', '')}
                  </span>
                  <h3 className="mb-2 text-[16px] font-extrabold leading-[1.2] tracking-[-0.015em] text-[#1a1714]">
                    {c.title}
                  </h3>
                  <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#e5632f] group-hover:gap-2 transition-all">
                    Open →
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ─── COMPANY INFO ─── */}
      <section className="border-b-[3px] border-[#1a1714] bg-[#FDEEE1] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="mb-3 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e5632f]">
                Company information
              </span>
              <h2 className="mb-6 text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#1a1714] sm:text-[40px]">
                Registered, certified, and ready to contract.
              </h2>
              <p className="mb-10 max-w-[560px] text-[15px] leading-[1.65] text-[#4a3d33] font-medium">
                Beag Labs is a HUBZone-certified small business. We hold an active
                SBA profile and are registered in SAM.gov with the UEI and CAGE
                codes below. Send procurement or contracting questions to the
                email listed.
              </p>

              <dl className="grid grid-cols-1 gap-px bg-[#1a1714] sm:grid-cols-2">
                <div className="bg-[#fffaf3] px-5 py-5">
                  <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#5b4a3d]">
                    UEI
                  </dt>
                  <dd className="font-mono text-[18px] font-extrabold tracking-[0.04em] text-[#1a1714]">
                    {company.uei}
                  </dd>
                </div>
                <div className="bg-[#fffaf3] px-5 py-5">
                  <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#5b4a3d]">
                    CAGE
                  </dt>
                  <dd className="font-mono text-[18px] font-extrabold tracking-[0.04em] text-[#1a1714]">
                    {company.cage}
                  </dd>
                </div>
                <div className="bg-[#fffaf3] px-5 py-5 sm:col-span-2">
                  <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#5b4a3d]">
                    Contact
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${company.email}`}
                      className="font-mono text-[16px] font-extrabold text-[#1a1714] underline decoration-[#e5632f] decoration-2 underline-offset-4 transition-colors hover:text-[#e5632f]"
                    >
                      {company.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-6">
              <div className="border-[3px] border-[#1a1714] bg-[#fffaf3] p-7 shadow-[6px_6px_0px_0px_#1a1714]">
                <span className="mb-5 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e5632f]">
                  Certifications
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {(company.certs ?? []).map((cert) => (
                    <div
                      key={cert.label}
                      className="flex h-28 items-center justify-center border-[2px] border-[#1a1714] bg-[#FDEEE1] p-3"
                    >
                      <img
                        src={cert.src}
                        alt={cert.label}
                        className="block h-full w-auto max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 border-[3px] border-[#1a1714] bg-[#1a1714] p-5 text-[#fffaf3] shadow-[6px_6px_0px_0px_#e5632f]">
                <span className="flex h-12 w-12 items-center justify-center bg-[#e5632f] font-mono text-[20px] font-extrabold text-[#1a1714]">
                  {company.logoMark}
                </span>
                <div className="flex-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#e5632f]">
                    Prepared by
                  </p>
                  <p className="text-[16px] font-extrabold tracking-[-0.015em]">
                    {company.name}
                  </p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#fffaf3]/50">
                  {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              <a
                href="/capabilities/modernization.pdf"
                download
                className="group flex items-center justify-between gap-4 border-[3px] border-[#1a1714] bg-[#e5632f] p-5 text-[#1a1714] shadow-[6px_6px_0px_0px_#1a1714] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[8px_8px_0px_0px_#1a1714]"
              >
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#1a1714]/70">
                    One-pager
                  </p>
                  <p className="text-[16px] font-extrabold tracking-[-0.015em]">
                    Download PDF brief
                  </p>
                </div>
                <span className="flex size-12 items-center justify-center border-[2px] border-[#1a1714] bg-[#fffaf3] transition-colors group-hover:bg-[#1a1714] group-hover:text-[#fffaf3]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
