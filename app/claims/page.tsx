import type { Metadata } from 'next'
import Link from 'next/link'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { claims } from '@/lib/claims'

export const metadata: Metadata = {
  title: 'Claim Ledger — Beag Labs',
  description: 'A source-linked ledger of verified claims, approved language, and usage boundaries.',
  alternates: { canonical: 'https://www.beaglabs.com/claims' },
}

export default function ClaimsPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />
      <section className="px-6 pb-20 pt-32 lg:px-9 lg:pb-28 lg:pt-36">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-6 flex items-center gap-3">
            <span className="nb-label">Reference</span>
            <span className="h-px w-10 bg-[#111]" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#555]">{claims.length} documented claims</span>
          </div>
          <h1 className="max-w-[850px] text-[44px] font-extrabold leading-[0.98] tracking-[-0.05em] sm:text-[58px] lg:text-[72px]">
            Claim Ledger<span className="text-[#ff5f1f]">.</span>
          </h1>
          <p className="mt-5 max-w-[680px] text-[17px] font-medium leading-[1.7] text-[#404040]">
            Verified statements with approved wording, source links, and clear boundaries for how each claim should be used.
          </p>

          <div className="mt-12 border-y-[3px] border-[#111]">
            {claims.map((claim, index) => (
              <Link
                key={claim.claimId}
                href={`/claims/${encodeURIComponent(claim.claimId)}`}
                className={`group grid min-w-0 gap-4 px-4 py-6 transition-colors hover:bg-[#fff0e9] sm:grid-cols-[150px_minmax(0,1fr)_180px] sm:items-center sm:px-6 ${index > 0 ? 'border-t border-[#bbb]' : ''}`}
              >
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start sm:justify-center">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]">{claim.claimId}</span>
                  <span className="inline-flex w-fit border border-[#111] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#333]">{claim.status}</span>
                </div>
                <span className="min-w-0 break-words text-[15px] font-semibold leading-[1.55] text-[#222]">{claim.claim}</span>
                <span className="flex min-w-0 items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#666] sm:block sm:text-right">
                  <span>{claim.sourceOrganization}</span>
                  <span className="mt-1 block">Verified {claim.lastVerified}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
