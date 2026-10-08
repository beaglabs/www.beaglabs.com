import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { SolutionPage } from '@/components/solution-page'

export const metadata: Metadata = pageMetadata({
  title: "Document Automation",
  description: "Extract useful information from PDFs and office files, review results, and turn content into repeatable workflows.",
  path: '/solutions/document-automation',
  label: "Document Automation",
})

export default function Page() {
  return <SolutionPage content={{
    eyebrow: "Document Automation",
    title: "Turn documents into structured work.",
    description: "Extract useful information from PDFs and office files, review results, and turn content into repeatable workflows.",
    result: "From PDFs to decisions",
    steps: [{"title":"Document intake","description":"Bring PDFs, forms, policies, spreadsheets and office files into one workflow."},{"title":"Structured extraction","description":"Extract fields, requirements and action items into consistent structured outputs."},{"title":"Human review","description":"Review source evidence and approve results before downstream action."}],
  }} />
}
