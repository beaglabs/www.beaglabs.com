import type { Metadata } from 'next'

import { PartnerApplicationForm } from '@/components/licensing/partner-application-form'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Partner Application',
  description: 'Apply for access to the Beag Labs partner program and Papyrus channel operations.',
}

export default function PartnerApplyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1280px]">
          <section className="mb-10 grid gap-8 border-b-[3px] border-[#111] pb-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Partner network</span>
              <h1 className="max-w-[760px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#111] lg:text-[56px]">
                Work with Beag Labs.
              </h1>
              <p className="mt-5 max-w-[700px] text-[16px] font-medium leading-[1.7] text-[#505050] lg:text-[17px]">
                Apply for distributor, reseller, prime, integrator, referral, or technology-partner access. We manually review every legal entity before portal access or commercial authority is granted.
              </p>
            </div>
            <div className="border-[3px] border-[#111] bg-[#fff0a6] p-5 shadow-[5px_5px_0px_0px_#111]">
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.14em]">Federal channel integrity</div>
              <p className="mt-2 text-[13px] font-semibold leading-6 text-[#444]">
                UEI and CAGE are required so partner activity stays tied to the correct legal entity. Application approval does not create an entitlement or license.
              </p>
            </div>
          </section>

          <PartnerApplicationForm />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
