import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Invest",
  description:
    "Small models, deployed anywhere. Beag Labs builds domain-specific AI that runs on your infrastructure at a fraction of the cost.",
  openGraph: {
    title: "Invest — Beag Labs",
    description:
      "Small models, deployed anywhere. Beag Labs builds domain-specific AI that runs on your infrastructure at a fraction of the cost. Purpose-built models for compliance, legal, healthcare, and security — no cloud lock-in.",
    url: "https://beaglabs.com/raise",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beag Labs — Invest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invest — Beag Labs",
    description:
      "Small models, deployed anywhere. Beag Labs builds domain-specific AI that runs on your infrastructure at a fraction of the cost. Purpose-built models for compliance, legal, healthcare, and security — no cloud lock-in.",
    images: ["/og-image.png"],
  },
}

const problemCards = [
  {
    step: "01",
    title: "Enterprise AI is overpriced and overprovisioned",
    body: "Companies pay per-token rates for 1.8-trillion-parameter models to run classification and extraction workloads. These use cases need a focused model that costs 13x less and runs 40x faster — but no one sells one.",
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
    title: "We own the workflow, not just the model",
    description:
      "We start with a specific classification or extraction outcome your team needs — contract clause identification, medical record coding, document triage. We map the labeling schema, build the training pipeline, and deliver a deployed model. You pay for the outcome, not the GPU hour.",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "Frontier models do the easy work. Your experts do the hard work.",
    description:
      "Our pipeline uses frontier models to label ~95% of examples automatically. An uncertainty engine surfaces the 5% where the model is conflicted — those are the only examples your domain experts review. This cuts labeling cost by 20x and turns your SMEs into validators instead of labelers.",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "Your data never touches our servers after training",
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
    body: "Working with legal-tech and healthcare organizations on production classification pipelines. Each is a paid pilot with a path to multi-year contract.",
  },
  {
    label: "Model performance",
    value: "92-96% F1",
    body: "Domain-specific classification models consistently outperform GPT-4 and Claude on held-out test sets at 13x lower inference cost.",
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
    body: "Turn repeated delivery patterns into self-serve tooling: data connectors, the uncertainty-driven labeling interface, one-click deployment to customer infrastructure. Each deployment gets faster and cheaper to fulfill.",
  },
  {
    phase: "Phase 3",
    status: "Scale",
    title: "Expand vertically",
    body: "Each domain (legal, healthcare, finance, defense) has a compounding data and schema advantage. Models, evaluation datasets, and labeling templates transfer across customers within a vertical. Enter new verticals through strategic design partners.",
  },
]

const moatPoints = [
  "The uncertainty engine gets smarter with every deployment. The distribution of frontier-model confidence across domains is proprietary data that improves our labeling efficiency permanently.",
  "Customer-owned deployment creates structural switching costs. Your legal team reviewed the labels, your IT deployed the model, and your compliance team approved the air-gap. Replacing the model means redoing all three.",
  "Vertical knowledge compounds. Healthcare schemas, legal document structures, financial instrument taxonomies — these don't exist in public training data. Each engagement creates defensible IP for that vertical.",
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
              Pre-seed round
            </span>
            <h1 className="mb-6 max-w-[700px] text-[44px] font-extrabold leading-[1.0] tracking-[-0.055em] text-[#111] sm:text-[56px] lg:text-[68px]">
              Small models that own the workflow. Deployed anywhere. 13x cheaper.
            </h1>
            <p className="mb-8 max-w-[560px] text-[18px] leading-[1.7] text-[#404040] font-medium">
              Beag Labs builds domain-specific classification and extraction models that outperform GPT-4 on their trained domain, run on customer-controlled infrastructure, and cost a fraction of per-token APIs. We own the outcome, not the API call.
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
                Raising $1M pre-seed. 3 design partners active.
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
                3-parameter models outperform GPT-4 on classification and extraction at 13x lower inference cost and 40x lower latency. Measured on real customer workloads.
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
            Every company needs AI for domain-specific tasks. No one sells a model that is accurate enough, private enough, and cheap enough — so enterprises either overpay for general APIs or give up.
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
            Services as the wedge. Platform as the exit. Data as the moat.
          </h2>
          <p className="mb-12 max-w-[620px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We sell workflow outcomes, not model access. Each engagement starts with a specific business process — contract review, medical chart coding, document triage — and delivers a deployed model that outperforms GPT-4 on that task at a fraction of the cost and latency. The customer owns the model. We own the pipeline that built it.
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
            We have not yet recognized revenue — we are pre-revenue by design. What we do have is a validated technical approach, active design partners in legal and healthcare, and model performance numbers that beat GPT-4 and Claude on their specific classification tasks.
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
                    As the pipeline productizes, customers can run their own labeling campaigns and deployments. Platform subscription + usage-based deployment pricing.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Phase 3: Vertical expansion</div>
                  <p className="mt-1 text-sm leading-[1.6] text-white/72 font-medium">
                    Pre-built models for legal, healthcare, finance, and defense. Each new customer in a vertical benefits from every previous customer's data and schemas.
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
                    Too expensive for volume classification. Cannot be deployed on customer infrastructure. No data privacy guarantees.
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

      {/* Ask */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">The ask</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            $1M pre-seed. 18 months of runway. Build the platform while customers pay for delivery.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
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
                    title: "Platform engineering",
                    body: "Build the uncertainty-driven labeling interface, data connectors, and one-click deployment pipeline that transforms each delivery from a consulting engagement into a product interaction.",
                  },
                  {
                    title: "Hire 2-3 senior engineers",
                    body: "Current team is founder-only. First hires are full-stack and ML engineers who can own customer delivery end-to-end while building platform features in the same sprint.",
                  },
                  {
                    title: "Evaluation and data infrastructure",
                    body: "The datasets, evals, and schemas that compound across customers within a vertical. This is the permanent asset that makes each subsequent deployment cheaper and faster.",
                  },
                  {
                    title: "Operating runway",
                    body: "18 months of founder salary, legal, and compliance costs. No burn rate beyond the team. No cloud spend beyond what customers pay for.",
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
                href="https://cal.com/comradelemoncake/meet-the-founder"
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
