import type { Metadata } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { pageMetadata } from '@/lib/seo'

const blogDescription =
  'Practical notes on agentic ERP, enterprise Classes, governed workflows, and connecting legacy systems.'

export const metadata: Metadata = pageMetadata({
  title: 'Blog',
  description: blogDescription,
  path: '/blog',
  label: 'Blog',
  headline: 'Ideas behind the agentic back office.',
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
      {/* Shared dotted OG visual language, with accessible dynamic page copy. */}
      <section className="relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#1a1714] px-5 py-16 sm:py-20" style={{backgroundImage:'radial-gradient(circle at center, #e5632f 0 6px, transparent 6.5px), radial-gradient(circle at center, #f7c995 0 6px, transparent 6.5px), radial-gradient(circle at center, #fffaf3 0 6px, transparent 6.5px)',backgroundSize:'54px 18px, 54px 18px, 54px 18px',backgroundPosition:'0 0,18px 0,36px 0'}}>
        <div className="relative mx-auto flex max-w-[1040px] flex-col items-center border-[4px] border-[#1a1714] bg-[#fffaf3] px-6 py-12 text-center shadow-[10px_10px_0_#1a1714] sm:px-12 sm:py-16">
          <span className="border-2 border-[#1a1714] bg-[#e5632f] px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[.18em] shadow-[3px_3px_0_#1a1714]">Beag Labs · Journal</span>
          <h1 className="mt-8 max-w-[900px] font-[family-name:var(--font-roboto-condensed)] text-[length:min(68px,11vw)] font-black uppercase leading-[.95] tracking-[-.04em] text-[#1a1714]">Ideas behind the agentic back office.</h1>
          <div className="mt-8 h-[3px] w-full max-w-[460px] bg-[#1a1714]" />
          <p className="mt-7 max-w-[690px] text-lg font-bold leading-8 text-[#3d2f26]">Practical notes on agentic ERP, enterprise Classes, governed workflows, and connecting legacy systems.</p>
          <a href="mailto:james@beaglabs.com?subject=Subscribe%20to%20the%20Beag%20Labs%20blog" className="mt-8 border-b-2 border-[#1a1714] pb-1 font-mono text-xs font-black uppercase tracking-wider">Get updates →</a>
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
