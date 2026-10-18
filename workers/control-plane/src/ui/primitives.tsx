import type { ComponentChildren } from 'preact'
import { useCallback, useEffect, useId, useRef, useState } from 'preact/hooks'
import type { Toast } from './actions'
import { relative } from './format'
import { IconCheck, IconChevron, IconClose, IconRefresh } from './icons'
import type { PollStatus } from './polling'
import { useRuntime } from './runtime'
import type { Action, Milestone, MilestoneState, ProgressView, Tone } from './types'

/**
 * Neobrutalist takes on the Cult UI pieces the spec names: Spinner, Halo Progress, Marker, Sheet/Drawer, Toast,
 * Navigation Menu and Loading Carousel. Square corners, 2px #111 borders, hard offset shadows, #ff5f1f accents.
 * Every animation has a static equivalent under prefers-reduced-motion (CSS, and the runtime's animate is a no-op).
 */

// Hostnames break after dots, never mid-label ------------------------------------------------------------------------

export const Host = ({ name }: { name: string }) => (
  <>
    {name.split('.').map((part, i, all) =>
      i < all.length - 1 ? (
        <>
          {part}.<wbr />
        </>
      ) : (
        part
      ),
    )}
  </>
)

// Spinner ----------------------------------------------------------------------------------------------------------------

export const Spinner = ({ label }: { label?: string }) => (
  <span class="spin" role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} />
)

// Status ------------------------------------------------------------------------------------------------------------------

/** The confirmed state. Pulses once when it changes. */
export const StatusPill = ({ tone, label, size = 'md' }: { tone: Tone; label: string; size?: 'sm' | 'md' }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const runtime = useRuntime()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    runtime.animate(ref.current, { transform: ['scale(1)', 'scale(1.12)', 'scale(1)'] }, { duration: 0.45, ease: 'easeOut' })
  }, [label])
  return (
    <span ref={ref} class={`pill pill-${size}`} data-tone={tone}>
      <span class="pill-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

/** A requested transition the backend has not confirmed yet, shown next to (not instead of) the confirmed state. */
export const TransitionChip = ({ label, awaiting }: { label: string; awaiting: boolean }) => (
  <span class="trans" role="status">
    <Spinner />
    {label}
    <span class="trans-sub">{awaiting ? 'waiting for confirmation' : 'requested'}</span>
  </span>
)

// Halo progress -----------------------------------------------------------------------------------------------------------

const polar = (cx: number, cy: number, r: number, degrees: number) => {
  const radians = ((degrees - 90) * Math.PI) / 180
  return [cx + r * Math.cos(radians), cy + r * Math.sin(radians)] as const
}

const arc = (cx: number, cy: number, r: number, from: number, to: number) => {
  const [x0, y0] = polar(cx, cy, r, from)
  const [x1, y1] = polar(cx, cy, r, to)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

const SEGMENT_TONE: Record<MilestoneState, string> = { completed: 'done', active: 'active', pending: 'todo', failed: 'fail' }

/**
 * Halo Progress: one ring segment per backend milestone (determinate: real completed/total). The active segment
 * marches (no completion data inside a step); with no milestones the halo spins (indeterminate).
 */
export const Halo = ({ milestones, progress, center, size = 112 }: { milestones: Milestone[]; progress: ProgressView; center?: ComponentChildren; size?: number }) => {
  const runtime = useRuntime()
  const svg = useRef<SVGSVGElement>(null)
  const completed = useRef(progress.completed)
  const n = milestones.length
  const gap = n > 1 ? 5 : 0
  const step = n ? 360 / n : 360

  useEffect(() => {
    if (progress.completed > completed.current) {
      const index = progress.completed - 1
      const segment = svg.current?.querySelector(`[data-seg="${index}"]`)
      runtime.animate(segment, { strokeDashoffset: [1, 0] }, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] })
    }
    completed.current = progress.completed
  }, [progress.completed])

  return (
    <div class="halo" style={{ width: `${size}px`, height: `${size}px` }} role="img" aria-label={progress.mode === 'determinate' ? `Progress: ${progress.label}` : 'In progress'}>
      <svg ref={svg} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <circle class="halo-shadow" cx="64" cy="64" r="55" />
        <circle class="halo-plate" cx="60" cy="60" r="55" />
        <circle class="halo-hole" cx="60" cy="60" r="37" />
        {n === 0 ? (
          <g class="halo-spin">
            <path class="halo-seg" data-tone="active" d={arc(60, 60, 46, 0, 100)} pathLength={1} />
          </g>
        ) : (
          milestones.map((m, i) => (
            <path key={m.id} data-seg={i} class="halo-seg" data-tone={SEGMENT_TONE[m.state]} d={arc(60, 60, 46, i * step + gap / 2, (i + 1) * step - gap / 2)} pathLength={1} />
          ))
        )}
      </svg>
      <div class="halo-center">{center}</div>
    </div>
  )
}

