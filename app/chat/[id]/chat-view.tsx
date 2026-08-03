'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const SERVICES = [
  {
    key: 'legacy-data',
    title: 'Legacy Data Extraction',
    blurb: 'Mainframe, COBOL, AS400 — read it without touching the system of record.',
    icon: '▤',
  },
  {
    key: 'ai-swe',
    title: 'AI-Enabled Software Development',
    blurb: 'Embed with your team and ship a working AI feature in 6–10 weeks.',
    icon: '⚙',
  },
  {
    key: 'agent-ux',
    title: 'Agent UX Consulting',
    blurb: 'Design agentic experiences that users actually trust and complete.',
    icon: '◆',
  },
  {
    key: 'slm-feasibility',
    title: 'SLM Feasibility & Savings',
    blurb: '2–4 week paid assessment. Quality benchmark, $/year projection, go/no-go.',
    icon: '◎',
  },
  {
    key: 'slm-deploy',
    title: 'SLM Deployments',
    blurb: 'On-prem, air-gapped, VPC, edge. Quantization, serving, observability.',
    icon: '▣',
  },
] as const

const QUICK_PROMPTS = [
  'What does a typical engagement look like?',
  'How much can we actually save vs. our current API?',
  "We're stuck on a 30-year-old mainframe. Can you help?",
  'Walk me through your feasibility assessment.',
]

export function ChatView({ id, initialMessage }: { id: string; initialMessage?: string }) {
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    id,
    transport: new DefaultChatTransport({
      api: `/api/chat/${id}`,
    }),
  })

  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const consumedInitial = useRef(false)

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
  }, [input])

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: status === 'streaming' ? 'auto' : 'smooth' })
  }, [messages, status])

  // Send the initial message from the hero input (once)
  useEffect(() => {
    if (!initialMessage || consumedInitial.current) return
    consumedInitial.current = true
    sendMessage({ text: initialMessage })
  }, [initialMessage, sendMessage])

  const isStreaming = status === 'submitted' || status === 'streaming'
  const isEmpty = messages.length === 0

  function handleSubmit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    sendMessage({ text: trimmed })
    setInput('')
  }

  function pickService(svc: (typeof SERVICES)[number]) {
    handleSubmit(
      `Tell me more about ${svc.title}. ${svc.blurb} Specifically, I want to understand how it would work for our team.`,
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 lg:px-9">
      {/* Header bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#111] pb-4">
        <div className="flex items-center gap-3">
          <span className="nb-label">Agent</span>
          <h1 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#111]">
            Beag Labs Concierge
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#555]">
          <span className="hidden sm:inline">session</span>
          <code className="border-[2px] border-[#111] bg-white px-2 py-1 text-[#111]">
            {id.slice(0, 8)}…
          </code>
        </div>
      </div>

      {/* Scroll area */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto border-[3px] border-[#111] bg-white shadow-[6px_6px_0px_0px_#111]"
      >
        {isEmpty ? (
          <EmptyState onPickService={pickService} onPickPrompt={handleSubmit} />
        ) : (
          <MessageList messages={messages} status={status} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center justify-between gap-3 border-[3px] border-[#dc2626] bg-[#FFF3E6] px-4 py-3 text-[12px] text-[#111]">
          <span>
            <span className="font-extrabold">Something went wrong.</span> The model didn&apos;t respond.
          </span>
          <button
            type="button"
            onClick={() => regenerate()}
            className="border-[2px] border-[#111] bg-white px-3 py-1 font-extrabold uppercase tracking-[0.1em] shadow-[2px_2px_0px_0px_#111] hover:shadow-[3px_3px_0px_0px_#111] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick prompt chips */}
      {!isEmpty && (
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSubmit(p)}
              className="nb-chip disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(input)
        }}
        className="mt-3 flex items-end gap-2 border-[3px] border-[#111] bg-white p-2 shadow-[6px_6px_0px_0px_#111]"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleSubmit(input)
            }
          }}
          placeholder={
            isEmpty
              ? 'Ask about our services, your stack, or paste a problem…'
              : 'Continue the conversation…'
          }
          rows={1}
          disabled={isStreaming}
          className="min-h-[40px] flex-1 resize-none border-none bg-transparent px-3 py-2 text-[15px] font-medium leading-[1.4] text-[#111] outline-none placeholder:text-[#999] focus:outline-none disabled:opacity-60"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={() => stop()}
            className="nb-btn flex h-[40px] items-center gap-2 bg-[#111] px-4 text-[11px] uppercase text-white"
            aria-label="Stop generating"
          >
            <span className="block size-2 bg-[#ff5f1f]" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="nb-btn flex h-[40px] items-center gap-2 bg-[#111] px-4 text-[11px] uppercase text-white disabled:opacity-40"
          >
            Send
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          </button>
        )}
      </form>

      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#999]">
        Enter to send · Shift+Enter for newline · Responses stream from the model
      </p>
    </div>
  )
}

/* ─────────── Empty state ─────────── */

