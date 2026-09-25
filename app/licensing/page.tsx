import type { Metadata } from 'next'

import { LicensingConsole } from '@/components/licensing/licensing-console'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Licensing Administration',
  description: 'Private Beag Labs licensing administration.',
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
              <span className="nb-label mb-5 inline-block">Operations</span>
              <h1 className="max-w-[820px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#111] lg:text-[56px]">
                Licensing control center.
              </h1>
              <p className="mt-5 max-w-[720px] text-[16px] font-medium leading-[1.7] text-[#505050] lg:text-[17px]">
                Commercial state and secure provisioning in the Beag Labs interface. The signing boundary stays isolated at license.beaglabs.com; production license signatures stay inside Azure Key Vault.
              </p>
            </div>
            <div className="flex h-fit items-center gap-3 border-[3px] border-[#111] bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#111]">
              <span className="h-2.5 w-2.5 bg-[#59d45c]" />
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#333]">Headless control plane</span>
            </div>
          </div>
          <LicensingConsole />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
