import { createContext } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'
import type { ActivityEvent } from './types'

/**
 * What the components need from the browser, injected so the same components render on the server (first paint) and
 * hydrate in the client bundle. The server runtime does nothing: effects never run during server rendering.
 */

export type LiveState = 'connecting' | 'live' | 'polling' | 'offline'

export interface AnimateOptions {
  duration?: number
  delay?: number
  ease?: [number, number, number, number] | 'linear' | 'easeOut' | 'easeInOut'
}

export interface Runtime {
  reducedMotion: boolean
  /** Motion's animate(); a no-op on the server and when the user prefers reduced motion. */
  animate: (element: unknown, keyframes: Record<string, unknown>, options?: AnimateOptions) => void
  getJson: <T>(url: string) => Promise<T>
  postJson: <T>(url: string, body?: unknown) => Promise<{ status: number; body: T }>
  isHidden: () => boolean
  onVisibility: (listener: () => void) => () => void
  /** Open the live Activity socket; returns a cleanup. */
  live: (handlers: { onEvent: (event: ActivityEvent) => void; onState: (state: LiveState) => void }) => () => void
}

const unavailable = () => Promise.reject(new Error('Not available while rendering on the server'))

export const serverRuntime: Runtime = {
  reducedMotion: false,
  animate: () => {},
  getJson: unavailable,
  postJson: unavailable,
  isHidden: () => false,
  onVisibility: () => () => {},
  live: () => () => {},
}

export const RuntimeContext = createContext<Runtime>(serverRuntime)
export const useRuntime = () => useContext(RuntimeContext)

/** False during server rendering and hydration, true after mount: for anything that depends on the viewer's clock or time zone. */
export const useMounted = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/** A clock that starts at the server's time (so hydration matches) and ticks after mount. */
export const useNow = (serverTime: string, everyMs = 1000) => {
  const [now, setNow] = useState(() => Date.parse(serverTime) || 0)
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(timer)
  }, [everyMs])
  return now
}
