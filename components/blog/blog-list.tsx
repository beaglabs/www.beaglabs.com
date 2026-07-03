import { BlogCard } from './blog-card'
import { ResearchCard } from './research-card'
import type { BlogPost, ResearchPaper } from '@/lib/hygraph/types'

interface BlogListProps {
  posts?: BlogPost[]
  papers?: ResearchPaper[]
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

  return (
    <nav className="mt-12 flex items-center justify-center gap-3">
      {currentPage > 1 && (
        <a
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-[#555] transition-colors hover:bg-white hover:text-[#111]"
        >
          Previous
        </a>
      )}
      <span className="px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8c8c8c]">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <a
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-[#555] transition-colors hover:bg-white hover:text-[#111]"
        >
          Next
        </a>
      )}
    </nav>
  )
}

export function BlogList({
  posts,
  papers,
  emptyMessage = 'No posts found.',
}: BlogListProps) {
  if (posts && posts.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[#999]">{emptyMessage}</p>
    )
  }
  if (papers && papers.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[#999]">{emptyMessage}</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
      {posts?.map((post) => <BlogCard key={post.id} post={post} />)}
      {papers?.map((paper) => (
        <ResearchCard key={paper.id} paper={paper} />
      ))}
    </div>
  )
}

export { Pagination }
