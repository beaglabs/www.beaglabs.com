'use client'

import * as React from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

type Lane = 'csp' | 'prime'

const CARD =
  'nb-card flex flex-col bg-white p-5 transition-all hover:shadow-[8px_8px_0px_0px_#ff5f1f] hover:-translate-x-[1px] hover:-translate-y-[1px] lg:p-6'

const DEPLOY_STEPS = [
  { n: '01', t: 'Prerequisites', d: 'An Azure subscription, an Entra tenant, and a model endpoint \u2014 Azure OpenAI or any OpenAI-compatible endpoint. Optional at deploy time.' },
  { n: '02', t: 'Deploy the template', d: 'A hardened Ubuntu appliance with a dedicated data disk, supervised by systemd. You pick size, region, and network posture.' },
  { n: '03', t: 'First-run onboarding', d: 'The appliance serves an onboarding flow, gated by a setup token it prints to its log.' },
  { n: '04', t: 'Bind identity + model', d: 'Entra is the only identity authority. Register the customer\u2019s model endpoint as a profile.' },
]

const LICENSE_STEPS = [
  { n: '01', t: 'Deploy', d: 'The customer or partner deploys the Azure Application into the customer\u2019s subscription.' },
  { n: '02', t: 'Read the deployment ID', d: 'Printed on first boot. The licence binds to it.' },
  { n: '03', t: 'Send it to us', d: 'The deployment ID is the only information we need.' },
  { n: '04', t: 'We mint', d: 'A signed, offline licence \u2014 90-day pilot or 365-day annual.' },
  { n: '05', t: 'Activate', d: 'Activated by a Papyrus System Owner, verified entirely offline.' },
]

const TEAMING_STEPS = [
  { n: '01', t: 'Teaming or sub', d: 'We join your program as a sub or teaming partner, under your flow-down.' },
  { n: '02', t: 'Discovery', d: 'We map the data, the workflows, and the unanswered questions with your domain experts.' },
  { n: '03', t: 'Build', d: 'Data extraction, an SLM, or agent UX \u2014 merged into your repo, model owned by you.' },
  { n: '04', t: 'Deliver', d: 'Deployed in your environment with an operational runbook. You own the result.' },
]

const CAPABILITIES = [
  ['Extract', 'Legacy Data Extraction \u2014 mainframes, COBOL, AS/400, and scans into validated records.'],
  ['Build', 'AI-Enabled Software Development \u2014 a production AI feature in 6\u201310 weeks.'],
  ['Design', 'Agent UX Consulting \u2014 the user-facing surface of your agent, prototype backed by your model.'],
  ['Assess', 'SLM Feasibility & Savings \u2014 a go/no-go with a 3-year cost projection.'],
  ['Deploy', 'SLM Deployments \u2014 on-prem, air-gapped, VPC, or edge. You own the weights.'],
]

const DIFFERENTIATORS = [
  ['It runs where the data is.', 'No call to a Beag control plane. Workloads, prompts, and outputs never leave the environment.'],
  ['Entra is the only identity authority.', 'No local role database, no password store, no invitation flow.'],
  ['The licence works offline.', 'A signed file, verified locally \u2014 no licence server, no activation call.'],
  ['Sandboxed, or it does not run.', 'Landlock and seccomp with network denied. If a host cannot isolate, execution is off.'],
  ['The agent proposes; policy releases.', 'Entra-authorized approvers release actions. Inline secrets are rejected.'],
]

const CSP_FAQ = [
  ['Why not a hosted agent platform?', 'Because the data cannot leave. A hosted platform requires egress, an approved third-party model provider, and a vendor control plane in the path. Papyrus is bought by organisations that cannot accept any of those.'],
  ['Is BYOL a hassle?', 'It is a file. We mint it against the deployment ID, you activate it, and it self-expires. There is no licence server to run and no per-user provisioning to reconcile.'],
  ['What about GPU cost?', 'Optional, and it lands in the customer\u2019s subscription \u2014 so it counts toward their Azure commitment and flows through you as partner consumption. Model hosting is not required.'],
  ['Can they draw committed Azure spend against the licence?', 'No. The software is invoiced by us, not Microsoft, so the licence fee cannot draw down Azure committed spend \u2014 infrastructure still counts. If a procurement gate needs the software itself transactable, tell us.'],
]

const PRIME_FAQ = [
  ['Can it run air-gapped?', 'Yes. Papyrus makes no vendor callback and its licence is verified offline, so it runs in disconnected and classified environments.'],
  ['Who owns the model and the data?', 'Your program does. We merge code into your repo, deploy the model on your infrastructure, and hand over the weights, the data, and the runbook.'],
  ['Does it need a vendor control plane?', 'No. There is no call home at any point. Entra (or your identity provider) is the only authority, and the execution sandbox denies outbound network.'],
  ['How do you handle sensitive programs?', 'We work inside your accredited environment under your controls. Facility and clearance specifics are scoped per program.'],
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

function SubBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b6b]">
        {label}
      </p>
      <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
    </div>
  )
}

