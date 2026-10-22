import type { ReactNode } from 'react'

/** The frame every live demo sits in: a black title bar, hard border and offset shadow. */
export function DemoWindow({ title, meta = 'Live demo · sample data', children, className = '', bodyClassName = '', shadow = '#111' }: {
  title: string
  meta?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  shadow?: string
}) {
  return <div className={`flex min-w-0 flex-col border-[3px] border-[#111] bg-white text-[#111] ${className}`} style={{ boxShadow: `8px 8px 0 ${shadow}` }}>
    <div className="flex items-center gap-3 border-b-[3px] border-[#111] bg-[#111] px-3 py-2 text-white">
      <span aria-hidden="true" className="flex gap-1.5">
        <i className="block h-2.5 w-2.5 bg-[#ff5f1f]" /><i className="block h-2.5 w-2.5 bg-white" /><i className="block h-2.5 w-2.5 border border-white" />
      </span>
      <span className="min-w-0 truncate font-mono text-[11px] font-bold uppercase tracking-[.14em]">{title}</span>
      <span className="ml-auto hidden shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#cfcfcf] sm:flex">
        <i aria-hidden="true" className="block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5f1f]" />{meta}
      </span>
    </div>
    <div className={`min-w-0 flex-1 ${bodyClassName}`}>{children}</div>
  </div>
}

/** A segmented control in the site's style. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void; label: string }) {
  return <div role="tablist" aria-label={label} className="inline-flex border-2 border-[#111] bg-white">
    {options.map(([key, text], i) => <button
      key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}
      className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.1em] transition-colors ${i > 0 ? 'border-l-2 border-[#111]' : ''} ${value === key ? 'bg-[#111] text-white' : 'text-[#111] hover:bg-[#ffdfcf]'}`}
    >{text}</button>)}
  </div>
}

/** Deterministic short hash for ledger-style ids in demos. */
export function shortHash(input: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}
