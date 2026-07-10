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
    <main className="bg-[#FAFAF9] px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 border-b-[3px] border-[#111] pb-10">
          <span className="nb-label mb-5 inline-block">
            Journal
          </span>
          <h1 className="mb-3 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
            Blog
          </h1>
          <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#404040] font-medium">
            Project updates, case studies, and tutorials documenting how Beag
            Labs approaches applied AI systems in practice.
          </p>
        </div>
        <div className="mb-8">
          <BlogCategoryFilter />
        </div>
        <BlogList posts={data.blogPosts} emptyMessage="No posts yet." />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/blog"
        />
      </div>
    </main>
  )
}
