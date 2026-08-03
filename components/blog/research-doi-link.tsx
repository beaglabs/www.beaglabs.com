'use client'

import { Download } from 'lucide-react'
import posthog from 'posthog-js'

interface ResearchDoiLinkProps {
  doi: string
  title: string
}

export function ResearchDoiLink({ doi, title }: ResearchDoiLinkProps) {
  const href = `https://doi.org/${doi}`

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(0,0,0,0.08)] pt-4">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2a2a2a]"
        onClick={() => posthog.capture('research_pdf_downloaded', { doi, title })}
      >
        <Download className="w-4 h-4" />
        Download PDF
      </a>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#777] underline underline-offset-2 transition-colors hover:text-[#ff5f1f]"
      >
        DOI: {doi}
      </a>
    </div>
  )
}
