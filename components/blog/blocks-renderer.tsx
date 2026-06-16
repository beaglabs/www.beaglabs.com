import { MarkdownRenderer } from './markdown-renderer'
import { MathBlockRenderer } from './math-block'
import { MermaidBlockRenderer } from './mermaid-block'
import type { MathBlock, MermaidBlock } from '@/lib/hygraph/types'

interface BlocksRendererProps {
  markdown: string
  mathBlocks: MathBlock[]
  mermaidBlocks: MermaidBlock[]
}

/**
 * Interleaves math and mermaid blocks into the markdown body.
 *
 * Place markers in the body to position blocks:
 *   [math:0]  — inserts mathBlocks[0] here
 *   [mermaid:0] — inserts mermaidBlocks[0] here
 *
 * The marker is replaced with the rendered block. Everything else is
 * rendered as standard markdown.
 */
export function BlocksRenderer({
  markdown,
  mathBlocks,
  mermaidBlocks,
}: BlocksRendererProps) {
  // Split the markdown at marker positions, interleaving rendered blocks
  // Match [math:N] and [mermaid:N] markers (Hygraph strips HTML comments)
  const markerRegex = /\[(math|mermaid):(\d+)\]/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let partKey = 0

  while ((match = markerRegex.exec(markdown)) !== null) {
    // Render markdown segment before this marker
    const before = markdown.slice(lastIndex, match.index)
    if (before.trim()) {
      parts.push(<MarkdownRenderer key={`md-${partKey++}`}>{before}</MarkdownRenderer>)
    }

    const type = match[1]
    const idx = parseInt(match[2], 10)

    if (type === 'math' && mathBlocks[idx]) {
      parts.push(<MathBlockRenderer key={`math-${idx}`} block={mathBlocks[idx]} />)
    } else if (type === 'mermaid' && mermaidBlocks[idx]) {
      parts.push(<MermaidBlockRenderer key={`mermaid-${idx}`} block={mermaidBlocks[idx]} />)
    }

    lastIndex = match.index + match[0].length
  }

  // Render remaining markdown after last marker
  const after = markdown.slice(lastIndex)
  if (after.trim()) {
    parts.push(<MarkdownRenderer key={`md-${partKey++}`}>{after}</MarkdownRenderer>)
  }

  // If no markers at all, render the whole body as-is
  if (parts.length === 0) {
    return <MarkdownRenderer>{markdown}</MarkdownRenderer>
  }

  return <>{parts}</>
}