// Marker timeline -------------------------------------------------------------------------------------------------------

const MARK: Record<MilestoneState, ComponentChildren> = {
  completed: <IconCheck />,
  active: <span class="ms-pulse" />,
  failed: <span class="ms-bang">!</span>,
  pending: null,
}

const STATE_WORD: Record<MilestoneState, string> = { completed: 'Done', active: 'In progress', failed: 'Failed', pending: 'Pending' }

export const MilestoneList = ({ milestones, now, mounted }: { milestones: Milestone[]; now: number; mounted: boolean }) => (
  <ol class="ms">
    {milestones.map((m, i) => (
      <li key={m.id} class="ms-i" data-state={m.state} aria-current={m.state === 'active' ? 'step' : undefined}>
        <span class="ms-mark" aria-hidden="true">
          {MARK[m.state] ?? <span class="ms-num">{i + 1}</span>}
        </span>
        <div class="ms-body">
          <div class="ms-row">
            <span class="ms-label">{m.label}</span>
            <span class="sr-only"> · {STATE_WORD[m.state]}</span>
            {m.at && m.state !== 'pending' ? (
              <time class="ms-time" dateTime={m.at} title={m.at}>
                {mounted ? relative(m.at, now) : m.at.slice(11, 16) + ' UTC'}
              </time>
            ) : null}
          </div>
          <p class="ms-detail">{m.detail}</p>
          {m.note && m.state === 'active' ? <p class="ms-note">{m.note}</p> : null}
        </div>
      </li>
    ))}
  </ol>
)

// Buttons ---------------------------------------------------------------------------------------------------------------

export const ActionButton = ({ action, pendingId, blocked, onRun, size, icon }: { action: Action; pendingId: string | null; blocked: boolean; onRun: (action: Action) => void; size?: 'sm' | 'lg'; icon?: ComponentChildren }) => {
  const busy = pendingId === action.id
  return (
    <button
      type="button"
      class={`btn ${action.kind === 'primary' ? 'primary' : action.kind === 'danger' ? 'danger' : ''} ${size ?? ''}`}
      disabled={blocked || busy}
      aria-busy={busy ? 'true' : undefined}
      data-action={action.id}
      onClick={() => onRun(action)}
    >
      {busy ? <Spinner /> : icon}
      {busy ? action.pendingLabel : action.label}
    </button>
  )
}

// Sheet / Drawer / Dialog -----------------------------------------------------------------------------------------------

/**
 * A native <dialog> (focus trap, Esc, inert page for free). `sheet`: slides in from the right on desktop and becomes a
 * bottom drawer on small screens (CSS). `dialog`: centred on desktop, bottom drawer on small screens.
 */
