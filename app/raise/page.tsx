import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import RevenueChart from "./revenue-chart-wrapper"

import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Invest",
  description:
    "Small models, deployed anywhere. Beag Labs builds domain-specific AI for internal enterprise workflows — CRM, compliance, IAM, tool calling — that runs on your infrastructure at a fraction of the cost.",
  path: "/raise",
  label: "Invest",
  ogDescription:
    "Small models, deployed anywhere. Beag Labs builds domain-specific AI for internal enterprise workflows — CRM, compliance, IAM, tool calling — no cloud lock-in.",
})

const problemCards = [
  {
    step: "01",
    title: "Internal workflows are stuck on general-purpose APIs",
    body: "Companies pay per-token rates for 1.8-trillion-parameter models to run CRM updates, compliance checks, IAM provisioning, and workflow automation. These internal tasks need a focused model that costs 13x less and runs 40x faster — but no one sells one.",
  },
  {
    step: "02",
    title: "Regulated industries can't use the cloud",
    body: "Legal, healthcare, defense, and financial services cannot send sensitive data to third-party inference APIs. Every compliance officer's first question is 'where does this data go?' — and every vendor's answer is unacceptable.",
  },
  {
    step: "03",
    title: "Custom models are too expensive to build",
    body: "Fine-tuning requires ML engineers, labeling budgets, and GPU infrastructure that most teams don't have. The result: enterprises either overpay for general APIs or give up on AI entirely.",
  },
]

const approachSteps = [
  {
    id: "01",
    title: "Open weights, fine-tuned for any workflow",
    description:
      "We start with frontier open-weight models (Google Gemma E4B) and fine-tune them for the customer's internal workflows. The resulting model is deployed on their infrastructure — on-prem, VPC, or edge device. The customer owns the model weights under a standard commercial license.",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "GRPO + OPD = Small Models that run with the big dogs",
    description:
      "Our training recipe uses GRPO and On-policy Distillation to produce small models that can outperform foundation models on internal workflows. We measure performance on held-out test sets and compare against GPT-4 and Claude. The result: 13x lower inference cost, 40x lower latency, and better accuracy on the customer's internal tasks.",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "Customer data never touches our servers after training",
    description:
      "We train on your data, in your cloud account or air-gapped environment if needed. The resulting model deploys on your infrastructure — on-prem, VPC, or edge device. We never see your inference data. You own the model weights under a standard commercial license.",
    bg: "#E6FFF2",
  },
  {
    id: "04",
    title: "Each deployment compounds into the next",
    description:
      "Every engagement teaches us which schemas, evaluation patterns, and data transforms generalize. Our platform gets more productive with each customer instead of starting from zero. The models stay with the customer; the platform knowledge stays with us.",
    bg: "#FFF9E6",
  },
]

const tractionCards = [
  {
    label: "Revenue",
    value: "Pre-revenue",
    body: "Founder-led delivery engagements in progress. First paid contracts expected Q3 2026.",
  },
  {
    label: "Design partners",
    value: "3 active",
    body: "Working with legal-tech and healthcare organizations on production workflow automation pipelines. Each is a paid pilot with a path to multi-year contract.",
  },
  {
    label: "Model performance",
    value: "92-96% F1",
    body: "Domain-specific workflow models consistently outperform GPT-4 and Claude on held-out test sets at 13x lower inference cost.",
  },
  {
    label: "Target contract",
    value: "$150-250k ACV",
    body: "2-3 year engagements for workflow-level outcomes, not model-as-a-service token meters. Customers buy a result, not an API key.",
  },
]

const roadmapPhases = [
  {
    phase: "Phase 1",
    status: "Now",
    title: "Land and deliver — prove the model",
    body: "Win 4-6 high-trust design partners through founder-led sales. Each engagement builds tooling, evaluation infrastructure, and a reference customer. Revenue funds the roadmap. Target: $600k ARR exiting year one.",
  },
  {
    phase: "Phase 2",
    status: "Next",
    title: "Productize the pipeline",
    body: "Turn repeated delivery patterns into self-serve tooling: data connectors, the uncertainty-driven labeling interface, one-click deployment to customer infrastructure. Each workflow deployment gets faster and cheaper to fulfill.",
  },
  {
    phase: "Phase 3",
    status: "Scale",
    title: "Expand vertically",
    body: "Each vertical (legal, healthcare, finance, defense) has a compounding data and schema advantage. Models, evaluation datasets, and workflow templates transfer across customers within a vertical. Enter new verticals through strategic design partners.",
  },
]

