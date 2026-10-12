"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

const ORANGE: [number, number, number] = [255, 95, 31]
const INK: [number, number, number] = [17, 17, 17]
const CELL = 4

type Stage =
  | { kind: "dither"; label: string; ms: number }
  | { kind: "video"; src: string; poster: string; label: string; ms: number }
  | { kind: "product"; label: string; ms: number }

const stages: Stage[] = [
  { kind: "dither", label: "Public infrastructure", ms: 5200 },
  { kind: "video", src: "/hero/clip-1.mp4", poster: "/hero/poster-1.jpg", label: "State & local", ms: 4800 },
  { kind: "video", src: "/hero/clip-2.mp4", poster: "/hero/poster-2.jpg", label: "Cities & counties", ms: 4800 },
  { kind: "video", src: "/hero/clip-3.mp4", poster: "/hero/poster-3.jpg", label: "Federal & legal", ms: 4800 },
  { kind: "product", label: "Papyrus workspace", ms: 7000 },
]

const WIPE_MS = 800

// 8x8 Bayer matrix, normalized to 0..1
const BAYER = (() => {
  let m = [[0, 2], [3, 1]]
  while (m.length < 8) {
    const n = m.length
    const next = Array.from({ length: n * 2 }, () => new Array<number>(n * 2).fill(0))
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4
        next[y][x] = v
        next[y][x + n] = v + 2
        next[y + n][x] = v + 3
        next[y + n][x + n] = v + 1
      }
    }
    m = next
  }
  return m.map((row) => row.map((v) => (v + 0.5) / 64))
})()

