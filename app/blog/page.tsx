import type { Metadata } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { PageHero } from '@/components/page-hero'
import { pageMetadata } from '@/lib/seo'

const blogDescription =
  'Notes on building the agentic ERP: data models agents understand, back-office work agents run, and approvals where they matter.'

export const metadata: Metadata = pageMetadata({
  title: 'Blog',
  description: blogDescription,
  path: '/blog',
  label: 'Blog',
})

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
      <PageHero
        label="Blog"
        title="Building the agentic ERP"
        description={blogDescription}
        below={<a href="mailto:james@beaglabs.com?subject=Subscribe%20to%20the%20Beag%20Labs%20blog" className="text-[12px] font-bold uppercase tracking-[0.08em] underline decoration-2 underline-offset-4">Sign up for updates by email</a>}
      />

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
