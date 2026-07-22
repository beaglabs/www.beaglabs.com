'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import type { Agent } from '@/lib/types'
import { Bot, Plus, Workflow, Puzzle, Plug } from 'lucide-react'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/flue/admin/agents')
      .then((r) => r.json())
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title="Agents"
        description="Manage your Flue AI agents"
      >
        <Link href="/agents/new" className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Agent
        </Link>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-7 h-7" />}
          title="No agents yet"
          description="Create your first Flue agent to get started. Agents can use tools, skills, and connect to channels."
          action={
            <Link href="/agents/new" className="nb-btn-orange px-4 py-2 text-sm">
              Create Agent
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              href={`/agents/${agent.name}`}
              className="nb-card bg-white p-5 hover:bg-[var(--sidebar-accent)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <StatusBadge status="active" />
              </div>
              <h3 className="font-bold text-lg">{agent.name}</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                {agent.description || 'No description configured'}
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs text-[var(--muted-foreground)]">
                <span className="nb-chip !py-1 !px-2 !text-[10px]">
                  {agent.model || 'default'}
                </span>
                <span className="flex items-center gap-1">
                  <Workflow className="w-3 h-3" />
                  {agent.tools?.length ?? 0} tools
                </span>
                <span className="flex items-center gap-1">
                  <Puzzle className="w-3 h-3" />
                  {agent.skills?.length ?? 0} skills
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
