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
 *   [math:0]     — inserts mathBlocks[0] here
 *   [mermaid:0]  — inserts mermaidBlocks[0] here
 *
 * Adjacent markers (no text between them) render side-by-side in a flex row.
 * Hygraph escapes [ as \\[ in markdown — both forms are matched.
 */
export function BlocksRenderer({
  markdown,
  mathBlocks,
  mermaidBlocks,
}: BlocksRendererProps) {
  const markerRegex = /\\?\[(math|mermaid):(\d+)\]/g

  // Collect segments: { type: 'md'|'block', content }
  interface Segment {
    type: 'md' | 'block'
    content: string
    blockType?: 'math' | 'mermaid'
    blockIndex?: number
  }
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = markerRegex.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index)
    segments.push({ type: 'md', content: before })

    segments.push({
      type: 'block',
      content: match[0],
      blockType: match[1] as 'math' | 'mermaid',
      blockIndex: parseInt(match[2], 10),
    })

    lastIndex = match.index + match[0].length
  }

  // Trailing markdown
  const after = markdown.slice(lastIndex)
  if (after) {
    segments.push({ type: 'md', content: after })
  }

  // No markers at all — render markdown as-is
  if (segments.every((s) => s.type === 'md')) {
    return <MarkdownRenderer>{markdown}</MarkdownRenderer>
  }

  // Render segments, grouping consecutive blocks into side-by-side rows
  const parts: React.ReactNode[] = []
  let partKey = 0
  let pendingBlocks: React.ReactNode[] = []

  const flushPending = () => {
    if (pendingBlocks.length === 0) return
    if (pendingBlocks.length === 1) {
      parts.push(pendingBlocks[0])
    } else {
      parts.push(
        <div
          key={`side-${partKey++}`}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8"
        >
          {pendingBlocks.map((b, i) => (
            <div key={i} className="min-w-0">
              {b}
            </div>
          ))}
        </div>
      )
    }
    pendingBlocks = []
  }

  for (const seg of segments) {
    if (seg.type === 'md') {
      flushPending()
      if (seg.content.trim()) {
        parts.push(
          <MarkdownRenderer key={`md-${partKey++}`}>
            {seg.content}
          </MarkdownRenderer>
        )
      }
    } else {
      let block: React.ReactNode = null
      if (
        seg.blockType === 'math' &&
        seg.blockIndex !== undefined &&
        mathBlocks[seg.blockIndex]
      ) {
        block = (
          <MathBlockRenderer
            key={`math-${seg.blockIndex}`}
            block={mathBlocks[seg.blockIndex]}
          />
        )
      } else if (
        seg.blockType === 'mermaid' &&
        seg.blockIndex !== undefined &&
        mermaidBlocks[seg.blockIndex]
      ) {
        block = (
          <MermaidBlockRenderer
            key={`mermaid-${seg.blockIndex}`}
            block={mermaidBlocks[seg.blockIndex]}
          />
        )
      }
      if (block) pendingBlocks.push(block)
    }
  }
  flushPending()

  return <>{parts}</>
}
