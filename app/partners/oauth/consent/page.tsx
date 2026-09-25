import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PartnerOAuthConsent } from '@/components/licensing/partner-oauth-consent'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Authorize Partner Application',
  description: 'Review a Beag Labs partner OAuth authorization request.',
  robots: { index: false, follow: false },
}

export default function PartnerOAuthConsentPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <Suspense fallback={<div className="mx-auto max-w-[920px] nb-panel p-8 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Loading authorization request…</div>}>
          <PartnerOAuthConsent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}
