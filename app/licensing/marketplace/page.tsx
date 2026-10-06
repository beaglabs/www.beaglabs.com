import type { Metadata } from 'next'
import Link from 'next/link'

import { MarketplaceConsole } from '@/components/licensing/marketplace-console'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Azure Channel Operations',
    description: 'Private Beag Labs Microsoft Marketplace lead, customer, and VM analytics operations.',
    path: '/licensing/marketplace',
    label: 'Azure Channel',
  }),
  robots: { index: false, follow: false },
}

export default function MarketplaceOperationsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 grid gap-8 border-b-[3px] border-[#111] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Azure Channel Operations</span>
              <h1 className="max-w-[920px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#111] lg:text-[56px]">
                Marketplace is a channel. Licensing stays customer-centric.
              </h1>
              <p className="mt-5 max-w-[820px] text-[16px] font-medium leading-[1.7] text-[#505050] lg:text-[17px]">
                Use this view for Microsoft lead ingestion, private-offer and SKU observations, VM usage, and deployment telemetry. Customer agreements, entitlements, approved organization scope, and signed license issuance remain in the primary commercial CRM.
              </p>
            </div>
            <Link href="/licensing" className="nb-btn-white inline-flex h-fit items-center px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em]">
              Back to licensing CRM
            </Link>
          </div>
          <MarketplaceConsole />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
