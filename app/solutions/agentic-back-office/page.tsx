import { pageMetadata } from '@/lib/seo'
import { AgenticGuide } from '@/components/backoffice/agentic-guide'

export const metadata = pageMetadata({
  title: 'Agentic Back Office',
  description: 'A practical guide to agentic back office automation: document intake, tool use, exceptions, human approvals, and traceable evidence.',
  path: '/solutions/agentic-back-office',
  label: 'Papyrus / Back office',
})

export default function Page() {
  return <AgenticGuide mode="backoffice" />
}
