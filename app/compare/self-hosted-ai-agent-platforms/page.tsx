import type { Metadata } from 'next'
import Link from 'next/link'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { EdgyHero } from '@/components/edgy-hero'
import { CompareFaq, faqJsonLd } from '@/components/compare/compare-faq'
import { FitNotes } from '@/components/compare/fit-notes'
import { Methodology } from '@/components/compare/methodology'
import { PlatformMatrix } from '@/components/compare/platform-matrix'
import { ProductLogo } from '@/components/compare/product-logo'
import { SiteFooter } from '@/components/site-footer'
import { company } from '@/data/company'
import { FILTERS, filterOptions, getGuide, guides, logoUrl, platforms, productHref, verifiedOn, verifiedOnIso } from '@/lib/compare'
import { claims } from '@/lib/claims'
import { pageMetadata } from '@/lib/seo'

const guide = getGuide('self-hosted-ai-agent-platforms')!
const path = `/compare/${guide.slug}`

export const metadata: Metadata = pageMetadata({
  title: guide.title,
  description: guide.description,
  path,
  label: 'Comparison',
  type: 'article',
})

export default function SelfHostedPlatformsPage() {
  const filters = FILTERS.map((filter) => ({ ...filter, options: filterOptions(filter.key) }))
  const citedCount = claims.filter((claim) => claim.usedOn?.includes(path)).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    dateModified: verifiedOnIso,
    mainEntityOfPage: `${company.url}${path}`,
    author: { '@type': 'Organization', name: company.name, url: company.url },
    publisher: { '@type': 'Organization', name: company.name, url: company.url },
    about: {
      '@type': 'ItemList',
      itemListElement: platforms.map((platform, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: platform.name,
        url: platform.officialUrl,
      })),
    },
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />

      <EdgyHero
        background="signal"
        size="md"
        breadcrumb={<div className="[&_nav]:mb-0 [&_ol]:!text-white/80 [&_span]:!text-white [&_a:hover]:!text-[#ffb894]">
          <Breadcrumbs items={[
            { name: 'Home', url: '/' },
            { name: 'Comparisons', url: '/compare' },
            { name: 'Self-hosted AI agent platforms', url: path },
          ]} />
        </div>}
        eyebrow="Comparison"
        before="Self-hosted"
        slab="AI agent platforms,"
        after="compared."
        description={<>{platforms.length} platforms for organizations that want to keep agents, data and credentials in their own environment, compared on how they deploy, how they are sold, whether people can approve agent actions, how they are licensed and which security controls they document.</>}
        next={{ href: '#matrix', label: 'See the matrix' }}
        asideLabel="How this comparison works"
        aside={<>
          <dl className="grid grid-cols-2 gap-[3px] border-[3px] border-[#111] bg-[#111]">
            <div className="bg-white px-3 py-2.5"><dt className="font-mono text-[9px] uppercase tracking-[.14em] text-[#666]">Verified</dt><dd className="text-[16px] font-extrabold">{verifiedOn}</dd></div>
            <div className="bg-white px-3 py-2.5"><dt className="font-mono text-[9px] uppercase tracking-[.14em] text-[#666]">Cited claims</dt><dd className="text-[16px] font-extrabold">{citedCount}</dd></div>
          </dl>
          <p className="mt-5 border-l-[4px] border-[#ff5f1f] pl-4 text-[14px] font-semibold leading-[1.7] text-[#333]">
            Disclosure: Beag Labs makes Papyrus, one of the platforms below. Papyrus is cited from our own pages and labelled first-party, and the alternatives are given the same evidence rules and a fair account of where they may fit better. See the <a className="underline underline-offset-2" href="#methodology">methodology</a>.
          </p>
        </>}
      />

      <section id="matrix" className="scroll-mt-12 border-y-[3px] border-[#111] bg-[#f3f1ec] px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1440px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b33d0d]">Comparison table</p>
          <h2 className="mt-3 max-w-[760px] text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[40px]">Filter by how you need to deploy and buy.</h2>
          <p className="mt-3 mb-8 max-w-[760px] text-[14px] font-medium leading-[1.7] text-[#444]">
            Each cell shows its evidence status and links to the Claim Ledger record that holds the source. Open “sources checked” on a Not documented cell to see where we looked.
          </p>
          <p className="mb-6 max-w-[760px] border-l-[4px] border-[#111] pl-4 text-[13px] font-semibold leading-[1.7] text-[#333]">
            Known limitation: Microsoft Marketplace pages did not load for our automated checks. Marketplace cells therefore rest on vendor pages, and a Not documented Marketplace cell means we found no listing in the sources we could read. Confirm offer details on the listing itself before buying.
          </p>
          <PlatformMatrix platforms={platforms} filters={filters} />
        </div>
      </section>

      <section id="fit" className="px-6 py-16 lg:px-9">
        <div className="mx-auto max-w-[1440px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b33d0d]">Where each one may fit</p>
          <h2 className="mt-3 max-w-[820px] text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[40px]">No platform wins every comparison.</h2>
          <p className="mt-3 max-w-[760px] text-[14px] font-medium leading-[1.7] text-[#444]">
            Fit statements below are derived only from cells in the table, and each lists the cells it rests on. They are not rankings.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {platforms.map((platform) => (
              <article key={platform.slug} id={platform.slug} className="scroll-mt-12 border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0_#111]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={productHref(platform)} className="flex items-center gap-3 hover:text-[#b33d0d]">
                    <ProductLogo name={platform.name} src={logoUrl(platform)} />
                    <h3 className="text-[24px] font-extrabold tracking-[-0.03em] underline decoration-2 underline-offset-4">{platform.name}</h3>
                  </Link>
                  {platform.isBeag && <span className="border border-[#111] bg-[#ffdeca] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]">Made by Beag Labs</span>}
                </div>
                <p className="mt-2 text-[14px] font-medium leading-[1.65] text-[#444]">{platform.summary}</p>
                <div className="mt-5 grid gap-5 border-t-2 border-[#111] pt-5">
                  <div>
                    <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b33d0d]">May fit well when</h4>
                    <FitNotes platform={platform} notes={platform.bestFor} empty="Not enough verified evidence to say." />
                  </div>
                  <div>
                    <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">May fit less well when</h4>
                    <FitNotes platform={platform} notes={platform.lessSuitedFor} empty="Nothing in the verified evidence points to a gap." />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#bbb] pt-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em]">
                  <Link href={productHref(platform)} className="underline underline-offset-4">Full profile →</Link>
                  <a href={platform.officialUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Official site ↗</a>
                  {platform.marketplaceUrl && <a href={platform.marketplaceUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Marketplace listing ↗</a>}
                  {guides.filter((item) => item.versus === platform.slug).map((item) => (
                    <Link key={item.slug} href={`/compare/${item.slug}`} className="text-[#b33d0d] underline underline-offset-4">vs Papyrus →</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 lg:px-9">
        <div className="mx-auto max-w-[1120px]"><Methodology /></div>
      </section>
      <section className="px-6 pb-20 lg:px-9"><CompareFaq /></section>
      <SiteFooter />
    </main>
  )
}
