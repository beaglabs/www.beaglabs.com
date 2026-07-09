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
    title: "Enterprise AI is overpriced",
    body: "Companies pay per-token rates for models that are 100x larger than their use case requires. Classification and extraction don't need GPT-4 — they need a focused model that costs 13x less.",
  },
  {
    step: "02",
    title: "Data never leaves the building",
    body: "Regulated industries — legal, healthcare, defense — cannot send sensitive data to third-party APIs. They need models that run on their own infrastructure, on-prem or air-gapped.",
  },
  {
    step: "03",
    title: "Labeling is the bottleneck",
    body: "Manual data labeling costs $100k+ and takes months. Teams waste SME hours on consensus meetings when 95% of examples could be auto-labeled by a frontier model.",
  },
]

const approachSteps = [
  {
    id: "01",
    title: "Chat with us",
    description:
      "Tell us what you're building. We'll design a labeling schema, hand-pick the best frontier model for your data, and ship you a custom data recipe you can run yourself — or we'll run it for you.",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "Train with intelligent labeling",
    description:
      "Frontier models auto-label your examples. Our disagreement engine surfaces the 2-5% where the model is uncertain — those are the only ones your team reviews.",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "Co-Review the hard cases",
    description:
      "A keyboard-driven review interface lets your domain experts correct contested labels in minutes. No CSV export, no spreadsheet ping-pong.",
    bg: "#E6FFF2",
  },
  {
    id: "04",
    title: "Deploy your model",
    description:
      "Export as ONNX and deploy on your infrastructure — cloud, on-prem, or air-gapped. You own the model. We don't touch your inference data.",
    bg: "#FFF9E6",
  },
]

const economicsCards = [
  {
    label: "Target contract",
    value: "$200k TCV",
    body: "2-3 year engagements with enough scope to own meaningful workflow outcomes.",
  },
  {
    label: "Active customers",
    value: "4-6",
    body: "A small number of high-trust accounts generates backlog, execution density, and product signal.",
  },
  {
    label: "Revenue at target",
    value: "$800k-$1.2M",
    body: "Meaningful contracted visibility before any pure-software expansion is required.",
  },
  {
    label: "Cost vs GPT-4",
    value: "13x cheaper",
    body: "Small domain models run on commodity hardware. Inference costs drop from dollars to cents.",
  },
]

const roadmapPhases = [
  {
    phase: "Phase 1",
    status: "Now",
    title: "Land and deliver",
    body: "Win 4-6 high-trust accounts through founder-led sales. Each engagement builds tooling, trust, and a reference for the next.",
  },
  {
    phase: "Phase 2",
    status: "Next",
    title: "Productize the platform",
    body: "Turn repeated delivery patterns into self-serve tooling. Data connectors, labeling interface, and deployment pipeline become product features.",
  },
  {
    phase: "Phase 3",
    status: "Scale",
    title: "Expand to adjacent verticals",
    body: "Each domain (legal, healthcare, finance, defense) creates a flywheel. Models, schemas, and evaluation datasets compound across deployments.",
  },
]

