import type { Metadata } from 'next'

import { PartnerPortal } from '@/components/licensing/partner-portal'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Partner Portal',
  description: 'Beag Labs approved partner catalog and order portal.',
  robots: { index: false, follow: false },
}

export default function PartnerPortalPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 border-b-[3px] border-[#111] pb-10">
            <span className="nb-label mb-5 inline-block">Partner operations</span>
            <h1 className="max-w-[780px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] lg:text-[54px]">Papyrus channel portal.</h1>
            <p className="mt-5 max-w-[690px] text-[16px] font-medium leading-[1.7] text-[#505050]">View current Papyrus SKUs, submit customer order requests, and track commercial review without exposing entitlement creation or license-signing authority to partner accounts.</p>
          </div>
          <PartnerPortal />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
