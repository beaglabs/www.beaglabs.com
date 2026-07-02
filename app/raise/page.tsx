import type { Metadata } from "next"
import type { ComponentType, ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Binary,
  BrainCircuit,
  BriefcaseBusiness,
  Database,
  FlaskConical,
  Layers3,
  Telescope,
  Workflow,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Beag Labs Raise",
  description:
    "Investor page for Beag Labs: an applied AI research lab building toward a representation layer for scientific and spatial intelligence.",
  openGraph: {
    title: "Beag Labs Raise",
    description:
      "Services-backed applied AI research company building a representation layer for scientific intelligence.",
    url: "https://beaglabs.com/raise",
  },
}

const navItems = [
  { id: "overview", index: "01", label: "Overview" },
  { id: "problem", index: "02", label: "Problem" },
  { id: "model", index: "03", label: "Operating model" },
  { id: "representation", index: "04", label: "Representation thesis" },
  { id: "economics", index: "05", label: "Economics" },
  { id: "roadmap", index: "06", label: "Roadmap" },
  { id: "timing", index: "07", label: "Why now" },
  { id: "ask", index: "08", label: "The ask" },
] as const

const thesisLines = [
  "Scientific AI fails when data lives across incompatible file types, coordinate systems, and discipline-specific assumptions.",
  "The missing abstraction is a representation layer that can unify structure, semantics, and transformation across those formats.",
  "Beag Labs uses services as the acquisition and learning layer, then compounds toward model and representation IP.",
]

const problemCards = [
  {
    label: "01",
    title: "Heterogeneous formats",
    body: "Scientific workflows live across arrays, tables, grids, imagery, coordinates, and domain conventions that generic AI stacks do not normalize well.",
    icon: Layers3,
  },
  {
    label: "02",
    title: "Hidden semantics",
    body: "Meaning often sits outside the raw tensor: physical constraints, temporal assumptions, transforms, and coordinate frames are essential to useful reasoning.",
    icon: BrainCircuit,
  },
  {
    label: "03",
    title: "Cross-disciplinary failure",
    body: "Current models are strong inside single modalities, but scientific intelligence requires movement across representations and domains.",
    icon: Binary,
  },
]

const modelCards = [
  {
    label: "Operating model",
    title: "70 / 30 mix",
    body: "About 70% of effort goes toward delivery and 30% toward research so the company stays commercially grounded while building technical edge.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Near term",
    title: "Forward deployed AI services",
    body: "Start inside hard scientific workflows, own outcomes with customers, and turn that work into repeatable system knowledge.",
    icon: Workflow,
  },
  {
    label: "Long term",
    title: "Compounding data and model insight",
    body: "Each opted-in deployment informs the representation layer, sharpens product direction, and builds a defensible training advantage over time.",
    icon: Database,
  },
]

const roadmap = [
  {
    phase: "Near term",
    status: "Now",
    title: "Monetize through embedded scientific AI work",
    body: "Win services revenue through forward deployed engagements, AI-enabled workflow ownership, and delivery inside technical customer environments.",
  },
  {
    phase: "Medium term",
    status: "Build",
    title: "Standardize the representation layer",
    body: "Convert repeated patterns from delivery into reusable data pipelines, canonical representations, evaluation loops, and shared tooling.",
  },
  {
    phase: "Long term",
    status: "Scale",
    title: "Train toward a general scientific foundation model",
    body: "Use accumulated representation knowledge and opted-in datasets to support models that reason across spatial and scientific domains.",
  },
] as const

const useOfCapital = [
  "Turn delivery learnings into productized representation tooling rather than treating services as one-off consulting work.",
  "Increase execution capacity for high-value scientific deployments without building a burn-heavy, research-only organization.",
  "Invest in infrastructure, evaluation, and dataset systems that make future model training cumulative instead of episodic.",
]

