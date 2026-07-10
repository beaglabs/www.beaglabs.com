import type { Metadata } from "next"
import Link from "next/link"

import { DomainModelDiagram } from "@/components/domain-model-diagram"
import { IntegrationPipelineDiagram } from "@/components/integration-pipeline-diagram"
import { SiteFooter } from "@/components/site-footer"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Design Partnerships",
  description:
    "The Domain Intelligence Pilot: a 12-week engagement that builds a custom AI model for your organization. Natural-language querying and analysis across your data systems — deployed in your environment.",
  path: "/design-partnerships",
  label: "Pilot Program",
  ogDescription:
    "12-week Domain Intelligence Pilot: discovery, data integration, domain modeling, and deployment in your secure environment. Turn your proprietary data into an AI that answers questions, not just queries.",
})

const deliverables = [
  {
    id: "01",
    title: "Discovery workshops",
    description:
      "Deep-dive sessions with your domain experts and stakeholders to map the landscape of your data, workflows, and unanswered questions.",
  },
  {
    id: "02",
    title: "Data integration",
    description:
      "Connect and normalize data across your systems — databases, files, APIs, and third-party sources — into a unified representation surface.",
  },
  {
    id: "03",
    title: "Initial domain model",
    description:
      "A structured schema encoding your key entities, relationships, constraints, and domain logic so the system understands what your data means.",
  },
  {
    id: "04",
    title: "Natural-language querying",
    description:
      "Ask analytical questions in plain language and receive accurate, context-aware answers with traceable provenance back to source systems.",
  },
  {
    id: "05",
    title: "Secure deployment",
    description:
      "The pilot runs in your secure environment — private cloud, on-premises, or air-gapped — with access controls, audit logging, and encryption.",
  },
  {
    id: "06",
    title: "Long-term recommendations",
    description:
      "A detailed report covering what worked, what patterns emerged, what data gaps remain, and a concrete roadmap for continued operation.",
  },
]

const phases = [
  {
    id: "01",
    title: "Learning your organization",
    description:
      "We embed with your team to understand the data landscape, key workflows, stakeholder questions, and the domain semantics that matter most.",
  },
  {
    id: "02",
    title: "Planning a data and state model",
    description:
      "We design the domain schema that will unify your data sources — defining entities, relationships, constraints, and transformation rules.",
  },
  {
    id: "03",
    title: "Integrating and constructing the domain model",
    description:
      "Data flows are built across your systems, normalized into the domain schema, and validated against real queries during integration.",
  },
  {
    id: "04",
    title: "Deploying and querying in a secure environment",
    description:
      "The full system is deployed into your secure environment. Your team begins asking natural-language questions against real analytical needs.",
  },
  {
    id: "05",
    title: "Handoff and long-term recommendations",
    description:
      "We deliver the domain model, query interface, integration pipelines, and a comprehensive report with a phased roadmap for continued operation.",
  },
]

const heroChips = [
  "Cross-system integration",
  "Natural-language querying",
  "Secure deployment",
]

