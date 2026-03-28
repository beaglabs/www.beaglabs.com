"use client"

import { useEffect, useState, useCallback } from "react"

interface TextScrambleProps {
  text: string
  className?: string
  scrambleOnHover?: boolean
  autoStart?: boolean
  duration?: number
}

const chars = "!<>-_\\/[]{}—=+*^?#________"

export function TextScramble({
  text,
  className = "",
  scrambleOnHover = true,
  autoStart = true,
  duration = 1500,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(autoStart ? "" : text)
  const [isScrambling, setIsScrambling] = useState(autoStart)

  const scramble = useCallback(() => {
    setIsScrambling(true)
    let iteration = 0
    const totalIterations = text.length * 3

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " "
            if (index < iteration / 3) {
              return text[index]
            }
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join("")
      )

      iteration += 1

      if (iteration >= totalIterations) {
        clearInterval(interval)
        setDisplayText(text)
        setIsScrambling(false)
      }
    }, duration / totalIterations)

    return () => clearInterval(interval)
  }, [text, duration])

  useEffect(() => {
    if (autoStart) {
      const timeout = setTimeout(scramble, 200)
      return () => clearTimeout(timeout)
    }
  }, [autoStart, scramble])

  const handleMouseEnter = () => {
    if (scrambleOnHover && !isScrambling) {
      scramble()
    }
  }

  return (
    <span
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </span>
  )
}