const moatPoints = [
  "Labeled datasets grow with each customer. Frontier-model labeling plus human review on hard cases builds proprietary training data.",
  "Representation knowledge compounds. Each domain teaches us which schemas, transforms, and evaluation patterns generalize across use cases.",
  "Deployment ownership creates switching costs. When your model runs on your infra and your team reviewed the labels, leaving is expensive.",
  "The 70/30 split keeps us grounded. Services revenue funds research, and research makes services better. Neither starves the other.",
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
              Investor page
            </span>
            <h1 className="mb-6 max-w-[700px] text-[44px] font-extrabold leading-[1.0] tracking-[-0.055em] text-[#111] sm:text-[56px] lg:text-[68px]">
              Small models. Deployed anywhere. 13x cheaper.
            </h1>
            <p className="mb-8 max-w-[560px] text-[18px] leading-[1.7] text-[#404040] font-medium">
              Beag Labs builds domain-specific classification and extraction models that run on your infrastructure. No per-token pricing. No data leaves your environment. You own the model.
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
                Raising pre-seed. Targeting $1M.
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="nb-card bg-[#FFF3E6] p-6">
              <div className="text-[36px] font-extrabold tracking-[-0.04em] text-[#111]">$200B</div>
              <p className="mt-1 text-[14px] leading-[1.6] text-[#404040] font-medium">
                Enterprise AI market by 2027. The majority of spend will be on domain-specific models, not general-purpose APIs.
              </p>
            </div>
            <div className="nb-card bg-[#E6F2FF] p-6">
              <div className="text-[36px] font-extrabold tracking-[-0.04em] text-[#111]">13x</div>
              <p className="mt-1 text-[14px] leading-[1.6] text-[#404040] font-medium">
                Cost advantage over GPT-4 for classification workloads. Small focused models win on price, speed, and data privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">The problem</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Enterprise AI is stuck between overpriced APIs and impossible build-vs-buy decisions.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Most classification and extraction use cases don&apos;t need a 1.8 trillion parameter model. They need a focused system that runs on their infrastructure with their data.
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

      {/* How it works */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">How it works</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            From raw data to deployed model. Four steps.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            No PhD required. We handle the frontier-model labeling, your team reviews only the hard cases, and you deploy a model you own on infrastructure you control.
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

      {/* Economics */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Economics</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Revenue model designed for durable customer ownership.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Multi-year contracts, services as the wedge, product revenue as the expansion path. Each customer relationship compounds.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {economicsCards.map((card) => (
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
                Operating split
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-white/72 font-medium">
                    <span>Delivery & workflow ownership</span>
                    <span>70%</span>
                  </div>
                  <div className="mt-2 h-4 border-[2px] border-white/20">
                    <div className="h-full w-[70%] bg-[#FF5F1F]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-white/72 font-medium">
                    <span>Research & product R&D</span>
                    <span>30%</span>
                  </div>
                  <div className="mt-2 h-4 border-[2px] border-white/20">
                    <div className="h-full w-[30%] bg-[#8B7355]" />
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm leading-[1.7] text-white/72">
                Services revenue funds the research that makes services better. Each customer engagement feeds the product roadmap. Neither track starves the other.
              </p>
            </div>

            <div className="nb-card bg-[#FFF3E6] p-8">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                Moat
              </div>
              <ul className="mt-5 space-y-3">
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
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Roadmap</span>
          <h2 className="mb-4 max-w-[600px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Each phase de-risks the next. No hard pivots, no moonshots.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            The company gets more productized with each engagement, never less. Revenue funds the roadmap. The roadmap attracts more revenue.
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
            $1M pre-seed. Build the platform while customers pay for delivery.
          </h2>
          <p className="mb-12 max-w-[560px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            We&apos;re looking for aligned capital that understands services-led SaaS and believes the enterprise AI market will reward focused, deploy-anywhere models over bloated general-purpose APIs.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="nb-card bg-[#111] p-8 text-white">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Use of funds
              </div>
              <ul className="mt-5 space-y-3">
                {[
                  "Productize the labeling interface, data connectors, and deployment pipeline into a self-serve platform.",
                  "Hire 2-3 senior engineers to accelerate delivery throughput and product development.",
                  "Build the evaluation and dataset infrastructure that makes each deployment compound into the next.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.6] text-white/72 font-medium">
                    <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] font-bold text-[#FF5F1F]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nb-card bg-white p-8 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF5F1F]">
                  Ideal partner
                </div>
                <ul className="mt-5 space-y-3">
                  {[
                    "Believes services-led go-to-market is a viable wedge into enterprise SaaS.",
                    "Understands regulated industries (legal, healthcare, defense) and their infrastructure requirements.",
                    "Prefers durable company formation over shallow AI feature arbitrage.",
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
