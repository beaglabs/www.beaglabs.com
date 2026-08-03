'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const CERTS = [
  {
    label: 'HUBZone Certified',
    src: 'https://www.wildflowerintl.com/wp-content/uploads/2024/02/HubZoneCertified.png',
  },
  {
    label: 'SBA',
    src: 'https://images.seeklogo.com/logo-png/33/2/small-business-administration-logo-png_seeklogo-331699.png',
  },
]

export function ChatInput({ className }: { className?: string }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [input])

  function start(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const id = crypto.randomUUID()
    const params = new URLSearchParams({ q: trimmed })
    window.location.href = `/chat/${id}?${params.toString()}`
  }

  return (
    <div className={cn('w-full', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          start(input)
        }}
        className="flex items-end gap-2 border-[3px] border-[#111] bg-white p-2 shadow-[6px_6px_0px_0px_#111] focus-within:shadow-[8px_8px_0px_0px_#ff5f1f] focus-within:-translate-x-[1px] focus-within:-translate-y-[1px] transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              start(input)
            }
          }}
          placeholder="Ask anything. 'We're on COBOL. What can you do?'"
          rows={1}
          className="min-h-[44px] flex-1 resize-none border-none bg-transparent px-3 py-2.5 text-[15px] font-medium leading-[1.45] text-[#111] outline-none placeholder:text-[#999]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="nb-btn flex h-[44px] items-center gap-2 bg-[#111] px-4 text-[11px] font-extrabold uppercase text-white disabled:opacity-40"
        >
          Chat
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#555]">
          Certified
        </span>
        {CERTS.map((cert) => (
          <div
            key={cert.label}
            className="flex h-12 items-center justify-center border-[2px] border-[#111] bg-white px-3 shadow-[3px_3px_0px_0px_#111]"
            title={cert.label}
          >
            <img
              src={cert.src}
              alt={cert.label}
              className="block h-9 w-auto max-w-[120px] object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
