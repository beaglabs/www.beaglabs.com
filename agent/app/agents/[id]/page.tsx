'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import type { Agent } from '@/lib/types'
import { Bot, Send, Settings, History, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AgentDetailPage() {
  const params = useParams()
  const agentName = params.id as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [instanceId] = useState(() => `portal-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/flue/admin/agents')
      .then((r) => r.json())
      .then((data) => {
        const found = Array.isArray(data)
          ? data.find((a: Agent) => a.name === agentName)
          : null
        setAgent(found ?? { name: agentName, model: 'unknown' })
      })
      .catch(() => setAgent({ name: agentName, model: 'unknown' }))
  }, [agentName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`/api/flue/agents/${agentName}/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || data.error || 'No response',
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader title={agentName} description={agent?.description || 'Agent detail and chat'}>
        <Link
          href={`/agents/${agentName}/config`}
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configure
        </Link>
        <Link
          href={`/agents/${agentName}/runs`}
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          Runs
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Info Sidebar */}
        <div className="nb-card bg-white p-5 h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{agentName}</h3>
              <StatusBadge status="active" className="!py-0.5 !px-2 !text-[10px]" />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Model
              </p>
              <p className="font-medium mt-0.5">{agent?.model || 'default'}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Instance
              </p>
              <p className="font-mono text-xs mt-0.5 break-all">{instanceId}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Tools
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent?.tools?.map((tool) => (
                  <span key={tool} className="nb-chip !py-0.5 !px-2 !text-[10px]">
                    {tool}
                  </span>
                )) ?? <span className="text-xs text-[var(--muted-foreground)]">None</span>}
              </div>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Skills
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent?.skills?.map((skill) => (
                  <span key={skill} className="nb-chip !py-0.5 !px-2 !text-[10px]">
                    {skill}
                  </span>
                )) ?? <span className="text-xs text-[var(--muted-foreground)]">None</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-3 nb-card bg-white flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-[var(--secondary)] border-2 border-black flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg">Chat with {agentName}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-sm">
                  Send a message to start a conversation with this agent. The agent
                  will use its configured tools and skills to respond.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 text-sm ${
                    msg.role === 'user'
                      ? 'nb-btn-orange !shadow-none'
                      : 'nb-card !shadow-none bg-[var(--secondary)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <p className="text-[10px] opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="nb-card !shadow-none bg-[var(--secondary)] p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-3 border-black p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="nb-btn-orange px-4 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
