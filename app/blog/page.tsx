import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

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
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            Blog
          </h1>
          <p className="text-[#555]">
            Project updates, case studies, and tutorials.
          </p>
        </div>
        <BlogCategoryFilter />
        <BlogList posts={data.blogPosts} emptyMessage="No posts yet." />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/blog"
        />
      </main>
      <SiteFooter />
    </>
  )
}
