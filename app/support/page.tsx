import type { Metadata } from 'next'
import Link from 'next/link'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

/**
 * Support index. Exists so `/support` is a real destination rather than a 404 for anyone
 * who trims the commercial page's URL, and so the government and commercial paths are
 * distinguishable without reading two separate pages.
 */

export const metadata: Metadata = pageMetadata({
  title: 'Support',
  description:
    'Support for Papyrus deployments: commercial and government channels, response targets, and how to report a security issue.',
  path: '/support',
  label: 'Support',
  ogDescription:
    'Commercial and government support channels for Papyrus, with response targets by severity.',
})

const PATHS = [
  {
    id: 'commercial',
    title: 'Commercial',
    summary:
      'Self-deployed appliances in Azure commercial, AWS, or on-premises. Email support with severity-based response targets.',
    href: '/support/commercial',
    cta: 'Commercial support terms',
  },
  {
    id: 'government',
    title: 'Government',
    summary:
      'Azure Government and other accredited environments. Same product, with support handled under the governing contract or agreement.',
    href: '/support/commercial#severity',
    cta: 'Response targets by severity',
  },
]

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F4F0]">
        <div className="mx-auto max-w-[1100px] px-6 py-16">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Papyrus
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-[-0.03em] text-[#111]">Support</h1>
          <p className="mb-12 max-w-[680px] text-[16px] leading-relaxed text-[#333]">
            Papyrus runs entirely inside your environment and reports nothing back to us. There
            is no control plane for us to inspect, so support starts with what you send us —
            and the first response target is a commitment, not an aspiration.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {PATHS.map((path) => (
              <div key={path.id} id={path.id} className="scroll-mt-24 border-2 border-[#111] bg-white p-6">
                <h2 className="mb-2 text-lg font-bold tracking-[-0.02em] text-[#111]">
                  {path.title}
                </h2>
                <p className="mb-5 text-[14px] leading-relaxed text-[#333]">{path.summary}</p>
                <Link
                  href={path.href}
                  className="inline-block border-2 border-[#111] px-4 py-2 text-[13px] font-semibold text-[#111]"
                >
                  {path.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t-2 border-[#111] pt-8">
            <h2 className="mb-3 text-xl font-bold tracking-[-0.02em] text-[#111]">
              Security reports
            </h2>
            <p className="max-w-[680px] text-[15px] leading-relaxed text-[#333]">
              Report suspected vulnerabilities to{' '}
              <a
                href="mailto:james@beaglabs.com?subject=%5Bsecurity%5D"
                className="text-[#111] underline"
              >
                james@beaglabs.com
              </a>{' '}
              with <span className="font-mono text-[13px]">[security]</span> in the subject line
              rather than opening a public issue. We acknowledge within one business day.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
