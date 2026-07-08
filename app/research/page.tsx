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
    <main className="bg-[#FAFAF9] px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 border-b-[3px] border-[#111] pb-10">
          <span className="nb-label mb-5 inline-block">
            Research
          </span>
          <h1 className="mb-3 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            Research
          </h1>
          <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#404040] font-medium">
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
