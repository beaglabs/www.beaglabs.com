import type { Metadata } from 'next'

import { CaptureRecordDetail } from '@/components/licensing/capture-record-detail'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Capture Record — Beag Labs',
  robots: { index: false, follow: false },
}

export default async function CaptureRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <CaptureRecordDetail kind="vehicle" id={id} />
      </main>
      <SiteFooter />
    </>
  )
}
