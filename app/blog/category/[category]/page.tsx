import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS_BY_CATEGORY, GET_ALL_CATEGORIES } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'

export async function generateStaticParams() {
  try {
    const data = await fetchHygraph<{ blogPostsGroup: { field: string }[] }>(
      GET_ALL_CATEGORIES
    )
    return data.blogPostsGroup.map((g) => ({
      category: encodeURIComponent(g.field),
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const decoded = decodeURIComponent(category)
  return {
    title: `${decoded} — Blog — Beag Labs`,
    description: `Blog posts in the ${decoded} category.`,
    alternates: {
      canonical: `https://www.beaglabs.com/blog/category/${category}`,
    },
  }
}

const POSTS_PER_PAGE = 9

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { category } = await params
  const decoded = decodeURIComponent(category)

  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  let data: BlogPostsResponse
  try {
    data = await fetchHygraph<BlogPostsResponse>(GET_BLOG_POSTS_BY_CATEGORY, {
      category: decoded,
      first: POSTS_PER_PAGE,
      skip,
    })
  } catch {
    notFound()
  }

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <main className="px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 grid grid-cols-1 gap-8 border-b border-[rgba(0,0,0,0.08)] pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
              Blog Category
            </div>
            <h1 className="mb-3 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              {decoded}
            </h1>
          </div>
          <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#4e4e4e] lg:justify-self-end">
            {data.blogPostsConnection.aggregate.count} post
            {data.blogPostsConnection.aggregate.count !== 1 ? 's' : ''} in this
            category.
          </p>
        </div>
        <div className="mb-8">
          <BlogCategoryFilter currentCategory={decoded} />
        </div>
        <BlogList
          posts={data.blogPosts}
          emptyMessage={`No posts in ${decoded} yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/category/${category}`}
        />
      </div>
    </main>
  )
}
