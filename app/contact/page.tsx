import type { Metadata } from 'next'

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
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="mx-auto mb-9 max-w-[760px] text-center">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#ff5f1f]">
              Contact / Schedule
            </p>
            <h1 className="mt-3 text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#111] sm:text-[52px]">
              Talk with Beag Labs.
            </h1>
            <p className="mx-auto mt-5 max-w-[650px] text-[15px] font-medium leading-7 text-[#555]">
              Pick a time to discuss Papyrus, secure deployment, partnerships, or another
              problem you&apos;re working on. Microsoft Bookings checks live calendar availability
              and adds the meeting automatically after you confirm.
            </p>
          </div>

          <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111]">
            <div className="border-b-[3px] border-[#111] bg-[#fff1e9] px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                  className="nb-btn-white inline-flex w-fit items-center px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.1em]"
                >
                  Open in new tab
                </a>
              </div>
            </div>

            <iframe
              src={BOOKING_URL}
              title="Schedule a meeting with Beag Labs"
              width="100%"
              height="1050"
              loading="lazy"
              allowFullScreen
              className="block w-full border-0 bg-white"
            />
          </section>

          <div className="mx-auto mt-8 max-w-[760px] text-center">
            <p className="text-[12px] leading-6 text-[#666]">
              If the booking calendar does not load in your browser, use the <strong>Open in new tab</strong>{' '}
              button above. Prefer email?{' '}
              <a href="mailto:james@beaglabs.com" className="font-bold underline decoration-2 underline-offset-4">
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
