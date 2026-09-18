import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact-form'
import { Navbar } from '@/components/navbar'
import { PartnerProgram } from '@/components/partner-program'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Partners',
  description:
    'Partner with Beag Labs. Two lanes: resell and deploy Papyrus as a Cloud Solution Provider, or team with us as a Prime to deliver AI capability inside your programs.',
  path: '/partners',
  label: 'Partners',
  ogDescription:
    'Two ways to partner with Beag Labs: the CSP lane and the Prime lane. Both keep the data where it is.',
})

export default function PartnersPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#FAFAF9]">
        <section className="nb-section-divider bg-[#FAFAF9] px-6 pt-28 pb-16 lg:px-9 lg:pt-32 lg:pb-20">
          <div className="mx-auto max-w-[1440px]">
            <span className="nb-label mb-5 inline-block">Partners</span>
            <h1 className="max-w-[760px] text-[32px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[42px]">
              Partner with Beag Labs.
            </h1>
            <p className="mt-5 max-w-[560px] text-[17px] font-medium leading-[1.65] text-[#404040]">
              Two lanes. Resell and deploy Papyrus for your customers as a Cloud Solution
              Provider \u2014 or team with us as a Prime to deliver AI capability inside your
              programs. Either way, the data stays where it is.
            </p>
          </div>
        </section>

        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-12 lg:px-9 lg:py-16">
          <div className="mx-auto max-w-[1440px]">
            <PartnerProgram />
          </div>
        </section>

        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-12 lg:px-9 lg:py-16">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="nb-label mb-5 inline-block">Partner with us</span>
              <h2 className="mb-4 max-w-[460px] text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[32px]">
                Tell us who you are.
              </h2>
              <p className="max-w-[430px] text-[16px] font-medium leading-[1.65] text-[#404040]">
                Pick your lane above, then tell us what a first engagement looks like. We will
                come back with partner pricing and the deployment runbook.
              </p>
            </div>
            <ContactForm id="partnerships" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