function EmptyState({
  onPickService,
  onPickPrompt,
}: {
  onPickService: (svc: (typeof SERVICES)[number]) => void
  onPickPrompt: (text: string) => void
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b-[3px] border-[#111] bg-[#ff5f1f] p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#111]/70">
          AI concierge · opencode-go / minimax-m3
        </p>
        <h2 className="mt-3 text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111] sm:text-[34px]">
          What are you trying to ship?
        </h2>
        <p className="mt-3 max-w-[640px] text-[14px] leading-[1.5] text-[#404040]">
          I&apos;ll route you to the right Beag Labs service. Be specific — name a system, a cost, a
          deadline — and I can be useful in one message.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        {SERVICES.map((svc) => (
          <button
            key={svc.key}
            type="button"
            onClick={() => onPickService(svc)}
            className="group flex flex-col items-start gap-2 border-[3px] border-[#111] bg-white p-4 text-left shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#ff5f1f]"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center border-[2px] border-[#111] bg-[#ff5f1f] text-[15px] font-extrabold text-[#111]">
                {svc.icon}
              </span>
              <span className="text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-[#111]">
                {svc.title}
              </span>
            </div>
            <p className="text-[12px] leading-[1.45] text-[#555]">{svc.blurb}</p>
            <span className="mt-auto font-mono text-[9px] uppercase tracking-[0.14em] text-[#999] group-hover:text-[#ff5f1f]">
              Ask about this →
            </span>
          </button>
        ))}
      </div>

      <div className="border-t-[3px] border-[#111] bg-[#FAFAF9] p-4 sm:p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#555]">
          Or jump in with:
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPickPrompt(p)}
              className="nb-chip"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────── Messages ─────────── */

function MessageList({
  messages,
  status,
}: {
  messages: ReturnType<typeof useChat>['messages']
  status: ReturnType<typeof useChat>['status']
}) {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {status === 'submitted' && <TypingBubble />}
    </div>
  )
}

function MessageBubble({ message }: { message: ReturnType<typeof useChat>['messages'][number] }) {
  const isUser = message.role === 'user'
  const text = useMemo(
    () => message.parts.filter((p) => p.type === 'text').map((p) => p.text).join(''),
    [message.parts],
  )

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[88%] flex-col gap-1.5 sm:max-w-[78%]', isUser && 'items-end')}>
        <div className="flex items-center gap-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#777]">
          {isUser ? <span>You</span> : <span className="text-[#ff5f1f]">Beag Labs</span>}
        </div>
        <div
          className={cn(
            'border-[3px] border-[#111] px-4 py-3 text-[14px] leading-[1.55] sm:text-[15px]',
            isUser
              ? 'bg-[#111] text-white shadow-[4px_4px_0px_0px_#ff5f1f]'
              : 'bg-white text-[#111] shadow-[4px_4px_0px_0px_#111]',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{text}</p>
          ) : (
            <Markdown text={text} />
          )}
        </div>
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[78%] flex-col gap-1.5">
        <div className="flex items-center gap-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#ff5f1f]">
          Beag Labs
        </div>
        <div className="flex items-center gap-1.5 border-[3px] border-[#111] bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#111]">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </div>
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="block size-1.5 rounded-full bg-[#111] animate-pulse"
      style={{ animationDelay: delay }}
    />
  )
}

/* ─────────── Lightweight markdown ─────────── */

function Markdown({ text }: { text: string }) {
  // Block-level parsing: split on blank lines, then inline within each block.
  const blocks = useMemo(() => text.split(/\n{2,}/), [text])
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

function Block({ block }: { block: string }) {
  // Headings
  const h = block.match(/^(#{1,3})\s+(.*)$/)
  if (h) {
    const level = h[1].length
    const content = renderInline(h[2])
    if (level === 1) return <h3 className="text-[18px] font-extrabold tracking-[-0.02em]">{content}</h3>
    if (level === 2) return <h4 className="text-[16px] font-extrabold tracking-[-0.01em]">{content}</h4>
    return <h5 className="text-[15px] font-extrabold">{content}</h5>
  }
  // Unordered list
  if (/^(?:- |\* )/m.test(block) && block.split('\n').every((l) => /^(?:- |\* )/.test(l) || l.trim() === '')) {
    const items = block.split('\n').filter((l) => /^(?:- |\* )/.test(l)).map((l) => l.replace(/^(?:- |\* )/, ''))
    return (
      <ul className="list-inside list-disc space-y-1 marker:text-[#ff5f1f]">
        {items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    )
  }
  // Numbered list
  if (/^\d+\.\s/m.test(block) && block.split('\n').every((l) => /^\d+\.\s/.test(l) || l.trim() === '')) {
    const items = block.split('\n').filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s/, ''))
    return (
      <ol className="list-inside list-decimal space-y-1 marker:font-extrabold marker:text-[#ff5f1f]">
        {items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ol>
    )
  }
  // Code block
  if (block.startsWith('```')) {
    const code = block.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '')
    return (
      <pre className="overflow-x-auto border-[2px] border-[#111] bg-[#FAFAF9] p-3 font-mono text-[12px] leading-[1.5]">
        <code>{code}</code>
      </pre>
    )
  }
  // Paragraph (preserve line breaks inside)
  return <p className="whitespace-pre-wrap leading-[1.6]">{renderInline(block)}</p>
}

function renderInline(s: string) {
  // Bold then inline code then links — order matters
  const parts: (string | { kind: 'bold' | 'code' | 'link'; value: string; href?: string })[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('**')) parts.push({ kind: 'bold', value: t.slice(2, -2) })
    else if (t.startsWith('`')) parts.push({ kind: 'code', value: t.slice(1, -1) })
    else if (t.startsWith('[')) {
      const lm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!
      parts.push({ kind: 'link', value: lm[1], href: lm[2] })
    }
    last = m.index + t.length
  }
  if (last < s.length) parts.push(s.slice(last))
  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{p}</span>
    if (p.kind === 'bold') return <strong key={i} className="font-extrabold text-[#111]">{p.value}</strong>
    if (p.kind === 'code')
      return (
        <code key={i} className="border-[1px] border-[#111] bg-[#FAFAF9] px-1.5 py-0.5 font-mono text-[12px]">
          {p.value}
        </code>
      )
    return (
      <Link key={i} href={p.href!} className="underline decoration-[#ff5f1f] decoration-2 underline-offset-2 hover:decoration-[#111]">
        {p.value}
      </Link>
    )
  })
}
