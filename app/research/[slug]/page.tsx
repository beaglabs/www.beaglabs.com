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
      <header className="mb-10 border-b border-[rgba(0,0,0,0.08)] pb-8">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C7661D]">
          <time dateTime={paper.publishedAt}>
            {new Date(paper.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })}
          </time>
        </p>
        <h1 className="mb-4 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
          {paper.title}
        </h1>
        <ResearchAuthorList authors={paper.authors} />
      </header>

      <div className="mb-8 rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[#f1ede7] p-6 lg:p-7">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
          Abstract
        </h2>
        <p className="mb-4 text-[16px] leading-[1.82] text-[#555]">{paper.abstract}</p>

        {paper.doi && <ResearchDoiLink doi={paper.doi} title={paper.title} />}
      </div>

      {(paper.coverImage || paper.seoImage) && (
        <img
          src={paper.coverImage?.url || paper.seoImage!}
          alt={paper.title}
          className="mb-10 w-full rounded-[24px] border border-[rgba(17,17,17,0.08)]"
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
