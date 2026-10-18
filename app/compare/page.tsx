import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { PageHero } from '@/components/page-hero'
import { CompareFaq } from '@/components/compare/compare-faq'
import { Methodology } from '@/components/compare/methodology'
import { ProductCard } from '@/components/compare/product-card'
import { SiteFooter } from '@/components/site-footer'
import { comparisons } from '@/data/comparisons/comparisons'
import { company } from '@/data/company'
import { ATTRIBUTES, guides, platforms, verifiedOn, verifiedOnIso } from '@/lib/compare'
import { claims } from '@/lib/claims'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Compare AI Agent Platforms',
  description:
    'Sourced comparisons of AI agent platforms for the back office, including Papyrus, the agentic ERP. Every statement links to a record in the Beag Labs Claim Ledger, and every gap is marked rather than guessed.',
  path: '/compare',
  label: 'Comparisons',
})

export default function ComparePage() {
  const [pillar, ...headToHeads] = guides
  const ledgerCount = claims.filter((claim) => claim.usedOn?.some((path) => path.startsWith('/compare'))).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Compare AI Agent Platforms',
    dateModified: verifiedOnIso,
    publisher: { '@type': 'Organization', name: company.name, url: company.url },
    hasPart: guides.map((guide) => ({ '@type': 'Article', headline: guide.title, url: `${company.url}/compare/${guide.slug}` })),
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        label="Comparisons"
        title="Compare AI agent platforms, with receipts"
        description="Buyer’s guides for teams putting agents to work on the back office. Every statement links to a source in our Claim Ledger, and where we could not find documentation we say so instead of guessing."
        above={<Breadcrumbs items={[{ name: 'Home', url: '/' }, { name: 'Comparisons', url: '/compare' }]} />}
        below={<div className="space-y-3 text-left">
          <p className="flex flex-wrap justify-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#555]"><span>Verified {verifiedOn}</span><span>{ledgerCount} cited claims</span></p>
          <p className="border-l-[4px] border-[#ff5f1f] pl-4 text-[13px] font-semibold leading-[1.7] text-[#333]">
            Disclosure: Beag Labs makes Papyrus, the agentic ERP covered here.
          </p>
        </div>}
      />

      <section className="border-y-[3px] border-[#111] bg-white px-6 py-16 lg:px-9">
        <div className="mx-auto max-w-[1440px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b33d0d]">Start here</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <Link href={`/compare/${pillar.slug}`} className="group flex min-h-[320px] flex-col justify-between border-[3px] border-[#111] bg-[#ff5f1f] p-7 shadow-[6px_6px_0_#111] transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#111] motion-reduce:transform-none">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Guide · {platforms.length} platforms</span>
                <h2 className="mt-4 max-w-[560px] text-[34px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[42px]">{pillar.title}</h2>
                <p className="mt-4 max-w-[560px] text-[15px] font-semibold leading-[1.65]">{pillar.description}</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">Open the comparison <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
            </Link>
            <div className="grid gap-4">
              {headToHeads.map((guide) => (
                <Link key={guide.slug} href={`/compare/${guide.slug}`} className="group flex items-start justify-between gap-4 border-[3px] border-[#111] bg-[#fafaf9] p-5 shadow-[4px_4px_0_#111] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ff5f1f] motion-reduce:transform-none">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#b33d0d]">Head to head</span>
                    <h3 className="mt-2 text-[22px] font-extrabold leading-tight tracking-[-0.03em]">{guide.title}</h3>
                    <p className="mt-2 text-[13px] font-medium leading-[1.6] text-[#444]">{guide.description}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-9">
        <div className="mx-auto max-w-[1440px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b33d0d]">What we compare</p>
          <h2 className="mt-3 max-w-[780px] text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[40px]">The same {ATTRIBUTES.length} attributes for every platform.</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {ATTRIBUTES.map(({ key, label }) => <li key={key} className="border-2 border-[#111] bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em]">{label}</li>)}
          </ul>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => <ProductCard key={platform.slug} platform={platform} />)}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 lg:px-9">
        <div className="mx-auto max-w-[1120px]"><Methodology /></div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-white px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1120px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b33d0d]">Different question</p>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[32px]">Choosing an approach rather than a product?</h2>
          <p className="mt-3 max-w-[720px] text-[14px] font-medium leading-[1.7] text-[#444]">
            These explainers compare approaches such as agent-run document work, custom development and legacy replacement. They are general guidance and are not tied to the Claim Ledger.
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {comparisons.map((item) => (
              <li key={item.slug}>
                <Link href={`/compare/${item.slug}`} className="block h-full border-2 border-[#111] bg-[#fafaf9] p-4 text-[14px] font-extrabold leading-snug transition-colors hover:bg-[#fff0e9]">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-9"><CompareFaq /></section>

      <section className="px-6 pb-20 lg:px-9">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 border-t-[3px] border-[#111] pt-8">
          <p className="max-w-[560px] text-[14px] font-medium leading-[1.7] text-[#444]">Want a platform covered, or think we got something wrong? Tell us and we will re-check the source.</p>
          <a href={`mailto:${company.email}?subject=Comparison%20feedback`} className="nb-btn-orange inline-flex items-center gap-2 px-6 py-3 text-[12px] uppercase">Email {company.email}</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
