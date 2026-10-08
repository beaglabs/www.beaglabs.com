import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, ShieldCheck } from 'lucide-react'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Provisioning',
    description: 'Provision and manage customer-hosted Papyrus deployments.',
    path: '/provision',
    label: 'Provisioning',
  }),
  robots: { index: false, follow: false },
}

export default function ProvisionPage() {
  return (
    <main className="min-h-screen bg-[#fafaf9] px-6 py-16 lg:px-9">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-10 border-b-[3px] border-[#111] pb-9">
          <span className="nb-label mb-5 inline-block">Papyrus / Control plane</span>
          <h1 className="max-w-[820px] text-[46px] font-black uppercase leading-[.94] tracking-[-.04em] sm:text-[64px]">Provision your environment.</h1>
          <p className="mt-5 max-w-[760px] text-[16px] font-medium leading-7 text-[#555]">Choose the identity and cloud boundary that owns your Papyrus deployment. Connected Azure deployments can be managed here; disconnected licensing remains portable.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/provision/commercial" className="nb-card group bg-white p-7">
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f]"><Building2 className="h-6 w-6" /></div>
            <h2 className="mt-7 text-[28px] font-extrabold tracking-[-.04em]">Commercial</h2>
            <p className="mt-3 text-[14px] font-medium leading-6 text-[#666]">Azure Commercial, Marketplace usage billing, organization provisioning, deployment resizing, and account management.</p>
            <div className="mt-7 font-mono text-[10px] font-black uppercase tracking-[.12em] underline underline-offset-4">Open commercial provisioning →</div>
          </Link>
          <Link href="/provision/government" className="nb-card group bg-[#111] p-7 text-white">
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-white bg-[#ff5f1f] text-[#111]"><ShieldCheck className="h-6 w-6" /></div>
            <h2 className="mt-7 text-[28px] font-extrabold tracking-[-.04em]">Government</h2>
            <p className="mt-3 text-[14px] font-medium leading-6 text-[#d0d0d0]">Azure Government identity, connected deployments, government acknowledgments, and signed offline licenses for restricted or disconnected environments.</p>
            <div className="mt-7 font-mono text-[10px] font-black uppercase tracking-[.12em] text-[#ff9b70] underline underline-offset-4">Open government provisioning →</div>
          </Link>
        </div>
      </div>
    </main>
  )
}
