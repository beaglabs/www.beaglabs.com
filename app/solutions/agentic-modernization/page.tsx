import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { SolutionPage } from '@/components/solution-page'

export const metadata: Metadata = pageMetadata({
  title: "Agentic Modernization",
  description: "Preserve trusted legacy systems while exposing their workflows through modern APIs and interfaces.",
  path: '/solutions/agentic-modernization',
  label: "Agentic Modernization",
})

export default function Page() {
  return <SolutionPage content={{
    headline: ["Modern interfaces for", "systems", "that still work."],
    demo: "legacy",
    highlights: ["Terminals and SOAP/XML services documented from how they actually behave.", "Governed APIs and modern screens in front of them, scoped per caller.", "Systems of record stay in place; writes go through approvals."],
    projects: ["bridge", "migration", "dashboards", "voice"],
    eyebrow: "Agentic Modernization",
    title: "Modern interfaces for systems that still work.",
    description: "Preserve trusted legacy systems while exposing their workflows through modern APIs and interfaces.",
    result: "From legacy workflows to modern services",
    steps: [{"title":"Connect legacy services","description":"Work with terminal-driven processes, SOAP/XML interfaces, and existing service endpoints."},{"title":"Expose modern APIs","description":"Wrap existing capabilities with controlled REST/OpenAPI interfaces while retaining the system of record."},{"title":"Improve operator workflows","description":"Build easier web interfaces and introduce governed automation incrementally."}],
  }} />
}
