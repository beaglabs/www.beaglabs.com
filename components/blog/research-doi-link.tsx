'use client'

import { Download } from 'lucide-react'
import posthog from 'posthog-js'

interface ResearchDoiLinkProps {
  doi: string
  title: string
}

export function ResearchDoiLink({ doi, title }: ResearchDoiLinkProps) {
  const href = `https://doi.org/10.5281/${doi}`

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8B7355] hover:bg-[#6b5740] rounded-lg transition-colors"
        onClick={() => posthog.capture('research_pdf_downloaded', { doi, title })}
      >
        <Download className="w-4 h-4" />
        Download PDF
      </a>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-[#999] hover:text-[#8B7355] underline underline-offset-2 transition-colors"
      >
        DOI: {doi}
      </a>
    </div>
  )
}
