import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PartnerReview } from '@/components/licensing/partner-review'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Partner Application Review',
  description: 'Review a pending Beag Labs partner application.',
  robots: { index: false, follow: false },
}

export default function PartnerReviewPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <Suspense fallback={<div className="mx-auto max-w-[760px] nb-panel p-8 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Loading partner review…</div>}>
          <PartnerReview />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}
