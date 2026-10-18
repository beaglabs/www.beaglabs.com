import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { SolutionPage } from '@/components/solution-page'

export const metadata: Metadata = pageMetadata({
  title: "Document Automation: Documents In, Ledger Out",
  description: "Papyrus agents read invoices, contracts and forms and turn them into structured ERP records, with people approving what matters.",
  path: '/solutions/document-automation',
  label: "Document Automation",
})

export default function Page() {
  return <SolutionPage content={{
    eyebrow: "Papyrus · Document automation",
    title: "Documents in, ledger out.",
    description: "Papyrus agents read invoices, contracts, forms and spreadsheets and turn them into vendor, customer, invoice and payment records. No rekeying.",
    result: "Every document becomes a record agents can act on.",
    steps: [{"title":"Documents in","description":"Invoices, contracts, forms and spreadsheets arrive by upload or inbox."},{"title":"Records out","description":"Agents extract the fields and create or update the matching ERP records."},{"title":"People approve","description":"Exceptions and consequential steps wait for a person, with the source document attached."}],
  }} />
}
