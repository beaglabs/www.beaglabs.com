import { pageMetadata } from '@/lib/seo'
import { AgenticGuide } from '@/components/backoffice/agentic-guide'

export const metadata = pageMetadata({
  title: 'Agentic Back Office',
  description: 'Turn repetitive administrative work into structured, reviewable workflows. Give agents defined tools, keep exceptions visible, and put people at the decisions that matter.',
  path: '/solutions/agentic-back-office',
  label: 'Papyrus / Back office',
})

export default function Page() {
  return <AgenticGuide mode="backoffice" />
}
