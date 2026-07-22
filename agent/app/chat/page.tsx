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
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Wrench,
  ExternalLink,
  PanelRightOpen,
  PanelRightClose,
  Code2,
  FileCode,
  Maximize2,
  Minimize2,
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

interface Artifact {
  id: string
  type: 'code' | 'markdown' | 'html' | 'json'
  title: string
  language?: string
  content: string
}

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'

const MODELS = [
  { value: 'xiaomi/mimo-v2.5-pro', label: 'MiMo v2.5 Pro', provider: 'Xiaomi' },
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

function formatDate(d: Date): string {
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Past 7 Days'
  return 'Older'
}

// Extract code blocks from markdown content as artifacts
function extractArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let match
  let i = 0
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1] || 'text'
    const code = match[2].trim()
    if (code.length > 50) {
      artifacts.push({
        id: `artifact-${i++}`,
        type: lang === 'html' ? 'html' : lang === 'json' ? 'json' : 'code',
        title: lang === 'html' ? 'HTML Preview' : `${lang} snippet`,
        language: lang,
        content: code,
      })
    }
  }
  return artifacts
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [model] = useState(DEFAULT_MODEL)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false)
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null)
  const [artifactFullscreen, setArtifactFullscreen] = useState(false)
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  function createNewConversation() {
    const id = crypto.randomUUID()
    const newConv: Conversation = {
      id,
      name: 'New Thread',
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

  // Auto-name conversation from first user message
  function autoNameConversation(convId: string, firstMessage: string) {
    const name = firstMessage.length > 40 ? firstMessage.slice(0, 40) + '...' : firstMessage
    setConversations(prev => prev.map(c =>
      c.id === convId && c.name === 'New Thread' ? { ...c, name } : c
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isStreaming || !activeConversation) return

    const userContent = input.trim()
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    autoNameConversation(activeConversation, userContent)

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
          message: userContent,
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

  function openArtifact(artifact: Artifact) {
    setActiveArtifact(artifact)
    setArtifactPanelOpen(true)
  }

  // Group conversations by date
  const grouped = conversations.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const key = formatDate(conv.createdAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(conv)
    return acc
  }, {})

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ─── Threads Sidebar ─── */}
      <div className="w-64 border-r-[3px] border-black bg-[var(--sidebar)] flex flex-col shrink-0">
        <div className="p-3 border-b-[3px] border-black">
          <button
            onClick={createNewConversation}
            className="nb-btn-orange w-full px-3 py-2 text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {Object.entries(grouped).map(([label, convs]) => (
            <div key={label} className="mb-1">
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {label}
              </div>
              {convs.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-all ${
                    conv.id === activeConversation
                      ? 'bg-[var(--accent)] font-bold border-y-2 border-black'
                      : 'hover:bg-[var(--sidebar-accent)]'
                  }`}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0 truncate text-xs">
                    {conv.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
              No threads yet
            </div>
          )}
        </div>

        {/* View App link */}
        <div className="p-3 border-t-[3px] border-black space-y-2">
          <a
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors py-1.5"
          >
            View App
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--muted-foreground)]">
            <span className="nb-label !text-[9px] !py-0.5 !px-2">
              {MODELS.find(m => m.value === model)?.label || model}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0">
        <div
          className="flex-1 overflow-y-auto"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {currentConversation?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 bg-[var(--accent)] border-[3px] border-black flex items-center justify-center mb-5 shadow-[5px_5px_0px_0px_#111]">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold mb-2">What can I help with?</h2>
              <p className="text-[var(--muted-foreground)] max-w-sm text-xs leading-relaxed mb-6">
                I can create schedules, run workflows, and help with questions.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {[
                  'Create a daily summary schedule',
                  'List my workflows',
                  'Run the deploy workflow',
                  'What schedules do I have?',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="bg-white border-2 border-black px-3 py-2.5 text-xs text-left hover:bg-[var(--sidebar-accent)] transition-colors shadow-[2px_2px_0px_0px_#111]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
              {currentConversation?.messages.map((msg) => {
                const msgArtifacts = msg.role === 'assistant' ? extractArtifacts(msg.content) : []
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#111] mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`${
                          msg.role === 'user'
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[3px] border-black shadow-[3px_3px_0px_0px_#111]'
                            : 'bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_#111]'
                        } px-4 py-3`}
                      >
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-black/10">
                            {msg.attachments.map((att) => {
                              const Icon = getFileIcon(att.type)
                              return (
                                <div
                                  key={att.id}
                                  className={`flex items-center gap-1.5 px-2 py-1 text-[10px] border ${
                                    msg.role === 'user'
                                      ? 'border-white/30 bg-white/10'
                                      : 'border-black/10 bg-black/5'
                                  }`}
                                >
                                  <Icon className="w-3 h-3" />
                                  <span className="truncate max-w-[100px]">{att.name}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {msg.role === 'assistant' ? (
                          <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:my-1.5 prose-pre:bg-black/5 prose-pre:border-2 prose-pre:border-black/10 prose-pre:rounded prose-code:text-[12px] prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-table:border-2 prose-table:border-black prose-th:border-2 prose-th:border-black prose-th:bg-[var(--secondary)] prose-th:px-2 prose-th:py-1.5 prose-td:border-2 prose-td:border-black prose-td:px-2 prose-td:py-1.5 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5 prose-a:text-[var(--accent)] prose-a:underline prose-strong:font-bold prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-3 prose-blockquote:italic">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        )}

                        {msg.tokens && (
                          <div className={`mt-2 pt-1.5 border-t ${
                            msg.role === 'user' ? 'border-white/10' : 'border-black/10'
                          } flex items-center gap-2 text-[9px] opacity-50`}>
                            <span>{msg.tokens.input.toLocaleString()} in</span>
                            <span>{msg.tokens.output.toLocaleString()} out</span>
                            {msg.model && <span className="ml-auto">{msg.model.split('/')[1]}</span>}
                          </div>
                        )}
                      </div>

                      {/* Artifacts bar */}
                      {msgArtifacts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msgArtifacts.map((art) => (
                            <button
                              key={art.id}
                              onClick={() => openArtifact(art)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium bg-white border-2 border-black hover:bg-[var(--accent)] transition-colors shadow-[2px_2px_0px_0px_#111]"
                            >
                              {art.type === 'html' ? <FileCode className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
                              {art.title}
                              {art.language && <span className="opacity-50">.{art.language}</span>}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Copy button */}
                      <div className={`absolute top-1 ${
                        msg.role === 'user' ? '-left-8' : '-right-8'
                      } opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button
                          onClick={() => copyMessage(msg.content, msg.id)}
                          className="p-1 bg-white border border-black hover:bg-[var(--accent)] transition-colors"
                          title="Copy"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-2.5 h-2.5" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 bg-[var(--secondary)] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#111] order-2 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-[var(--accent)]/10 border-[3px] border-dashed border-[var(--accent)] flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white border-[3px] border-black px-6 py-3 shadow-[5px_5px_0px_0px_#111]">
              <p className="font-bold">Drop files here</p>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t-[3px] border-black bg-white px-4 py-3">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b-2 border-black/10">
              {attachments.map((att) => {
                const Icon = getFileIcon(att.type)
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-[var(--secondary)] border-2 border-black px-2 py-1 text-[10px] shadow-[1px_1px_0px_0px_#111]"
                  >
                    {att.preview ? (
                      <img src={att.preview} alt="" className="w-4 h-4 object-cover border border-black" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="truncate max-w-[80px] font-medium">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="p-0.5 hover:bg-black/10">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="nb-btn-outline p-2.5 shrink-0"
              title="Attach"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isStreaming}
                rows={1}
                className="w-full border-[3px] border-black px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 resize-none min-h-[42px] max-h-[160px]"
              />
            </div>
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="nb-btn p-2.5 bg-red-500 text-white shrink-0"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className="nb-btn-orange p-2.5 disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ─── Artifact Panel ─── */}
      {artifactPanelOpen && activeArtifact && (
        <div className={`${artifactFullscreen ? 'fixed inset-0 z-50' : 'w-[420px]'} border-l-[3px] border-black bg-white flex flex-col shrink-0`}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b-[3px] border-black bg-[var(--sidebar)]">
            <div className="flex items-center gap-2">
              {activeArtifact.type === 'html' ? <FileCode className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              <span className="font-bold text-sm">{activeArtifact.title}</span>
              {activeArtifact.language && (
                <span className="nb-label !text-[9px] !py-0.5 !px-1.5">{activeArtifact.language}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setArtifactFullscreen(!artifactFullscreen)}
                className="p-1.5 hover:bg-black/10 transition-colors"
                title={artifactFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {artifactFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setArtifactPanelOpen(false); setActiveArtifact(null) }}
                className="p-1.5 hover:bg-black/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeArtifact.type === 'html' ? (
              <div className="border-2 border-black h-full">
                <iframe
                  srcDoc={activeArtifact.content}
                  className="w-full h-full min-h-[400px]"
                  sandbox="allow-scripts"
                  title="HTML Preview"
                />
              </div>
            ) : (
              <pre className="text-xs font-mono bg-black/5 border-2 border-black p-4 overflow-auto whitespace-pre-wrap leading-relaxed">
                {activeArtifact.content}
              </pre>
            )}
          </div>

          <div className="px-4 py-2 border-t-[3px] border-black bg-[var(--sidebar)]">
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeArtifact.content)
                toast.success('Copied to clipboard')
              }}
              className="nb-btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Artifact toggle button (when panel is closed and there are artifacts) */}
      {!artifactPanelOpen && currentConversation?.messages.some(m =>
        m.role === 'assistant' && extractArtifacts(m.content).length > 0
      ) && (
        <button
          onClick={() => {
            const lastAssistant = [...(currentConversation?.messages || [])].reverse().find(m => m.role === 'assistant')
            if (lastAssistant) {
              const arts = extractArtifacts(lastAssistant.content)
              if (arts.length > 0) openArtifact(arts[0])
            }
          }}
          className="fixed right-4 bottom-20 nb-btn-orange p-2.5 shadow-[3px_3px_0px_0px_#111] z-40"
          title="View artifacts"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
