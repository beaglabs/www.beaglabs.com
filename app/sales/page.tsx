import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact-form'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Sales',
  description:
    'Talk to Beag Labs about buying or evaluating Papyrus. Budget and timeline are what let us answer yes or no instead of scheduling a discovery call.',
  path: '/sales',
  label: 'Sales',
  ogDescription:
    'Tell us what you are evaluating. Budget and timeline are what let us answer yes or no instead of scheduling a discovery call.',
})

export default function SalesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Sales
          </p>
          <h1 className="mb-4 text-2xl font-bold tracking-[-0.03em] text-[#111]">
            Talk to sales
          </h1>
          <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-[#555]">
            Tell us what you are evaluating. Budget and timeline are what let us answer yes or no
            instead of scheduling a discovery call, and a rough range is always better than a
            number you cannot commit to.
          </p>

          <div className="max-w-2xl">
            <ContactForm id="sales" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
