'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/utils'
import type { WorkflowRun } from '@/lib/types'
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AgentRunsPage() {
  const params = useParams()
  const agentName = params.id as string
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/flue/admin/runs?workflow=${agentName}&limit=50`)
      .then((r) => r.json())
      .then((data) => setRuns(Array.isArray(data) ? data : []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }, [agentName])

  return (
    <>
      <PageHeader title={`Runs: ${agentName}`} description="Execution history for this agent">
        <Link
          href={`/agents/${agentName}`}
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agent
        </Link>
      </PageHeader>

      <div className="nb-card bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-3 border-black bg-[var(--secondary)]">
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">
                  Run ID
                </th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">
                  Started
                </th>
                <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">
                  Completed
                </th>
                <th className="text-right px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                    Loading runs...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                    No runs recorded for this agent
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr
                    key={run.runId}
                    className="hover:bg-[var(--sidebar-accent)] transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs">{run.runId.slice(0, 12)}...</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(run.startedAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">
                      {run.completedAt ? formatDate(run.completedAt) : '—'}
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
