import { listRuns } from '@flue/runtime'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RunsPage() {
  let runs: Awaited<ReturnType<typeof listRuns>> = { runs: [], nextCursor: undefined }

  try {
    runs = await listRuns({ limit: 50 })
  } catch {}

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-300'
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'errored': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-[#f5f5f5] text-[#555] border-[#111]'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Runs</h1>
        <p className="text-sm text-[#555] mt-1">Workflow execution history</p>
      </div>

      {runs.runs.length === 0 ? (
        <div className="nb-card bg-white p-8 text-center">
          <p className="text-sm text-[#555]">No runs yet.</p>
        </div>
      ) : (
        <div className="nb-card bg-white overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-[3px] border-[#111]">
                <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Run ID</th>
                <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Workflow</th>
                <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Status</th>
                <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Created</th>
              </tr>
            </thead>
            <tbody>
              {runs.runs.map((run) => (
                <tr key={run.runId} className="border-b border-[#111] hover:bg-[#FF5F1F]/5 transition-colors">
                  <td className="px-4 py-2">
                    <Link href={`/portal/runs/${run.runId}`} className="font-bold text-[#FF5F1F] hover:underline font-mono">
                      {run.runId.slice(0, 20)}…
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#555]">{run.workflowName || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border-2 ${statusBadge(run.status)}`}>
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
