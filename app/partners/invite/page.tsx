import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PartnerInvite } from '@/components/licensing/partner-invite'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Partner Invitation',
  description: 'Complete approved Beag Labs partner access.',
  robots: { index: false, follow: false },
}

export default function PartnerInvitePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <Suspense fallback={<div className="mx-auto max-w-[720px] nb-panel p-8 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Loading invitation…</div>}>
          <PartnerInvite />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}
