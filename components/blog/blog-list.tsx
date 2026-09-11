import { BlogCard } from './blog-card'
import { ResearchCard } from './research-card'
import type { BlogPost, ResearchPaper } from '@/lib/hygraph/types'

interface BlogListProps {
  posts?: BlogPost[]
  papers?: ResearchPaper[]
  /** When true, the first post renders as a full-width featured card. */
  featured?: boolean
  emptyMessage?: string
}

function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number
  totalPages: number
  basePath: string
}) {
  if (totalPages <= 1) return null

  const separator = basePath.includes('?') ? '&' : '?'

  const linkClass =
    'nb-btn-white inline-flex items-center px-5 py-2.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#111]'

  return (
    <nav className="mt-14 flex items-center justify-center gap-4">
      {currentPage > 1 && (
        <a href={`${basePath}${separator}page=${currentPage - 1}`} className={linkClass}>
          ← Prev
        </a>
      )}
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#555]">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages && (
        <a href={`${basePath}${separator}page=${currentPage + 1}`} className={linkClass}>
          Next →
        </a>
      )}
    </nav>
  )
}

export function BlogList({
  posts,
  papers,
  featured = false,
  emptyMessage = 'No posts found.',
}: BlogListProps) {
  if (posts && posts.length === 0) {
    return <p className="py-16 text-center text-sm text-[#999]">{emptyMessage}</p>
  }
  if (papers && papers.length === 0) {
    return <p className="py-16 text-center text-sm text-[#999]">{emptyMessage}</p>
  }

  const showFeatured = featured && !!posts && posts.length > 0
  const featuredPost = showFeatured ? posts![0] : null
  const gridPosts = showFeatured ? posts!.slice(1) : posts ?? []

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
      {featuredPost && <BlogCard key={featuredPost.id} post={featuredPost} featured />}
      {gridPosts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
      {papers?.map((paper) => (
        <ResearchCard key={paper.id} paper={paper} />
      ))}
    </div>
  )
}

export { Pagination }
