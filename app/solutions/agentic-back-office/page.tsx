import { pageMetadata } from '@/lib/seo'
import { AgenticGuide } from '@/components/backoffice/agentic-guide'

export const metadata = pageMetadata({
  title: 'Agentic Back Office: AP, AR and Approvals Run by Agents',
  description: 'How Papyrus agents run the back office on one data model: invoice and document intake, AP and AR, exceptions, reconciliation and human approvals.',
  path: '/solutions/agentic-back-office',
  label: 'Papyrus / Back office',
})

export default function Page() {
  return <AgenticGuide mode="backoffice" />
}
