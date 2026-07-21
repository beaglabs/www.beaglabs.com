import { listAgents } from '@flue/runtime'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  let agents: Awaited<ReturnType<typeof listAgents>> = []

  try {
    agents = await listAgents()
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Agents</h1>
        <p className="text-sm text-[#555] mt-1">Registered agent definitions</p>
      </div>

      {agents.length === 0 ? (
        <div className="nb-card bg-white p-8 text-center">
          <p className="text-sm text-[#555]">No agents registered.</p>
          <p className="text-xs text-[#999] mt-2">
            Define agents in <code className="font-mono text-[#FF5F1F]">lib/flue/agents/</code> and restart the runtime.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              href={`/portal/agents/${agent.name}`}
              className="nb-card block bg-white p-4 hover:shadow-[8px_8px_0px_0px_#111] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#FF5F1F]">{agent.name}</h3>
                  <p className="text-xs text-[#555] mt-1">{agent.description || 'No description'}</p>
                </div>
                <svg className="w-4 h-4 text-[#111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
