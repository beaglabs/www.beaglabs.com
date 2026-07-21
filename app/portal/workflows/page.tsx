export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-[#e5e5e5]">Workflows</h1>
        <p className="text-xs text-[#666] mt-1">Defined workflow pipelines</p>
      </div>

      <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-8 text-center">
        <p className="text-sm text-[#666]">No workflows defined yet.</p>
        <p className="text-xs text-[#444] mt-2">
          Define workflows in <code className="text-[#C7661D]">lib/flue/workflows/</code>
        </p>
      </div>
    </div>
  )
}
