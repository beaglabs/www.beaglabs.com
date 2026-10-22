import type { Metadata } from 'next'
import { ArrowUpRight, Mail } from 'lucide-react'

import { SiteFooter } from '@/components/site-footer'
import { EdgyHero, heroButtonPrimary, heroButtonSecondary } from '@/components/edgy-hero'
import { pageMetadata } from '@/lib/seo'

const BOOKING_URL =
  'https://bookings.cloud.microsoft/book/BeagLabsBookings@beaglabs.com/?ismsaljsauthenabled'

export const metadata: Metadata = pageMetadata({
  title: 'Book a meeting',
  description:
    'Schedule a conversation with Beag Labs about Papyrus, back office automation, legacy workflows, or delivery partnerships.',
  path: '/contact',
  label: 'Contact',
  ogDescription:
    'Choose a time to talk with Beag Labs about Papyrus, back office automation, legacy workflows, or delivery partnerships.',
})

export default function ContactPage() {
  return (
    <>
      <EdgyHero
        background="daylight"
        eyebrow="Contact / Schedule"
        before="Talk with"
        slab="Beag Labs."
        description="Pick a time to discuss Papyrus, back office automation, legacy workflows, or delivery partnerships."
        next={{ href: '#booking', label: 'Choose a time' }}
        actions={<>
          <a href="#booking" className={heroButtonPrimary}>Choose a time</a>
          <a href="mailto:james@beaglabs.com" className={heroButtonSecondary}><Mail className="h-4 w-4" /> james@beaglabs.com</a>
        </>}
      />

      <main id="booking" className="site-page-grid min-h-screen scroll-mt-20 bg-[#FAFAF9] px-6 pb-20 pt-12 lg:px-9 lg:pb-28 lg:pt-16">
        <div className="mx-auto w-full max-w-[1180px]">
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
