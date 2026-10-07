import type { Metadata } from 'next'
import { ArrowUpRight, CalendarDays, Mail } from 'lucide-react'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

const BOOKING_URL =
  'https://bookings.cloud.microsoft/bookwithme/user/be687874d69f4ede995ae233db37c9e4@beaglabs.com/meetingtype/-0-zLXxC0k2YsZBckNCG6Q2?anonymous&ismsaljsauthenabled&ep=mlink'

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
        <div className="mx-auto w-full max-w-[980px]">
          <div className="mx-auto max-w-[720px] text-center">
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

          <section className="mx-auto mt-10 max-w-[760px] border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111]">
            <div className="border-b-[3px] border-[#111] bg-[#fff1e9] px-6 py-5 text-center">
              <CalendarDays className="mx-auto h-7 w-7" />
              <p className="mt-3 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">
                Microsoft Bookings
              </p>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.035em]">
                Choose an available time
              </h2>
              <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-6 text-[#666]">
                Microsoft will show live availability and add the meeting to the calendar after you confirm.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <a
                href={BOOKING_URL}
                className="nb-btn-orange flex w-full items-center justify-center gap-3 px-6 py-4 text-center font-mono text-[11px] font-black uppercase tracking-[0.1em]"
              >
                Book a meeting
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#bbb]" />
                <span className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#777]">or</span>
                <div className="h-px flex-1 bg-[#bbb]" />
              </div>

              <a
                href="mailto:james@beaglabs.com"
                className="nb-btn-white flex w-full items-center justify-center gap-3 px-6 py-4 text-center font-mono text-[10px] font-black uppercase tracking-[0.1em]"
              >
                <Mail className="h-4 w-4" />
                Email james@beaglabs.com
              </a>
            </div>
          </section>

          <p className="mx-auto mt-7 max-w-[640px] text-center text-[11px] leading-5 text-[#777]">
            Microsoft Personal Bookings blocks third-party iframe embedding in browsers such as Firefox,
            so the scheduler opens directly on Microsoft&apos;s secure booking page.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
