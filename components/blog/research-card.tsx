import Link from 'next/link'
import type { ResearchPaper } from '@/lib/hygraph/types'

interface ResearchCardProps {
  paper: ResearchPaper
}

function getImageUrl(paper: ResearchPaper): string | null {
  if (paper.coverImage?.url) return paper.coverImage.url
  if (paper.seoImage) return paper.seoImage
  return null
}

export function ResearchCard({ paper }: ResearchCardProps) {
  const imageUrl = getImageUrl(paper)

  return (
    <Link href={`/research/${paper.slug}`}>
      <article className="group bg-white rounded-lg border border-[rgba(0,0,0,0.06)] border-l-[3px] border-l-[#8B7355] overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={paper.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <p className="font-mono text-xs text-[#555] mb-2">
            {paper.authors.join(', ')}
          </p>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-[#111] mb-2 group-hover:text-[#8B7355] transition-colors">
            {paper.title}
          </h3>
          <p className="text-sm text-[#555] line-clamp-3 mb-3 leading-relaxed">
            {paper.abstract}
          </p>
          <div className="flex items-center gap-3 text-xs text-[#999]">
            <time dateTime={paper.publishedAt}>
              {new Date(paper.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {paper.doi && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#8B7355]">DOI</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
