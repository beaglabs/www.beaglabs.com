import type { Metadata } from 'next'
import Link from 'next/link'

import { AccountManagerAdmin } from '@/components/licensing/account-manager-admin'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Account Managers',
    description: 'Private Beag Labs account manager administration.',
    path: '/licensing/account-managers',
    label: 'Licensing',
  }),
  robots: { index: false, follow: false },
}

export default function AccountManagersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col justify-between gap-5 border-b-[3px] border-[#111] pb-9 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Licensing / Account ownership</span>
              <h1 className="max-w-[820px] text-[40px] font-extrabold leading-[.98] tracking-[-.045em] lg:text-[54px]">Entra-backed Account Managers.</h1>
              <p className="mt-4 max-w-[760px] text-[15px] font-medium leading-7 text-[#555]">Choose which authorized Beag Labs identity owns each customer relationship in the Papyrus provisioning portal.</p>
            </div>
            <Link href="/licensing" className="nb-btn-white inline-flex h-fit px-4 py-2.5 font-mono text-[9px] font-black uppercase">Back to licensing</Link>
          </div>
          <AccountManagerAdmin />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
