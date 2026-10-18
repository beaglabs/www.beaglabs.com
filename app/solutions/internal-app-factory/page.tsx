import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { SolutionPage } from '@/components/solution-page'

export const metadata: Metadata = pageMetadata({
  title: "Internal App Factory",
  description: "Describe a process and Papyrus builds the forms, queues and views your team needs, on the same data model its agents run.",
  path: '/solutions/internal-app-factory',
  label: "Internal App Factory",
})

export default function Page() {
  return <SolutionPage content={{
    eyebrow: "Papyrus · Internal apps",
    title: "Apps on your ERP, built by agents.",
    description: "Describe a process and Papyrus builds the forms, queues and views your team needs, on the same customers, vendors and invoices its agents work with.",
    result: "From a prompt to an app on your own records.",
    steps: [{"title":"Describe the workflow","description":"Name the process, the records it touches and the people who own it."},{"title":"Agents build it","description":"Papyrus creates the forms, queues and views on your existing data model."},{"title":"Review and run","description":"Review the changes, publish the app and keep running it at your own Papyrus address."}],
  }} />
}
