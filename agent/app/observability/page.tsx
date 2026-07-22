'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { MetricCard } from '@/components/metric-card'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import type { WorkflowRun } from '@/lib/types'
import {
  BarChart3,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface Metrics {
  totalRuns: number
  successRate: number
  avgLatencyMs: number
  totalCost: number
  totalTokens: number
}

export default function ObservabilityPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/flue/admin/runs?limit=100')
      .then((r) => r.json())
      .then((data) => {
        const allRuns = Array.isArray(data) ? data : []
        setRuns(allRuns)

        const completed = allRuns.filter((r: WorkflowRun) => r.status === 'completed')
        const errored = allRuns.filter((r: WorkflowRun) => r.status === 'errored')
        const active = allRuns.filter((r: WorkflowRun) => r.status === 'active')

        setMetrics({
          totalRuns: allRuns.length,
          successRate: allRuns.length > 0 ? (completed.length / allRuns.length) * 100 : 0,
          avgLatencyMs: 0,
          totalCost: 0,
          totalTokens: 0,
        })
      })
      .catch(() => {
        setRuns([])
        setMetrics({ totalRuns: 0, successRate: 0, avgLatencyMs: 0, totalCost: 0, totalTokens: 0 })
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredRuns = statusFilter === 'all'
    ? runs
    : runs.filter((r) => r.status === statusFilter)

  return (
    <>
      <PageHeader title="Observability" description="Monitor agent runs, performance, and errors" />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Runs"
          value={metrics?.totalRuns ?? 0}
          change="All time"
          icon={<Play className="w-5 h-5" />}
        />
        <MetricCard
          label="Success Rate"
          value={`${(metrics?.successRate ?? 0).toFixed(1)}%`}
          change="Completed successfully"
          changeType={metrics?.successRate && metrics.successRate > 90 ? 'positive' : 'negative'}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Avg Latency"
          value={`${metrics?.avgLatencyMs ?? 0}ms`}
          change="Per run"
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label="Total Cost"
          value={`$${(metrics?.totalCost ?? 0).toFixed(2)}`}
          change="Model usage"
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      {/* Runs Table */}
      <div className="nb-card bg-white">
        <div className="px-5 py-4 border-b-3 border-black flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Run History
          </h2>
          <div className="flex items-center gap-2">
            {['all', 'active', 'completed', 'errored'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`nb-chip !py-1 !px-3 !text-xs capitalize transition-colors ${
                  statusFilter === status ? 'bg-[var(--accent)]' : ''
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-[var(--secondary)]">
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Run ID</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Workflow</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Status</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Started</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Duration</th>
                <th className="text-right px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                    Loading runs...
                  </td>
                </tr>
              ) : filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                    No runs found
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => {
                  const duration = run.completedAt
                    ? Math.round(
                        (new Date(run.completedAt).getTime() -
                          new Date(run.startedAt).getTime()) /
                          1000
                      )
                    : null
                  return (
                    <tr
                      key={run.runId}
                      className="hover:bg-[var(--sidebar-accent)] transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs">{run.runId.slice(0, 16)}...</td>
                      <td className="px-5 py-3 font-medium">{run.workflowName || '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(run.startedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">
                        {duration !== null ? `${duration}s` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/observability/runs/${run.runId}`}
                          className="nb-chip !py-1 !px-2 !text-[10px] hover:bg-[var(--accent)] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Trace
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
