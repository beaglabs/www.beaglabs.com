import type { Metadata } from 'next'
import Link from 'next/link'

import { ProvisionedAccountsTable } from '@/components/licensing/provisioned-accounts-table'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Provisioned Accounts',
    description: 'Private Beag Labs administration for customers onboarded through Papyrus provisioning.',
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
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-6 flex flex-col gap-5 border-b-[3px] border-[#111] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#b63700]">Papyrus / Provisioned Accounts</span>
              <h1 className="mt-2 text-[34px] font-black tracking-[-0.045em] text-[#111] sm:text-[44px]">Licensing</h1>
              <p className="mt-3 max-w-[760px] text-[13px] font-medium leading-6 text-[#666]">
                Customers appear here after onboarding through the Papyrus provisioning portal. Government accounts can be issued the $250,000 90-day offline license directly from the row menu.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/licensing/account-managers" className="nb-btn-white px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.1em]">Account Managers</Link>
              <Link href="/provision" className="nb-btn-orange px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.1em]">Provisioning Portal</Link>
            </div>
          </div>
          <ProvisionedAccountsTable />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
