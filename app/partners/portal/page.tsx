import { pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

import { PartnerPortal } from '@/components/licensing/partner-portal'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Marketplace Partners',
    description: 'Beag Labs Microsoft Marketplace channel and commercial support.',
    path: '/partners/portal',
    label: 'Partners',
  }),
  robots: { index: false, follow: false },
}

export default function PartnerPortalPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 border-b-[3px] border-[#111] pb-10">
            <span className="nb-label mb-5 inline-block">Marketplace channel</span>
            <h1 className="max-w-[860px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] lg:text-[54px]">One commercial path: Microsoft Marketplace.</h1>
            <p className="mt-5 max-w-[760px] text-[16px] font-medium leading-[1.7] text-[#505050]">Partner and customer transactions no longer need a separate Beag Labs deal-registration or order-submission workflow. Marketplace is the transaction path; Beag Labs handles support and deployment operations behind it.</p>
          </div>
          <PartnerPortal />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
