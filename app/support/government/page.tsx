import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

const SUPPORT_EMAIL = 'james@beaglabs.com'
const SUPPORT_HREF = `mailto:${SUPPORT_EMAIL}?subject=Papyrus%20government%20support%20request`

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Government support',
    description:
      'Support for Papyrus government deployments in Azure Government and other accredited environments: channels, response targets by severity, what is in scope, and how to engage under your governing contract.',
    path: '/support/government',
    label: 'Support',
    images: [
      {
        url: 'https://images.pexels.com/photos/4328661/pexels-photo-4328661.jpeg',
        width: 2047,
        height: 1167,
        alt: 'Government deployment workspace',
      },
    ],
  })
}

const SEVERITIES: Array<{
  level: string
  definition: string
  firstResponse: string
  updates: string
}> = [
  {
    level: 'Severity 1',
    definition:
      'The appliance is down or unusable in production, no workaround exists, and mission-critical work has stopped.',
    firstResponse: '4 business hours',
    updates: 'Every business day until resolved',
  },
  {
    level: 'Severity 2',
    definition:
      'Functionality is degraded or a subset of workflows fails, but a workaround is available.',
    firstResponse: '1 business day',
    updates: 'Every 2 business days until resolved',
  },
  {
    level: 'Severity 3',
    definition:
      'Questions, configuration help, documentation gaps, cosmetic defects, and feature requests.',
    firstResponse: '3 business days',
    updates: 'As the request progresses',
  },
]

const IN_SCOPE = [
  'The Papyrus container image, its API, and its first-run onboarding in Azure Government or other accredited environments.',
  'The Azure Resource Manager templates and Bicep modules in our repository, including deployment failures in government clouds.',
  'Licence issuance, activation, and renewal for your deployment ID.',
  'Model endpoint configuration — pointing Papyrus at Azure OpenAI in Azure Government, an OpenAI-compatible gateway, or your own inference host within the boundary.',
  'Upgrades between published image tags, and rollback guidance if one goes wrong.',
  'Compliance evidence and artefacts referenced in your Authority to Operate (ATO) package.',
]

const OUT_OF_SCOPE = [
  'Azure Government platform incidents, quota limits, or region capacity. Those go to Microsoft support through your existing channels.',
  'Your network, firewall, DNS, private endpoints, and egress policy within the accredited boundary.',
  'The model endpoint itself. If it is your own inference host or a third-party gateway, availability and correctness there are outside Papyrus.',
  'Custom integrations, connectors, or prompts built during an engagement. Those are scoped separately.',
  'The host VM operating system, its disks, and any hardening beyond what our templates apply, including STIG or CIS baseline enforcement.',
  'FedRAMP, IL4/IL5, or other authorization package maintenance beyond the Papyrus component references we provide.',
]

const DIAGNOSTICS = [
  ['Deployment ID', 'Shown on the appliance onboarding page, and returned by /api/config/public. It is the only identifier we need to find the licence record.'],
  ['Image tag', 'The tag you deployed, for example 0.1.1. `sudo docker ps --format "{{.Image}}"` prints it.'],
  ['Azure Government context', 'Subscription region (e.g., usgov-virginia, usgov-arizona), VM size, and the output of `az deployment group show -g <rg> -n <deployment> --query properties.error` if the template itself failed.'],
  ['Container state', '`sudo docker ps -a` and `sudo docker logs papyrus --tail 200`.'],
  ['Timeline', 'When it last worked, and anything that changed in between — an image update, a network change, a model endpoint rotation, or a boundary policy update.'],
  ['Authorization artefacts', 'Relevant excerpts from your ATO, SSP, or POA&M that pertain to the Papyrus component, if the issue relates to compliance evidence.'],
]

