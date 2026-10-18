import { pageMetadata } from '@/lib/seo'
import { AgenticGuide } from '@/components/backoffice/agentic-guide'

export const metadata = pageMetadata({
  title: 'Agentic Modernization Factory',
  description: 'Explore a visual terminal-to-browser modernization workflow with screen mapping, controlled tools, validation, and human approval.',
  path: '/solutions/agentic-modernization-factory',
  label: 'Papyrus / Back office',
})

export default function Page() {
  return <AgenticGuide mode="modernization" />
}
