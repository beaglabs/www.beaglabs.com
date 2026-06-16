import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPERS_BY_AUTHOR } from '@/lib/hygraph/queries'
import type { ResearchPapersResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const PAPERS_PER_PAGE = 9

interface AuthorPageProps {
  params: Promise<{ author: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ResearchAuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const { author } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * PAPERS_PER_PAGE

  const data = await fetchHygraph<ResearchPapersResponse>(
    GET_RESEARCH_PAPERS_BY_AUTHOR,
    {
      author,
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
            {author}
          </h1>
          <p className="text-[#555]">
            {data.researchPapersConnection.aggregate.count} paper
            {data.researchPapersConnection.aggregate.count !== 1 ? 's' : ''} by{' '}
            {author}
          </p>
        </div>
        <BlogList
          papers={data.researchPapers}
          emptyMessage={`No papers by ${author} yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/research/authors/${encodeURIComponent(author)}`}
        />
      </main>
      <SiteFooter />
    </>
  )
}
