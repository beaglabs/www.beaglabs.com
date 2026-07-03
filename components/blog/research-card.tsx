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
      <article className="group overflow-hidden rounded-[24px] border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.76)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white">
        {imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={paper.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="p-6 lg:p-7">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C7661D]">
            {paper.authors.join(', ')}
          </p>
          <h3 className="mb-3 text-[24px] leading-[1.08] tracking-[-0.03em] text-[#111] transition-colors group-hover:text-[#C7661D]">
            {paper.title}
          </h3>
          <p className="mb-4 line-clamp-3 text-[14px] leading-[1.75] text-[#555]">
            {paper.abstract}
          </p>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#888]">
            <time dateTime={paper.publishedAt}>
              {new Date(paper.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </time>
            {paper.doi && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#C7661D]">DOI</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
