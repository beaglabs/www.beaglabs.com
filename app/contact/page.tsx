import type { Metadata } from 'next'
import { ArrowUpRight, Mail } from 'lucide-react'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

const BOOKING_URL =
  'https://bookings.cloud.microsoft/book/BeagLabsBookings@beaglabs.com/?ismsaljsauthenabled'

export const metadata: Metadata = pageMetadata({
  title: 'Book a meeting',
  description:
    'Schedule a conversation with Beag Labs about Papyrus, secure AI deployment, partnerships, or another problem you are working on.',
  path: '/contact',
  label: 'Contact',
  ogDescription:
    'Choose a time to talk with Beag Labs about Papyrus, secure AI deployment, partnerships, or another problem you are working on.',
})

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="mx-auto mb-9 max-w-[760px] text-center">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#ff5f1f]">
              Contact / Schedule
            </p>
            <h1 className="mt-3 text-[42px] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#111] sm:text-[58px]">
              Talk with Beag Labs.
            </h1>
            <p className="mx-auto mt-5 max-w-[650px] text-[16px] font-medium leading-7 text-[#555]">
              Pick a time to discuss Papyrus, secure deployment, partnerships, or another
              problem you&apos;re working on.
            </p>
          </div>

          <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111]">
            <div className="flex flex-col gap-3 border-b-[3px] border-[#111] bg-[#fff1e9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#ff5f1f]">
                  Microsoft Bookings
                </p>
                <p className="mt-1 text-[14px] font-extrabold text-[#111]">Choose an available time</p>
              </div>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nb-btn-white inline-flex w-fit items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.1em]"
              >
                Open in new tab
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="h-[1050px] w-full bg-white sm:h-[1120px]">
              <iframe
                src={BOOKING_URL}
                title="Schedule a meeting with Beag Labs"
                width="100%"
                height="100%"
                scrolling="yes"
                className="block h-full w-full border-0 bg-white"
              />
            </div>
          </section>

          <div className="mx-auto mt-8 max-w-[760px] text-center">
            <p className="text-[12px] leading-6 text-[#666]">
              Prefer email?{' '}
              <a
                href="mailto:james@beaglabs.com"
                className="inline-flex items-center gap-1 font-bold underline decoration-2 underline-offset-4"
              >
                <Mail className="h-3.5 w-3.5" />
                james@beaglabs.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
