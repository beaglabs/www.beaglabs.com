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
    <nav className="flex items-center justify-center gap-2 mt-12">
      {currentPage > 1 && (
        <a
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="text-xs text-[#555] hover:text-[#111] px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors"
        >
          Previous
        </a>
      )}
      <span className="text-xs text-[#999] px-3">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <a
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="text-xs text-[#555] hover:text-[#111] px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors"
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
      <p className="text-center text-[#999] py-16 text-sm">{emptyMessage}</p>
    )
  }
  if (papers && papers.length === 0) {
    return (
      <p className="text-center text-[#999] py-16 text-sm">{emptyMessage}</p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts?.map((post) => <BlogCard key={post.id} post={post} />)}
      {papers?.map((paper) => (
        <ResearchCard key={paper.id} paper={paper} />
      ))}
    </div>
  )
}

export { Pagination }
