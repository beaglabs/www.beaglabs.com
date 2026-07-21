import { listRuns } from '@flue/runtime'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RunsPage() {
  let runs: Awaited<ReturnType<typeof listRuns>> = { runs: [], nextCursor: undefined }

  try {
    runs = await listRuns({ limit: 50 })
  } catch {}

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
      case 'active': return 'bg-blue-400/10 text-blue-400 border-blue-400/20'
      case 'errored': return 'bg-red-400/10 text-red-400 border-red-400/20'
      default: return 'bg-[#222]/10 text-[#666] border-[#222]/20'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-[#e5e5e5]">Runs</h1>
        <p className="text-xs text-[#666] mt-1">Workflow execution history</p>
      </div>

      {runs.runs.length === 0 ? (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-8 text-center">
          <p className="text-sm text-[#666]">No runs yet.</p>
        </div>
      ) : (
        <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Run ID</th>
                <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Workflow</th>
                <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {runs.runs.map((run) => (
                <tr key={run.runId} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                  <td className="px-4 py-2">
                    <Link href={`/portal/runs/${run.runId}`} className="text-[#C7661D] hover:underline font-mono">
                      {run.runId.slice(0, 20)}…
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#888]">{run.workflowName || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] rounded border ${statusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#555]">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
