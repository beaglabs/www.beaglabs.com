import type { Metadata } from 'next'
import Link from 'next/link'

import { LicensingConsole } from '@/components/licensing/licensing-console'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Customer & Licensing Operations',
    description: 'Private Beag Labs customer, licensing, entitlement, and Microsoft Marketplace operations.',
    path: '/licensing',
    label: 'Licensing',
  }),
  robots: { index: false, follow: false },
}

export default function LicensingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 grid gap-8 border-b-[3px] border-[#111] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Customer & Licensing Operations</span>
              <h1 className="max-w-[920px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#111] lg:text-[56px]">
                Leads, customers, entitlements, and deployment channels.
              </h1>
              <p className="mt-5 max-w-[820px] text-[16px] font-medium leading-[1.7] text-[#505050] lg:text-[17px]">
                Customer records are the commercial source of truth. Direct agreements and private Marketplace motions feed the same entitlement and licensing workflow: approve the customer scope, issue the signed organization license, and let the customer deploy as many Papyrus VMs as their agreement allows. Marketplace remains a channel, not the product model.
              </p>
            </div>
            <div className="flex h-fit items-center gap-3 border-[3px] border-[#111] bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#111]">
              <span className="h-2.5 w-2.5 bg-[#59d45c]" />
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#333]">Commercial CRM</span>
            </div>
          </div>
          <div className="mb-8 flex flex-wrap gap-3">
            <Link href="/licensing/marketplace" className="nb-btn-white inline-flex items-center px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em]">
              Azure channel activity
            </Link>
          </div>
          <LicensingConsole />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
