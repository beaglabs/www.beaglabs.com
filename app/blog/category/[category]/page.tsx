import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS_BY_CATEGORY } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const POSTS_PER_PAGE = 9

interface CategoryPageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const data = await fetchHygraph<BlogPostsResponse>(
    GET_BLOG_POSTS_BY_CATEGORY,
    { category, first: POSTS_PER_PAGE, skip }
  )

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            {category}
          </h1>
          <p className="text-[#555]">
            {data.blogPostsConnection.aggregate.count} post
            {data.blogPostsConnection.aggregate.count !== 1 ? 's' : ''}
          </p>
        </div>
        <BlogCategoryFilter currentCategory={category} />
        <BlogList
          posts={data.blogPosts}
          emptyMessage={`No posts in ${category} yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/category/${encodeURIComponent(category)}`}
        />
      </main>
      <SiteFooter />
    </>
  )
}
