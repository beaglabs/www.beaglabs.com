import type { Metadata } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPERS } from '@/lib/hygraph/queries'
import type { ResearchPapersResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BrutalistPhoto } from '@/components/brutalist-photo'

export const metadata: Metadata = {
  title: 'Research',
  description: 'Papers, technical deep-dives, and research findings from active work across operational AI systems, data, and evaluation.',
  alternates: {
    canonical: 'https://www.beaglabs.com/research',
  },
  openGraph: {
    title: 'Research — Beag Labs',
    description: 'Papers, technical deep-dives, and research findings from active work across operational AI systems, data, and evaluation.',
    url: 'https://www.beaglabs.com/research',
  },
}

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
        <div className="mb-14 grid grid-cols-1 items-center gap-12 border-b-[3px] border-[#111] pb-10 lg:grid-cols-[1.4fr_minmax(320px,440px)]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="nb-label">Research</span>
              <span className="block h-px w-10 bg-[#111]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">technical</span>
            </div>
            <h1 className="mb-3 text-[42px] font-extrabold leading-[1.02] tracking-[-0.05em] text-[#111] sm:text-[52px] lg:text-[64px]">
              Research
            </h1>
            <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#404040] font-medium">
              Papers, technical deep-dives, and research findings from active
              work across operational AI systems, data, and evaluation.
            </p>
          </div>
          <BrutalistPhoto
            src="https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg"
            alt="Research workspace with papers and notebook"
            badge="TECHNICAL"
            meta="beaglabs / research"
            rounded
            className="mx-auto w-full max-w-[400px]"
            shadowSize="md"
          />
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
