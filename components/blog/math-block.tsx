import katex from 'katex'
import type { MathBlock } from '@/lib/hygraph/types'

interface MathBlockProps {
  block: MathBlock
}

export function MathBlockRenderer({ block }: MathBlockProps) {
  let html: string
  try {
    html = katex.renderToString(block.latex, {
      displayMode: true,
      throwOnError: false,
      trust: true,
    })
  } catch {
    html = katex.renderToString('\\text{Invalid LaTeX}', {
      displayMode: true,
      throwOnError: false,
    })
  }

  return (
    <figure className="my-8">
      <div
        className="overflow-x-auto py-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {block.label && (
        <figcaption className="text-center text-xs text-[#999] mt-2 font-mono">
          {block.label}
        </figcaption>
      )}
    </figure>
  )
}
