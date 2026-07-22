'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Loader2,
  Bot,
  User,
  Square,
  Plus,
  Settings,
  ChevronDown,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Search,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  tokens?: { input: number; output: number }
  attachments?: Attachment[]
  toolCalls?: ToolCall[]
}

interface ToolCall {
  id: string
  name: string
  arguments: string
  result?: string
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  preview?: string
}

interface Conversation {
  id: string
  name: string
  messages: Message[]
  createdAt: Date
  model: string
}

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'

const MODELS = [
  { value: 'xiaomi/mimo-v2.5-pro', label: 'Xiaomi MiMo v2.5 Pro', provider: 'Xiaomi' },
  { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet', provider: 'Anthropic' },
  { value: 'openai/gpt-5.5', label: 'GPT-5.5', provider: 'OpenAI' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
]

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.includes('pdf') || type.includes('document')) return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentConversation = conversations.find(c => c.id === activeConversation)

  useEffect(() => {
    if (!activeConversation) {
      createNewConversation()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

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

  function deleteConversation(id: string) {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConversation === id) {
      const remaining = conversations.filter(c => c.id !== id)
      setActiveConversation(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    addAttachments(Array.from(files))
    e.target.value = ''
  }

  function addAttachments(files: File[]) {
    const newAttachments: Attachment[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  function removeAttachment(id: string) {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id)
      if (att?.preview) URL.revokeObjectURL(att.preview)
      return prev.filter(a => a.id !== id)
    })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) addAttachments(files)
  }, [])

  function copyMessage(content: string, id: string) {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isStreaming || !activeConversation) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConversation
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    ))
    setInput('')
    setAttachments([])
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
          attachments: userMessage.attachments?.map(a => ({
            name: a.name,
            type: a.type,
            size: a.size,
          })),
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function stopStreaming() {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }

  const filteredConversations = searchQuery
    ? conversations.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-72 border-r-[3px] border-black bg-[var(--sidebar)] flex flex-col">
        <div className="p-3 border-b-[3px] border-black">
          <button
            onClick={createNewConversation}
            className="nb-btn-orange w-full px-3 py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="p-2 border-b-[3px] border-black">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full border-2 border-black pl-8 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative flex items-center gap-2 px-3 py-2.5 text-sm rounded cursor-pointer transition-all ${
                conv.id === activeConversation
                  ? 'bg-[var(--accent)] font-bold border-2 border-black shadow-[3px_3px_0px_0px_#111]'
                  : 'hover:bg-[var(--sidebar-accent)] border-2 border-transparent'
              }`}
              onClick={() => setActiveConversation(conv.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate">{conv.name}</div>
                <div className={`text-xs ${conv.id === activeConversation ? 'text-black/70' : 'text-[var(--muted-foreground)]'}`}>
                  {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(conv.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {filteredConversations.length === 0 && searchQuery && (
            <div className="text-center py-4 text-xs text-[var(--muted-foreground)]">
              No conversations found
            </div>
          )}
        </div>

        <div className="p-3 border-t-[3px] border-black">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] w-full transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Model Settings</span>
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>

          {showSettings && (
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border-2 border-black px-2.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {MODELS.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label} — {m.provider}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--background)]">
        <div
          className="flex-1 overflow-y-auto"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {currentConversation?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-20 h-20 bg-[var(--accent)] border-[3px] border-black flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_#111]">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2">Start a conversation</h2>
              <p className="text-[var(--muted-foreground)] max-w-md text-sm leading-relaxed">
                Send a message to start chatting with the AI assistant.
                You can also ask it to create schedules or run workflows.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  'Create a daily summary schedule',
                  'List my workflows',
                  'Explain quantum computing',
                  'Write a React component',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="nb-card bg-white p-3 text-left text-xs hover:bg-[var(--sidebar-accent)] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
              {currentConversation?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#111]">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div className={`max-w-[75%] group relative ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`${
                        msg.role === 'user'
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[3px] border-black shadow-[4px_4px_0px_0px_#111]'
                          : 'bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#111]'
                      } p-4`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-black/10">
                          {msg.attachments.map((att) => {
                            const Icon = getFileIcon(att.type)
                            return (
                              <div
                                key={att.id}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs border-2 ${
                                  msg.role === 'user'
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-black/10 bg-black/5'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[120px]">{att.name}</span>
                                <span className="opacity-60">{formatFileSize(att.size)}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Tool calls indicator */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-black/10 space-y-2">
                          {msg.toolCalls.map((tc) => (
                            <div key={tc.id} className="flex items-center gap-2 text-xs bg-[var(--secondary)] border-2 border-black px-3 py-2">
                              <Wrench className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-bold font-mono">{tc.name}</span>
                              <span className="text-[var(--muted-foreground)] truncate">{tc.arguments}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Content — Markdown for assistant, plain text for user */}
                      {msg.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:my-2 prose-pre:bg-black/5 prose-pre:border-2 prose-pre:border-black/10 prose-pre:rounded prose-code:text-[13px] prose-code:bg-black/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-table:border-2 prose-table:border-black prose-th:border-2 prose-th:border-black prose-th:bg-[var(--secondary)] prose-th:px-3 prose-th:py-2 prose-td:border-2 prose-td:border-black prose-td:px-3 prose-td:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5 prose-a:text-[var(--accent)] prose-a:underline prose-strong:font-bold prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-4 prose-blockquote:italic">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      )}

                      {msg.tokens && (
                        <div className={`mt-3 pt-2 border-t ${
                          msg.role === 'user' ? 'border-white/10' : 'border-black/10'
                        } flex items-center gap-3 text-[10px] opacity-60`}>
                          <span>{msg.tokens.input.toLocaleString()} in</span>
                          <span>{msg.tokens.output.toLocaleString()} out</span>
                          {msg.model && (
                            <span className="ml-auto">{msg.model.split('/')[1]}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`absolute top-2 ${
                      msg.role === 'user' ? '-left-10' : '-right-10'
                    } opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                      <button
                        onClick={() => copyMessage(msg.content, msg.id)}
                        className="p-1.5 bg-white border-2 border-black hover:bg-[var(--accent)] transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-9 h-9 bg-[var(--secondary)] border-2 border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#111] order-2">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {isDragging && (
          <div className="absolute inset-0 bg-[var(--accent)]/10 border-[3px] border-dashed border-[var(--accent)] flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white border-[3px] border-black px-8 py-4 shadow-[6px_6px_0px_0px_#111]">
              <p className="font-bold text-lg">Drop files here</p>
              <p className="text-sm text-[var(--muted-foreground)]">Attach files to your message</p>
            </div>
          </div>
        )}

        <div className="border-t-[3px] border-black bg-white p-4">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b-2 border-black/10">
              {attachments.map((att) => {
                const Icon = getFileIcon(att.type)
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-[var(--secondary)] border-2 border-black px-3 py-1.5 text-xs shadow-[2px_2px_0px_0px_#111]"
                  >
                    {att.preview ? (
                      <img src={att.preview} alt="" className="w-6 h-6 object-cover border border-black" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-[100px] font-medium">{att.name}</span>
                    <span className="text-[var(--muted-foreground)]">{formatFileSize(att.size)}</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="ml-1 p-0.5 hover:bg-black/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="nb-btn-outline p-3 shrink-0"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                disabled={isStreaming}
                rows={1}
                className="w-full border-[3px] border-black px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 resize-none min-h-[48px] max-h-[200px]"
              />
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="nb-btn px-4 py-3 bg-red-500 text-white flex items-center gap-2 shrink-0"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className="nb-btn-orange px-4 py-3 flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
          </form>

          <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
            <span className="nb-label !text-[9px] !py-0.5 !px-2">
              {MODELS.find(m => m.value === model)?.label || model.split('/')[1] || model}
            </span>
            <span>Press Enter to send · Shift+Enter for new line · Drop files to attach</span>
          </div>
        </div>
      </div>
    </div>
  )
}