export const Overlay = ({ open, onClose, title, kicker, variant, children, footer }: { open: boolean; onClose: () => void; title: string; kicker?: string; variant: 'sheet' | 'dialog'; children: ComponentChildren; footer?: ComponentChildren }) => {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const id = `ov${useId()}`
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null
      dialog.showModal()
      const close = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog.querySelector<HTMLElement>('.ov-x')
      close?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      opener.current?.focus?.()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      class={`ov ov-${variant}`}
      aria-labelledby={`${id}-t`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div class="ov-panel">
        <span class="ov-grip" aria-hidden="true" />
        <header class="ov-head">
          <div>
            {kicker ? <div class="ov-kicker">{kicker}</div> : null}
            <h2 id={`${id}-t`} class="disp">
              {title}
            </h2>
          </div>
          <button type="button" class="ov-x" aria-label="Close" onClick={onClose}>
            <IconClose />
          </button>
        </header>
        <div class="ov-body">{children}</div>
        {footer ? <footer class="ov-foot">{footer}</footer> : null}
      </div>
    </dialog>
  )
}

// Toasts ----------------------------------------------------------------------------------------------------------------

interface ToastItem extends Toast {
  id: number
}

export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (toast: Toast) => {
      const id = ++seq.current
      setToasts((list) => [...list.slice(-3), { ...toast, id }])
      setTimeout(() => dismiss(id), toast.tone === 'err' ? 10_000 : 5_000)
    },
    [dismiss],
  )
  return { toasts, push, dismiss }
}

const ToastView = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  const runtime = useRuntime()
  useEffect(() => runtime.animate(ref.current, { opacity: [0, 1], transform: ['translateY(-10px)', 'translateY(0)'] }, { duration: 0.25, ease: 'easeOut' }), [])
  return (
    <div ref={ref} class="toast" data-tone={toast.tone} role={toast.tone === 'err' ? 'alert' : undefined}>
      <span class="toast-mark" aria-hidden="true">
        {toast.tone === 'ok' ? <IconCheck /> : toast.tone === 'err' ? '!' : 'i'}
      </span>
      <div class="toast-text">
        <strong>{toast.title}</strong>
        {toast.body ? <p>{toast.body}</p> : null}
      </div>
      <button type="button" class="toast-x" aria-label="Dismiss" onClick={onDismiss}>
        <IconClose />
      </button>
    </div>
  )
}

