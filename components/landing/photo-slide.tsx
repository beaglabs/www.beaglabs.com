"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"

import { DitherWipe, WIPE_MS } from "@/components/hero-showcase"

export type PhotoSlideItem = {
  src: string
  alt: string
  label: string
  /** Photographer / agency line shown in the citation. */
  credit: string
  /** Publication the image was taken from. */
  sourceName: string
  sourceUrl: string
}

const SLIDE_MS = 5200

export function PhotoSlide({ slides }: { slides: PhotoSlideItem[] }) {
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

  useEffect(() => {
    if (reduce) return
    const timer = window.setTimeout(() => goTo((active + 1) % slides.length), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [active, reduce, goTo, slides.length])

  useEffect(() => () => window.clearTimeout(swapTimer.current), [])

  const slide = slides[active]

  return (
    <div>
      <div className="relative aspect-[4/3.4] w-full overflow-hidden border-[3px] border-[#111] bg-[#111] shadow-[8px_8px_0_#111] sm:aspect-[16/12] lg:aspect-[4/3.6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.05]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#ff5f1f] mix-blend-multiply opacity-75" />
        {!reduce && <DitherWipe run={wipe} />}
        <span className="nb-label absolute bottom-3 left-3 z-10 !bg-white">{slide.label}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" role="tablist" aria-label="Photo slide">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.label}
              onClick={() => i !== active && goTo(i)}
              className={`h-2.5 w-8 border-2 border-[#111] transition-colors ${i === active ? "bg-[#ff5f1f]" : "bg-white hover:bg-[#ffdfcf]"}`}
            />
          ))}
        </div>
        <p className="text-right font-mono text-[10px] font-semibold uppercase leading-4 tracking-wide text-[#555]">
          Photo: {slide.credit} ·{" "}
          <a
            href={slide.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#b63700]"
          >
            {slide.sourceName}
          </a>
        </p>
      </div>
    </div>
  )
}
