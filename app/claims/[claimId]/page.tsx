import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ClaimDiagram } from '@/components/claims/claim-diagram'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { claims, getClaim } from '@/lib/claims'
import { pageMetadata } from '@/lib/seo'

interface ClaimPageProps {
  params: Promise<{ claimId: string }>
}

export const dynamicParams = false

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
      <Navbar bannerHeight={38} />
      <section className="px-6 pb-20 pt-32 lg:px-9 lg:pb-28 lg:pt-36">
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
          <h1 className="mt-4 text-[42px] font-extrabold leading-[1.02] tracking-[-0.05em] sm:text-[54px] lg:text-[64px]">
            {claim.claimId}<span className="text-[#ff5f1f]">.</span>
          </h1>
          <p className="mt-4 max-w-[800px] text-[18px] font-semibold leading-[1.65] text-[#333]">{claim.claim}</p>
          <ClaimDiagram claim={claim} />
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
