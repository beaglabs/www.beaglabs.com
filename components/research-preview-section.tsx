import { fetchHygraph } from "@/lib/hygraph/client"
import { GET_RESEARCH_PAPERS } from "@/lib/hygraph/queries"
import type { ResearchPaper, ResearchPapersResponse } from "@/lib/hygraph/types"

const fallbackPapers = [
  {
    id: "fallback-1",
    slug: "/research",
    title: "Model evaluation under operational constraints",
    abstract:
      "How to evaluate systems when latency, ambiguity, and operator context matter as much as top-line benchmark scores.",
    publishedAt: "2026-06-01",
  },
  {
    id: "fallback-2",
    slug: "/research",
    title: "Synthetic data for robotics and simulation pipelines",
    abstract:
      "Designing data generation workflows that improve coverage without drifting away from the conditions systems face in deployment.",
    publishedAt: "2026-05-01",
  },
  {
    id: "fallback-3",
    slug: "/research",
    title: "Applied notes from high-context deployments",
    abstract:
      "Patterns from production-facing work where model behavior has to remain legible to analysts, engineers, and operators.",
    publishedAt: "2026-04-01",
  },
]

function formatResearchDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

async function getResearchPreview() {
  if (!process.env.HYGRAPH_ENDPOINT || !process.env.HYGRAPH_TOKEN) {
    return fallbackPapers
  }

  try {
    const data = await fetchHygraph<ResearchPapersResponse>(GET_RESEARCH_PAPERS, {
      first: 3,
      skip: 0,
    })

    if (data.researchPapers.length === 0) {
      return fallbackPapers
    }

    return data.researchPapers
  } catch {
    return fallbackPapers
  }
}

export async function ResearchPreviewSection() {
  const papers = await getResearchPreview()

  return (
    <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Research
          </div>
          <h2 className="mb-4 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
            Papers, field notes, and technical work.
          </h2>
          <p className="max-w-[430px] text-[17px] leading-[1.72] text-[#4e4e4e]">
            The homepage should pull recent research into the main narrative so
            the lab identity is visible immediately.
          </p>
        </div>

        <div className="overflow-hidden border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.72)]">
          {papers.map((paper, index) => {
            const href = paper.slug.startsWith("/")
              ? paper.slug
              : `/research/${paper.slug}`

            return (
              <a
                key={paper.id}
                href={href}
                className={`grid gap-4 px-5 py-5 transition-colors duration-200 hover:bg-white lg:grid-cols-[110px_minmax(0,1fr)_120px] ${
                  index > 0 ? "border-t border-[rgba(17,17,17,0.08)]" : ""
                }`}
              >
                <div className="pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C7661D]">
                  {formatResearchDate(paper.publishedAt)}
                </div>
                <div>
                  <div className="mb-2 text-[21px] leading-[1.15] text-[#111]">
                    {paper.title}
                  </div>
                  <div className="text-[14px] leading-[1.7] text-[#555]">
                    {paper.abstract}
                  </div>
                </div>
                <div className="text-left text-[12px] uppercase tracking-[0.08em] text-[#666] lg:text-right">
                  Open research
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
