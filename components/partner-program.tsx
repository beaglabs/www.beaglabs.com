'use client'

import * as React from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

type Lane = 'csp' | 'prime'

const CARD =
  'nb-card flex flex-col bg-white p-5 transition-all hover:shadow-[8px_8px_0px_0px_#ff5f1f] hover:-translate-x-[1px] hover:-translate-y-[1px] lg:p-6'

const DEPLOY_STEPS = [
  { n: '01', t: 'Prerequisites', d: 'An Azure subscription, an Entra tenant, and a model endpoint — optional at deploy time.' },
  { n: '02', t: 'Deploy the Marketplace VM', d: 'The Papyrus Marketplace VM deploys into the customer’s Azure subscription.' },
  { n: '03', t: 'First-run onboarding', d: 'The appliance serves an onboarding flow gated by a setup token.' },
  { n: '04', t: 'Bind identity + model', d: 'Entra is the only identity authority. Register the model endpoint.' },
]

const LICENSE_STEPS = [
  { n: '01', t: 'Purchase', d: 'Purchase a Papyrus Marketplace VM plan, directly or through an authorized CSP partner.' },
  { n: '02', t: 'Validate locally', d: 'At startup, Papyrus reads the VM’s plan from Azure Instance Metadata Service and matches it to a supported Papyrus plan and deployment profile.' },
  { n: '03', t: 'Complete onboarding', d: 'A matching Marketplace entitlement enables the plan’s features. No deployment ID submission or separately minted license is needed for this path.' },
]

const TEAMING_STEPS = [
  { n: '01', t: 'Teaming or sub', d: 'We join your program as a sub or teaming partner.' },
  { n: '02', t: 'Discovery', d: 'We map the data, workflows, and unanswered questions.' },
  { n: '03', t: 'Build', d: 'Data extraction, an SLM, or agent UX — merged into your repo.' },
  { n: '04', t: 'Deliver', d: 'Deployed in your environment with a runbook. You own the result.' },
]

const CAPABILITIES = [
  ['Extract', 'Legacy Data Extraction — mainframes, COBOL, AS/400, and scans into validated records.'],
  ['Build', 'AI-Enabled Software Development — a production AI feature in 6–10 weeks.'],
  ['Design', 'Agent UX Consulting — the user-facing surface of your agent.'],
  ['Assess', 'SLM Feasibility & Savings — a go/no-go with a 3-year cost projection.'],
  ['Deploy', 'SLM Deployments — on-prem, air-gapped, VPC, or edge. You own the weights.'],
]

const DIFFERENTIATORS = [
  ['It runs where the data is.', 'No call to a Beag control plane. Nothing leaves the environment.'],
  ['Entra is the only identity authority.', 'No local role database, no password store, no invitation flow.'],
  ['Entitlement is validated locally.', 'Marketplace VM plans are checked through Azure instance metadata, with no Beag Labs activation call.'],
  ['Sandboxed, or it does not run.', 'Landlock and seccomp with network denied.'],
  ['The agent proposes; policy releases.', 'Entra-authorized approvers release actions. Inline secrets are rejected.'],
]

const CSP_FAQ = [
  ['Why not a hosted agent platform?', 'Because the data cannot leave. A hosted platform requires egress, an approved third-party model provider, and a vendor control plane in the path.'],
  ['How does Marketplace activation work?', 'Papyrus validates the VM’s Marketplace plan locally using Azure instance metadata. A supported plan and deployment profile activate the included features without sending a deployment ID to Beag Labs. Separately agreed signed licenses remain available for deployments outside this Marketplace path.'],
  ['What about infrastructure and model costs?', 'VM, storage, optional GPU capacity, and model consumption are separate from the software purchase. Billing follows the customer’s Azure subscription and model-provider arrangements; CSP infrastructure margin depends on that billing relationship.'],
  ['Can partners arrange private-offer economics?', 'Yes. Partner margin is set by agreement. Beag Labs can establish CSP or private-offer economics for qualified partners, with pricing and purchasing terms confirmed for each deal.'],
]

const PRIME_FAQ = [
  ['Can it run air-gapped?', 'Yes. Papyrus makes no vendor callback and its licence is verified offline, so it runs in disconnected and classified environments.'],
  ['Who owns the model and the data?', 'Your program does. We merge code into your repo, deploy on your infrastructure, and hand over the weights, data, and runbook.'],
  ['Does it need a vendor control plane?', 'No. There is no call home at any point. Entra (or your identity provider) is the only authority.'],
  ['How do you handle sensitive programs?', 'We work inside your accredited environment under your controls. Facility and clearance specifics are scoped per program.'],
]

function Card({ num, title, children, className }: { num: string; title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn(CARD, className)}>
      <span className="mb-4 block font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
        {num}
      </span>
      <h3 className="mb-3 text-[16px] font-extrabold tracking-[-0.02em] text-[#111]">{title}</h3>
      {children}
    </div>
  )
}

function StepList({ items }: { items: Array<{ n: string; t: string; d: string }> }) {
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.n} className="flex gap-3">
          <span className="w-6 shrink-0 pt-0.5 font-mono text-[11px] font-bold text-[#ff5f1f]">{item.n}</span>
          <div>
            <p className="text-[13px] font-bold text-[#111]">{item.t}</p>
            <p className="text-[13px] leading-relaxed text-[#444]">{item.d}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function SubBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">{label}</p>
      <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
    </div>
  )
}

