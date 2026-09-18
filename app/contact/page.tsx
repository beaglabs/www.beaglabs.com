import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact-form'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description:
    'Talk to Beag Labs. General enquiries, press, and anything that does not fit the partner or sales forms.',
  path: '/contact',
  label: 'Contact',
  ogDescription:
    'Tell us what you are working on and we will get back to you. General enquiries, press, and everything that does not fit the partner or sales forms.',
})

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9]">
        <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Contact
          </p>
          <h1 className="mb-4 text-3xl font-extrabold tracking-[-0.03em] text-[#111]">
            Talk to us
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-[#555]">
            General enquiries, press, or anything that does not fit the partner or sales forms.
            Tell us what you are working on and we will get back to you within two business days.
          </p>

          <ContactForm id="hello" />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
