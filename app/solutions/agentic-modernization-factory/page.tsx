import { pageMetadata } from '@/lib/seo'
import { AgenticGuide } from '@/components/backoffice/agentic-guide'

export const metadata = pageMetadata({
  title: 'Legacy Systems in the Agentic ERP',
  description: 'Bring terminal systems into the agentic ERP: screen mapping, controlled tools, validation and human approval, so agents can work with the systems you already run.',
  path: '/solutions/agentic-modernization-factory',
  label: 'Papyrus / Back office',
})

export default function Page() {
  return <AgenticGuide mode="modernization" />
}