function DeckSection({
  id,
  index,
  label,
  title,
  intro,
  children,
}: {
  id: string
  index: string
  label: string
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(251,250,247,0.98))] p-6 shadow-[0_24px_80px_rgba(17,17,17,0.06)] sm:p-8 lg:p-10"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] border border-black/6 bg-white/70 px-5 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,115,85,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.06),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#111111_0.75px,transparent_0.75px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.55),transparent_72%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 border-b border-black/6 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#7b7368]">
                <span className="h-2 w-2 rounded-full bg-[#8B7355]" />
                {label}
              </div>
              <h2 className="max-w-4xl font-serif text-[2rem] leading-none tracking-[-0.04em] text-[#111111] sm:text-[2.6rem] lg:text-[3.25rem]">
                {title}
              </h2>
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#9f978d]">
              {index} / {navItems.length.toString().padStart(2, "0")}
            </div>
          </div>
          <p className="max-w-4xl text-[1rem] leading-8 text-[#57524c] sm:text-[1.04rem]">
            {intro}
          </p>
          {children}
        </div>
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  body,
}: {
  label: string
  value: string
  body: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/8 bg-white/88 p-5 backdrop-blur-sm">
      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
        {label}
      </div>
      <div className="mt-3 max-w-full text-balance break-words text-[1.45rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[#111111] sm:text-[1.8rem] xl:text-[2.05rem]">
        {value}
      </div>
      <p className="mt-3 text-sm leading-7 text-[#57524c]">{body}</p>
    </div>
  )
}

function InsightCard({
  label,
  title,
  body,
  icon: Icon,
}: {
  label: string
  title: string
  body: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/8 bg-white/82 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
          {label}
        </div>
        <div className="rounded-full border border-black/8 bg-[#f7f2eb] p-2 text-[#8B7355]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#57524c]">{body}</p>
    </div>
  )
}