export function PartnerProgram() {
  const [lane, setLane] = React.useState<Lane>('csp')
  const isCsp = lane === 'csp'
  const heading = isCsp ? 'Resell and deploy Papyrus for your customers.' : 'Deliver AI capability inside your programs.'
  const sub = isCsp
    ? 'The Cloud Solution Provider lane: you hold the billing relationship, we provide the software, the licence, and the runbook.'
    : 'The Prime lane: team with Beag Labs to bring data extraction, SLMs, and agent UX to your programs \u2014 on your infrastructure, with your data staying put.'

  const faq = isCsp ? CSP_FAQ : PRIME_FAQ

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[620px]">
          <span className="nb-label mb-4 inline-block">Choose a lane</span>
          <h2 className="text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] lg:text-[32px]">
            {heading}
          </h2>
          <p className="mt-3 max-w-[560px] text-[16px] font-medium leading-[1.65] text-[#404040]">
            {sub}
          </p>
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
            <div className={`${CARD} lg:col-span-2`}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">01</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">How the money works</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <SubBlock label="Infrastructure" body="Runs in the customer\u2019s Azure subscription. You hold the billing relationship, so consumption flows through you at normal CSP margin \u2014 recurring, and usually the larger number." />
                <SubBlock label="Software" body="BYOL, invoiced by us. Solution templates are not transactable, so there is no Microsoft-brokered software margin \u2014 stated plainly, not discovered mid-deal." />
                <SubBlock label="Partner margin" body="Set by agreement, quoted per partner. Email us and we will walk you through it." />
              </div>
            </div>

            <div className={CARD}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">02</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">Deploy</h3>
              <StepList items={DEPLOY_STEPS} />
            </div>

            <div className={CARD}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">03</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">License</h3>
              <StepList items={LICENSE_STEPS} />
            </div>

            <div className={CARD}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">04</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">Support</h3>
              <div className="space-y-4">
                <SubBlock label="Tier 1 \u2014 partner" body="Deployment, configuration, onboarding, and licence activation. First line for everything." />
                <SubBlock label="Tier 2 \u2014 Beag Labs" body="Defects, the sandbox, licence minting and replacement, and anything a partner cannot resolve from the docs." />
              </div>
            </div>

            <div className={`${CARD} lg:col-span-2`}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">05</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">Why Papyrus</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {DIFFERENTIATORS.map(([title, body]) => (
                  <li key={title} className="border-l-2 border-[#ff5f1f] pl-3">
                    <p className="text-[14px] font-bold text-[#111]">{title}</p>
                    <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className={`${CARD} lg:col-span-2`}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">01</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">Why team with Beag Labs</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <SubBlock label="You own it" body="Code merged into your repo, model weights on your infrastructure, runbook in your hands. No managed-service dependency, no per-inference fee." />
                <SubBlock label="No data egress" body="Nothing leaves the program\u2019s environment. Papyrus makes no vendor callback and the sandbox denies outbound network." />
                <SubBlock label="Clearance-aware" body="Built for regulated and air-gapped environments where commercial APIs can\u2019t reach. We operate under your controls." />
              </div>
            </div>

            <div className={`${CARD} lg:col-span-2`}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">02</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">What you can deliver</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {CAPABILITIES.map(([title, body]) => (
                  <li key={title} className="border-l-2 border-[#ff5f1f] pl-3">
                    <p className="text-[14px] font-bold text-[#111]">{title}</p>
                    <p className="text-[13px] leading-relaxed text-[#444]">{body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className={CARD}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">03</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">How we team</h3>
              <StepList items={TEAMING_STEPS} />
            </div>

            <div className={CARD}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">04</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">Papyrus on the program</h3>
              <div className="space-y-4">
                <SubBlock label="Customer-hosted" body="Runs in the program\u2019s own Azure, VPC, or air-gapped environment." />
                <SubBlock label="Entra-authorized" body="Your directory is the only identity authority. No local role store." />
                <SubBlock label="Sandboxed execution" body="Agent code runs under Landlock and seccomp with network denied, or it does not run." />
              </div>
            </div>

            <div className={CARD}>
              <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">05</span>
              <h3 className="mb-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#111]">Security posture</h3>
              <div className="space-y-4">
                <SubBlock label="Offline licence" body="A signed file, verified locally. No licence server, no activation call." />
                <SubBlock label="No call home" body="There is no Beag control plane in the path at any point." />
                <SubBlock label="Policy-released actions" body="The agent proposes; an approver releases. Inline secrets are rejected." />
              </div>
            </div>
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
