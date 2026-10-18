import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { SolutionPage } from '@/components/solution-page'

export const metadata: Metadata = pageMetadata({
  title: "Agentic Modernization",
  description: "Keep the legacy systems that still work and bring them into the agentic ERP, with tested APIs agents and people can use.",
  path: '/solutions/agentic-modernization',
  label: "Agentic Modernization",
})

export default function Page() {
  return <SolutionPage content={{
    eyebrow: "Papyrus · Legacy into the ERP",
    title: "Keep the old system. Give it agents.",
    description: "Papyrus wraps terminal and SOAP/XML systems in tested APIs, so its agents can read and update them alongside your customers, vendors and invoices.",
    result: "Legacy systems, working inside your agentic ERP.",
    steps: [{"title":"Connect legacy services","description":"Work with terminal-driven processes, SOAP/XML interfaces, and existing service endpoints."},{"title":"Expose modern APIs","description":"Wrap existing capabilities with controlled REST/OpenAPI interfaces while retaining the system of record."},{"title":"Hand it to agents","description":"Let Papyrus agents use the wrapped system in back-office workflows, with people approving what matters."}],
  }} />
}
