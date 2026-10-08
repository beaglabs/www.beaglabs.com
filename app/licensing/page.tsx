import type { Metadata } from 'next'
import { LicensingConsole } from '@/components/licensing/licensing-console'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Licensing Operations',
    description: 'Private Beag Labs licensing, entitlement, deployment, and account operations.',
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
              <span className="nb-label mb-5 inline-block">Papyrus / Licensing Operations</span>
              <h1 className="max-w-[920px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#111] lg:text-[56px]">
                Entitlements, deployments, offline licenses, and customer access.
              </h1>
              <p className="mt-5 max-w-[820px] text-[16px] font-medium leading-[1.7] text-[#505050] lg:text-[17px]">
                Operate the Papyrus commercial and government licensing boundary without carrying a general-purpose CRM inside the licensing console.
              </p>
            </div>
            <div className="flex h-fit flex-wrap gap-3">
              <Link href="/licensing/account-managers" className="nb-btn-white px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.12em]">Account Managers</Link>
              <Link href="/provision" className="nb-btn-orange px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.12em]">Customer Provisioning</Link>
            </div>
          </div>
          <LicensingConsole />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
