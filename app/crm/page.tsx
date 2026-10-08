import type { Metadata } from 'next'
import { CrmTable } from '@/components/crm/crm-table'

export const metadata: Metadata = {
  title: 'CRM | Beag Labs',
  description: 'Private Beag Labs customer and free trial overview.',
  robots: { index: false, follow: false, nocache: true },
}

export default function CrmPage() {
  return <main className="min-h-screen bg-[#fafaf9] px-5 py-12 text-[#111] md:px-10">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 border-b border-neutral-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Beag Labs / Private</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">CRM</h1>
        <p className="mt-2 text-sm text-neutral-600">Provisioned organizations and Microsoft Marketplace trials.</p>
      </header>
      <CrmTable />
    </div>
  </main>
}
