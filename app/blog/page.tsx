import type { Metadata } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Project updates, case studies, and tutorials documenting how Beag Labs approaches applied AI systems in practice.',
  alternates: {
    canonical: 'https://www.beaglabs.com/blog',
  },
  openGraph: {
    title: 'Blog — Beag Labs',
    description: 'Project updates, case studies, and tutorials documenting how Beag Labs approaches applied AI systems in practice.',
    url: 'https://www.beaglabs.com/blog',
  },
}

const POSTS_PER_PAGE = 9

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const data = await fetchHygraph<BlogPostsResponse>(GET_BLOG_POSTS, {
    first: POSTS_PER_PAGE,
    skip,
  })

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <main>
      {/* ─── HERO BAND ─── */}
      <section className="border-b-[3px] border-[#111] bg-[#ff5f1f]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-20 lg:px-9 lg:py-20">
          <span className="font-mono text-[13px] font-bold uppercase tracking-[0.24em] text-[#111]">
            [ Blog ]
          </span>
          <div className="max-w-[720px] lg:justify-self-end">
            <h1 className="mb-5 text-[44px] font-extrabold leading-[1.0] tracking-[-0.05em] text-[#111] sm:text-[56px] lg:text-[68px]">
              We ship models. We also write.
            </h1>
            <p className="mb-9 max-w-[600px] text-[17px] font-medium leading-[1.6] text-[#111]">
              Project updates, case studies, and tutorials documenting how Beag
              Labs approaches applied AI systems in practice.
            </p>
            <a
              href="mailto:james@beaglabs.com?subject=Subscribe%20to%20the%20Beag%20Labs%20blog"
              className="nb-btn inline-flex items-center gap-2.5 bg-[#111] px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#ff5f1f]"
            >
              Sign up for updates
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
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

      {/* ─── CONTENT ─── */}
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-9 lg:py-16">
        <div className="mb-10">
          <BlogCategoryFilter />
        </div>
        <BlogList
          posts={data.blogPosts}
          featured={page === 1}
          emptyMessage="No posts yet."
        />
        <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
      </div>
    </main>
  )
}
