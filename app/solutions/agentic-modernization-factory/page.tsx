import { pageMetadata } from '@/lib/seo'
import { AgenticGuide } from '@/components/backoffice/agentic-guide'

export const metadata = pageMetadata({
  title: 'Agentic Modernization Factory',
  description: 'Make the systems you already depend on easier to use. Follow the work from a legacy screen to a controlled operation, a browser interface, and a release decision.',
  path: '/solutions/agentic-modernization-factory',
  label: 'Papyrus / Modernization',
})

export default function Page() {
  return <AgenticGuide mode="modernization" />
}
