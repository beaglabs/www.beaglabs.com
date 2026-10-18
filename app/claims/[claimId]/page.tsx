import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ClaimDiagram } from '@/components/claims/claim-diagram'
import { SiteFooter } from '@/components/site-footer'
import { claims, getClaim } from '@/lib/claims'
import { pageMetadata } from '@/lib/seo'

interface ClaimPageProps {
  params: Promise<{ claimId: string }>
}

export const dynamicParams = false

const usedOnLabels: Record<string, string> = {
  '/solutions/agentic-modernization-factory': 'Modernization Factory',
  '/solutions/agentic-back-office': 'Agentic Back Office',
  '/compare/self-hosted-ai-agent-platforms': 'Self-hosted AI agent platforms comparison',
}

function usedOnLabel(path: string) {
  const known = usedOnLabels[path]
  if (known) return known
  return path.startsWith('/compare/papyrus-vs-') ? `Papyrus vs ${path.replace('/compare/papyrus-vs-', '').replaceAll('-', ' ')}` : path
}

export function generateStaticParams() {
  return claims.map(({ claimId }) => ({ claimId }))
}

export async function generateMetadata({ params }: ClaimPageProps): Promise<Metadata> {
  const { claimId } = await params
  const claim = getClaim(claimId)
  if (!claim) return { title: 'Claim Not Found' }

  return pageMetadata({
    title: `${claim.claimId} — Claim Ledger`,
    description: claim.allowedLanguage,
    path: `/claims/${encodeURIComponent(claim.claimId)}`,
    label: claim.sourceOrganization,
    type: 'article',
  })
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { claimId } = await params
  const claim = getClaim(claimId)
  if (!claim) notFound()

  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />

      <section className="site-hero px-6 pb-20 pt-16 lg:px-9 lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-[1120px]">
          <Breadcrumbs items={[
            { name: 'Home', url: '/' },
            { name: 'Claim Ledger', url: '/claims' },
            { name: claim.claimId, url: `/claims/${encodeURIComponent(claim.claimId)}` },
          ]} />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="nb-label">{claim.sourceOrganization}</span>
            <span className="border border-[#111] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{claim.status}</span>
          </div>
          <h1 className="mt-4 text-[length:min(42px,9vw)] font-extrabold leading-[1.02] tracking-[-0.05em] sm:text-[54px] lg:text-[64px]">
            {claim.claimId}<span className="text-[#ff5f1f]">.</span>
          </h1>
          <p className="mt-4 max-w-[800px] text-[18px] font-semibold leading-[1.65] text-[#333]">{claim.claim}</p>
          <ClaimDiagram claim={claim} />
          <dl className="mt-8 grid gap-px border-2 border-[#111] bg-[#111] sm:grid-cols-2">
            {[
              ['Source', <a key="s" href={claim.source} rel="noopener noreferrer" target="_blank" className="break-all font-bold underline underline-offset-4">{claim.source.replace(/^https?:\/\//, '')} ↗</a>],
              ['Where in the source', claim.sourceLocator || 'Not recorded'],
              ['Source organization', claim.sourceOrganization],
              ['Evidence type', claim.evidenceType || 'Not recorded'],
              ['Source date', claim.sourceDate || 'Not shown on the source'],
              ['Last verified', claim.lastVerified],
              ['Approved wording', claim.allowedLanguage],
              ['Scope and caveats', claim.scopeCaveat],
              ['Do not infer', claim.prohibitedInference],
            ].map(([label, value], index) => (
              <div key={String(label)} className={`bg-white p-5 ${index >= 6 ? 'sm:col-span-2' : ''}`}>
                <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">{label}</dt>
                <dd className="mt-2 text-sm font-medium leading-7">{value}</dd>
              </div>
            ))}
          </dl>
          {claim.usedOn && <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">Cited on</span>
            {claim.usedOn.map(path => <Link key={path} href={path} className="text-sm font-bold underline underline-offset-4">{usedOnLabel(path)} ↗</Link>)}
          </div>}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t-[2px] border-[#111] pt-5">
            <Link href="/claims" className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] underline decoration-2 underline-offset-4 hover:text-[#b33d0d]">
              ← All claims
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#666]">Record {claim.claimId}</span>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
