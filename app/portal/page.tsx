import { listAgents, listRuns } from '@flue/runtime'

export const dynamic = 'force-dynamic'

export default async function PortalDashboard() {
  let agents: Awaited<ReturnType<typeof listAgents>> = []
  let runs: Awaited<ReturnType<typeof listRuns>> = { runs: [], nextCursor: undefined }

  try {
    agents = await listAgents()
  } catch {
    // Flue runtime not initialized yet
  }

  try {
    runs = await listRuns({ limit: 10 })
  } catch {
    // Flue runtime not initialized yet
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400'
      case 'active': return 'text-blue-400'
      case 'errored': return 'text-red-400'
      default: return 'text-[#666]'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium text-[#e5e5e5]">Dashboard</h1>
        <p className="text-xs text-[#666] mt-1">Agent workflow overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Agents', value: agents.length, sub: 'registered' },
          { label: 'Runs', value: runs.runs.length, sub: 'recent' },
          { label: 'Active', value: runs.runs.filter(r => r.status === 'active').length, sub: 'running' },
          { label: 'Failed', value: runs.runs.filter(r => r.status === 'errored').length, sub: 'errors' },
        ].map((stat) => (
          <div key={stat.label} className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#444]">{stat.label}</p>
            <p className="text-2xl font-light text-[#e5e5e5] mt-1">{stat.value}</p>
            <p className="text-[10px] text-[#555] mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div>
        <h2 className="text-sm font-medium text-[#999] mb-3">Agents</h2>
        {agents.length === 0 ? (
          <p className="text-xs text-[#555]">No agents registered. Define agents in <code className="text-[#C7661D]">lib/flue/agents/</code></p>
        ) : (
          <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                  <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.name} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                    <td className="px-4 py-2">
                      <a href={`/portal/agents/${agent.name}`} className="text-[#C7661D] hover:underline">
                        {agent.name}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-[#888]">{agent.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div>
        <h2 className="text-sm font-medium text-[#999] mb-3">Recent Runs</h2>
        {runs.runs.length === 0 ? (
          <p className="text-xs text-[#555]">No workflow runs yet.</p>
        ) : (
          <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                  <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Run ID</th>
                  <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Workflow</th>
                  <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.runs.map((run) => (
                  <tr key={run.runId} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                    <td className="px-4 py-2">
                      <a href={`/portal/runs/${run.runId}`} className="text-[#C7661D] hover:underline font-mono">
                        {run.runId.slice(0, 16)}…
                      </a>
                    </td>
                    <td className="px-4 py-2 text-[#888]">{run.workflowName || '—'}</td>
                    <td className={`px-4 py-2 ${statusColor(run.status)}`}>{run.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
