import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPERS } from '@/lib/hygraph/queries'
import type { ResearchPapersResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

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
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            Research
          </h1>
          <p className="text-[#555]">
            Papers, technical deep-dives, and research findings.
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
      </main>
      <SiteFooter />
    </>
  )
}
