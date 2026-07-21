export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Workflows</h1>
        <p className="text-sm text-[#555] mt-1">Defined workflow pipelines</p>
      </div>

      <div className="nb-card bg-white p-8 text-center">
        <p className="text-sm text-[#555]">No workflows defined yet.</p>
        <p className="text-xs text-[#999] mt-2">
          Define workflows in <code className="font-mono text-[#FF5F1F]">lib/flue/workflows/</code>
        </p>
      </div>
    </div>
  )
}
