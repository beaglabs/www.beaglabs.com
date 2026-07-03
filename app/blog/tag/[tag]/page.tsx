import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS_BY_TAG } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'

const POSTS_PER_PAGE = 9

interface TagPageProps {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function BlogTagPage({
  params,
  searchParams,
}: TagPageProps) {
  const { tag } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const data = await fetchHygraph<BlogPostsResponse>(GET_BLOG_POSTS_BY_TAG, {
    tag,
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
              Blog Tag
            </div>
            <h1 className="mb-3 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              #{tag}
            </h1>
          </div>
          <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#4e4e4e] lg:justify-self-end">
            {data.blogPostsConnection.aggregate.count} post
            {data.blogPostsConnection.aggregate.count !== 1 ? 's' : ''} tagged
            &nbsp;&ldquo;{tag}&rdquo;.
          </p>
        </div>
        <BlogList
          posts={data.blogPosts}
          emptyMessage={`No posts tagged "${tag}" yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/tag/${encodeURIComponent(tag)}`}
        />
      </div>
    </main>
  )
}
