'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

interface RunEvent {
  type: string
  timestamp?: string
  data?: unknown
}

interface RunMeta {
  runId: string
  workflowName: string
  status: string
  createdAt?: string
  endedAt?: string
  input?: unknown
  result?: unknown
  error?: unknown
}

export default function RunDetailPage() {
  const params = useParams()
  const runId = params.runId as string
  const [meta, setMeta] = useState<RunMeta | null>(null)
  const [events, setEvents] = useState<RunEvent[]>([])
  const eventsEndRef = useRef<HTMLDivElement>(null)

  // Fetch run metadata
  useEffect(() => {
    fetch(`/api/flue/runs/${runId}?meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {})
  }, [runId])

  // Connect to SSE stream
  useEffect(() => {
    const url = `/api/flue/runs/${runId}?live=sse`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data)) {
          setEvents((prev) => [...prev, ...data])
        } else {
          setEvents((prev) => [...prev, data])
        }
      } catch {}
    }

    return () => eventSource.close()
  }, [runId])

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-700 font-bold'
      case 'active': return 'text-blue-700 font-bold'
      case 'errored': return 'text-red-700 font-bold'
      default: return 'text-[#555]'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111] font-mono">{runId.slice(0, 24)}…</h1>
        {meta && (
          <div className="flex items-center gap-4 mt-2 text-xs text-[#555]">
            <span>Workflow: <span className="font-bold text-[#111]">{meta.workflowName}</span></span>
            <span className={statusColor(meta.status)}>{meta.status}</span>
            {meta.createdAt && (
              <span>Started: {new Date(meta.createdAt).toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      {meta?.input != null && (
        <div>
          <h2 className="nb-label mb-2">Input</h2>
          <pre className="text-xs text-[#111] nb-card bg-white p-3 overflow-x-auto font-mono">
            {JSON.stringify(meta.input, null, 2)}
          </pre>
        </div>
      )}

      {/* Result */}
      {meta?.result != null && (
        <div>
          <h2 className="nb-label mb-2">Result</h2>
          <pre className="text-xs text-[#111] nb-card bg-white p-3 overflow-x-auto font-mono">
            {JSON.stringify(meta.result, null, 2)}
          </pre>
        </div>
      )}

      {/* Error */}
      {meta?.error != null && (
        <div>
          <h2 className="nb-label mb-2">Error</h2>
          <pre className="text-xs text-red-700 bg-red-50 nb-card p-3 overflow-x-auto font-mono">
            {JSON.stringify(meta.error, null, 2)}
          </pre>
        </div>
      )}

      {/* Event stream */}
      <div>
        <h2 className="nb-label mb-2">Events</h2>
        <div className="nb-card bg-white p-4 max-h-96 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-[#999] text-center py-4 font-mono">Waiting for events…</p>
          ) : (
            events.map((event, i) => (
              <div key={i} className="border-l-[3px] border-[#111] pl-3 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#555]">{event.type}</span>
                  {event.timestamp && (
                    <span className="text-[10px] text-[#999]">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
                {event.data != null && (
                  <pre className="text-[10px] text-[#555] mt-1 overflow-x-auto font-mono">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
          <div ref={eventsEndRef} />
        </div>
      </div>
    </div>
  )
}
