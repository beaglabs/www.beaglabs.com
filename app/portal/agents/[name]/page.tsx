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
        <div key={i} className="border-l-2 border-[#333] pl-3 py-1">
          <p className="text-xs text-[#888]">{event.type}</p>
          <p className="text-sm text-[#ccc] mt-0.5 whitespace-pre-wrap">{event.text || JSON.stringify(event.data)}</p>
        </div>
      )
    }

    if (event.type === 'tool_call' || event.type === 'tool_use') {
      return (
        <div key={i} className="border-l-2 border-blue-500/40 pl-3 py-1 bg-blue-500/5 rounded-r">
          <p className="text-xs text-blue-400 font-mono">🔧 {event.toolName || 'tool'}</p>
          {event.toolInput != null && (
            <pre className="text-[10px] text-[#888] mt-1 overflow-x-auto">
              {JSON.stringify(event.toolInput, null, 2)}
            </pre>
          )}
        </div>
      )
    }

    if (event.type === 'tool_result') {
      return (
        <div key={i} className="border-l-2 border-emerald-500/40 pl-3 py-1 bg-emerald-500/5 rounded-r">
          <p className="text-xs text-emerald-400 font-mono">✓ result</p>
          <pre className="text-[10px] text-[#888] mt-1 overflow-x-auto">
            {typeof event.toolOutput === 'string'
              ? event.toolOutput
              : JSON.stringify(event.toolOutput ?? null, null, 2)}
          </pre>
        </div>
      )
    }

    return (
      <div key={i} className="border-l-2 border-[#222] pl-3 py-1">
        <p className="text-[10px] text-[#555] font-mono">{event.type}</p>
        <pre className="text-[10px] text-[#444] mt-0.5 overflow-x-auto">
          {JSON.stringify(event.data ?? event, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-[#e5e5e5]">{name}</h1>
          <p className="text-xs text-[#666] mt-1">
            Instance: <code className="text-[#C7661D]">{instanceId}</code>
          </p>
        </div>
        <button
          onClick={abortAgent}
          className="px-3 py-1.5 text-xs text-red-400 border border-red-400/20 rounded hover:bg-red-400/10 transition-colors"
        >
          Abort
        </button>
      </div>

      {/* Events stream */}
      <div className="flex-1 overflow-y-auto border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg p-4 space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-[#444] text-center py-8">
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
          className="flex-1 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#444] focus:outline-none focus:border-[#333]"
          disabled={sending}
        />
        <button
          onClick={sendPrompt}
          disabled={sending || !prompt.trim()}
          className="px-4 py-2 text-xs font-medium bg-[#C7661D] text-white rounded-lg hover:bg-[#d87a3a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
