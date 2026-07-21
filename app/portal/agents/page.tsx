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
        <h1 className="text-lg font-medium text-[#e5e5e5]">Agents</h1>
        <p className="text-xs text-[#666] mt-1">Registered agent definitions</p>
      </div>

      {agents.length === 0 ? (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-8 text-center">
          <p className="text-sm text-[#666]">No agents registered.</p>
          <p className="text-xs text-[#444] mt-2">
            Define agents in <code className="text-[#C7661D]">lib/flue/agents/</code> and restart the runtime.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              href={`/portal/agents/${agent.name}`}
              className="block border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4 hover:border-[#333] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[#C7661D]">{agent.name}</h3>
                  <p className="text-xs text-[#666] mt-1">{agent.description || 'No description'}</p>
                </div>
                <svg className="w-4 h-4 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
