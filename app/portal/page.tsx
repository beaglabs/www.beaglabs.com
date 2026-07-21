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
      case 'completed': return 'text-emerald-600'
      case 'active': return 'text-blue-600'
      case 'errored': return 'text-red-600'
      default: return 'text-[#555]'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Dashboard</h1>
        <p className="text-sm text-[#555] mt-1">Agent workflow overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Agents', value: agents.length, sub: 'registered' },
          { label: 'Runs', value: runs.runs.length, sub: 'recent' },
          { label: 'Active', value: runs.runs.filter(r => r.status === 'active').length, sub: 'running' },
          { label: 'Failed', value: runs.runs.filter(r => r.status === 'errored').length, sub: 'errors' },
        ].map((stat) => (
          <div key={stat.label} className="nb-card bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF5F1F]">{stat.label}</p>
            <p className="text-3xl font-extrabold text-[#111] mt-1">{stat.value}</p>
            <p className="text-[11px] text-[#999] font-medium mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div>
        <h2 className="nb-label mb-3">Agents</h2>
        {agents.length === 0 ? (
          <div className="nb-card bg-white p-8 text-center">
            <p className="text-sm text-[#555]">No agents registered.</p>
            <p className="text-xs text-[#999] mt-2">
              Define agents in <code className="font-mono text-[#FF5F1F]">lib/flue/agents/</code>
            </p>
          </div>
        ) : (
          <div className="nb-card bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-[3px] border-[#111]">
                  <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Name</th>
                  <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Description</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.name} className="border-b border-[#111] hover:bg-[#FF5F1F]/5 transition-colors">
                    <td className="px-4 py-2">
                      <a href={`/portal/agents/${agent.name}`} className="font-bold text-[#FF5F1F] hover:underline">
                        {agent.name}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-[#555]">{agent.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div>
        <h2 className="nb-label mb-3">Recent Runs</h2>
        {runs.runs.length === 0 ? (
          <div className="nb-card bg-white p-8 text-center">
            <p className="text-sm text-[#555]">No workflow runs yet.</p>
          </div>
        ) : (
          <div className="nb-card bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-[3px] border-[#111]">
                  <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Run ID</th>
                  <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Workflow</th>
                  <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.runs.map((run) => (
                  <tr key={run.runId} className="border-b border-[#111] hover:bg-[#FF5F1F]/5 transition-colors">
                    <td className="px-4 py-2">
                      <a href={`/portal/runs/${run.runId}`} className="font-bold text-[#FF5F1F] hover:underline font-mono">
                        {run.runId.slice(0, 16)}…
                      </a>
                    </td>
                    <td className="px-4 py-2 text-[#555]">{run.workflowName || '—'}</td>
                    <td className={`px-4 py-2 font-bold ${statusColor(run.status)}`}>{run.status}</td>
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