export const Toasts = ({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) => (
  <div class="toasts" role="region" aria-label="Notifications">
    <div aria-live="polite">
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  </div>
)

// Sync status -----------------------------------------------------------------------------------------------------------

/** Last successful update, a quiet spinner while a refresh is in flight, stale state with Retry after failures. */
export const SyncBadge = ({ status, now, mounted, onRefresh, dark }: { status: PollStatus; now: number; mounted: boolean; onRefresh: () => void; dark?: boolean }) => {
  const when = status.lastSuccessAt ? new Date(status.lastSuccessAt).toISOString() : null
  return (
    <div class={`sync${status.stale ? ' stale' : ''}${dark ? ' dark' : ''}`} role="status" aria-live="polite">
      {status.inFlight ? <Spinner /> : <span class="sync-dot" aria-hidden="true" />}
      <span class="sync-text">
        {status.stale ? (
          <>
            <strong>Can't reach the control plane</strong> · showing {mounted && when ? relative(when, now) : 'last known'} data
            {status.failures > 1 ? ` · retrying (${status.failures})` : ''}
          </>
        ) : (
          <>Updated {mounted && when ? relative(when, now) : 'just now'}</>
        )}
      </span>
      <button type="button" class="sync-btn" onClick={onRefresh} disabled={status.inFlight} aria-label={status.stale ? 'Retry now' : 'Refresh now'}>
        <IconRefresh />
        <span>{status.stale ? 'Retry' : 'Refresh'}</span>
      </button>
    </div>
  )
}

// Navigation menu (deployment switcher) ---------------------------------------------------------------------------------

export const Switcher = ({ current, items }: { current: string; items: { id: string; name: string; tone: Tone; statusLabel: string }[] }) => {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const others = items.filter((item) => item.id !== current)
  const name = items.find((item) => item.id === current)?.name ?? current
  if (!others.length) return <span class="crumb-cur">{name}</span>
  const focusItem = (delta: number) => {
    const links = Array.from(root.current?.querySelectorAll<HTMLElement>('.nm-list a') ?? [])
    const index = links.indexOf(document.activeElement as HTMLElement)
    links[(index + delta + links.length) % links.length]?.focus()
  }
  return (
    <div
      class="nm"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          root.current?.querySelector<HTMLElement>('.nm-btn')?.focus()
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          if (!open) setOpen(true)
          setTimeout(() => focusItem(1), 0)
        } else if (event.key === 'ArrowUp' && open) {
          event.preventDefault()
          focusItem(-1)
        }
      }}
    >
      <button type="button" class="nm-btn" aria-expanded={open ? 'true' : 'false'} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <span class="crumb-cur">{name}</span>
        <IconChevron dir={open ? 'up' : 'down'} />
      </button>
      {open ? (
        <div class="nm-pop">
          <div class="nm-head">Switch deployment</div>
          <ul class="nm-list">
            {others.map((item) => (
              <li key={item.id}>
                <a href={`/deploy/${encodeURIComponent(item.id)}`}>
                  <span class="nm-dot" data-tone={item.tone} aria-hidden="true" />
                  <span class="nm-name">{item.name}</span>
                  <span class="nm-st">{item.statusLabel}</span>
                </a>
              </li>
            ))}
            <li>
              <a href="/deploy" class="nm-all">
                All deployments →
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}

// Loading carousel ------------------------------------------------------------------------------------------------------

export interface Tip {
  title: string
  body: string
}

/**
 * Tips while provisioning (Cult UI Loading Carousel pattern). Rotates every 6s, pauses on hover/focus, and never
 * auto-rotates under reduced motion. It is decoration around the real status, never a substitute for it.
 */
export const LoadingCarousel = ({ tips, label }: { tips: Tip[]; label: string }) => {
  const runtime = useRuntime()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = useRef<HTMLDivElement>(null)
  const auto = !runtime.reducedMotion && !paused
  useEffect(() => {
    if (!auto) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % tips.length), 6000)
    return () => clearTimeout(timer)
  }, [index, auto, tips.length])
  useEffect(() => runtime.animate(slide.current, { opacity: [0, 1], transform: ['translateX(14px)', 'translateX(0)'] }, { duration: 0.35, ease: 'easeOut' }), [index])
  const tip = tips[index]!
  return (
    <section class="lc" aria-roledescription="carousel" aria-label={label} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusIn={() => setPaused(true)} onFocusOut={() => setPaused(false)}>
      <div class="lc-slide" ref={slide} aria-live={auto ? 'off' : 'polite'} aria-roledescription="slide" aria-label={`${index + 1} of ${tips.length}`}>
        <div class="lc-kicker">
          Tip {index + 1} / {tips.length}
        </div>
        <h3 class="lc-title disp">{tip.title}</h3>
        <p class="lc-body">{tip.body}</p>
      </div>
      <div class="lc-nav">
        <button type="button" class="lc-arrow" aria-label="Previous tip" onClick={() => setIndex((index - 1 + tips.length) % tips.length)}>
          <IconChevron dir="left" />
        </button>
        <div class="lc-dots" role="group" aria-label="Choose a tip">
          {tips.map((t, i) => (
            <button key={t.title} type="button" class={`lc-dot${i === index ? ' on' : ''}`} aria-label={`Tip ${i + 1}: ${t.title}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)}>
              {i === index && auto ? <span class="lc-fill" key={index} /> : null}
            </button>
          ))}
        </div>
        <button type="button" class="lc-arrow" aria-label="Next tip" onClick={() => setIndex((index + 1) % tips.length)}>
          <IconChevron dir="right" />
        </button>
      </div>
    </section>
  )
}
