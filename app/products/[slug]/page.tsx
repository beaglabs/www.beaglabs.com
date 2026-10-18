import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { PageHero } from '@/components/page-hero'
import { EvidenceCell } from '@/components/compare/evidence-cell'
import { FitNotes } from '@/components/compare/fit-notes'
import { Methodology } from '@/components/compare/methodology'
import { ProductCard } from '@/components/compare/product-card'
import { ProductLogo } from '@/components/compare/product-logo'
import { StatTiles } from '@/components/compare/stat-tiles'
import { SiteFooter } from '@/components/site-footer'
import { company } from '@/data/company'
import { ATTRIBUTES, getPlatform, getPlatformByProfileSlug, guides, logoUrl, platforms, productHref, productStats, profileSlug, verifiedOn, verifiedOnIso } from '@/lib/compare'
import { pageMetadata } from '@/lib/seo'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

// Papyrus keeps its marketing page at /products/papyrus (a static route that takes precedence);
// its sourced profile is served here as /products/papyrus-by-beaglabs.
export const dynamicParams = false

export function generateStaticParams() {
  return platforms.map((platform) => ({ slug: profileSlug(platform) }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const platform = getPlatformByProfileSlug(slug)
  if (!platform) return { title: 'Product Not Found' }
  return pageMetadata({
    title: `${platform.name} — Sourced Profile`,
    description: `${platform.summary} Verified ${verifiedOn}, with every statement linked to its source.`,
    path: productHref(platform),
    label: platform.vendor,
  })
}

export default async function ProductProfilePage({ params }: ProductPageProps) {
  const { slug } = await params
  const platform = getPlatformByProfileSlug(slug)
  if (!platform) notFound()

  const path = productHref(platform)
  const comparedIn = guides.filter((guide) => guide.kind === 'guide' || platform.isBeag || guide.versus === platform.slug)
  const others = platforms.filter((item) => item.slug !== platform.slug)
  const papyrus = platform.isBeag ? undefined : getPlatform('papyrus')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${platform.name} — Sourced Profile`,
    dateModified: verifiedOnIso,
    url: `${company.url}${path}`,
    publisher: { '@type': 'Organization', name: company.name, url: company.url },
    about: {
      '@type': 'SoftwareApplication',
      name: platform.name,
      url: platform.officialUrl,
      description: platform.summary,
      creator: { '@type': 'Organization', name: platform.vendor },
    },
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        label={`Sourced profile · Verified ${verifiedOn}`}
        title={platform.name}
        description={platform.summary}
        above={
          <div>
            <Breadcrumbs items={[
              { name: 'Home', url: '/' },
              { name: 'Comparisons', url: '/compare' },
              { name: platform.name, url: path },
            ]} />
            <div className="flex items-center justify-center gap-4">
              <ProductLogo name={platform.name} src={logoUrl(platform)} size="lg" />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#666]">by {platform.vendor}</p>
            </div>
          </div>
        }
        below={
          <div className="text-left">
            <div className="flex flex-wrap justify-center gap-3">
              <a href={platform.officialUrl} rel="noopener noreferrer" target="_blank" className="nb-btn-white px-5 py-3 text-[11px] uppercase">Official site ↗</a>
              {!platform.isBeag && platform.marketplaceUrl && <a href={platform.marketplaceUrl} rel="noopener noreferrer" target="_blank" className="nb-btn-white px-5 py-3 text-[11px] uppercase">Marketplace listing ↗</a>}
              {platform.isBeag && <Link href="/products/papyrus" className="nb-btn-white px-5 py-3 text-[11px] uppercase">Papyrus product page →</Link>}
              {!platform.isBeag && comparedIn.filter((guide) => guide.kind === 'head-to-head').map((guide) => (
                <Link key={guide.slug} href={`/compare/${guide.slug}`} className="nb-btn-white px-5 py-3 text-[11px] uppercase">Compare with Papyrus →</Link>
              ))}
            </div>
            <p className="mt-6 border-l-[4px] border-[#ff5f1f] pl-4 text-[13px] font-semibold leading-[1.7] text-[#333]">
              {platform.isBeag
                ? 'Beag Labs makes Papyrus and compiled this profile. Every statement cites our own pages and is labelled first-party, not independently verified. For the full product story, see the Papyrus product page.'
                : 'This profile was compiled by Beag Labs, which makes a competing product (Papyrus). It is built from public documentation, not hands-on testing, and every statement links to its source.'}
            </p>
          </div>
        }
      />

      <section className="border-y-[3px] border-[#111] bg-[#f3f1ec] px-6 py-12 lg:px-9">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#b33d0d]">At a glance</h2>
          <StatTiles stats={productStats(platform)} />
        </div>
      </section>

      <section className="px-6 py-16 lg:px-9">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[40px]">Profile, attribute by attribute.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {ATTRIBUTES.map(({ key, label }) => (
              <div key={key} className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]">
                <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">{label}</h3>
                <EvidenceCell cell={platform.cells[key]} />
                {platform.cells[key].caveat && <p className="mt-3 border-t border-[#ddd] pt-3 text-[12px] font-medium leading-[1.6] text-[#555]">Does not establish: {platform.cells[key].caveat}</p>}
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="border-[3px] border-[#111] bg-white p-6">
              <h3 className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#b33d0d]">May fit well when</h3>
              <FitNotes platform={platform} notes={platform.bestFor} empty="Not enough verified evidence to say." />
            </div>
            <div className="border-[3px] border-[#111] bg-white p-6">
              <h3 className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#666]">May fit less well when</h3>
              <FitNotes platform={platform} notes={platform.lessSuitedFor} empty="Nothing in the verified evidence points to a gap." />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-white px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#b33d0d]">Compared in</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {comparedIn.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/compare/${guide.slug}`} className="block border-2 border-[#111] bg-[#fafaf9] p-4 transition-colors hover:bg-[#fff0e9]">
                  <span className="block text-[16px] font-extrabold">{guide.title}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-[1.55] text-[#444]">{guide.description}</span>
                </Link>
              </li>
            ))}
          </ul>
          {others.length > 0 && (
            <>
              <h2 className="mb-5 mt-12 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#b33d0d]">Other platforms</h2>
              <div className="grid gap-5 md:grid-cols-3">
                {papyrus && <ProductCard platform={papyrus} />}
                {others.filter((item) => !item.isBeag).slice(0, papyrus ? 2 : 3).map((item) => <ProductCard key={item.slug} platform={item} />)}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="px-6 py-16 lg:px-9">
        <div className="mx-auto max-w-[1120px]"><Methodology compact /></div>
      </section>
      <SiteFooter />
    </main>
  )
}
