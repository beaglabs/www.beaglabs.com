"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface InteractiveDotsProps {
  colors?: string[]
  spacing?: number
  dotRadius?: number
  repelForce?: number
  repelDistance?: number
  returnSpeed?: number
  className?: string
  style?: React.CSSProperties
}

class Dot {
  x: number
  y: number
  homeX: number
  homeY: number
  color: string
  radius: number

  constructor(x: number, y: number, color: string, radius: number) {
    this.x = x
    this.y = y
    this.homeX = x
    this.homeY = y
    this.color = color
    this.radius = radius
  }

  update(
    width: number,
    height: number,
    mouse: { x: number; y: number; active: boolean },
    repelForce: number,
    repelDistance: number,
    returnSpeed: number,
  ) {
    const disX = this.x - mouse.x
    const disY = this.y - mouse.y
    const ds = disX * disX + disY * disY

    if (mouse.active && ds < repelDistance && ds > 0.01) {
      const angle = Math.atan2(disY, disX)
      const dist = repelDistance / ds
      this.x += Math.cos(angle) * dist * repelForce
      this.y += Math.sin(angle) * dist * repelForce
    } else {
      if (this.x !== this.homeX) this.x += (this.homeX - this.x) * 0.02 * returnSpeed
      if (this.y !== this.homeY) this.y += (this.homeY - this.y) * 0.02 * returnSpeed
    }

    if (this.x < 0 || this.x > width) this.x = this.homeX
    if (this.y < 0 || this.y > height) this.y = this.homeY
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath()
  }
}

/**
 * A canvas field of dots that repel from the pointer and drift home again.
 * Sizes itself to its parent element — place it absolutely inside a
 * `relative` container. The canvas is pointer-events:none, so it never
 * blocks the content above it.
 */
export function InteractiveDots({
  colors = ["#ff5f1f", "#ff8a5c", "#ffb894", "#111111", "#ffc9b0"],
  spacing = 20,
  dotRadius = 9,
  repelForce = 0.6,
  repelDistance = 10000,
  returnSpeed = 1,
  className = "",
  style = {},
}: InteractiveDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const buildDots = () => {
      const dots: Dot[] = []
      for (let x = spacing / 2; x < canvas.clientWidth; x += spacing) {
        for (let y = spacing / 2; y < canvas.clientHeight; y += spacing) {
          dots.push(new Dot(x, y, colors[Math.floor(Math.random() * colors.length)], dotRadius))
        }
      }
      dotsRef.current = dots
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildDots()
    }

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      for (const dot of dotsRef.current) dot.draw(ctx)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      const mouse = mouseRef.current
      for (const dot of dotsRef.current) {
        dot.update(canvas.clientWidth, canvas.clientHeight, mouse, repelForce, repelDistance, returnSpeed)
        dot.draw(ctx)
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const point = event instanceof MouseEvent ? event : event.touches[0]
      if (!point) return
      mouseRef.current.x = point.clientX - rect.left
      mouseRef.current.y = point.clientY - rect.top
      mouseRef.current.active = true
    }

    const handlePointerLeave = () => {
      mouseRef.current.active = false
    }

    resize()

    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)

    if (reducedMotion) {
      // Static field: no loop, no pointer tracking.
      drawFrame()
    } else {
      animate()
      window.addEventListener("mousemove", handlePointerMove, { passive: true })
      window.addEventListener("touchmove", handlePointerMove, { passive: true })
      document.documentElement.addEventListener("mouseleave", handlePointerLeave)
    }

    return () => {
      cancelAnimationFrame(animationRef.current)
      observer.disconnect()
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("touchmove", handlePointerMove)
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave)
    }
  }, [colors, spacing, dotRadius, repelForce, repelDistance, returnSpeed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}
    />
  )
}
