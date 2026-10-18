import Link from 'next/link'

import { PageHero } from '@/components/page-hero'
import { SiteFooter } from '@/components/site-footer'

type Severity = {
  level: string
  definition: string
  firstResponse: string
  updates: string
}

type Diagnostic = [term: string, detail: string]

type SupportDetailPageProps = {
  eyebrow: string
  title: string
  intro: string
  email: string
  mailSubject: string
  counterpart: {
    label: string
    href: string
  }
  severities: Severity[]
  diagnostics: Diagnostic[]
  inScope: string[]
  outOfScope: string[]
  contactNotes: string[]
  selfService: Array<{
    title: string
    detail: string
    href?: string
    code?: boolean
  }>
}

export function SupportDetailPage({
  eyebrow,
  title,
  intro,
  email,
  mailSubject,
  counterpart,
  severities,
  diagnostics,
  inScope,
  outOfScope,
  contactNotes,
  selfService,
}: SupportDetailPageProps) {
  const supportHref = `mailto:${email}?subject=${encodeURIComponent(mailSubject)}`

  return (
    <main className="bg-[#FAFAF9] text-[#111]">


      <PageHero
        label={eyebrow}
        title={title}
        description={<>
          {intro}{' '}
          <Link href={counterpart.href} className="text-[#111] underline underline-offset-4">
            {counterpart.label}
          </Link>
          .
        </>}
        below={<div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-bold uppercase tracking-[0.08em]">
          <a href={supportHref} className="break-all underline decoration-2 underline-offset-4">Email {email}</a>
          <Link href="/support" className="underline decoration-2 underline-offset-4">All support</Link>
        </div>}
      />

      <section id="severity" className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">Support terms</p>
              <h2 className="mt-2 text-[length:min(38px,9vw)] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                How support works
              </h2>
            </div>
            <p className="max-w-[430px] text-[15px] font-medium leading-[1.7] text-[#555]">
              First-response targets are commitments to engage and triage. Resolution time depends on the fault,
              environment, and any third-party dependency involved.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="nb-card p-7 sm:p-8">
              <p className="text-[15px] leading-relaxed text-[#333]">
                Email{' '}
                <a href={supportHref} className="font-semibold text-[#111] underline underline-offset-4">
                  {email}
                </a>
                . Include the severity and deployment ID in the subject line, for example{' '}
                <span className="font-mono text-[13px]">[Sev 2] 7f3a91c4 — onboarding completes but no licence accepted</span>.
              </p>
              <div className="mt-6 space-y-4 border-t-2 border-[#111] pt-6">
                {contactNotes.map((note) => (
                  <p key={note} className="text-[14px] leading-relaxed text-[#444]">
                    {note}
                  </p>
                ))}
              </div>
            </div>

            <div className="nb-card overflow-hidden p-0">
              <div className="border-b-2 border-[#111] px-7 py-5">
                <h3 className="text-[20px] font-extrabold tracking-[-0.02em]">Severity targets</h3>
              </div>
              <div className="overflow-x-auto px-7 py-5">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b-2 border-[#111] text-left">
                      <th className="py-2 pr-3 font-semibold">Severity</th>
                      <th className="py-2 pr-3 font-semibold">First response</th>
                      <th className="py-2 font-semibold">Updates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {severities.map((row) => (
                      <tr key={row.level} className="border-b border-[#E2E0DB] align-top last:border-0">
                        <td className="py-3 pr-3 font-semibold whitespace-nowrap">{row.level}</td>
                        <td className="py-3 pr-3 whitespace-nowrap text-[#333]">{row.firstResponse}</td>
                        <td className="py-3 text-[#333]">{row.updates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {severities.map((row) => (
              <div key={`${row.level}-definition`} className="border-2 border-[#111] bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5f1f]">{row.level}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[#333]">{row.definition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Diagnostics</span>
              <h2 className="max-w-[760px] text-[length:min(38px,9vw)] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                What to include
              </h2>
            </div>
            <p className="max-w-[430px] text-[15px] font-medium leading-[1.7] text-[#555]">
              Papyrus does not call a Beag Labs control plane and we receive no appliance telemetry. The details you send are what let us reproduce and isolate the issue quickly.
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {diagnostics.map(([term, detail]) => (
              <div key={term} className="nb-card p-6">
                <dt className="mb-2 text-[16px] font-extrabold tracking-[-0.02em]">{term}</dt>
                <dd className="text-[14px] leading-relaxed text-[#333]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <span className="nb-label mb-5 inline-block">Scope</span>
          <h2 className="max-w-[760px] text-[length:min(38px,9vw)] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
            What is covered
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-5 text-[20px] font-extrabold tracking-[-0.02em]">In scope</h3>
              <ul className="space-y-3 text-[14px] leading-relaxed">
                {inScope.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 font-bold text-[#ff5f1f]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-5 text-[20px] font-extrabold tracking-[-0.02em]">Outside standard support</h3>
              <ul className="space-y-3 text-[14px] leading-relaxed">
                {outOfScope.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[#999]">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <span className="nb-label mb-5 inline-block">Self-service</span>
          <h2 className="max-w-[760px] text-[length:min(38px,9vw)] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
            Before you write
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {selfService.map((item) => (
              <div key={item.title} className="nb-card p-7 sm:p-8">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] font-extrabold tracking-[-0.02em] text-[#111] underline underline-offset-4"
                  >
                    {item.title}
                  </a>
                ) : item.code ? (
                  <code className="text-[13px] font-semibold">{item.title}</code>
                ) : (
                  <h3 className="text-[16px] font-extrabold tracking-[-0.02em]">{item.title}</h3>
                )}
                <p className="mt-3 text-[14px] leading-relaxed text-[#333]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111] px-6 py-16 text-white lg:px-9">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff7c4a]">Need an engineer?</p>
            <h2 className="mt-2 text-[32px] font-extrabold tracking-[-0.04em] sm:text-[42px]">Start with the support mailbox.</h2>
          </div>
          <a
            href={supportHref}
            className="inline-flex w-fit items-center border-2 border-white bg-white px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111] transition hover:bg-[#ff5f1f] hover:text-white"
          >
            {email}
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
