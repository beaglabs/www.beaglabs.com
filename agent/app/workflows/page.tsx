'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { formatDate } from '@/lib/utils'
import type { Workflow, WorkflowRun } from '@/lib/types'
import { Workflow as WorkflowIcon, Play, Clock, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [invoking, setInvoking] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/flue/admin/workflows').then((r) => r.json()).catch(() => []),
      fetch('/api/flue/admin/runs?limit=20').then((r) => r.json()).catch(() => []),
    ]).then(([workflowsData, runsData]) => {
      setWorkflows(Array.isArray(workflowsData) ? workflowsData : [])
      setRecentRuns(Array.isArray(runsData) ? runsData : [])
      setLoading(false)
    })
  }, [])

  async function invokeWorkflow(name: string) {
    setInvoking(name)
    try {
      const res = await fetch(`/api/flue/workflows/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.runId) {
        // Refresh runs
        const runsRes = await fetch('/api/flue/admin/runs?limit=20')
        const runsData = await runsRes.json()
        setRecentRuns(Array.isArray(runsData) ? runsData : [])
      }
    } catch {
      // Error handled by UI
    } finally {
      setInvoking(null)
    }
  }

  return (
    <>
      <PageHeader title="Workflows" description="Manage and invoke Flue workflows" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={<WorkflowIcon className="w-7 h-7" />}
          title="No workflows configured"
          description="Workflows are finite, inspectable operations for background jobs, document transformations, and CI tasks. Define them in src/workflows/."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {workflows.map((workflow) => (
            <div key={workflow.name} className="nb-card bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                    <WorkflowIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{workflow.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {workflow.description || 'No description'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => invokeWorkflow(workflow.name)}
                  disabled={invoking === workflow.name}
                  className="nb-btn-orange px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  {invoking === workflow.name ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Run
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                {workflow.model && (
                  <span className="nb-chip !py-0.5 !px-2 !text-[10px]">{workflow.model}</span>
                )}
                {workflow.hasRoute && (
                  <span className="nb-chip !py-0.5 !px-2 !text-[10px]">HTTP</span>
                )}
                {workflow.hasRuns && (
                  <span className="nb-chip !py-0.5 !px-2 !text-[10px]">Runs</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Runs */}
      <h2 className="font-bold text-xl mb-4">Recent Runs</h2>
      <div className="nb-card bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-3 border-black bg-[var(--secondary)]">
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Workflow</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Run ID</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Status</th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Started</th>
                <th className="text-right px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {recentRuns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                    No runs recorded
                  </td>
                </tr>
              ) : (
                recentRuns.map((run) => (
                  <tr key={run.runId} className="hover:bg-[var(--sidebar-accent)] transition-colors">
                    <td className="px-5 py-3 font-medium">{run.workflowName || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs">{run.runId.slice(0, 12)}...</td>
                    <td className="px-5 py-3"><StatusBadge status={run.status} /></td>
                    <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(run.startedAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/observability/runs/${run.runId}`}
                        className="nb-chip !py-1 !px-2 !text-[10px] hover:bg-[var(--accent)] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
