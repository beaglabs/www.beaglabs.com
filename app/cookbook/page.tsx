import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { BrutalistPhoto } from "@/components/brutalist-photo"
import { SampleRecipe } from "@/components/cookbook/sample-recipe"
import { parts } from "@/data/cookbook/parts"
import { recipes } from "@/data/cookbook/recipes"
import { getRecipesByPart } from "@/data/cookbook/recipes"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "ML Cookbook 2026",
  description:
    "52 modern training recipes every AI engineer should know. GRPO, Flow Matching, World Models, and more — with pipeline diagrams, compute estimates, and paper references.",
  path: "/cookbook",
  label: "Cookbook",
  ogDescription:
    "52 modern training recipes every AI engineer should know. GRPO, Flow Matching, World Models, and more — with pipeline diagrams, compute estimates, and paper references.",
})

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

      <section className="relative flex min-h-[calc(100vh-3rem)] flex-col justify-center border-b-[3px] border-[#111] bg-[#FAFAF9] pt-[calc(3rem+2.375rem)]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_minmax(360px,500px)] lg:px-9 lg:py-14">
          <div className="flex flex-col items-start text-left">
            <div className="mb-6 flex items-center gap-3">
              <span className="nb-label">New</span>
              <span className="block h-px w-10 bg-[#111]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">2026 edition</span>
            </div>

            <h1 className="mb-2 text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[60px] lg:text-[72px]">
              The ML Engineer&rsquo;s
            </h1>
            <h1 className="mb-2 text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[60px] lg:text-[72px]">
              Cookbook
            </h1>
            <h1 className="mb-6 text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#ff5f1f] sm:text-[60px] lg:text-[72px]">
              2026 Edition
            </h1>

            <p className="mb-2 max-w-[700px] text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-[#111]">
              52 recipes — GRPO, Flow Matching, World Models, and everything in between
            </p>

            <p className="mb-8 max-w-[650px] text-[15px] leading-[1.65] text-[#555]">
              A cookbook of modern training methodologies for AI engineers who build. Centered on the
              recipes that actually matter right now — spanning{" "}
              {parts.length} domains — with pipeline diagrams, compute estimates, and paper references.
            </p>

            <a
              href="/beag-labs-ml-cookbook-2026.pdf"
              download
              className="nb-btn-orange group mb-4 inline-flex items-center gap-3 px-6 py-3 text-[12px]"
            >
              Download the PDF
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </a>

            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777]">
              No email required · Direct download
            </p>
          </div>

          <BrutalistPhoto
            src="https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg"
            alt="Open cookbook on a wooden surface"
            badge="52 RECIPES"
            meta="beaglabs / cookbook"
            rounded
            className="mx-auto w-full max-w-[480px]"
          />
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
                    <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
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

      <section className="nb-section-divider bg-[#ff5f1f]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 className="mb-4 text-[32px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#111] sm:text-[40px]">
              Get Your Free Copy
            </h2>
            <p className="mb-8 text-[15px] leading-[1.65] text-[#111]">
              52 training recipes with pipeline diagrams, compute
              estimates, and paper references. Direct download — no email.
            </p>
            <a
              href="/beag-labs-ml-cookbook-2026.pdf"
              download
              className="nb-btn-orange group mx-auto inline-flex items-center gap-3 px-6 py-3 text-[12px]"
            >
              Download the PDF
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