export default function RaisePage() {
  return (
    <main className="min-h-screen bg-[#f6f2eb] text-[#111111]">
      <Navbar />

      <div className="relative overflow-hidden pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,115,85,0.12),transparent_28%),linear-gradient(180deg,#f6f2eb_0%,#f9f7f2_36%,#f6f2eb_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.7),transparent_72%)]" />

        <div className="relative mx-auto max-w-[1480px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="mb-6 rounded-[1.75rem] border border-black/8 bg-white/78 p-6 shadow-[0_18px_60px_rgba(17,17,17,0.05)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl space-y-4">
                <div className="inline-flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8B7355]">
                  <span className="h-px w-10 bg-[#8B7355]" />
                  Investor page
                </div>
                <div className="flex items-center gap-3 text-[#111111]">
                  <Image src="/logo.png" alt="Beag Labs" width={44} height={44} className="rounded-2xl border border-black/8 bg-white p-1.5" />
                  <span className="text-base font-semibold tracking-[-0.03em]">Beag Labs</span>
                </div>
                <h1 className="max-w-5xl font-serif text-[2.8rem] leading-[0.92] tracking-[-0.055em] text-[#111111] sm:text-[4.2rem] lg:text-[5.3rem]">
                  Applied AI research for the representation layer scientific intelligence still lacks.
                </h1>
                <p className="max-w-3xl text-[1rem] leading-8 text-[#5b544c] sm:text-[1.06rem]">
                  Beag Labs is building an applied AI research company that monetizes through forward deployed scientific AI work in the near term and compounds that work into a long-term model and representation advantage.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:max-w-sm lg:justify-end">
                <Button asChild variant="outline" className="rounded-full border-black/10 bg-white/70 px-5 text-[#111111] hover:bg-[#f3ede5]">
                  <Link href="https://cal.com/comradelemoncake/meet-the-founder" target="_blank">
                    Meet the founder
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-24 xl:h-fit">
              <div className="rounded-[1.75rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,247,242,0.98))] p-5 shadow-[0_16px_50px_rgba(17,17,17,0.05)] backdrop-blur-sm">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                  Raise navigation
                </div>
                <p className="mt-3 text-sm leading-7 text-[#57524c]">
                  Services-backed operating model, representation-layer thesis, and a contract structure built for durable scientific AI relationships.
                </p>
                <nav className="mt-5 grid gap-2" aria-label="Raise sections">
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm text-[#57524c] transition hover:border-black/8 hover:bg-white hover:text-[#111111]"
                    >
                      <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-current text-[0.72rem] font-semibold tracking-[0.08em]">
                        {item.index}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-6 rounded-[1.25rem] bg-[#111111] p-4 text-white">
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Current contract thesis
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                    $200k TCV
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    Targeting 2-3 year, Palantir-style relationships where Beag Labs owns real workflow outcomes and compounds insight from each engagement.
                  </p>
                </div>
              </div>
            </aside>

            <div className="grid gap-6">
              <DeckSection
                id="overview"
                index="01"
                label="Overview"
                title="A services-first AI research company with a long-term representation-layer wedge."
                intro="The company model is deliberately sequenced. Near term, Beag Labs behaves like a deeply technical forward deployed engineering organization for scientific AI workflows. Long term, that work becomes the acquisition channel for representation knowledge, opted-in data, and model training signal."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Focus"
                    value="State-space models + RWKV"
                    body="Architecture research begins from sequence models and efficient long-context systems that can support scientific reasoning workloads."
                  />
                  <StatCard
                    label="Primary wedge"
                    value="Scientific workflows"
                    body="Win by solving real technical workflows where domain structure and representation quality matter more than generic chatbot performance."
                  />
                  <StatCard
                    label="Operating split"
                    value="70 / 30"
                    body="Keep the company delivery-heavy enough to generate revenue while preserving a serious research track for differentiated IP."
                  />
                  <StatCard
                    label="Outcome"
                    value="Representation moat"
                    body="Each deployment should strengthen the abstractions, data schemas, and evaluation loops needed for general scientific intelligence."
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.5rem] border border-black/8 bg-white/84 p-5">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                      Core thesis
                    </div>
                    <div className="mt-4 grid gap-3">
                      {thesisLines.map((line) => (
                        <div key={line} className="rounded-[1.1rem] border-l-[3px] border-[#111111] bg-[#fbf8f2] px-4 py-4 text-[0.98rem] leading-8 text-[#27221d]">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-black/8 bg-[#111111] p-5 text-white">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                      Company shape
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm text-white/72">
                          <span>Delivery and workflow ownership</span>
                          <span>70%</span>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-white/10">
                          <div className="h-3 w-[70%] rounded-full bg-[#f0d6b6]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm text-white/72">
                          <span>Research and representation R&amp;D</span>
                          <span>30%</span>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-white/10">
                          <div className="h-3 w-[30%] rounded-full bg-[#8B7355]" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-7 text-white/72">
                      This is not a pure API bet. It is a disciplined sequence: services first, representation layer next, broader model platform over time.
                    </p>
                  </div>
                </div>
              </DeckSection>

              <DeckSection
                id="problem"
                index="02"
                label="Problem"
                title="Science breaks generic AI because the world is not stored in one clean modality."
                intro="The difficult problem is not only reasoning quality. It is the many different file formats, dimensions, coordinate systems, and physical assumptions required to communicate multi-spatial concepts across scientific workflows."
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  {problemCards.map((card) => (
                    <InsightCard key={card.title} {...card} />
                  ))}
                </div>

                <div className="rounded-[1.5rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,242,235,0.95))] p-5">
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                    <div>
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                        Why this matters
                      </div>
                      <p className="mt-4 text-base leading-8 text-[#27221d]">
                        If the representation layer is broken, every downstream model is fighting the wrong battle. Scientific intelligence requires models that can move through structure and meaning at the same time, not just autocomplete within a single cleaned dataset.
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-black/8 bg-white/90 p-5">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                        Implication
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#57524c]">
                        The strategic opportunity is to own the translation layer between heterogeneous scientific assets and the models that must eventually reason across them.
                      </p>
                    </div>
                  </div>
                </div>
              </DeckSection>

              <DeckSection
                id="model"
                index="03"
                label="Operating model"
                title="Monetize like a technical services company while compounding like a model company."
                intro="The near-term business is closer to Palantir than a pure API vendor. Beag Labs embeds deeply, solves hard workflows, and uses that work to produce revenue, domain trust, product signal, and the raw material for future model differentiation."
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  {modelCards.map((card) => (
                    <InsightCard key={card.title} {...card} />
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-[1.4rem] border border-black/8 bg-white/86 p-5">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                      Near-term motion
                    </div>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-[#57524c]">
                      <li>Land through AI-enabled services agreements where customers already feel workflow pain.</li>
                      <li>Own delivery close to the data and the domain rather than selling generic abstraction from afar.</li>
                      <li>Select engagements that create repeated structure, reusable tools, and opt-in learning opportunities.</li>
                    </ul>
                  </div>
                  <div className="rounded-[1.4rem] border border-black/8 bg-[#161616] p-5 text-white">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                      Long-run effect
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/72">
                      Services are not the endpoint. They are the controlled environment where Beag Labs learns which representations matter, which transformations repeat, and which scientific interfaces should ultimately become platform primitives.
                    </p>
                  </div>
                </div>
              </DeckSection>

              <DeckSection
                id="representation"
                index="04"
                label="Representation thesis"
                title="Start at the data format layer because representation is the bottleneck."
                intro="Beag Labs is not starting with a broad assistant layer. The first technical milestone is a shared computational form for heterogeneous scientific assets so models can learn over structure, coordinates, metadata, and domain transformations in one system."
              >
                <div className="grid gap-4 xl:grid-cols-4">
                  <InsightCard
                    label="01"
                    title="Ingest"
                    body="Capture heterogeneous scientific assets across formats, structures, and dimensions without collapsing away their useful semantics."
                    icon={Database}
                  />
                  <InsightCard
                    label="02"
                    title="Normalize"
                    body="Represent arrays, coordinates, tables, transforms, and metadata in a common computational surface that models can actually learn over."
                    icon={Layers3}
                  />
                  <InsightCard
                    label="03"
                    title="Learn"
                    body="Train over values and structure together so the system learns domain transformations rather than only surface-level prediction patterns."
                    icon={FlaskConical}
                  />
                  <InsightCard
                    label="04"
                    title="Generalize"
                    body="Move toward models that operate across scientific disciplines instead of remaining boxed inside a single modality or data source."
                    icon={Telescope}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.5rem] border border-black/8 bg-white/88 p-5">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                      Research conviction
                    </div>
                    <p className="mt-4 text-base leading-8 text-[#27221d]">
                      A general scientific foundation model will need to reason through spatial, temporal, and physical representations that today&apos;s systems mostly ignore. That means the data abstraction itself is strategic, not just the model architecture layered on top of it.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-black/8 bg-[#faf6ef] p-5">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                      Business consequence
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#57524c]">
                      The more deployments Beag Labs completes in real scientific environments, the stronger its view becomes on which representations deserve to be standardized and which can become defensible model inputs later.
                    </p>
                  </div>
                </div>
              </DeckSection>

              <DeckSection
                id="economics"
                index="05"
                label="Economics"
                title="Contract structure, budget discipline, and financial GTM are designed to reinforce each other."
                intro="The revenue model assumes multi-year scientific AI engagements rather than short-term experimentation. The company should be able to grow through durable customer ownership while keeping research investment attached to commercial reality."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Target contract"
                    value="$200k TCV"
                    body="Each customer relationship is modeled as a 2-3 year engagement with enough scope to own meaningful workflow outcomes."
                  />
                  <StatCard
                    label="Annualized revenue"
                    value="$67k-$100k"
                    body="Equivalent yearly revenue per account varies by contract term, giving room to structure deals by complexity and deployment depth."
                  />
                  <StatCard
                    label="Portfolio target"
                    value="4-6 active customers"
                    body="A small number of high-trust accounts is enough to generate backlog, execution density, and strong product signal early on."
                  />
                  <StatCard
                    label="Backlog at target"
                    value="$800k-$1.2M"
                    body="That customer base implies meaningful contracted visibility before any pure-software expansion is required."
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.5rem] border border-black/8 bg-white/88 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                          Financial GTM expectations
                        </div>
                        <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#111111]">
                          Founder-led land-and-expand with technical depth as the differentiator.
                        </h3>
                      </div>
                      <ArrowRight className="hidden h-5 w-5 text-[#8B7355] sm:block" />
                    </div>
                    <ul className="mt-5 space-y-3 text-sm leading-7 text-[#57524c]">
                      <li>Lead with workflow ownership rather than generic model access or one-off experimentation.</li>
                      <li>Price around durable technical value, not hourly consulting abstraction.</li>
                      <li>Expand from an initial deployment into multi-year responsibility for the surrounding scientific system.</li>
                      <li>Choose customers where opted-in learning value and workflow repeatability are both high.</li>
                    </ul>
                  </div>

                  <div className="rounded-[1.5rem] border border-black/8 bg-[#111111] p-5 text-white">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                      Budget principles
                    </div>
                    <div className="mt-4 grid gap-3">
                      {useOfCapital.map((item) => (
                        <div key={item} className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/72">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DeckSection>

              <DeckSection
                id="roadmap"
                index="06"
                label="Roadmap"
                title="The company should get more productized with each engagement, not just bigger."
                intro="The roadmap is a sequence from services revenue to reusable representation infrastructure to a broader model platform. Each phase should de-risk the next rather than forcing a hard reset in strategy."
              >
                <div className="grid gap-4">
                  {roadmap.map((item, index) => (
                    <div key={item.title} className="grid gap-4 rounded-[1.45rem] border border-black/8 bg-white/88 p-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                      <div className="space-y-2 border-b border-black/6 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                          {item.phase}
                        </div>
                        <div className="inline-flex rounded-full border border-black/8 bg-[#f7f2eb] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#6c6257]">
                          {item.status}
                        </div>
                        <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#c1b7aa]">
                          Step 0{index + 1}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#111111]">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[#57524c]">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DeckSection>

              <DeckSection
                id="timing"
                index="07"
                label="Why now"
                title="Scientific organizations increasingly look like software organizations, but their data stack still does not."
                intro="There is a growing mismatch between what scientific and spatial teams need from AI and what generic AI infrastructure can presently support. That mismatch creates room for a specialized company with stronger representation instincts and closer customer proximity."
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <InsightCard
                    label="Tailwind"
                    title="Scientific work is more software-defined"
                    body="More workflows are computational, automated, and dependent on reproducible digital systems rather than isolated human interpretation."
                    icon={Workflow}
                  />
                  <InsightCard
                    label="Tailwind"
                    title="AI increases the premium on data structure"
                    body="As more organizations attempt model-driven workflows, representation quality and lineage clarity become more economically important."
                    icon={BrainCircuit}
                  />
                  <InsightCard
                    label="Tailwind"
                    title="Services can open product categories"
                    body="A focused forward deployed model is now a credible path to building durable software and model IP in technically complex domains."
                    icon={BriefcaseBusiness}
                  />
                </div>
              </DeckSection>

              <DeckSection
                id="ask"
                index="08"
                label="The ask"
                title="The right capital partner accelerates the transition from services-backed execution to durable representation infrastructure."
                intro="Beag Labs is looking for aligned capital that understands technical workflow businesses, appreciates the value of a services-led wedge, and believes scientific AI will require deeper representation work than the market currently prices in."
              >
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[1.55rem] border border-black/8 bg-[#111111] p-6 text-white">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                      What investor capital unlocks
                    </div>
                    <ul className="mt-5 space-y-3 text-sm leading-7 text-white/72">
                      <li>More disciplined conversion of customer work into reusable data and representation infrastructure.</li>
                      <li>Faster productization around the scientific format layer and evaluation loop.</li>
                      <li>Ability to pursue higher-value deployments without starving long-term technical differentiation.</li>
                    </ul>
                  </div>

                  <div className="rounded-[1.55rem] border border-black/8 bg-white/90 p-6">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9f978d]">
                      Ideal partner profile
                    </div>
                    <ul className="mt-5 space-y-3 text-sm leading-7 text-[#57524c]">
                      <li>Believes services can be a wedge into real software and model businesses.</li>
                      <li>Understands scientific or technical workflow markets and the pace of enterprise adoption.</li>
                      <li>Prefers durable company formation over shallow AI feature arbitrage.</li>
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild className="rounded-full bg-[#111111] px-5 text-white hover:bg-[#262626]">
                        <Link href="https://cal.com/comradelemoncake/meet-the-founder" target="_blank">
                          Schedule a conversation
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </DeckSection>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
