import type { Metadata } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { pageMetadata } from '@/lib/seo'
import { EdgyHero, heroButtonSecondary } from '@/components/edgy-hero'

const blogDescription =
  'Practical notes on back office automation, document workflows, and governed modernization.'

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
      <EdgyHero
        background="daylight"
        eyebrow="Beag Labs · Journal"
        before="Ideas behind the"
        slab="agentic"
        after="back office."
        description="Practical notes on agentic ERP, enterprise Classes, governed workflows, and connecting legacy systems."
        next={{ href: '#posts', label: 'Latest posts' }}
        actions={<a href="mailto:james@beaglabs.com?subject=Subscribe%20to%20the%20Beag%20Labs%20blog" className={heroButtonSecondary}>Get updates →</a>}
      />

      {/* ─── CONTENT ─── */}
      <div id="posts" className="mx-auto max-w-[1440px] scroll-mt-20 px-6 py-14 lg:px-9 lg:py-16">
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
