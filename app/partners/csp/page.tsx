import type { Metadata } from 'next'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ContactForm } from '@/components/contact-form'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

/**
 * Public CSP partner page, laid out as a bento grid like the rest of the site.
 *
 * The long-form prose that used to sit here is now in two places: the mechanics are bento
 * cards, and the objections/questions are an accordion. Nothing confidential lives on the
 * page — commercial terms are "on request" rather than listed, because a partner price
 * list published here is readable by anyone with the link, including procurement.
 */

const CONTACT_EMAIL = 'james@beaglabs.com'
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=CSP%20partner%20access`

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'CSP partners',
    description:
      'Partner with Beag Labs. How Cloud Solution Providers deploy, license, and support Papyrus for their customers.',
    path: '/partners/csp',
    label: 'Partners',
  })
}

const DEPLOY_STEPS = [
  { n: '01', t: 'Prerequisites', d: 'An Azure subscription, a Microsoft Entra tenant, and a model endpoint — Azure OpenAI in the customer\u2019s own tenant, or any OpenAI-compatible endpoint. Optional at deploy time.' },
  { n: '02', t: 'Deploy the template', d: 'A hardened Ubuntu appliance with a dedicated data disk, supervised by systemd. You pick the VM size, region, and network posture.' },
  { n: '03', t: 'First-run onboarding', d: 'The appliance serves an onboarding flow rather than the full product, gated by a setup token it prints to its log.' },
  { n: '04', t: 'Bind identity + model', d: 'Entra is the only identity authority. Register the customer\u2019s model endpoint as a profile.' },
]

const LICENSE_STEPS = [
  { n: '01', t: 'Deploy', d: 'The customer or partner deploys the Azure Application into the customer\u2019s subscription.' },
  { n: '02', t: 'Read the deployment ID', d: 'Printed to the appliance log on first boot. The licence binds to it.' },
  { n: '03', t: 'Send it to us', d: 'The deployment ID is the only information we need to mint a licence.' },
  { n: '04', t: 'We mint', d: 'A signed, offline licence — 90-day pilot or 365-day annual terms.' },
  { n: '05', t: 'Activate', d: 'Activated by a Papyrus System Owner. Verified entirely offline.' },
]

const DIFFERENTIATORS = [
  ['It runs where the data is.', 'No call to a Beag control plane. Workloads, prompts, and outputs never leave the customer\u2019s environment.'],
  ['Entra is the only identity authority.', 'No local role database, no password store, no invitation flow.'],
  ['The licence works offline.', 'A signed file, verified locally — no licence server, no activation call.'],
  ['Sandboxed, or it does not run.', 'Landlock and seccomp with network denied. If a host cannot isolate, execution is off.'],
  ['The agent proposes; policy releases.', 'Entra-authorized approvers release actions. Inline secrets are rejected.'],
]

const FAQ = [
  ['Why not a hosted agent platform?', 'Because the data cannot leave. A hosted platform requires egress, an approved third-party model provider, and a vendor control plane in the path. Papyrus is bought by organisations that cannot accept any of those.'],
  ['Is BYOL a hassle?', 'It is a file. We mint it against the deployment ID, you activate it, and it self-expires. There is no licence server to run and no per-user provisioning to reconcile — usually easier than the alternative, not harder.'],
  ['Does it need internet access?', 'Not to us. Papyrus makes no vendor callback. The customer\u2019s chosen model endpoint must be reachable from the appliance, and in a restricted environment that endpoint is their own.'],
  ['Which models can it use?', 'Any OpenAI-compatible or Azure OpenAI endpoint, including one in the customer\u2019s own tenant. Restricted and disconnected profiles refuse to fall back to a commercial endpoint.'],
  ['What about GPU cost?', 'Optional, and it lands in the customer\u2019s subscription — so it counts toward their Azure commitment and flows through you as partner consumption. Model hosting is not required.'],
  ['Can they draw committed Azure spend against the licence?', 'No. The software is invoiced by us, not Microsoft, so the licence fee cannot draw down Azure committed spend — infrastructure still counts. If a procurement gate needs the software itself transactable, tell us: it is a known constraint with known answers.'],
  ['What happens when a licence expires?', 'It self-expires, silently, because nothing phones home. A lapsed licence stops unlocking its features until a new one is minted and activated. Put a renewal reminder on both sides at least 30 days out.'],
  ['Should the onboarding port be public?', 'Exposing it is the simplest path; leaving it internal and reaching it over a private network is the better posture for a restricted environment. Raise it with the customer early.'],
]

function StepList({ items }: { items: Array<{ n: string; t: string; d: string }> }) {
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.n} className="flex gap-3">
          <span className="w-6 shrink-0 pt-0.5 font-mono text-[11px] font-bold text-[#ff5f1f]">
            {item.n}
          </span>
          <div>
            <p className="text-[14px] font-bold text-[#111]">{item.t}</p>
            <p className="text-[13px] leading-relaxed text-[#444]">{item.d}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const CARD = 'nb-card flex flex-col bg-white p-5 transition-all hover:shadow-[8px_8px_0px_0px_#ff5f1f] hover:-translate-x-[1px] hover:-translate-y-[1px] lg:p-6'

export default function CspPartnersPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#FAFAF9]">
        {/* Hero */}
        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-12 lg:px-9 lg:py-16">
          <div className="mx-auto max-w-[1440px]">
            <span className="nb-label mb-5 inline-block">Cloud Solution Provider program</span>
            <h1 className="max-w-[760px] text-[32px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[42px]">
              Partner with Beag Labs.
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] font-medium leading-[1.65] text-[#404040]">
              Papyrus is a customer-hosted durable agent runtime. We work with a small number of
              Cloud Solution Providers who deploy it for their customers.
            </p>
          </div>
        </section>

        {/* Bento */}
        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-12 lg:px-9 lg:py-16">
          <div className="mx-auto max-w-[1440px]">
            <span className="nb-label mb-5 inline-block">How it works</span>
            <h2 className="mb-8 max-w-[620px] text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[32px]">
              The commercial model, the deployment, and the licence — in cards.
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className={`${CARD} lg:col-span-2`}>
                <div className="mb-4 flex items-start justify-between gap-6">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                    01
                  </span>
                </div>
                <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">
                  How the money works
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Infrastructure
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#444]">
                      Runs in the customer&apos;s Azure subscription. You hold the billing
                      relationship, so consumption flows through you at normal CSP margin —
                      recurring, and usually the larger number.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Software
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#444]">
                      BYOL, invoiced by us. Solution templates are not transactable, so there is
                      no Microsoft-brokered software margin — stated plainly, not discovered
                      mid-deal.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Partner margin
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#444]">
                      Set by agreement, quoted per partner.{' '}
                      <a href={CONTACT_HREF} className="font-bold text-[#111] underline">
                        Email us
                      </a>{' '}
                      and we will walk you through it.
                    </p>
                  </div>
                </div>
              </div>

              <div className={CARD}>
                <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                  02
                </span>
                <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">
                  Deploy
                </h3>
                <StepList items={DEPLOY_STEPS} />
              </div>

              <div className={CARD}>
                <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                  03
                </span>
                <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">
                  License
                </h3>
                <StepList items={LICENSE_STEPS} />
              </div>

              <div className={CARD}>
                <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                  04
                </span>
                <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">
                  Support
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Tier 1 — partner
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#444]">
                      Deployment, configuration, onboarding, and licence activation. First line
                      for everything.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Tier 2 — Beag Labs
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#444]">
                      Defects, the sandbox, licence minting and replacement, and anything a
                      partner cannot resolve from the docs.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${CARD} lg:col-span-2`}>
                <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                  05
                </span>
                <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">
                  Why Papyrus
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {DIFFERENTIATORS.map(([title, body]) => (
                    <li key={title} className="border-l-2 border-[#ff5f1f] pl-3">
                      <p className="text-[14px] font-bold text-[#111]">{title}</p>
                      <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-12 lg:px-9 lg:py-16">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="nb-label mb-5 inline-block">FAQ</span>
              <h2 className="mb-4 max-w-[460px] text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[32px]">
                Objections, answered.
              </h2>
              <p className="max-w-[430px] text-[16px] font-medium leading-[1.65] text-[#404040]">
                The questions a partner hears in a competitive deal, with the answers you need
                to close it.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {FAQ.map(([question, answer], index) => (
                <AccordionItem key={question} value={`faq-${index}`}>
                  <AccordionTrigger>{question}</AccordionTrigger>
                  <AccordionContent>{answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact */}
        <section className="nb-section-divider bg-[#FAFAF9] px-6 py-12 lg:px-9 lg:py-16">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="nb-label mb-5 inline-block">Partner with us</span>
              <h2 className="mb-4 max-w-[460px] text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[32px]">
                Tell us who you are.
              </h2>
              <p className="max-w-[430px] text-[16px] font-medium leading-[1.65] text-[#404040]">
                Your CSP program ID if you have one, and roughly what a first customer looks
                like. Only Direct Bill partners and Indirect Providers can be authorised to
                resell — indirect resellers should work through their provider.
              </p>
            </div>
            <ContactForm id="partnerships" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