export default function DesignPartnershipsPage() {
  return (
    <main className="bg-[#f6f4ef] text-[#111]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(0,0,0,0.08)] bg-[rgba(248,247,243,0.84)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-9">
          <Link href="/" className="text-[20px] font-bold tracking-[-0.04em] text-[#111]">
            B_
          </Link>
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/models"
              className="text-[11px] uppercase tracking-[0.1em] text-[#595959] transition-colors duration-200 hover:text-[#111]"
            >
              Models
            </Link>
            <a
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#111] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-[#2a2a2a]"
            >
              Talk to us
            </a>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-[rgba(0,0,0,0.06)] bg-[#f6f4ef] pt-16">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#faf9f6_0%,#f5f3ee_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.03)_1px,transparent_1px)] bg-[size:96px_96px] opacity-[0.18]" />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-24 lg:px-9 lg:py-14">
          <div className="max-w-[760px] pt-10 lg:pt-0">
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[#C7661D]">
              Design partnership
            </div>

            <h1 className="mb-5 max-w-[820px] text-[48px] font-bold leading-[0.94] tracking-[-0.065em] text-[#111] sm:text-[60px] lg:text-[74px]">
              Domain Intelligence Pilot
            </h1>

            <p className="mb-8 max-w-[650px] text-[18px] leading-[1.72] text-[#404040] lg:text-[19px]">
              A 12-week engagement that maps your data landscape, builds an
              initial domain model, and enables natural-language querying —
              deployed in your secure environment with a clear path to long-term
              operation.
            </p>

            <div className="mb-10 flex flex-wrap items-center gap-4">
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#111] px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-[#2a2a2a]"
              >
                Apply as design partner
              </a>
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(17,17,17,0.14)] bg-[rgba(255,255,255,0.5)] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#111] transition-colors duration-200 hover:bg-white"
              >
                Schedule a conversation
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.74)] px-4 py-2 text-[12px] text-[#111] backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            What&apos;s included
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((item) => (
              <div
                key={item.id}
                className="border-t border-[rgba(0,0,0,0.12)] pt-3"
              >
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#7c7c7c]">
                  {`Deliverable ${item.id}`}
                </div>
                <div className="mt-2 text-[18px] leading-[1.2] text-[#111]">
                  {item.title}
                </div>
                <p className="mt-2 text-[14px] leading-[1.75] text-[#555]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
              Timeline
            </div>
            <h2 className="mb-4 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
              Five phases across 12 weeks.
            </h2>
            <p className="max-w-[430px] text-[17px] leading-[1.72] text-[#4e4e4e]">
              Each phase produces concrete artifacts that feed into the next,
              so every week moves the system closer to production readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.72)] p-8 backdrop-blur-sm"
              >
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                  Phase {phase.id}
                </div>
                <h3 className="mb-3 text-[22px] leading-[1.08] text-[#111]">
                  {phase.title}
                </h3>
                <p className="text-[14px] leading-[1.75] text-[#555]">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
                Phase 02 in detail
              </div>
              <h2 className="mb-6 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
                Planning a data and state model.
              </h2>

              <div className="space-y-5">
                {[
                  {
                    step: "1",
                    label: "Identify entities",
                    desc: "Map the core objects in your domain — assets, events, people, locations — and their key attributes.",
                  },
                  {
                    step: "2",
                    label: "Define relationships",
                    desc: "Wire the connections between entities: ownership, containment, sequence, dependency, and hierarchy.",
                  },
                  {
                    step: "3",
                    label: "Encode constraints",
                    desc: "Capture the business rules and physical constraints that govern how entities relate and change over time.",
                  },
                  {
                    step: "4",
                    label: "Specify transformations",
                    desc: "Define how data moves from raw source formats into the unified domain representation.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[rgba(17,17,17,0.15)] bg-[rgba(255,255,255,0.5)] text-[11px] font-bold text-[#C7661D] backdrop-blur-sm">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold leading-[1.3] text-[#111]">
                        {item.label}
                      </div>
                      <p className="mt-1 text-[14px] leading-[1.75] text-[#555]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.82)] p-8 backdrop-blur-sm">
                <DomainModelDiagram />

                <div className="mt-6 border-t border-[rgba(17,17,17,0.08)] pt-5">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                    Constraints
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center rounded-full border border-[rgba(199,102,29,0.2)] bg-[rgba(199,102,29,0.06)] px-3 py-1.5 font-mono text-[11px] text-[#C7661D]">
                      asset.region ∈ location.code
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[rgba(199,102,29,0.2)] bg-[rgba(199,102,29,0.06)] px-3 py-1.5 font-mono text-[11px] text-[#C7661D]">
                      event.ts ≥ asset.created
                    </span>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
                Phase 03 in detail
              </div>
              <h2 className="mb-6 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
                Integrating and constructing the domain model.
              </h2>

              <div className="space-y-5">
                {[
                  {
                    step: "1",
                    label: "Connect source systems",
                    desc: "Build data pipelines from your databases, APIs, files, and message queues into the integration layer.",
                  },
                  {
                    step: "2",
                    label: "Normalize into the schema",
                    desc: "Transform raw data into the unified domain model — mapping columns to entities, values to attributes, and joins to relationships.",
                  },
                  {
                    step: "3",
                    label: "Validate edge cases",
                    desc: "Run real queries against the integrated model to surface mismatches, nulls, duplicates, and domain assumptions that need resolution.",
                  },
                  {
                    step: "4",
                    label: "Iterate and refine",
                    desc: "Tighten the schema and transforms based on validation results until the model answers your organization's questions accurately.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[rgba(17,17,17,0.15)] bg-[rgba(255,255,255,0.5)] text-[11px] font-bold text-[#C7661D] backdrop-blur-sm">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold leading-[1.3] text-[#111]">
                        {item.label}
                      </div>
                      <p className="mt-1 text-[14px] leading-[1.75] text-[#555]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.82)] p-8 backdrop-blur-sm">
              <IntegrationPipelineDiagram />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Pricing
          </div>
          <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
                Design partner pricing with a clear path to standard rates.
              </h2>
              <p className="max-w-[430px] text-[17px] leading-[1.72] text-[#4e4e4e]">
                We are launching with a small cohort of design partners who
                help shape the product while receiving deep technical investment
                at a reduced rate. After the design partner phase, standard
                pricing applies.
              </p>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-[#111] text-white px-8 py-10 lg:px-10 lg:py-12">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
                Design partners
              </div>
              <div className="mb-2 text-[52px] font-bold leading-[0.94] tracking-[-0.055em] text-white">
                50% off standard rate
              </div>
              <p className="mb-8 text-[17px] leading-[1.72] text-[#C9C9C9]">
                Limited availability for organizations that join during the
                pilot phase. Full 12-week engagement plus direct influence on
                the product roadmap.
              </p>
              <ul className="mb-8 space-y-3 text-[14px] leading-[1.75] text-[#C9C9C9]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#FFB074]">&#10003;</span>
                  <span>12-week full engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#FFB074]">&#10003;</span>
                  <span>Cross-system data integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#FFB074]">&#10003;</span>
                  <span>Natural-language querying interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#FFB074]">&#10003;</span>
                  <span>Deployment in your secure environment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#FFB074]">&#10003;</span>
                  <span>Direct input on product direction</span>
                </li>
              </ul>
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#FF7A1A] px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#111] transition-colors duration-200 hover:bg-[#ff8b39]"
              >
                Apply as design partner
              </a>
            </div>

            <div className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.72)] px-8 py-10 backdrop-blur-sm lg:px-10 lg:py-12">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
                Standard — future price
              </div>
              <div className="mb-2 text-[52px] font-bold leading-[0.94] tracking-[-0.055em] text-[#111]">
                Contact us for pricing
              </div>
              <p className="mb-8 text-[17px] leading-[1.72] text-[#4e4e4e]">
                The standard price that will apply after the design partner
                cohort. Same comprehensive engagement, with the benefit of a
                more mature product and process.
              </p>
              <ul className="mb-8 space-y-3 text-[14px] leading-[1.75] text-[#555]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C7661D]">&#10003;</span>
                  <span>12-week full engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C7661D]">&#10003;</span>
                  <span>Cross-system data integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C7661D]">&#10003;</span>
                  <span>Natural-language querying interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C7661D]">&#10003;</span>
                  <span>Deployment in your secure environment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C7661D]">&#10003;</span>
                  <span>Mature product and refined process</span>
                </li>
              </ul>
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(17,17,17,0.14)] bg-[rgba(255,255,255,0.5)] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#111] transition-colors duration-200 hover:bg-white"
              >
                Schedule a conversation
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#111] text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-9 lg:py-28">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
              Start a conversation
            </div>
            <h2 className="mb-4 max-w-[720px] text-[42px] font-bold leading-[0.98] tracking-[-0.055em] text-white lg:text-[54px]">
              Bring your domain. We&apos;ll bring the intelligence layer.
            </h2>
            <p className="max-w-[560px] text-[18px] leading-[1.72] text-[#C9C9C9]">
              Apply as a design partner to get the full 12-week Domain
              Intelligence Pilot at the reduced rate. Spots are limited while we
              build the product alongside early partners.
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-start gap-4 lg:justify-end">
            <a
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#FF7A1A] px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#111] transition-colors duration-200 hover:bg-[#ff8b39]"
            >
              Apply as design partner
            </a>
            <Link
              href="/research"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.16)] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-[rgba(255,255,255,0.06)]"
            >
              See research
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}