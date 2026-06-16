import Link from 'next/link'
import type { ResearchPaper } from '@/lib/hygraph/types'

interface ResearchCardProps {
  paper: ResearchPaper
}

export function ResearchCard({ paper }: ResearchCardProps) {
  return (
    <Link href={`/research/${paper.slug}`}>
      <article className="group bg-white rounded-lg border border-[rgba(0,0,0,0.06)] p-6 hover:border-[rgba(0,0,0,0.12)] hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5">
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
      </article>
    </Link>
  )
}
