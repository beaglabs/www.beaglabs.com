import type { Metadata } from 'next'
import Link from 'next/link'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Support',
  description:
    'Papyrus support for commercial and government deployments, with dedicated mailboxes, response targets, diagnostics, and support scope.',
  path: '/support',
  label: 'Support',
  ogDescription:
    'Choose commercial or government Papyrus support and see the correct support channel for your deployment.',
})

const SUPPORT_PATHS = [
  {
    id: 'commercial',
    eyebrow: 'Commercial deployments',
    title: 'Commercial support',
    summary:
      'For Papyrus running in commercial cloud, private cloud, or on-premises environments under commercial terms.',
    href: '/support/commercial',
    email: 'commercial@beaglabs.com',
    subject: 'Papyrus commercial support request',
    details: ['Azure / AWS / private cloud', 'On-premises deployments', 'Commercial licence and appliance support'],
  },
  {
    id: 'government',
    eyebrow: 'Government deployments',
    title: 'Government support',
    summary:
      'For government, accredited, enclave, and disconnected Papyrus deployments where contract and handling requirements may apply.',
    href: '/support/government',
    email: 'government@beaglabs.com',
    subject: 'Papyrus government support request',
    details: ['Azure Government / accredited cloud', 'Disconnected and enclave deployments', 'Contract-aware support and evidence requests'],
  },
]

const RESPONSE_TARGETS = [
  ['Severity 1', '4 business hours', 'Production unavailable; no workaround'],
  ['Severity 2', '1 business day', 'Material degradation; workaround available'],
  ['Severity 3', '3 business days', 'Questions, configuration, documentation, feature requests'],
]

export default function SupportPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <section className="overflow-hidden border-b-[3px] border-[#111] pt-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex min-h-[520px] flex-col justify-center px-6 py-20 lg:border-r-[3px] lg:border-[#111] lg:px-9 lg:py-24">
            <p className="nb-label mb-5 inline-block">Papyrus support</p>
            <h1 className="max-w-[760px] text-[52px] font-extrabold leading-[.98] tracking-[-0.055em] sm:text-[66px] lg:text-[78px]">
              Support starts with the right channel.
            </h1>
            <p className="mt-7 max-w-[680px] text-[18px] font-medium leading-[1.7] text-[#444]">
              Papyrus runs inside your environment and does not stream appliance telemetry back to Beag Labs.
              Choose the deployment path below so the right team receives your case with the right handling context.
            </p>
          </div>

          <div className="grid min-h-[520px] border-t-[3px] border-[#111] bg-white lg:border-t-0">
            {SUPPORT_PATHS.map((path, index) => (
              <div
                key={path.id}
                className={`flex flex-col justify-between p-7 sm:p-9 ${index === 0 ? 'border-b-[3px] border-[#111]' : ''}`}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">{path.eyebrow}</p>
                  <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em]">{path.title}</h2>
                  <p className="mt-3 max-w-[540px] text-[14px] leading-relaxed text-[#444]">{path.summary}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={path.href}
                    className="nb-btn-orange inline-flex items-center px-5 py-3 text-[11px] uppercase tracking-[0.08em]"
                  >
                    View support terms
                  </Link>
                  <a
                    href={`mailto:${path.email}?subject=${encodeURIComponent(path.subject)}`}
                    className="inline-flex items-center border-2 border-[#111] bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#111] hover:text-white"
                  >
                    Email support
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Choose a path</span>
              <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                Two support channels, one product.
              </h2>
            </div>
            <p className="max-w-[430px] text-[15px] font-medium leading-[1.7] text-[#555]">
              The product architecture is the same. The support path changes because government deployments can carry contract, authorization, and information-handling requirements that commercial cases do not.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {SUPPORT_PATHS.map((path) => (
              <article key={path.id} id={path.id} className="nb-card scroll-mt-24 overflow-hidden p-0">
                <div className="border-b-2 border-[#111] p-7 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">{path.eyebrow}</p>
                  <h3 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em]">{path.title}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-[#444]">{path.summary}</p>
                </div>

                <div className="p-7 sm:p-8">
                  <ul className="space-y-3 text-[14px] leading-relaxed text-[#333]">
                    {path.details.map((detail) => (
                      <li key={detail} className="flex gap-3">
                        <span className="mt-0.5 shrink-0 font-bold text-[#ff5f1f]">✓</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 border-t-2 border-[#111] pt-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#777]">Mailbox</p>
                    <a
                      href={`mailto:${path.email}?subject=${encodeURIComponent(path.subject)}`}
                      className="mt-1 inline-block break-all text-[18px] font-extrabold tracking-[-0.025em] underline underline-offset-4"
                    >
                      {path.email}
                    </a>
                  </div>

                  <Link
                    href={path.href}
                    className="mt-7 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
                  >
                    Open {path.title.toLowerCase()} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-white">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[.8fr_1.2fr]">
          <div className="border-b-[3px] border-[#111] px-6 py-20 lg:border-b-0 lg:border-r-[3px] lg:px-9 lg:py-28">
            <span className="nb-label mb-5 inline-block">Response targets</span>
            <h2 className="text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
              Severity drives first response.
            </h2>
            <p className="mt-6 max-w-[520px] text-[15px] leading-[1.7] text-[#555]">
              These are standard first-response targets. Your order, contract, task order, or support agreement can establish different coverage and takes precedence when it does.
            </p>
          </div>

          <div className="px-6 py-20 lg:px-9 lg:py-28">
            <div className="overflow-x-auto border-2 border-[#111] bg-[#FAFAF9]">
              <table className="w-full border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b-2 border-[#111] bg-white">
                    <th className="p-4 font-extrabold">Severity</th>
                    <th className="p-4 font-extrabold">First response</th>
                    <th className="p-4 font-extrabold">Typical definition</th>
                  </tr>
                </thead>
                <tbody>
                  {RESPONSE_TARGETS.map(([severity, response, definition]) => (
                    <tr key={severity} className="border-b border-[#D8D5CF] last:border-0">
                      <td className="p-4 font-semibold">{severity}</td>
                      <td className="p-4 whitespace-nowrap text-[#333]">{response}</td>
                      <td className="p-4 text-[#444]">{definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="nb-card p-7 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">Security reports</p>
              <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em]">Report privately, not in a public issue.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#444]">
                For a suspected Papyrus vulnerability, use the mailbox that matches the affected deployment and put <span className="font-mono text-[13px]">[security]</span> in the subject line. Government customers should follow their contract and approved information-handling procedures before sending any sensitive diagnostic material.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SUPPORT_PATHS.map((path) => (
                <a
                  key={`${path.id}-security`}
                  href={`mailto:${path.email}?subject=${encodeURIComponent('[security] Papyrus vulnerability report')}`}
                  className="flex min-h-[190px] flex-col justify-between border-2 border-[#111] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#111]"
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#777]">{path.title}</p>
                    <p className="mt-2 break-all text-[17px] font-extrabold tracking-[-0.025em]">{path.email}</p>
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em]">Start private report →</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#111] px-6 py-16 text-white lg:px-9">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff7c4a]">Not sure which path applies?</p>
            <h2 className="mt-2 max-w-[760px] text-[32px] font-extrabold tracking-[-0.04em] sm:text-[42px]">
              Government agreement or accredited boundary? Use government. Everything else, use commercial.
            </h2>
          </div>
          <Link
            href="/support/government"
            className="inline-flex w-fit items-center border-2 border-white bg-white px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111] transition hover:bg-[#ff5f1f] hover:text-white"
          >
            Government support
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
