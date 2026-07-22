'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/utils'
import type { WorkflowRun, RunEvent } from '@/lib/types'
import {
  ArrowLeft,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Wrench,
  Cpu,
} from 'lucide-react'
import Link from 'next/link'

export default function RunTracePage() {
  const params = useParams()
  const runId = params.id as string
  const [run, setRun] = useState<WorkflowRun | null>(null)
  const [events, setEvents] = useState<RunEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/flue/admin/runs/${runId}`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/flue/runs/${runId}/events`)
        .then((r) => r.json())
        .then((data) => (Array.isArray(data) ? data : []))
        .catch(() => []),
    ]).then(([runData, eventsData]) => {
      setRun(runData)
      setEvents(eventsData)
      setLoading(false)
    })
  }, [runId])

  function getEventIcon(type: string) {
    switch (type) {
      case 'model_turn':
      case 'message_start':
      case 'message_end':
        return <Cpu className="w-4 h-4" />
      case 'tool_call':
      case 'tool_result':
        return <Wrench className="w-4 h-4" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'run_start':
      case 'run_end':
        return <Zap className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  function getEventColor(type: string) {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'run_end':
        return 'border-l-green-500 bg-green-50'
      case 'tool_call':
      case 'tool_result':
        return 'border-l-blue-500 bg-blue-50'
      case 'model_turn':
        return 'border-l-purple-500 bg-purple-50'
      default:
        return 'border-l-gray-300 bg-white'
    }
  }

  const duration = run?.completedAt
    ? Math.round(
        (new Date(run.completedAt).getTime() -
          new Date(run.startedAt).getTime()) /
          1000
      )
    : null

  return (
    <>
      <PageHeader title={`Run: ${runId.slice(0, 16)}...`} description="Execution trace and events">
        <Link
          href="/observability"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </PageHeader>

      {loading ? (
        <div className="h-64 bg-gray-200 nb-card animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Run Info */}
          <div className="nb-card bg-white p-5 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm font-mono">{runId.slice(0, 12)}...</h3>
                <StatusBadge status={run?.status || 'unknown'} className="!py-0.5 !px-2 !text-[10px]" />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Workflow
                </p>
                <p className="font-medium mt-0.5">{run?.workflowName || '—'}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Started
                </p>
                <p className="text-xs mt-0.5">{run?.startedAt ? formatDate(run.startedAt) : '—'}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Completed
                </p>
                <p className="text-xs mt-0.5">{run?.completedAt ? formatDate(run.completedAt) : '—'}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Duration
                </p>
                <p className="font-bold text-lg mt-0.5">{duration !== null ? `${duration}s` : '—'}</p>
              </div>
              {run?.error && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-red-600">
                    Error
                  </p>
                  <p className="text-xs mt-0.5 text-red-600 font-mono break-all">
                    {run.error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Event Timeline ({events.length} events)
            </h2>

            {events.length === 0 ? (
              <div className="nb-card bg-white p-8 text-center text-[var(--muted-foreground)]">
                No events recorded for this run
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event, i) => (
                  <div
                    key={i}
                    className={`nb-card !shadow-none border-l-4 ${getEventColor(
                      event.type
                    )} p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getEventIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold uppercase">
                            {event.type}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {event.timestamp
                              ? new Date(event.timestamp).toLocaleTimeString()
                              : ''}
                          </span>
                        </div>
                        {event.data && Object.keys(event.data).length > 0 && (
                          <pre className="mt-2 text-xs font-mono bg-gray-50 p-2 border-2 border-gray-200 overflow-x-auto max-h-48 overflow-y-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {run?.result != null && (
              <div className="mt-6">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Result
                </h3>
                <div className="nb-card bg-white p-5">
                  <pre className="text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                    {JSON.stringify(run.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
