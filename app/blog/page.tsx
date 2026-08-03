import type { Metadata } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { BrutalistPhoto } from '@/components/brutalist-photo'

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
    <main className="px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 grid grid-cols-1 items-center gap-12 border-b-[3px] border-[#111] pb-10 lg:grid-cols-[1.4fr_minmax(320px,440px)]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="nb-label">Journal</span>
              <span className="block h-px w-10 bg-[#111]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">applied AI</span>
            </div>
            <h1 className="mb-3 text-[42px] font-extrabold leading-[1.02] tracking-[-0.05em] text-[#111] sm:text-[52px] lg:text-[64px]">
              Blog
            </h1>
            <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#404040] font-medium">
              Project updates, case studies, and tutorials documenting how Beag
              Labs approaches applied AI systems in practice.
            </p>
          </div>
          <BrutalistPhoto
            src="https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg"
            alt="Notebook and pen on a desk"
            badge="JOURNAL"
            meta="beaglabs / blog"
            rounded
            className="mx-auto w-full max-w-[400px]"
            shadowSize="md"
          />
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
