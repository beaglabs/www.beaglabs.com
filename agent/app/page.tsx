'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { MetricCard } from '@/components/metric-card'
import { StatusBadge } from '@/components/status-badge'
import { formatRelativeTime } from '@/lib/utils'
import {
  Bot,
  Workflow,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
} from 'lucide-react'

interface DashboardData {
  agents: Array<{ name: string; description?: string }>
  recentRuns: Array<{
    runId: string
    workflowName: string
    status: string
    startedAt: string
  }>
  metrics: {
    totalAgents: number
    totalWorkflows: number
    activeRuns: number
    completedRuns: number
    erroredRuns: number
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, runsRes] = await Promise.all([
          fetch('/api/flue/admin/agents').then((r) => r.json()).catch(() => []),
          fetch('/api/flue/admin/runs?limit=20').then((r) => r.json()).catch(() => []),
        ])

        const agents = Array.isArray(agentsRes) ? agentsRes : []
        const runs = Array.isArray(runsRes) ? runsRes : []

        setData({
          agents,
          recentRuns: runs,
          metrics: {
            totalAgents: agents.length,
            totalWorkflows: 0,
            activeRuns: runs.filter((r: { status: string }) => r.status === 'active').length,
            completedRuns: runs.filter((r: { status: string }) => r.status === 'completed').length,
            erroredRuns: runs.filter((r: { status: string }) => r.status === 'errored').length,
          },
        })
      } catch {
        setData({
          agents: [],
          recentRuns: [],
          metrics: { totalAgents: 0, totalWorkflows: 0, activeRuns: 0, completedRuns: 0, erroredRuns: 0 },
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-10 w-48 bg-gray-200" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 nb-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your agent infrastructure"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Agents"
          value={data?.metrics.totalAgents ?? 0}
          change="Active Flue agents"
          icon={<Bot className="w-5 h-5" />}
        />
        <MetricCard
          label="Active Runs"
          value={data?.metrics.activeRuns ?? 0}
          change="Currently executing"
          icon={<Play className="w-5 h-5" />}
        />
        <MetricCard
          label="Completed"
          value={data?.metrics.completedRuns ?? 0}
          change="Last 24 hours"
          changeType="positive"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Errors"
          value={data?.metrics.erroredRuns ?? 0}
          change="Needs attention"
          changeType={data?.metrics.erroredRuns ? 'negative' : 'neutral'}
          icon={<XCircle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Agents Overview */}
        <div className="nb-card bg-white">
          <div className="px-5 py-4 border-b-3 border-black flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agents
            </h2>
            <a
              href="/agents"
              className="nb-chip text-xs hover:bg-[var(--accent)] transition-colors"
            >
              View All
            </a>
          </div>
          <div className="divide-y-2 divide-black">
            {data?.agents.length === 0 ? (
              <div className="p-6 text-center text-[var(--muted-foreground)] text-sm">
                No agents configured yet
              </div>
            ) : (
              data?.agents.slice(0, 5).map((agent) => (
                <div
                  key={agent.name}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--sidebar-accent)] transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm">{agent.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {agent.description || 'No description'}
                    </p>
                  </div>
                  <StatusBadge status="active" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Runs */}
        <div className="nb-card bg-white mt-6">
          <div className="px-5 py-4 border-b-3 border-black flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Recent Runs
            </h2>
            <a
              href="/observability"
              className="nb-chip text-xs hover:bg-[var(--accent)] transition-colors"
            >
              View All
            </a>
          </div>
          <div className="divide-y-2 divide-black">
            {data?.recentRuns.length === 0 ? (
              <div className="p-6 text-center text-[var(--muted-foreground)] text-sm">
                No runs recorded yet
              </div>
            ) : (
              data?.recentRuns.slice(0, 8).map((run) => (
                <a
                  key={run.runId}
                  href={`/observability/runs/${run.runId}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[var(--sidebar-accent)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">
                      {run.workflowName || run.runId}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(run.startedAt)}
                    </p>
                  </div>
                  <StatusBadge status={run.status} />
                </a>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/agents/new"
          className="nb-card bg-white p-5 flex items-center gap-4 hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Create Agent</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Configure a new Flue agent
            </p>
          </div>
        </a>
        <a
          href="/chat"
          className="nb-card bg-white p-5 flex items-center gap-4 hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Run Workflow</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Ask the chat to invoke a workflow
            </p>
          </div>
        </a>
        <a
          href="/observability"
          className="nb-card bg-white p-5 flex items-center gap-4 hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">View Metrics</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Observability dashboard
            </p>
          </div>
        </a>
      </div>
    </>
  )
}