export function PartnerProgram() {
  const [lane, setLane] = React.useState<Lane>('csp')
  const isCsp = lane === 'csp'
  const heading = isCsp ? 'Resell and deploy Papyrus for your customers.' : 'Deliver AI capability inside your programs.'
  const sub = isCsp
    ? 'The Cloud Solution Provider lane: resell Papyrus through Microsoft Marketplace and build your implementation and managed services around it.'
    : 'The Prime lane: team with Beag Labs to bring data extraction, SLMs, and agent UX to your programs — on your infrastructure, with your data staying put.'
  const faq = isCsp ? CSP_FAQ : PRIME_FAQ

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[620px]">
          <span className="nb-label mb-4 inline-block">Choose a lane</span>
          <h2 className="text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[32px]">
            {heading}
          </h2>
          <p className="mt-3 max-w-[560px] text-[16px] font-medium leading-[1.65] text-[#404040]">{sub}</p>
        </div>

        <div
          role="group"
          aria-label="Partner type"
          className="inline-flex w-fit items-stretch border-[3px] border-[#111] bg-white shadow-[4px_4px_0px_0px_#111]"
        >
          {(['csp', 'prime'] as Lane[]).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lane === l}
              onClick={() => setLane(l)}
              className={cn(
                'px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] transition-colors',
                lane === l ? 'bg-[#ff5f1f] text-[#111]' : 'bg-white text-[#111] hover:bg-[#f0eee9]',
              )}
            >
              {l === 'csp' ? 'CSP' : 'Prime'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isCsp ? (
          <>
            <Card num="01" title="Infrastructure">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Runs in the customer’s Azure subscription. Infrastructure and model consumption are billed under the customer’s subscription and provider arrangements. Whether Azure consumption flows through you depends on their CSP billing relationship.
              </p>
            </Card>
            <Card num="02" title="Software">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Papyrus is available as a transactable Azure Marketplace VM offer. Authorized CSP partners can resell the software alongside Azure infrastructure, model consumption, implementation, and managed services.
              </p>
            </Card>
            <Card num="03" title="Partner margin">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Set by agreement, quoted per partner. Beag Labs can establish CSP or private-offer economics for qualified partners. Contact us to confirm pricing and terms for your deal.
              </p>
            </Card>
            <Card num="04" title="Deploy">
              <StepList items={DEPLOY_STEPS} />
            </Card>
            <Card num="05" title="License">
              <StepList items={LICENSE_STEPS} />
            </Card>
            <Card num="06" title="Support">
              <div className="space-y-4">
                <SubBlock label="Tier 1 — partner" body="Deployment, configuration, onboarding, and Marketplace entitlement troubleshooting. First line for everything." />
                <SubBlock label="Tier 2 — Beag Labs" body="Defects, the sandbox, entitlement issues, and anything a partner cannot resolve from the docs. Signed-license issuance and replacement for separately agreed deployments." />
              </div>
            </Card>
            <Card num="07" title="Available through Microsoft Marketplace / CSP" className="md:col-span-2 lg:col-span-3">
              <div className="space-y-4">
                <SubBlock label="Offer: Papyrus" body="A transactable Azure Marketplace VM offer deployed into the customer’s Azure subscription." />
                <SubBlock label="Purchasing motion" body="Customers purchase a Papyrus VM plan through Microsoft Marketplace, directly or through an authorized CSP partner. Qualified partners can work with Beag Labs to establish CSP or private-offer terms before purchase. Infrastructure, model consumption, implementation, and managed services are scoped alongside the software." />
              </div>
            </Card>
            <Card num="08" title="Why Papyrus" className="lg:col-span-3">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DIFFERENTIATORS.map(([title, body]) => (
                  <li key={title} className="border-l-2 border-[#ff5f1f] pl-3">
                    <p className="text-[13px] font-bold text-[#111]">{title}</p>
                    <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ) : (
          <>
            <Card num="01" title="You own it">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Code merged into your repo, model weights on your infrastructure, runbook in your hands. No managed-service dependency, no per-inference fee.
              </p>
            </Card>
            <Card num="02" title="No data egress">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Nothing leaves the program’s environment. Papyrus makes no vendor callback and the sandbox denies outbound network.
              </p>
            </Card>
            <Card num="03" title="Clearance-aware">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Built for regulated and air-gapped environments where commercial APIs can’t reach. We operate under your controls.
              </p>
            </Card>
            <Card num="04" title="How we team">
              <StepList items={TEAMING_STEPS} />
            </Card>
            <Card num="05" title="Papyrus on the program">
              <div className="space-y-4">
                <SubBlock label="Customer-hosted" body="Runs in the program’s own Azure, VPC, or air-gapped environment." />
                <SubBlock label="Entra-authorized" body="Your directory is the only identity authority. No local role store." />
                <SubBlock label="Sandboxed execution" body="Agent code runs under Landlock and seccomp with network denied." />
              </div>
            </Card>
            <Card num="06" title="Security posture">
              <div className="space-y-4">
                <SubBlock label="Offline licence" body="A signed file, verified locally. No licence server, no activation call." />
                <SubBlock label="No call home" body="There is no Beag control plane in the path at any point." />
                <SubBlock label="Policy-released" body="The agent proposes; an approver releases. Inline secrets are rejected." />
              </div>
            </Card>
            <Card num="07" title="What you can deliver" className="lg:col-span-3">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CAPABILITIES.map(([title, body]) => (
                  <li key={title} className="border-l-2 border-[#ff5f1f] pl-3">
                    <p className="text-[13px] font-bold text-[#111]">{title}</p>
                    <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <span className="nb-label mb-5 inline-block">FAQ</span>
          <h3 className="max-w-[420px] text-[22px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111]">
            The questions you will hear.
          </h3>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faq.map(([question, answer], index) => (
            <AccordionItem key={question} value={`faq-${lane}-${index}`}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