function useCanvasSize(ref: React.RefObject<HTMLCanvasElement | null>) {
  const [size, setSize] = useState({ cols: 0, rows: 0 })
  useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize({ cols: Math.max(1, Math.ceil(r.width / CELL)), rows: Math.max(1, Math.ceil(r.height / CELL)) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** Animated orange ordered-dither rendering of a still image. */
function DitherImage({ src, animate }: { src: string; animate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { cols, rows } = useCanvasSize(canvasRef)
  const lumRef = useRef<Float32Array | null>(null)

  const draw = useCallback(
    (t: number) => {
      const canvas = canvasRef.current
      const lum = lumRef.current
      if (!canvas || !lum || !cols) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const img = ctx.createImageData(cols, rows)
      const d = img.data
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const wave = animate ? 0.2 * Math.sin(x * 0.07 - t * 1.8) * Math.cos(y * 0.05 + t * 0.7) + 0.06 * Math.sin(t * 1.1) : 0
          const on = lum[i] + wave > BAYER[y & 7][x & 7]
          const c = on ? ORANGE : INK
          const o = i * 4
          d[o] = c[0]
          d[o + 1] = c[1]
          d[o + 2] = c[2]
          d[o + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    [cols, rows, animate],
  )

  // Load the image and sample cover-fit luminance at cell resolution.
  useEffect(() => {
    if (!cols) return
    let cancelled = false
    const image = new Image()
    image.src = src
    image.onload = () => {
      if (cancelled) return
      const off = document.createElement("canvas")
      off.width = cols
      off.height = rows
      const octx = off.getContext("2d", { willReadFrequently: true })
      if (!octx) return
      const scale = Math.max(cols / image.width, rows / image.height)
      const w = image.width * scale
      const h = image.height * scale
      octx.drawImage(image, (cols - w) / 2, (rows - h) / 2, w, h)
      const px = octx.getImageData(0, 0, cols, rows).data
      const out = new Float32Array(cols * rows)
      for (let i = 0; i < out.length; i++) {
        const l = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255
        out[i] = Math.min(1, Math.max(0, (l - 0.5) * 1.5 + 0.5))
      }
      lumRef.current = out
      draw(0)
    }
    return () => {
      cancelled = true
    }
  }, [src, cols, rows, draw])

  useEffect(() => {
    if (!animate) return
    let raf = 0
    let last = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 50) return
      last = now
      draw(now / 1000)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [animate, draw])

  return (
    <canvas
      ref={canvasRef}
      width={cols || 1}
      height={rows || 1}
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  )
}

/** Orange dither dissolve that covers (0 -> 1) then reveals (1 -> 0) whenever `run` changes. */
function DitherWipe({ run }: { run: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { cols, rows } = useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!run || !canvas || !cols) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / WIPE_MS)
      const p = t < 0.5 ? t * 2 : 2 - t * 2
      const img = ctx.createImageData(cols, rows)
      const d = img.data
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // diagonal sweep so the dissolve travels across the frame
          const bias = ((x / cols + y / rows) / 2 - 0.5) * 0.5 * (t < 0.5 ? 1 : -1)
          const on = p * 1.5 - 0.25 - bias > BAYER[y & 7][x & 7]
          if (on) {
            const o = (y * cols + x) * 4
            const dark = BAYER[(y + 3) & 7][(x + 5) & 7] < 0.18
            const c = dark ? INK : ORANGE
            d[o] = c[0]
            d[o + 1] = c[1]
            d[o + 2] = c[2]
            d[o + 3] = 255
          }
        }
      }
      ctx.putImageData(img, 0, 0)
      if (t < 1) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, cols, rows)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [run, cols, rows])

  return (
    <canvas
      ref={canvasRef}
      width={cols || 1}
      height={rows || 1}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  )
}

function ProductStage({ animate }: { animate: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="flex items-center gap-2 border-b-2 border-[#111] bg-[#fafaf9] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full border border-[#111] bg-[#ff5f1f]" />
        <span className="h-2.5 w-2.5 rounded-full border border-[#111] bg-[#fff0a6]" />
        <span className="h-2.5 w-2.5 rounded-full border border-[#111] bg-white" />
        <span className="ml-2 font-mono text-[10px] font-bold uppercase tracking-wide text-[#555]">Papyrus / Canvas</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <motion.img
          src="/hero/papyrus-ui.png"
          alt="Papyrus home screen: What would you like to work on?"
          className="absolute left-0 top-0 h-full w-full origin-center object-cover object-left-top"
          initial={{ scale: 1 }}
          animate={animate ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={animate ? { duration: 7, ease: "easeInOut" } : undefined}
        />
      </div>
    </div>
  )
}

export function HeroShowcase() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [wipe, setWipe] = useState(0)
  const swapTimer = useRef<number | undefined>(undefined)

  const goTo = useCallback(
    (next: number) => {
      if (reduce) {
        setActive(next)
        return
      }
      setWipe((w) => w + 1)
      window.clearTimeout(swapTimer.current)
      swapTimer.current = window.setTimeout(() => setActive(next), WIPE_MS / 2)
    },
    [reduce],
  )

  // Reduced motion: no cycling, show the product UI statically.
  useEffect(() => {
    if (reduce) setActive(stages.length - 1)
  }, [reduce])

  useEffect(() => {
    if (reduce) return
    const timer = window.setTimeout(() => goTo((active + 1) % stages.length), stages[active].ms)
    return () => window.clearTimeout(timer)
  }, [active, reduce, goTo])

  useEffect(() => () => window.clearTimeout(swapTimer.current), [])

  const stage = stages[active]

  return (
    <div>
      <div className="relative aspect-[4/3.4] w-full overflow-hidden border-[3px] border-[#111] bg-[#111] shadow-[8px_8px_0_#111] sm:aspect-[16/12] lg:aspect-[4/3.6]">
        {stage.kind === "dither" && <DitherImage src="/hero/brunel.jpg" animate={!reduce} />}
        {stage.kind === "video" && (
          <>
            <video
              key={stage.src}
              className="absolute inset-0 h-full w-full object-cover"
              src={stage.src}
              poster={stage.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-0 bg-[#ff5f1f] mix-blend-multiply opacity-25" />
          </>
        )}
        {stage.kind === "product" && <ProductStage animate={!reduce} />}
        {!reduce && <DitherWipe run={wipe} />}
        {stage.kind !== "product" && (
          <span className="nb-label absolute bottom-3 left-3 z-10 !bg-white">{stage.label}</span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" role="tablist" aria-label="Hero showcase">
          {stages.map((s, i) => (
            <button
              key={s.label}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.label}
              onClick={() => i !== active && goTo(i)}
              className={`h-2.5 w-8 border-2 border-[#111] transition-colors ${i === active ? "bg-[#ff5f1f]" : "bg-white hover:bg-[#ffdfcf]"}`}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[#555]">
          {stage.kind === "product" ? "Papyrus · Current workspace UI" : stage.label}
        </span>
      </div>
    </div>
  )
}
