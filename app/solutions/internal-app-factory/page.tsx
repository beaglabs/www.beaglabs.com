import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { SolutionPage } from '@/components/solution-page'

export const metadata: Metadata = pageMetadata({
  title: "Internal App Factory",
  description: "Turn process requirements into useful interfaces, forms and workflows, with human oversight and controls.",
  path: '/solutions/internal-app-factory',
  label: "Internal App Factory",
})

export default function Page() {
  return <SolutionPage content={{
    eyebrow: "Internal App Factory",
    title: "Build the internal apps you actually need.",
    description: "Turn process requirements into useful interfaces, forms and workflows, with human oversight and controls.",
    result: "From prompts to practical apps",
    steps: [{"title":"Describe the workflow","description":"Start with a business process, the data it uses, and the people responsible."},{"title":"Build an interface","description":"Create role-aware forms, dashboards and operational interfaces around the process."},{"title":"Validate and operate","description":"Validate generated changes and keep ownership of deployment, access, and operations."}],
  }} />
}
