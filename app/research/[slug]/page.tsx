import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPER } from '@/lib/hygraph/queries'
import type { ResearchPaperResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { MarkdownRenderer } from '@/components/blog/markdown-renderer'
import { BlocksRenderer } from '@/components/blog/blocks-renderer'
import { ResearchAuthorList } from '@/components/blog/research-author-list'
import { PostTracker } from '@/components/blog/post-tracker'
import { ResearchDoiLink } from '@/components/blog/research-doi-link'

interface ResearchPaperPageProps {
  params: Promise<{ slug: string }>
}

function extractHeadings(markdown: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Array<{ id: string; text: string; level: number }> = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    headings.push({ id, text, level })
  }

  return headings
}

export async function generateMetadata({ params }: ResearchPaperPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<ResearchPaperResponse>(
    GET_RESEARCH_PAPER,
    { slug },
    isDraft
  )

  if (!data.researchPaper) {
    return { title: 'Not Found' }
  }

  return {
    title: data.researchPaper.seoTitle || data.researchPaper.title,
    description:
      data.researchPaper.seoDescription || data.researchPaper.abstract,
  }
}

export default async function ResearchPaperPage({
  params,
}: ResearchPaperPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<ResearchPaperResponse>(
    GET_RESEARCH_PAPER,
    { slug },
    isDraft
  )

  if (!data.researchPaper) {
    notFound()
  }

  const paper = data.researchPaper
  const toc = extractHeadings(paper.body.markdown)

  return (
    <BlogLayout toc={toc} isDraft={isDraft}>
      <PostTracker
        eventName="research_paper_viewed"
        properties={{ slug, title: paper.title, doi: paper.doi ?? undefined }}
      />
      <header className="mb-10">
        <p className="text-xs text-[#999] mb-3">
          <time dateTime={paper.publishedAt}>
            {new Date(paper.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#111] mb-4">
          {paper.title}
        </h1>
        <ResearchAuthorList authors={paper.authors} />
      </header>

      <div className="bg-[#f5f5f5] border-l-[3px] border-l-[#8B7355] p-6 rounded-r-lg mb-6">
        <h2 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">
          Abstract
        </h2>
        <p className="text-sm text-[#555] leading-relaxed mb-4">{paper.abstract}</p>

        {paper.doi && <ResearchDoiLink doi={paper.doi} title={paper.title} />}
      </div>

      {(paper.coverImage || paper.seoImage) && (
        <img
          src={paper.coverImage?.url || paper.seoImage!}
          alt={paper.title}
          className="w-full rounded-lg mb-10"
        />
      )}

      <BlocksRenderer
        markdown={paper.body.markdown}
        mathBlocks={paper.mathBlock ?? []}
        mermaidBlocks={paper.mermaidBlock ?? []}
        tableBlocks={paper.tableBlock ?? []}
      />
    </BlogLayout>
  )
}