export default function GovernmentSupportPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />

      {/* Hero Section */}
      <section className="overflow-hidden border-b-[3px] border-[#111] pt-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex min-h-[520px] flex-col justify-center px-6 py-20 lg:border-r-[3px] lg:border-[#111] lg:px-9 lg:py-24">
            <p className="nb-label mb-5 inline-block">Papyrus — government</p>
            <h1 className="max-w-[720px] text-[52px] font-extrabold leading-[.98] tracking-[-0.055em] sm:text-[66px] lg:text-[78px]">
              Government support
            </h1>
            <p className="mt-7 max-w-[650px] text-[18px] font-medium leading-[1.7] text-[#444]">
              Support for Papyrus appliances deployed in Azure Government and other accredited
              environments. The product is the same; support is handled under the governing contract
              or agreement that covers your deployment. If you are running the commercial offer,{' '}
              <Link href="/support/commercial" className="text-[#111] underline">
                commercial support terms
              </Link>{' '}
              apply.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href={SUPPORT_HREF}
                className="nb-btn-orange inline-flex items-center gap-2 px-6 py-3.5 text-[12px] uppercase tracking-[0.08em]"
              >
                Email {SUPPORT_EMAIL}
              </a>
            </div>
          </div>

          <div className="relative flex min-h-[520px] items-center justify-center border-t-[3px] border-[#111] bg-white lg:border-t-0">
            <Image
              src="https://images.pexels.com/photos/4328661/pexels-photo-4328661.jpeg?auto=compress&cs=tinysrgb&w=1920"
              alt="Government deployment workspace"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* How to reach us + Severity targets */}
      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">Support terms</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">How to reach us</h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 nb-card p-7 sm:p-8">
              <p className="mb-4 text-[15px] leading-relaxed text-[#333]">
                Email{' '}
                <a href={SUPPORT_HREF} className="text-[#111] underline">
                  {SUPPORT_EMAIL}
                </a>
                . Put the severity and your deployment ID in the subject line, for example{' '}
                <span className="font-mono text-[13px]">
                  [Sev 2] 7f3a91c4 — onboarding completes but no licence accepted
                </span>
                .
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-[#333]">
                Business hours are Monday to Friday, 09:00–18:00 US Eastern, excluding US
                federal holidays. Severity 1 reports are read outside those hours on a
                best-effort basis; there is no on-call rotation to page, and we will not pretend
                otherwise.
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-[#333]">
                There is no phone support line and no customer portal. Both were considered and
                skipped: a mailbox an engineer monitors answers faster than a queue nobody staffs.
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-[#333]">
                If your contract designates a specific contracting officer's representative (COR),
                programme manager, or security officer as the point of contact, include them on
                the thread. We will respect the communication protocols defined in your agreement.
              </p>
            </div>

            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-5 text-[20px] font-extrabold tracking-[-0.02em] text-[#111]">Severity targets</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b-2 border-[#111] text-left">
                      <th className="py-2 pr-3 font-semibold text-[#111]">Sev</th>
                      <th className="py-2 pr-3 font-semibold text-[#111]">First response</th>
                      <th className="py-2 font-semibold text-[#111]">Updates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEVERITIES.map((row) => (
                      <tr key={row.level} className="border-b border-[#E2E0DB] align-top">
                        <td className="py-2 pr-3 font-semibold whitespace-nowrap text-[#111]">{row.level}</td>
                        <td className="py-2 pr-3 whitespace-nowrap text-[#333]">{row.firstResponse}</td>
                        <td className="py-2 text-[#333]">{row.updates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[13px] text-[#555]">
                Targets for first response, not a resolution guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What to include */}
      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Diagnostics</span>
              <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                What to include
              </h2>
            </div>
            <p className="max-w-[390px] text-[15px] font-medium leading-[1.7] text-[#555]">
              Papyrus makes no call to a Beag Labs control plane, so we cannot see your instance
              and we have no telemetry from it. That is a deliberate property of the product and
              it means the information below is the difference between a same-day answer and a
              week of questions.
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIAGNOSTICS.map(([term, detail]) => (
              <div key={term} className="nb-card p-6">
                <dt className="mb-2 font-semibold text-[#111]">{term}</dt>
                <dd className="text-[14px] leading-relaxed text-[#333]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What is covered */}
      <section className="border-y-[3px] border-[#111] bg-white px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Scope</span>
              <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                What is covered
              </h2>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-4 text-[20px] font-extrabold tracking-[-0.02em] text-[#111]">In scope</h3>
              <ul className="space-y-3 text-[14px] leading-relaxed">
                {IN_SCOPE.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[#ff5f1f]">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-4 text-[20px] font-extrabold tracking-[-0.02em] text-[#111]">Out of scope</h3>
              <ul className="space-y-3 text-[14px] leading-relaxed">
                {OUT_OF_SCOPE.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[#999]">&mdash;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Before you write */}
      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">Self-service</span>
              <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                Before you write
              </h2>
            </div>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2">
            <li className="nb-card p-7 sm:p-8">
              <a
                href="https://github.com/beaglabs/papyrus/blob/main/deploy/azure/README.md"
                className="text-[#111] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Azure deployment README
              </a>{' '}
              <span className="text-[15px] leading-relaxed text-[#333]">
                — parameters, disk layout, and the checks that confirm a healthy appliance in Azure Government.
              </span>
            </li>
            <li className="nb-card p-7 sm:p-8">
              <code className="text-[13px]">GET /api/config/public</code>
              <p className="mt-2 text-[15px] leading-relaxed text-[#333]">
                on the appliance reports its deployment ID, licence state, and which profile it is running in.
                Most &ldquo;is it working&rdquo; questions are answered here.
              </p>
            </li>
            <li className="nb-card p-7 sm:p-8">
              <code className="text-[13px]">GET /api/license/status</code>
              <p className="mt-2 text-[15px] leading-relaxed text-[#333]">
                reports whether a licence is active and when it expires. An expired licence is the most common
                cause of an appliance that boots but refuses to start work.
              </p>
            </li>
            <li className="nb-card p-7 sm:p-8">
              <code className="text-[13px]">
                sudo docker exec papyrus node /healthcheck.mjs
              </code>
              <p className="mt-2 text-[15px] leading-relaxed text-[#333]">
                exits non-zero when the sandbox or workspace is unhealthy, and is worth running
                before reporting a fault.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Escalation & Security */}
      <section className="border-y-[3px] border-[#111] bg-white px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-4 text-[20px] font-extrabold tracking-[-0.02em] text-[#111]">If a request is not moving</h3>
              <p className="text-[15px] leading-relaxed text-[#333]">
                Reply on the existing thread with <span className="font-mono text-[13px]">escalate</span>{' '}
                in the body and it goes to the founder directly. If we have missed a Severity 1
                target, say so plainly — that is the signal we act on, and there is no process to
                work around to reach someone with authority over the answer.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-[#333]">
                If your agreement defines a formal dispute or escalation path, reference that
                clause when you escalate and we will follow it.
              </p>
            </div>
            <div className="nb-card p-7 sm:p-8">
              <h3 className="mb-4 text-[20px] font-extrabold tracking-[-0.02em] text-[#111]">Security reports</h3>
              <p className="text-[15px] leading-relaxed text-[#333]">
                Send suspected vulnerabilities to{' '}
                <a href={SUPPORT_HREF} className="text-[#111] underline">
                  {SUPPORT_EMAIL}
                </a>{' '}
                with <span className="font-mono text-[13px]">[security]</span> in the subject line.
                Do not open a public issue. We acknowledge within one business day, and we will tell
                you what we intend to do and when rather than asking you to sit on a finding
                indefinitely.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-[#333]">
                If your environment requires coordinated vulnerability disclosure through a specific
                channel (e.g., a DIB CSO, CISA, or internal SOC), note that in your report and we
                will coordinate accordingly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t-[3px] border-[#111] bg-[#ff5f1f] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#FAFAF9]">
              Ready to start
            </p>
            <h2 className="mt-4 max-w-[820px] text-[40px] font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-[56px] text-[#FAFAF9]">
              Deployment failures, licence problems, or a question about whether your setup is supported.
            </h2>
          </div>
          <a
            href={SUPPORT_HREF}
            className="nb-btn-white inline-flex shrink-0 items-center gap-2 px-6 py-3.5 text-[12px] uppercase tracking-[0.08em]"
          >
            Email {SUPPORT_EMAIL}
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}