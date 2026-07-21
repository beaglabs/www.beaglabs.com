'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface StreamEvent {
  type: string
  data?: unknown
  text?: string
  toolName?: string
  toolInput?: unknown
  toolOutput?: unknown
}

export default function AgentDetailPage() {
  const params = useParams()
  const name = params.name as string
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [prompt, setPrompt] = useState('')
  const [sending, setSending] = useState(false)
  const [instanceId, setInstanceId] = useState(`portal-${name}-default`)
  const eventsEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [events, scrollToBottom])

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    const url = `/api/flue/agents/${name}/${instanceId}?view=updates&offset=0&live=sse`
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

    eventSource.onerror = () => {
      // Will auto-reconnect
    }

    return () => eventSource.close()
  }, [name, instanceId])

  const sendPrompt = async () => {
    if (!prompt.trim() || sending) return
    setSending(true)

    try {
      const res = await fetch(`/api/flue/agents/${name}/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      })

      if (res.ok) {
        setPrompt('')
      }
    } catch (err) {
      console.error('Failed to send prompt:', err)
    } finally {
      setSending(false)
    }
  }

  const abortAgent = async () => {
    try {
      await fetch(`/api/flue/agents/${name}/${instanceId}/abort`, {
        method: 'POST',
      })
    } catch {}
  }

  const renderEvent = (event: StreamEvent, i: number) => {
    if (event.type === 'text' || event.type === 'message') {
      return (
        <div key={i} className="border-l-[3px] border-[#111] pl-3 py-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#999]">{event.type}</p>
          <p className="text-sm text-[#111] mt-0.5 whitespace-pre-wrap">{event.text || JSON.stringify(event.data)}</p>
        </div>
      )
    }

    if (event.type === 'tool_call' || event.type === 'tool_use') {
      return (
        <div key={i} className="border-l-[3px] border-[#FF5F1F] pl-3 py-1 bg-[#FF5F1F]/5">
          <p className="text-xs text-[#FF5F1F] font-mono font-bold">🔧 {event.toolName || 'tool'}</p>
          {event.toolInput != null && (
            <pre className="text-[10px] text-[#555] mt-1 overflow-x-auto font-mono">
              {JSON.stringify(event.toolInput, null, 2)}
            </pre>
          )}
        </div>
      )
    }

    if (event.type === 'tool_result') {
      return (
        <div key={i} className="border-l-[3px] border-emerald-600 pl-3 py-1 bg-emerald-50">
          <p className="text-xs text-emerald-700 font-mono font-bold">✓ result</p>
          <pre className="text-[10px] text-[#555] mt-1 overflow-x-auto font-mono">
            {typeof event.toolOutput === 'string'
              ? event.toolOutput
              : JSON.stringify(event.toolOutput ?? null, null, 2)}
          </pre>
        </div>
      )
    }

    return (
      <div key={i} className="border-l-[3px] border-[#111] pl-3 py-1">
        <p className="text-[10px] text-[#999] font-mono font-bold">{event.type}</p>
        <pre className="text-[10px] text-[#555] mt-0.5 overflow-x-auto font-mono">
          {JSON.stringify(event.data ?? event, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">{name}</h1>
          <p className="text-sm text-[#555] mt-1">
            Instance: <code className="font-mono text-[#FF5F1F]">{instanceId}</code>
          </p>
        </div>
        <button
          onClick={abortAgent}
          className="nb-btn bg-red-600 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
        >
          Abort
        </button>
      </div>

      {/* Events stream */}
      <div className="flex-1 overflow-y-auto nb-card bg-white p-4 space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-[#999] text-center py-8 font-mono">
            No events yet. Send a prompt below.
          </p>
        ) : (
          events.map((event, i) => renderEvent(event, i))
        )}
        <div ref={eventsEndRef} />
      </div>

      {/* Prompt input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendPrompt()}
          placeholder="Send a prompt to this agent..."
          className="flex-1 border-[3px] border-[#111] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF5F1F]"
          disabled={sending}
        />
        <button
          onClick={sendPrompt}
          disabled={sending || !prompt.trim()}
          className="nb-btn-orange px-4 py-2 text-xs font-extrabold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
