import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'

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
    <main className="px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 grid grid-cols-1 gap-8 border-b border-[rgba(0,0,0,0.08)] pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
              Journal
            </div>
            <h1 className="mb-3 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              Blog
            </h1>
          </div>
          <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#4e4e4e] lg:justify-self-end">
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