const moatPoints = [
  "The uncertainty engine gets smarter with every deployment. The distribution of frontier-model confidence across enterprise workflows is proprietary data that improves our pipeline efficiency permanently.",
  "Customer-owned deployment creates structural switching costs. Your legal team reviewed the outputs, your IT deployed the model, and your compliance team approved the air-gap. Replacing the model means redoing all three.",
  "Vertical knowledge compounds. CRM schemas, compliance taxonomies, IAM role structures, workflow orchestration patterns — these don't exist in public training data. Each engagement creates defensible IP for that vertical.",
  "The 70/30 split keeps us grounded. Delivery revenue funds research; research makes delivery cheaper and faster. Neither track starves the other. This is a durable business model, not a burn-for-market-share play.",
]

export default function RaisePage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="relative z-10 mx-auto max-w-[1440px] grid grid-cols-1 gap-16 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo.png" alt="Beag Labs" width={40} height={40} className="border-[2px] border-[#111]" />
              <span className="font-extrabold text-[#111]">Beag Labs</span>
            </div>
            <span className="nb-label mb-5 inline-block">
              $4.5M Seed round
            </span>
            <h1 className="mb-6 max-w-[700px] text-[44px] font-extrabold leading-[1.0] tracking-[-0.055em] text-[#111] sm:text-[56px] lg:text-[68px]">
              Helping enterprises own their models and inference.
            </h1>
            <p className="mb-8 max-w-[560px] text-[18px] leading-[1.7] text-[#404040] font-medium">
              Small models, deployed anywhere. Beag Labs builds domain-specific AI for internal enterprise workflows — CRM, compliance, IAM, tool calling — that runs on your infrastructure at a fraction of the cost.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                className="nb-btn inline-flex items-center gap-2 bg-[#111] px-8 py-4 text-[12px] uppercase text-white"
              >
                Meet the founder
              </Link>
              <span className="text-[14px] text-[#555] font-medium">
                Raising $4.5M Seed Round.
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="nb-card bg-[#FFF3E6] p-6">
              <div className="text-[36px] font-extrabold tracking-[-0.04em] text-[#111]">$200B</div>
              <p className="mt-1 text-[14px] leading-[1.6] text-[#404040] font-medium">
                Enterprise AI market by 2027. The majority of spend will shift from general-purpose APIs to domain-specific, deploy-anywhere models.
              </p>
            </div>
            <div className="nb-card bg-[#E6F2FF] p-6">
              <div className="text-[36px] font-extrabold tracking-[-0.04em] text-[#111]">13x cheaper</div>
              <p className="mt-1 text-[14px] leading-[1.6] text-[#404040] font-medium">
                Small models outperform GPT-4 on internal enterprise workflows at 13x lower inference cost and 40x lower latency. CRM, compliance, IAM, tool calling — measured on real customer workloads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">The market problem</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Enterprise AI is stuck between overpriced APIs and impossible build-vs-buy decisions.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Every company needs AI for internal enterprise workflows. No one sells a model that is accurate enough, private enough, and cheap enough — so enterprises either overpay for general APIs or give up.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {problemCards.map((card) => (
              <div key={card.step} className="border-[3px] border-[#111] bg-white p-8 shadow-[6px_6px_0px_0px_#111]">
                <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                  {card.step}
                </div>
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] text-[#111]">
                  {card.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-[#404040]">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — rewritten as investment thesis */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">How we win</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Enterprises want to own their models and inference. We own the pipeline that builds them.
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We sell the outcome, not the API call. Our pipeline uses frontier base SLMs (Google Gemma E4B) as the base for domain-specific fine-tuning of internal models deployed within the customer's infrastructure.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {approachSteps.map((step) => (
              <div
                key={step.id}
                className="nb-card p-8"
                style={{ background: step.bg }}
              >
                <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                  {step.id}
                </div>
                <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] text-[#111]">
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-[#404040]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business model — honest pre-revenue metrics */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Traction & business model</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Pre-revenue with measurable technical traction and pipeline.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We have not yet recognized revenue — we are pre-revenue by design. What we do have is a validated technical approach, active design partners in legal and healthcare, and model performance numbers that beat GPT-4 and Claude on their specific enterprise workflow tasks.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tractionCards.map((card) => (
              <div key={card.label} className="nb-card bg-white p-6">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                  {card.label}
                </div>
                <div className="mt-3 text-[28px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111]">
                  {card.value}
                </div>
                <p className="mt-3 text-[13px] leading-[1.65] text-[#555] font-medium">
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="nb-card bg-[#111] p-8 text-white">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Revenue model
              </div>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-sm font-semibold text-white">Phase 1: Outcomes-based delivery</div>
                  <p className="mt-1 text-sm leading-[1.6] text-white/72 font-medium">
                    Multi-year contracts priced on workflow scope, not token volume. Customer owns the model. We own the pipeline. $150-250k ACV.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Phase 2: Platform self-serve</div>
                  <p className="mt-1 text-sm leading-[1.6] text-white/72 font-medium">
                    As the pipeline productizes, customers can run their own workflow configurations and deployments. Platform subscription + usage-based deployment pricing.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Phase 3: Vertical expansion</div>
                  <p className="mt-1 text-sm leading-[1.6] text-white/72 font-medium">
                    Pre-built models for CRM, compliance, IAM, and workflow automation. Each new customer in a vertical benefits from every previous customer's data and schemas.
                  </p>
                </div>
              </div>
            </div>

            <div className="nb-card bg-[#FFF3E6] p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                Operating split
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-[#555] font-medium">
                    <span>Delivery & workflow ownership</span>
                    <span>70%</span>
                  </div>
                  <div className="mt-2 h-4 border-[2px] border-[#111]">
                    <div className="h-full w-[70%] bg-[#FF5F1F]" />
                  </div>
                  <p className="mt-1 text-xs leading-[1.6] text-[#555] font-medium">
                    Funds operations and grows reference customer base
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-[#555] font-medium">
                    <span>Platform R&D</span>
                    <span>30%</span>
                  </div>
                  <div className="mt-2 h-4 border-[2px] border-[#111]">
                    <div className="h-full w-[30%] bg-[#8B7355]" />
                  </div>
                  <p className="mt-1 text-xs leading-[1.6] text-[#555] font-medium">
                    Turns delivery patterns into product features
                  </p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-[1.7] text-[#555] font-medium">
                Services revenue funds the R&D that makes services cheaper and faster. Each engagement fully covers its own cost plus a margin that reinvests into the platform. Neither track starves the other.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Moat */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Defensibility</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Four compounding advantages that get stronger with every deployment.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            This is not a features race. Our moat is structural — built into the delivery model and data flywheel.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="nb-card bg-white p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                Moat
              </div>
              <ul className="mt-5 space-y-4">
                {moatPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.6] text-[#404040] font-medium">
                    <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] font-bold text-[#FF5F1F]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nb-card bg-[#E6F2FF] p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                Who we compete with
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-[#111]">General-purpose APIs (GPT-4, Claude, Gemini)</div>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#555] font-medium">
                    Too expensive for volume workflow automation. Cannot be deployed on customer infrastructure. No data privacy guarantees.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#111]">Fine-tuning platforms (Tinker, Fireworks, Together)</div>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#555] font-medium">
                    Sell GPU access, not workflow outcomes. Customer still needs ML engineers, labeling pipelines, and evaluation infrastructure. We absorb that complexity.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#111]">In-house ML teams</div>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#555] font-medium">
                    Most enterprises cannot hire and retain the talent needed to build and maintain custom models. We act as their ML department with a productized delivery model.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Roadmap</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Each phase de-risks the next. Revenue funds the roadmap.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We are capital-efficient by necessity and design. Revenue from delivery funds platform R&D. The platform R&D makes delivery cheaper and faster. This is a flywheel, not a burn multiple.
          </p>

          <div className="grid gap-4">
            {roadmapPhases.map((phase, i) => (
              <div key={phase.phase} className="nb-card bg-white p-8 flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 space-y-2 border-b-[3px] border-[#111] pb-4 sm:border-b-0 sm:border-r-[3px] sm:pr-6 sm:pb-0 sm:w-[160px]">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                    {phase.phase}
                  </div>
                  <div className="nb-chip text-[10px]">
                    {phase.status}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#999]">
                    Step 0{i + 1}
                  </div>
                </div>
                <div>
                  <h3 className="text-[24px] font-extrabold leading-[1.08] text-[#111]">
                    {phase.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-[#404040] font-medium">
                    {phase.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue forecast */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Revenue forecast</span>
          <h2 className="mb-4 max-w-[700px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Capital-efficient path to $1.4M contracted ACV within 24 months of first contract.
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Contracts are $150-250K ACV each, billed as flat annual fees. Founder closes the first 2-3 design partner contracts in months 4-10. A GTM hire at month 7 accelerates pipeline. A Sales Engineer at month 13 supports deal volume. Each contract compounds into the next — deployment experience shortens sales cycles and improves close rates.
          </p>

          <div className="nb-card bg-white p-8">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F] mb-6">
              Cumulative contracted ACV vs. monthly burn ($M)
            </div>
            <RevenueChart />

            <div className="mt-6 grid grid-cols-1 gap-4 border-t-[2px] border-[#111]/10 pt-6 md:grid-cols-3">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                  Contract model
                </div>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#555] font-medium">
                  $150-250K ACV per engagement, billed annually. Customer owns the model. We own the pipeline. Each contract is a multi-year commitment, not a token meter.
                </p>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                  Pipeline velocity
                </div>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#555] font-medium">
                  First contract closes month 4. Founder-led sales through month 10. GTM hire accelerates to 1 contract per quarter. Sales Engineer at month 13 supports concurrent deals.
                </p>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                  Cash position
                </div>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#555] font-medium">
                  Monthly burn stays under $250K. Cash runway extends past 22 months. Breakeven at month 21 — revenue catches expenses with cash remaining on the balance sheet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Budget */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Budget</span>
          <h2 className="mb-4 max-w-[700px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            $4.5M Seed round allocation.
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            These numbers are directional — a best guess based on current assumptions. Actual allocation will shift as we learn from early customers and hire against real pipeline needs.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="nb-card bg-[#111] p-8 text-white">
              <div className="space-y-4">
                {[
                  { label: "Training Infrastructure", amount: "$500k" },
                  { label: "Core Team & Engineering", amount: "$1.2M" },
                  { label: "Security, Compliance & Risk", amount: "$1.5M" },
                  { label: "Sales & GTM", amount: "$670k" },
                  { label: "Internal Platform / Ops", amount: "$250k" },
                  { label: "Reserve", amount: "$380k" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-[15px] font-semibold text-white">{item.label}</span>
                    <span className="text-[15px] text-white/60 font-medium font-mono">{item.amount}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[15px] font-extrabold text-white">Total</span>
                  <span className="text-[15px] font-extrabold text-white font-mono">$4.5M</span>
                </div>
              </div>
            </div>

            <div className="nb-card bg-[#FFF3E6] p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                Spending principles
              </div>
              <ul className="mt-5 space-y-4">
                {[
                  { title: "Revenue gates every hire", body: "No headcount until pipeline justifies it. We use LLMs to accelerate traction prior to pipeline justification. GTM hire at month 7, Sales Engineer at month 13 — both triggered by deal volume, not planning assumptions." },
                  { title: "No engineering hires in year one", body: "LLMs handle code, tests, docs, and design. The founder operates at 5x capacity. First engineering hire (if needed) is year two, funded by revenue." },
                  { title: "Compliance is not optional", body: "Regulated industries require SOC 2, HIPAA, and data residency guarantees. The security budget is front-loaded because it unblocks enterprise deals." },
                  { title: "Reserve is real", body: "$380K buffer for extended sales cycles, unexpected compute needs, and opportunistic hires. Not a rounding error — it is 8 months of founder runway." },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.6] text-[#404040] font-medium">
                    <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] font-bold text-[#FF5F1F]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="font-semibold text-[#111]">{item.title}</span>
                      <span> — {item.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solo + LLM Strategy */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Team strategy</span>
          <h2 className="mb-4 max-w-[700px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Solo founder. LLM-powered operations. Hires only where revenue demands it.
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We use LLMs to replace functions that would otherwise require 3-5 engineering hires. The founder handles product, ML, engineering, and delivery. Every hire must directly generate or close revenue.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="nb-card bg-[#E6F2FF] p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                What LLMs handle today
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { role: "Code review & refactoring", note: "Claude / Cursor for iterative development" },
                  { role: "Documentation & content", note: "Generated, not hand-written" },
                  { role: "Testing & eval pipelines", note: "LLM-written test suites, automated evals" },
                  { role: "UI/UX design iterations", note: "AI-assisted prototyping and iteration" },
                  { role: "Customer support triage", note: "Automated responses, founder handles escalation" },
                  { role: "Data labeling & annotation", note: "Frontier models label 95% of training examples" },
                ].map((item) => (
                  <div key={item.role} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 text-[#FF5F1F]">&#10003;</span>
                    <div>
                      <span className="text-sm font-semibold text-[#111]">{item.role}</span>
                      <span className="text-sm text-[#555] font-medium"> — {item.note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] leading-[1.6] text-[#555] font-medium">
                Net effect: founder operates at the capacity of a 5-person team without the coordination overhead or burn rate.
              </p>
            </div>

            <div className="nb-card bg-[#FFF3E6] p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                Planned hires (revenue-gated)
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#111]">GTM / Revenue Lead</div>
                    <span className="nb-chip text-[10px]">Month 6-9</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#555] font-medium">
                    Owns pipeline, manages inbound/outbound, runs discovery calls. Founder stays on demos and technical close. This hire is triggered by pipeline volume — not a planning assumption.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#111]">Sales Engineer</div>
                    <span className="nb-chip text-[10px]">Month 12-15</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#555] font-medium">
                    Runs POC deployments, handles technical due diligence, builds custom demos. Hired only when deal volume exceeds founder capacity. Directly tied to closing revenue.
                  </p>
                </div>
              </div>
              <div className="mt-6 border-t-[2px] border-[#111]/10 pt-4">
                <p className="text-[13px] leading-[1.6] text-[#555] font-medium">
                  <span className="font-semibold text-[#111]">Key principle:</span> No engineering hires in year one. LLMs handle code, tests, docs, and design. First engineering hire (if needed) is year two, funded entirely by revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Model Sizes */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Model architecture</span>
          <h2 className="mb-4 max-w-[700px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Model sizes
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Two model tiers designed for different deployment realities. One for edge and VPC. One for large enterprise operations.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Satellite */}
            <div className="relative overflow-hidden rounded-[16px] border-[3px] border-[#111] bg-[#F8F9FA] p-8 shadow-[6px_6px_0px_0px_#111]">
              <div className="mb-4 inline-block rounded-full border-[2px] border-[#111]/15 bg-white px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                4B params
              </div>
              <h3 className="text-[28px] font-extrabold leading-[1.1] text-[#111]">
                Beag Labs Starling Satellite
              </h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-[#555] font-medium">
                Edge & VPC deployment. Fine-tuned Gemma E4B for CRM automation, compliance workflows, IAM provisioning, and tool-call orchestration.
              </p>

              <div className="relative my-8 flex items-center justify-center">
                <div className="relative">
                  <Image
                    src="/starling.png"
                    alt="Starling Satellite"
                    width={180}
                    height={180}
                    className="object-contain"
                  />
                  <div className="absolute -right-3 -bottom-3 rounded-[10px] border-[2px] border-[#111]/10 bg-white p-1.5 shadow-md">
                    <Image
                      src="https://upload.wikimedia.org/wikipedia/commons/6/6d/Gemma_icon.png"
                      alt="Gemma"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-[#555] font-medium">
                  <span className="text-[#FF5F1F]">&#8226;</span> CRM, compliance, IAM, tool calling
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#555] font-medium">
                  <span className="text-[#FF5F1F]">&#8226;</span> Deploys on-prem, VPC, or edge
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#555] font-medium">
                  <span className="text-[#FF5F1F]">&#8226;</span> SFT + GRPO + On-Policy Distillation
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#555] font-medium">
                  <span className="text-[#FF5F1F]">&#8226;</span> ~$200-300 per training run
                </div>
              </div>
            </div>

            {/* Mothership (greyed out) */}
            <div className="relative overflow-hidden rounded-[16px] border-[3px] border-[#111]/15 bg-[#F8F9FA] p-8 opacity-50">
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="rotate-[-8deg] rounded-[12px] border-[3px] border-[#111] bg-white px-6 py-3 shadow-[4px_4px_0px_0px_#111]">
                  <span className="font-mono text-[13px] font-bold uppercase tracking-[0.15em] text-[#111]">
                    Planned for 2027
                  </span>
                </div>
              </div>

              <div className="mb-4 inline-block rounded-full border-[2px] border-[#111]/15 bg-white/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#555]/60">
                Large model
              </div>
              <h3 className="text-[28px] font-extrabold leading-[1.1] text-[#111]/60">
                Beag Labs Starling Mothership
              </h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-[#555]/60 font-medium">
                Large enterprise operations model. Multi-step workflow orchestration across CRM, compliance, IAM, and cross-system tool calling.
              </p>

              <div className="my-8 flex items-center justify-center">
                <div className="h-[180px] w-[180px] rounded-full border-[3px] border-dashed border-[#111]/15" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-[#555]/60 font-medium">
                  <span>&#8226;</span> Multi-system workflow orchestration
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#555]/60 font-medium">
                  <span>&#8226;</span> Cross-domain CRM, compliance, IAM
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#555]/60 font-medium">
                  <span>&#8226;</span> Complex tool-call chains
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#555]/60 font-medium">
                  <span>&#8226;</span> Training plan to be defined
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Satellite Training Plan — component preserved for reuse */}
      {/* 
        TrainingPlanSection component removed. JSX is available in git history.
        Function signature: <section> with stacked data cards, benchmark table, 
        training phase breakdown, economics panel, and investor summary.
        To restore: `git checkout HEAD~1 -- app/raise/page.tsx` then re-integrate.
      */}

      {/* Ask */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">The ask</span>
          <h2 className="mb-4 max-w-[700px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            $4.5M Seed round. 18 months of runway. Build the platform while customers pay for delivery.
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We are looking for aligned capital that understands services-led SaaS and believes the enterprise AI market will reward focused, deploy-anywhere models over bloated general-purpose APIs. We will not grow at all costs — we will grow at the speed our customers pay us to.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="nb-card bg-[#111] p-8 text-white">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Use of funds
              </div>
              <ul className="mt-5 space-y-4">
                {[
                  {
                    title: "Training infrastructure",
                    body: "Baseten SLURM compute, 8x B200 training runs, data pipelines, evaluation infrastructure. This is the core product — every dollar here produces a deployed model that generates revenue.",
                  },
                  {
                    title: "Operations budget",
                    body: "Founder salary, 2 revenue-gated hires (GTM/Revenue Lead month 6-9, Sales Engineer month 12-15), legal, compliance, insurance. No engineering hires in year one — LLMs handle code, tests, docs, and design.",
                  },
                  {
                    title: "Cloud & deployment",
                    body: "Customer-funded cloud spend offset, staging environments, CI/CD. Cloud costs are structurally offset by customer contracts.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.6] text-white/72 font-medium">
                    <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] font-bold text-[#FF5F1F]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="text-white font-semibold">{item.title}:</span>
                      <span className="text-white/72"> {item.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nb-card bg-white p-8 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                  Ideal partner
                </div>
                <ul className="mt-5 space-y-4">
                  {[
                    "Believes services-led go-to-market is a viable wedge into enterprise SaaS, not a consulting trap.",
                    "Understands regulated industries (legal, healthcare, defense) and why they cannot use cloud AI APIs.",
                    "Prefers durable company formation with honest metrics over growth-stage revenue fabrication.",
                    "Has the network to open design partner conversations in legal, healthcare, or financial services.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-[1.6] text-[#404040] font-medium">
                      <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] font-bold text-[#FF5F1F]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="mailto:james@beaglabs.com?subject=Investment%20Opportunity"
                target="_blank"
                className="nb-btn inline-flex items-center gap-2 bg-[#111] px-8 py-4 text-[12px] uppercase text-white mt-8 self-start"
              >
                Schedule a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
