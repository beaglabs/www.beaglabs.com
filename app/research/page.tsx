import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPERS } from '@/lib/hygraph/queries'
import type { ResearchPapersResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'

const PAPERS_PER_PAGE = 9

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const skip = (page - 1) * PAPERS_PER_PAGE

  const data = await fetchHygraph<ResearchPapersResponse>(
    GET_RESEARCH_PAPERS,
    {
      first: PAPERS_PER_PAGE,
      skip,
    }
  )

  const totalPages = Math.ceil(
    data.researchPapersConnection.aggregate.count / PAPERS_PER_PAGE
  )

  return (
    <main className="px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 grid grid-cols-1 gap-8 border-b border-[rgba(0,0,0,0.08)] pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
              Research
            </div>
            <h1 className="mb-3 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              Research
            </h1>
          </div>
          <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#4e4e4e] lg:justify-self-end">
            Papers, technical deep-dives, and research findings from active
            work across operational AI systems, data, and evaluation.
          </p>
        </div>
        <BlogList
          papers={data.researchPapers}
          emptyMessage="No papers published yet."
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/research"
        />
      </div>
    </main>
  )
}
