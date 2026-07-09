import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { EmailCapture } from "@/components/cookbook/email-capture"
import { SampleRecipe } from "@/components/cookbook/sample-recipe"
import { parts } from "@/data/cookbook/parts"
import { recipes } from "@/data/cookbook/recipes"
import { getRecipesByPart } from "@/data/cookbook/recipes"

export const metadata: Metadata = {
  title: "ML Cookbook 2026",
  description:
    "100 modern training recipes every AI engineer should know. A practical collection across language models, vision, 3D, speech, robotics, agents, and synthetic data.",
  openGraph: {
    title: "ML Cookbook 2026 — Beag Labs",
    description:
      "100 modern training recipes every AI engineer should know. GRPO, Flow Matching, World Models, and more — with pipeline diagrams, compute estimates, and paper references.",
    url: "https://beaglabs.com/cookbook",
    siteName: "Beag Labs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beag Labs ML Cookbook 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ML Cookbook 2026 — Beag Labs",
    description:
      "100 modern training recipes every AI engineer should know. GRPO, Flow Matching, World Models, and more — with pipeline diagrams, compute estimates, and paper references.",
    images: ["/og-image.png"],
  },
}

const partEmojis: Record<string, string> = {
  "language-models": "01",
  vision: "02",
  "3d-generation": "03",
  speech: "04",
  robotics: "05",
  agents: "06",
  "synthetic-data": "07",
}

export default function CookbookPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <section className="relative border-b-[3px] border-[#111] bg-[#FAFAF9] pt-[calc(4rem+2.375rem)]">
        <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-9 lg:py-28">
          <span className="nb-label mb-6 inline-block">New</span>

          <h1 className="mb-2 max-w-[900px] text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[60px] lg:text-[72px]">
            ML Cookbook
          </h1>
          <h1 className="mb-6 max-w-[900px] text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#FF5F1F] sm:text-[60px] lg:text-[72px]">
            2026
          </h1>

          <p className="mb-2 max-w-[700px] text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-[#111]">
            {recipes.length} Modern Training Recipes Every AI Engineer Should Know
          </p>

          <p className="mb-8 max-w-[650px] text-[15px] leading-[1.65] text-[#555]">
            A practical collection of state-of-the-art training recipes across{" "}
            {parts.length} domains: language models, vision, 3D generation,
            speech, robotics, agents, and synthetic data. Each recipe includes
            the training pipeline, compute requirements, open-source
            implementations, and key papers.
          </p>

          <div className="mb-8 max-w-[520px]">
            <EmailCapture />
          </div>

          <div className="flex flex-wrap gap-2">
            {["GRPO", "DAPO", "On-Policy Distillation", "RLVR", "Flow Matching", "World Models", "Tool-Use RL"].map(
              (tag) => (
                <span key={tag} className="nb-chip text-[10px]">
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
          <span className="nb-label mb-6 inline-block">Contents</span>
          <h2 className="mb-12 text-[38px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] sm:text-[48px]">
            What&rsquo;s Inside
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parts
              .filter((p) => getRecipesByPart(p.id).length > 0)
              .map((part) => {
                const partRecipes = getRecipesByPart(part.id)
                return (
                  <div key={part.id} className="nb-card p-6">
                    <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                      Part {partEmojis[part.id]}
                    </div>
                    <h3 className="mb-2 text-[20px] font-extrabold tracking-[-0.03em] text-[#111]">
                      {part.title}
                    </h3>
                    <p className="mb-4 text-[13px] leading-[1.6] text-[#555]">
                      {part.description}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#999]">
                      {partRecipes.length} recipe{partRecipes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )
              })}
          </div>
        </div>
      </section>

      <section className="nb-section-divider bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
          <span className="nb-label mb-6 inline-block">Format</span>
          <h2 className="mb-4 text-[38px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111] sm:text-[48px]">
            Every Recipe, One Format
          </h2>
          <p className="mb-10 max-w-[650px] text-[15px] leading-[1.65] text-[#555]">
            Instead of summarizing papers, each recipe extracts the training
            methodology: the problem it solves, the pipeline, architecture
            decisions, compute requirements, and where it works best.
          </p>

          <SampleRecipe />
        </div>
      </section>

      <section className="nb-section-divider bg-[#FF5F1F]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
          <div className="mx-auto max-w-[600px] text-center">
            <h2 className="mb-4 text-[32px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#111] sm:text-[40px]">
              Get Your Free Copy
            </h2>
            <p className="mb-8 text-[15px] leading-[1.65] text-[#111]">
              {recipes.length} training recipes with pipeline diagrams, compute
              estimates, and paper references. Delivered as a PDF to your inbox.
            </p>
            <div className="mx-auto max-w-[480px]">
              <EmailCapture />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
