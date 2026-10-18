import Link from 'next/link'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { PageHero } from '@/components/page-hero'
import { EvidenceCell } from '@/components/compare/evidence-cell'
import { FitNotes } from '@/components/compare/fit-notes'
import { Methodology } from '@/components/compare/methodology'
import { ProductLogo } from '@/components/compare/product-logo'
import { SiteFooter } from '@/components/site-footer'
import { company } from '@/data/company'
import { ATTRIBUTES, logoUrl, productHref, verifiedOn, verifiedOnIso, type Guide, type Platform } from '@/lib/compare'

const pillarPath = '/compare/self-hosted-ai-agent-platforms'

function Fit({ title, tone, children }: { title: string; tone: 'orange' | 'plain'; children: React.ReactNode }) {
  return (
    <div className="border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0_#111]">
      <h3 className={`mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${tone === 'orange' ? 'text-[#b33d0d]' : 'text-[#111]'}`}>{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

/** Sourced two-platform comparison. Both sides use the same evidence rules and fit statements are cell-derived. */
export function HeadToHead({ guide, beag, other }: { guide: Guide; beag: Platform; other: Platform }) {
  const path = `/compare/${guide.slug}`
  const openQuestions = ATTRIBUTES.flatMap(({ key, label }) =>
    [beag, other]
      .filter((platform) => platform.cells[key].status === 'Not documented')
      .map((platform) => `${platform.name}: ${label}`),
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    dateModified: verifiedOnIso,
    mainEntityOfPage: `${company.url}${path}`,
    author: { '@type': 'Organization', name: company.name, url: company.url },
    publisher: { '@type': 'Organization', name: company.name, url: company.url },
  }

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        label="Head to head"
        title={guide.title}
        description={guide.description}
        above={<Breadcrumbs items={[
          { name: 'Home', url: '/' },
          { name: 'Comparisons', url: '/compare' },
          { name: guide.title, url: path },
        ]} />}
        below={<div className="space-y-3 text-left">
          <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#555]">Verified {verifiedOn}</p>
          <p className="border-l-[4px] border-[#ff5f1f] pl-4 text-[13px] font-semibold leading-[1.7] text-[#333]">
            Disclosure: Beag Labs makes Papyrus. Its cells cite our own pages and are labelled first-party; {other.name} is held to the same evidence rules. This comparison is documentation-based and we have not run hands-on tests of either product.
          </p>
        </div>}
      />

      <section className="px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-5 md:grid-cols-2">
            {[beag, other].map((platform) => (
              <div key={platform.slug} className="border-[3px] border-[#111] bg-white p-5">
                <Link href={productHref(platform)} className="flex items-center gap-4 hover:text-[#b33d0d]">
                  <ProductLogo name={platform.name} src={logoUrl(platform)} />
                  <span>
                    <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#666]">{platform.vendor}</span>
                    <h2 className="text-[24px] font-extrabold tracking-[-0.03em] underline decoration-2 underline-offset-4">{platform.name}</h2>
                  </span>
                </Link>
                <p className="mt-2 text-[14px] font-medium leading-[1.65] text-[#444]">{platform.summary}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em]">
                  <Link href={productHref(platform)} className="underline underline-offset-4">Full profile →</Link>
                  <a href={platform.officialUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Official site ↗</a>
                  {platform.marketplaceUrl && <a href={platform.marketplaceUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Marketplace listing ↗</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-[#f3f1ec] px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[40px]">Side by side, with sources.</h2>
          <div className="mt-8 overflow-x-auto border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">{guide.title}: attribute comparison with a source link on every verified cell</caption>
              <thead>
                <tr className="border-b-[3px] border-[#111] bg-[#fafaf9]">
                  <th scope="col" className="w-[190px] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#555]">Attribute</th>
                  <th scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b33d0d]">{beag.name} (first-party)</th>
                  <th scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#111]">{other.name}</th>
                </tr>
              </thead>
              <tbody>
                {ATTRIBUTES.map(({ key, label }) => (
                  <tr key={key} className="border-b border-[#bbb] align-top last:border-b-0">
                    <th scope="row" className="px-4 py-4 text-[14px] font-extrabold">{label}</th>
                    <td className="px-4 py-4"><EvidenceCell cell={beag.cells[key]} /></td>
                    <td className="px-4 py-4"><EvidenceCell cell={other.cells[key]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-9">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[40px]">Where each may fit better.</h2>
          <p className="mt-3 max-w-[760px] text-[14px] font-medium leading-[1.7] text-[#444]">
            Derived only from the cells above. Each statement lists the cells it rests on, so you can check it.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Fit title={`${other.name} may fit better when`} tone="plain">
              <FitNotes platform={other} notes={other.bestFor} empty="Not enough verified evidence to say." />
              <FitNotes platform={beag} notes={beag.lessSuitedFor} empty="" />
            </Fit>
            <Fit title="Papyrus may fit better when" tone="orange">
              <FitNotes platform={beag} notes={beag.bestFor} empty="Not enough verified evidence to say." />
              <FitNotes platform={other} notes={other.lessSuitedFor} empty="" />
            </Fit>
          </div>

          {openQuestions.length > 0 && (
            <div className="mt-10 border-[3px] border-dashed border-[#111] bg-white p-6">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">Not documented in the sources we checked</h3>
              <p className="mt-2 max-w-[720px] text-[13px] font-medium leading-[1.65] text-[#444]">
                Ask the vendor before assuming either way. These are gaps in documentation we could find, not findings that a capability is missing.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {openQuestions.map((item) => <li key={item} className="text-[14px] font-semibold">? {item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-16 lg:px-9">
        <div className="mx-auto max-w-[1120px]"><Methodology compact /></div>
      </section>

      <section className="px-6 pb-20 lg:px-9">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 border-t-[3px] border-[#111] pt-8">
          <Link href={pillarPath} className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] underline underline-offset-4">← All self-hosted platforms</Link>
          <Link href="/claims" className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] underline underline-offset-4">Browse the Claim Ledger →</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
