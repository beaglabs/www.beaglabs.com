'use client'

import { useEffect, useRef, useState } from 'react'
import type { MermaidBlock } from '@/lib/hygraph/types'

interface MermaidBlockProps {
  block: MermaidBlock
}

export function MermaidBlockRenderer({ block }: MermaidBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const id = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    let cancelled = false
    import('mermaid').then((mermaid) => {
      if (cancelled) return
      mermaid.default.initialize({ startOnLoad: false, theme: 'neutral' })
      mermaid.default
        .render(id.current, block.diagram)
        .then(({ svg }) => {
          if (!cancelled && ref.current) {
            ref.current.innerHTML = svg
            setError(null)
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message)
        })
    })
    return () => { cancelled = true }
  }, [block.diagram])

  return (
    <figure className="my-8">
      {error ? (
        <div className="text-xs text-red-500 font-mono bg-red-50 p-4 rounded-lg">
          Mermaid error: {error}
        </div>
      ) : (
        <div
          ref={ref}
          className="flex justify-center overflow-x-auto py-4"
        />
      )}
      {block.label && (
        <figcaption className="text-center text-xs text-[#999] mt-2 font-mono">
          {block.label}
        </figcaption>
      )}
    </figure>
  )
}
