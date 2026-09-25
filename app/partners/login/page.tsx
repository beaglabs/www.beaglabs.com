import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PartnerLoginForm } from '@/components/licensing/partner-login-form'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Partner Sign In',
  description: 'Sign in to the Beag Labs partner portal.',
  robots: { index: false, follow: false },
}

export default function PartnerLoginPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF9] px-6 pb-20 pt-28 lg:px-9 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[1160px]">
          <Suspense fallback={<div className="nb-panel p-8 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Loading sign in…</div>}>
            <PartnerLoginForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
