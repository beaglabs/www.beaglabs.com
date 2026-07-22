'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Square, Plus, Settings, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  tokens?: { input: number; output: number }
}

interface Conversation {
  id: string
  name: string
  messages: Message[]
  createdAt: Date
  model: string
}

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const currentConversation = conversations.find(c => c.id === activeConversation)

  useEffect(() => {
    if (!activeConversation) {
      createNewConversation()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  function createNewConversation() {
    const id = crypto.randomUUID()
    const newConv: Conversation = {
      id,
      name: `Chat ${conversations.length + 1}`,
      messages: [],
      createdAt: new Date(),
      model,
    }
    setConversations(prev => [...prev, newConv])
    setActiveConversation(id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming || !activeConversation) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConversation
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    ))
    setInput('')
    setIsStreaming(true)

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model,
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConversation
        ? { ...c, messages: [...c.messages, assistantMessage] }
        : c
    ))

    try {
      abortControllerRef.current = new AbortController()

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: activeConversation,
          model,
          history: currentConversation?.messages.map(m => ({
            role: m.role,
            content: m.content,
          })) || [],
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) throw new Error('Failed to send message')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                setConversations(prev => prev.map(c =>
                  c.id === activeConversation
                    ? {
                        ...c,
                        messages: c.messages.map(m =>
                          m.id === assistantMessage.id
                            ? { ...m, content: m.content + data.content }
                            : m
                        ),
                      }
                    : c
                ))
              }
              if (data.tokens) {
                setConversations(prev => prev.map(c =>
                  c.id === activeConversation
                    ? {
                        ...c,
                        messages: c.messages.map(m =>
                          m.id === assistantMessage.id
                            ? { ...m, tokens: data.tokens }
                            : m
                        ),
                      }
                    : c
                ))
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Failed to get response')
        console.error(err)
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  function stopStreaming() {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r-3 border-black bg-[var(--sidebar)] flex flex-col">
        <div className="p-3 border-b-3 border-black">
          <button
            onClick={createNewConversation}
            className="nb-btn-orange w-full px-3 py-2 text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                conv.id === activeConversation
                  ? 'bg-[var(--accent)] font-bold'
                  : 'hover:bg-[var(--sidebar-accent)]'
              }`}
            >
              <div className="truncate">{conv.name}</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {conv.messages.length} messages
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t-3 border-black">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] w-full"
          >
            <Settings className="w-4 h-4" />
            Model Settings
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>

          {showSettings && (
            <div className="mt-2 space-y-2">
              <label className="block text-xs font-bold">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border-2 border-black px-2 py-1.5 text-xs bg-white"
              >
                <option value="xiaomi/mimo-v2.5-pro">Xiaomi MiMo v2.5 Pro</option>
                <option value="anthropic/claude-sonnet-4-6">Claude Sonnet</option>
                <option value="openai/gpt-5.5">GPT-5.5</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentConversation?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[var(--accent)] border-3 border-black flex items-center justify-center mb-4">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Start a conversation</h2>
              <p className="text-[var(--muted-foreground)] max-w-md">
                Send a message to start chatting with the AI assistant.
                The agent will be created dynamically with your chosen model.
              </p>
            </div>
          ) : (
            currentConversation?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] ${
                    msg.role === 'user'
                      ? 'nb-card bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'nb-card bg-white'
                  } p-4`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  {msg.tokens && (
                    <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {msg.tokens.input} input / {msg.tokens.output} output tokens
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-[var(--secondary)] border-2 border-black flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t-3 border-black">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="flex-1 border-3 border-black px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="nb-btn px-4 py-3 bg-red-500 text-white flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="nb-btn-orange px-4 py-3 flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
          </form>

          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="nb-label !text-[9px] !py-0 !px-1.5">
              {model.split('/')[1] || model}
            </span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  )
}
