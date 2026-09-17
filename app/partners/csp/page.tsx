import type { Metadata } from 'next'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

/**
 * Public CSP partner page.
 *
 * This is the URL handed to Partner Center for the CSP channel, and the page we point
 * partners at. It is deliberately public: the program only requires marketing materials
 * plus channel contact information, and gating it would have meant managing a partner
 * account for every reseller before they can read anything.
 *
 * The consequence is that nothing confidential belongs on this page. Commercial terms
 * are "on request" rather than listed, because a partner price list published here is
 * readable by anyone with the link, including the customer's procurement team.
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

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-xl font-bold tracking-[-0.02em] text-[#111] mb-4">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-[#333]">{children}</div>
    </section>
  )
}

function Steps({ items }: { items: Array<{ title: string; body: React.ReactNode }> }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-4">
          <span className="font-mono text-[11px] text-[#ff5f1f] pt-1 w-5 shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <p className="font-semibold text-[#111]">{item.title}</p>
            <p className="text-[#333]">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function EmailCta() {
  return (
    <a
      href={CONTACT_HREF}
      className="inline-block bg-[#111] text-white px-6 py-3 text-[15px] font-semibold"
    >
      Email us about partnering
    </a>
  )
}

export default function CspPartnersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F4F0]">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f] mb-3">
            Cloud Solution Provider program
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#111] mb-4">
            Partner with Beag Labs
          </h1>
          <p className="text-[15px] leading-relaxed text-[#555] max-w-3xl mb-8">
            Papyrus is a customer-hosted durable agent runtime. We work with a small number of
            Cloud Solution Providers who deploy it for their customers. This page covers how the
            commercial model works, how deployment and licensing run, and who does what when
            something goes wrong.
          </p>
          <EmailCta />

          <div className="mt-16 max-w-3xl">
            <Section id="commercial" title="1. How the commercial model works">
              <p>Papyrus is bought two ways, and it matters which one applies to a given deal.</p>
              <p>
                <strong className="text-[#111]">Infrastructure.</strong> The appliance runs in the
                customer&apos;s Azure subscription. As the partner you hold the billing
                relationship, so the Azure consumption that deployment generates — the appliance
                VM, its managed disk, and any GPU VMs behind it — flows through you at your normal
                CSP margin. That is recurring for as long as the customer runs it, and on a
                deployment with GPU capacity it is usually the larger number.
              </p>
              <p>
                <strong className="text-[#111]">Software.</strong> Papyrus is licensed BYOL and
                invoiced by us directly. Our Marketplace listing is a solution template, and
                solution templates are not transactable, so there is no Microsoft-brokered
                software margin on this offer. We would rather state that plainly than have you
                discover it mid-deal.
              </p>
              <p>
                <strong className="text-[#111]">Partner pricing and margin</strong> are set by
                agreement and quoted per partner —{' '}
                <a href={CONTACT_HREF} className="underline text-[#111]">
                  email us
                </a>{' '}
                and we will walk you through it.
              </p>
              <p>
                One procurement consequence worth knowing early: because the software is invoiced
                by us rather than by Microsoft, a customer cannot draw committed Azure spend down
                against the licence fee. Their infrastructure still counts toward that commitment.
                If a customer&apos;s procurement gate requires the software itself to be
                transactable, tell us — it is a known constraint with known answers, and better
                found in the first call than at signature.
              </p>
            </Section>

            <Section id="deployment" title="2. Deploying for a customer">
              <p>
                Deployment is a single Azure Application, offered as a solution template. You run
                it against the customer&apos;s subscription using your delegated administrator
                access. No Beag Labs involvement is required, and no data leaves their tenant.
              </p>
              <Steps
                items={[
                  {
                    title: 'Confirm the prerequisites',
                    body: (
                      <>
                        An Azure subscription, a Microsoft Entra tenant, and a model endpoint —
                        Azure OpenAI in the customer&apos;s own tenant, any OpenAI-compatible
                        endpoint, or a self-hosted one. No endpoint is needed at deploy time; it is
                        configured during onboarding.
                      </>
                    ),
                  },
                  {
                    title: 'Deploy the template',
                    body: (
                      <>
                        Provisions a hardened Ubuntu appliance with a dedicated data disk for
                        durable state, supervised by systemd. You choose the VM size, the region,
                        whether the onboarding port is reachable outside the virtual network, and
                        the allowed source address range.
                      </>
                    ),
                  },
                  {
                    title: 'Complete first-run onboarding',
                    body: (
                      <>
                        On first boot the appliance serves an onboarding flow rather than the full
                        product. It prints a setup token to its log, which gates the flow.
                      </>
                    ),
                  },
                  {
                    title: 'Bind identity and the model endpoint',
                    body: (
                      <>
                        Entra is the only identity authority — there is no local role database and
                        no invitation flow to reconcile. Register the customer&apos;s model
                        endpoint as a model profile.
                      </>
                    ),
                  },
                ]}
              />
              <p>
                Worth raising with the customer early: whether the onboarding port should be
                reachable from outside their virtual network. Exposing it is the simplest path;
                leaving it internal and reaching it over a private network is the better posture
                for a restricted environment.
              </p>
            </Section>

            <Section id="licensing" title="3. Licensing — walk the customer through this">
              <p>
                The licence is a file, not a service. There is no licence server and no call home
                at any point, which is the point: it works in environments with no outbound
                access.
              </p>
              <Steps
                items={[
                  {
                    title: 'Deploy the appliance',
                    body: (
                      <>
                        The customer or partner deploys the Azure Application into the
                        customer&apos;s subscription.
                      </>
                    ),
                  },
                  {
                    title: 'Read the deployment ID',
                    body: (
                      <>
                        On first boot the appliance prints a <strong>deployment ID</strong> and a{' '}
                        <strong>setup token</strong> to its log. The licence binds to that
                        deployment ID, so it must come from that specific deployment.
                      </>
                    ),
                  },
                  {
                    title: 'Send the deployment ID to Beag Labs',
                    body: <>That is the only information we need to mint a licence.</>,
                  },
                  {
                    title: 'We mint a signed licence',
                    body: (
                      <>
                        Issued against that deployment ID, naming the deployment profile and the
                        feature set it unlocks. Pilot terms are 90 days; annual terms are 365. It
                        is signed with our offline authority key.
                      </>
                    ),
                  },
                  {
                    title: 'Activate it on the appliance',
                    body: (
                      <>
                        The signed licence is activated on the appliance by a principal holding the
                        Papyrus System Owner Entra role. The appliance verifies the signature, the
                        deployment match, the profile, and the expiry entirely offline, then stores
                        it.
                      </>
                    ),
                  },
                ]}
              />
              <p>
                <strong className="text-[#111]">Plan the renewal before the term ends.</strong>{' '}
                Licences self-expire, and expiry is silent from our side because nothing phones
                home. A lapsed licence stops unlocking its features until a new one is minted and
                activated, so put a reminder on both sides at least 30 days out.
              </p>
            </Section>

            <Section id="support" title="4. Support model">
              <p>
                Under the CSP program terms the publisher is responsible for break-fix support to
                end customers. In practice the partner is the customer&apos;s first and only
                contact, and we support the partner behind them.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-[#E2E0DB] bg-white p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6B6B6B] mb-2">
                    Tier 1 — partner
                  </p>
                  <p className="text-[14px]">
                    Deployment, configuration, onboarding walkthroughs, licence activation, and
                    questions about the product&apos;s behaviour. First line for everything.
                  </p>
                </div>
                <div className="border border-[#E2E0DB] bg-white p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6B6B6B] mb-2">
                    Tier 2 — Beag Labs
                  </p>
                  <p className="text-[14px]">
                    Product defects, the execution sandbox, licence minting and replacement, and
                    anything a partner cannot resolve from the documentation.
                  </p>
                </div>
              </div>
            </Section>

            <Section id="positioning" title="5. Why Papyrus, and the objections you will hear">
              <p>What actually differentiates it in a competitive deal:</p>
              <ul className="space-y-3">
                {[
                  [
                    'It runs where the data is.',
                    "The appliance lives in the customer's subscription and makes no call to a Beag control plane. Nothing about their workloads, prompts, or outputs leaves their environment.",
                  ],
                  [
                    'Entra is the only identity authority.',
                    'No local role database, no password store, no invitation flow, no provisioning side-channel to reconcile with their directory.',
                  ],
                  [
                    'The licence works offline.',
                    'A signed file, verified locally. No licence server, no activation call, so it survives an environment with no outbound access.',
                  ],
                  [
                    'Agent code is sandboxed, or it does not run.',
                    'Under Landlock and seccomp with outbound network denied. On a host that cannot isolate, execution is switched off and the daemon says why rather than silently running unprotected.',
                  ],
                  [
                    'The agent proposes; policy releases.',
                    'Deterministic workflow policy plus an Entra-authorized approver release actions. Connectors take vault, certificate, or managed-identity references — inline secrets are rejected, not stored.',
                  ],
                ].map(([title, body]) => (
                  <li key={title} className="border-l-2 border-[#E2E0DB] pl-4">
                    <p className="font-semibold text-[#111]">{title}</p>
                    <p>{body}</p>
                  </li>
                ))}
              </ul>

              <h3 className="text-[15px] font-bold text-[#111] pt-4">Objections you will hear</h3>
              <dl className="space-y-4">
                {[
                  [
                    'Why not a hosted agent platform?',
                    'Because the data cannot leave. A hosted platform requires egress, an approved third-party model provider, and a vendor control plane in the path. Papyrus is bought by organisations that cannot accept any of those.',
                  ],
                  [
                    'Is BYOL a hassle?',
                    'It is a file. We mint it against the deployment ID, you activate it, and it self-expires. There is no licence server to run and no per-user provisioning to reconcile — usually easier than the alternative, not harder.',
                  ],
                  [
                    'Does it need internet access?',
                    "Not to us. Papyrus makes no vendor callback. The customer's chosen model endpoint must be reachable from the appliance, and in a restricted environment that endpoint is their own.",
                  ],
                  [
                    'Which models can it use?',
                    "Any OpenAI-compatible or Azure OpenAI endpoint, including one in the customer's own tenant. Restricted and disconnected profiles refuse to fall back to a commercial provider endpoint, so a closed environment stays closed.",
                  ],
                  [
                    'What about GPU cost?',
                    "Optional, and it lands in the customer's subscription — which means it counts toward their Azure commitment and flows through you as partner consumption. Model hosting is not required: most customers point at an endpoint they already have.",
                  ],
                ].map(([question, answer]) => (
                  <div key={question}>
                    <dt className="font-semibold text-[#111]">{question}</dt>
                    <dd className="text-[#333]">{answer}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section id="contact" title="6. Talk to us">
              <p>
                Email{' '}
                <a href={CONTACT_HREF} className="underline text-[#111]">
                  {CONTACT_EMAIL}
                </a>{' '}
                and tell us: who you are, your CSP program ID if you have one, and roughly what a
                first customer looks like. Only Direct Bill partners and Indirect Providers can be
                authorised to resell — indirect resellers should work through their provider, who
                can pass access and margin on.
              </p>
              <p>We will come back with partner pricing, the deployment runbook, and deal registration.</p>
              <EmailCta />
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
