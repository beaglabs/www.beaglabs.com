import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS_BY_TAG, GET_ALL_BLOG_TAGS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { PageHero } from '@/components/page-hero'
import { ogImageUrl } from '@/lib/seo'

export async function generateStaticParams() {
  try {
    const data = await fetchHygraph<{ blogPosts: { tags: string[] }[] }>(
      GET_ALL_BLOG_TAGS
    )
    return [...new Set(data.blogPosts.flatMap(post => post.tags))].map(tag => ({ tag }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const title = `#${decoded} — Blog — Beag Labs`
  const description = `Blog posts tagged ${decoded}.`
  const canonical = `https://beaglabs.com/blog/tag/${tag}`
  const ogUrl = ogImageUrl({
    title: `#${decoded}`,
    description,
    label: 'Blog Tag',
  })

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Beag Labs',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `Beag Labs — #${decoded}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  }
}

const POSTS_PER_PAGE = 9

export default async function BlogTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)

  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  let data: BlogPostsResponse
  try {
    data = await fetchHygraph<BlogPostsResponse>(GET_BLOG_POSTS_BY_TAG, {
      tag: decoded,
      first: POSTS_PER_PAGE,
      skip,
    })
  } catch {
    notFound()
  }

  if (data.blogPostsConnection.aggregate.count === 0) notFound()

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <main>
      <PageHero
        label="Blog tag"
        title={`#${decoded}`}
        description={<>{data.blogPostsConnection.aggregate.count} post{data.blogPostsConnection.aggregate.count !== 1 ? 's' : ''} tagged &ldquo;{decoded}&rdquo;.</>}
      />
      <div className="site-page-grid px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <BlogList
          posts={data.blogPosts}
          emptyMessage={`No posts tagged "${decoded}" yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/tag/${tag}`}
        />
      </div>
      </div>
    </main>
  )
}