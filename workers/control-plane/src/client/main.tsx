import { animate } from 'motion/mini'
import { hydrate } from 'preact'
import { DeploymentApp } from '../ui/DeploymentApp'
import { ListApp } from '../ui/ListApp'
import { RuntimeContext, type LiveState, type Runtime } from '../ui/runtime'
import type { DetailIsland, ListIsland } from '../ui/ssr'
import type { ActivityEvent } from '../ui/types'

/** Browser entry for /deploy and /deploy/{id}: hydrate the server-rendered page with a real runtime. */

const root = document.getElementById('dp-root')
const data = document.getElementById('dp-data')

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const getJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: 'same-origin', headers: { accept: 'application/json' } })
  if (response.status === 401) throw new Error('Signed out. Reload to sign in again.')
  if (!response.ok) throw new Error(`The control plane answered ${response.status}`)
  return (await response.json()) as T
}

const postJson = async <T,>(url: string, body: unknown = {}): Promise<{ status: number; body: T }> => {
  const response = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const parsed = (await response.json().catch(() => ({ ok: false, message: `The control plane answered ${response.status}` }))) as T
  return { status: response.status, body: parsed }
}

/** The account's ActivityHub socket, reconnecting with jittered backoff; closed while the tab is hidden. */
const live =
  (path: string): Runtime['live'] =>
  ({ onEvent, onState }) => {
    let socket: WebSocket | null = null
    let attempts = 0
    let retry: ReturnType<typeof setTimeout> | undefined
    let ping: ReturnType<typeof setInterval> | undefined
    let closed = false
    const set = (state: LiveState) => onState(state)
    const schedule = () => {
      clearTimeout(retry)
      if (closed || document.visibilityState === 'hidden') return
      const delay = Math.min(30_000, 1000 * 2 ** attempts++) * (0.5 + Math.random() / 2)
      retry = setTimeout(connect, delay)
    }
    const connect = () => {
      if (closed || socket || !('WebSocket' in window)) return
      if (document.visibilityState === 'hidden') return set('polling')
      set('connecting')
      let ws: WebSocket
      try {
        ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${path}`)
      } catch {
        set('polling')
        return schedule()
      }
      socket = ws
      ws.onopen = () => {
        attempts = 0
        set('live')
        clearInterval(ping)
        ping = setInterval(() => ws.readyState === 1 && ws.send('ping'), 30_000)
      }
      ws.onmessage = (message) => {
        if (message.data === 'pong') return
        try {
          const parsed = JSON.parse(String(message.data)) as { type?: string; event?: ActivityEvent }
          if (parsed.type === 'event' && parsed.event) onEvent(parsed.event)
        } catch {
          // not ours
        }
      }
      ws.onclose = () => {
        if (socket === ws) socket = null
        clearInterval(ping)
        if (closed) return
        set(navigator.onLine === false ? 'offline' : 'polling')
        schedule()
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') socket?.close()
      else if (!socket) {
        attempts = 0
        connect()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    connect()
    return () => {
      closed = true
      clearTimeout(retry)
      clearInterval(ping)
      socket?.close()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }

if (root && data?.textContent) {
  const island = JSON.parse(data.textContent) as DetailIsland | ListIsland
  const runtime: Runtime = {
    reducedMotion,
    animate: (element, keyframes, options) => {
      if (reducedMotion || !element) return
      animate(element as Element, keyframes as never, options as never)
    },
    getJson,
    postJson,
    isHidden: () => document.visibilityState === 'hidden',
    onVisibility: (listener) => {
      document.addEventListener('visibilitychange', listener)
      return () => document.removeEventListener('visibilitychange', listener)
    },
    live: live(root.dataset.liveUrl ?? '/api/events/live'),
  }
  hydrate(
    <RuntimeContext.Provider value={runtime}>
      {island.page === 'detail' ? <DeploymentApp payload={island.payload} events={island.events} /> : <ListApp payload={island.payload} />}
    </RuntimeContext.Provider>,
    root,
  )
}
