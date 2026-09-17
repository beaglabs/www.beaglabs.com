import type { Metadata } from 'next'
import Link from 'next/link'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

/**
 * Commercial support page for Papyrus.
 *
 * This is the URL Partner Center points at for the Azure Marketplace offer, so it has to
 * stand on its own as a support statement: who to contact, how fast, for what, and what is
 * out of scope. Microsoft's certification checks that a support URL exists and actually
 * describes support; a page that is only a mailto link does not.
 *
 * Note what is deliberately absent: a phone number. There is no support queue to put on
 * the other end of one, and a dead phone line is worse than saying email is the channel.
 */

const SUPPORT_EMAIL = 'james@beaglabs.com'
const SUPPORT_HREF = `mailto:${SUPPORT_EMAIL}?subject=Papyrus%20support%20request`

export const metadata: Metadata = pageMetadata({
  title: 'Commercial support',
  description:
    'Support for Papyrus commercial deployments: channels, response targets by severity, what is in scope, and what to include when you report an issue.',
  path: '/support/commercial',
  label: 'Support',
  ogDescription:
    'How to get support for a commercial Papyrus deployment — severity definitions, response targets, and the diagnostics we need from you.',
})

const SEVERITIES: Array<{
  level: string
  definition: string
  firstResponse: string
  updates: string
}> = [
  {
    level: 'Severity 1',
    definition:
      'The appliance is down or unusable in production, no workaround exists, and work has stopped.',
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
  'The Papyrus container image, its API, and its first-run onboarding.',
  'The Azure Resource Manager templates and Bicep modules in our repository, including deployment failures.',
  'Licence issuance, activation, and renewal for your deployment ID.',
  'Model endpoint configuration — pointing Papyrus at Azure OpenAI, an OpenAI-compatible gateway, or your own inference host.',
  'Upgrades between published image tags, and rollback guidance if one goes wrong.',
]

const OUT_OF_SCOPE = [
  'Azure platform incidents, quota limits, or region capacity. Those go to Microsoft support, and the Azure portal opens the case.',
  'Your network, firewall, DNS, private endpoints, and egress policy.',
  'The model endpoint itself. If it is your own inference host or a third-party gateway, availability and correctness there are outside Papyrus.',
  'Custom integrations, connectors, or prompts built during an engagement. Those are scoped separately.',
  'The host VM operating system, its disks, and any hardening beyond what our templates apply.',
]

const DIAGNOSTICS = [
  ['Deployment ID', 'Shown on the appliance onboarding page, and returned by /api/config/public. It is the only identifier we need to find the licence record.'],
  ['Image tag', 'The tag you deployed, for example 0.1.1. `sudo docker ps --format "{{.Image}}"` prints it.'],
  ['Azure context', 'Subscription region, VM size, and the output of `az deployment group show -g <rg> -n <deployment> --query properties.error` if the template itself failed.'],
  ['Container state', '`sudo docker ps -a` and `sudo docker logs papyrus --tail 200`.'],
  ['Timeline', 'When it last worked, and anything that changed in between — an image update, a network change, a model endpoint rotation.'],
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold tracking-[-0.02em] text-[#111]">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-[#333]">{children}</div>
    </section>
  )
}

export default function CommercialSupportPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F4F0]">
        <div className="mx-auto max-w-[1100px] px-6 py-16">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Papyrus — commercial
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-[-0.03em] text-[#111]">
            Commercial support
          </h1>
          <p className="mb-12 max-w-[680px] text-[16px] leading-relaxed text-[#333]">
            Support for self-deployed Papyrus appliances. Email is the supported channel and it
            reaches an engineer, not a queue. If you are running the government offer,{' '}
            <Link href="/support#government" className="text-[#111] underline">
              that has its own terms
            </Link>
            .
          </p>

          <Section id="contact" title="How to reach us">
            <p>
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
            <p>
              Business hours are Monday to Friday, 09:00–18:00 US Eastern, excluding US
              federal holidays. Severity 1 reports are read outside those hours on a
              best-effort basis; there is no on-call rotation to page, and we will not pretend
              otherwise.
            </p>
            <p>
              There is no phone support line and no customer portal. Both were considered and
              skipped: a mailbox an engineer monitors answers faster than a queue nobody staffs.
            </p>
          </Section>

          <Section id="severity" title="Severity definitions and response targets">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="border-b-2 border-[#111] text-left">
                    <th className="py-3 pr-4 font-semibold text-[#111]">Severity</th>
                    <th className="py-3 pr-4 font-semibold text-[#111]">Definition</th>
                    <th className="py-3 pr-4 font-semibold text-[#111]">First response</th>
                    <th className="py-3 font-semibold text-[#111]">Updates</th>
                  </tr>
                </thead>
                <tbody>
                  {SEVERITIES.map((row) => (
                    <tr key={row.level} className="border-b border-[#E2E0DB] align-top">
                      <td className="py-3 pr-4 font-semibold whitespace-nowrap text-[#111]">
                        {row.level}
                      </td>
                      <td className="py-3 pr-4 text-[#333]">{row.definition}</td>
                      <td className="py-3 pr-4 whitespace-nowrap text-[#333]">{row.firstResponse}</td>
                      <td className="py-3 text-[#333]">{row.updates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              These are targets for the first response, not a resolution guarantee. Resolution
              depends on what the fault turns out to be, and we will tell you what we think it
              is rather than leaving you without an answer.
            </p>
          </Section>

          <Section id="diagnostics" title="What to include">
            <p>
              Papyrus makes no call to a Beag Labs control plane, so we cannot see your instance
              and we have no telemetry from it. That is a deliberate property of the product and
              it means the information below is the difference between a same-day answer and a
              week of questions.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              {DIAGNOSTICS.map(([term, detail]) => (
                <div key={term} className="border-l-2 border-[#E2E0DB] pl-4">
                  <dt className="font-semibold text-[#111]">{term}</dt>
                  <dd className="text-[14px] text-[#333]">{detail}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="scope" title="What is covered">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-[15px] font-bold text-[#111]">In scope</h3>
                <ul className="space-y-2 text-[14px]">
                  {IN_SCOPE.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="pt-0.5 text-[#ff5f1f]">&#10003;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-[15px] font-bold text-[#111]">Out of scope</h3>
                <ul className="space-y-2 text-[14px]">
                  {OUT_OF_SCOPE.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="pt-0.5 text-[#999]">&mdash;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="self-service" title="Before you write">
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/beaglabs/papyrus/blob/main/deploy/azure/README.md"
                  className="text-[#111] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Azure deployment README
                </a>{' '}
                — parameters, disk layout, and the checks that confirm a healthy appliance.
              </li>
              <li>
                <code className="text-[13px]">GET /api/config/public</code> on the appliance
                reports its deployment ID, licence state, and which profile it is running in.
                Most &ldquo;is it working&rdquo; questions are answered here.
              </li>
              <li>
                <code className="text-[13px]">GET /api/license/status</code> reports whether a
                licence is active and when it expires. An expired licence is the most common
                cause of an appliance that boots but refuses to start work.
              </li>
              <li>
                <code className="text-[13px]">
                  sudo docker exec papyrus node /healthcheck.mjs
                </code>{' '}
                exits non-zero when the sandbox or workspace is unhealthy, and is worth running
                before reporting a fault.
              </li>
            </ul>
          </Section>

          <Section id="escalation" title="If a request is not moving">
            <p>
              Reply on the existing thread with <span className="font-mono text-[13px]">escalate</span>{' '}
              in the body and it goes to the founder directly. If we have missed a Severity 1
              target, say so plainly — that is the signal we act on, and there is no process to
              work around to reach someone with authority over the answer.
            </p>
          </Section>

          <Section id="security" title="Security reports">
            <p>
              Send suspected vulnerabilities to{' '}
              <a href={SUPPORT_HREF} className="text-[#111] underline">
                {SUPPORT_EMAIL}
              </a>{' '}
              with <span className="font-mono text-[13px]">[security]</span> in the subject line.
              Do not open a public issue. We acknowledge within one business day, and we will tell
              you what we intend to do and when rather than asking you to sit on a finding
              indefinitely.
            </p>
          </Section>

          <div className="mt-14 border-t-2 border-[#111] pt-8">
            <p className="mb-5 text-[15px] text-[#333]">
              Deployment failures, licence problems, or a question about whether your setup is
              supported — one email is enough to start.
            </p>
            <a
              href={SUPPORT_HREF}
              className="inline-block bg-[#111] px-6 py-3 text-[15px] font-semibold text-white"
            >
              Email {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
