/** Time formatting shared by server and client rendering. Before mount everything is UTC so hydration matches. */

export const relative = (iso: string | null | undefined, now: number) => {
  const at = Date.parse(iso ?? '')
  if (!Number.isFinite(at)) return '—'
  const seconds = Math.round((now - at) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "14:05:12" in the viewer's zone once mounted, UTC before. */
export const clock = (iso: string, local: boolean) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return local ? `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` : `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}

/** "Oct 17" (+ year when not this year). */
export const day = (iso: string | null | undefined, local: boolean, now: number) => {
  const date = new Date(iso ?? '')
  if (Number.isNaN(date.getTime())) return '—'
  const sameYear = (local ? date.getFullYear() : date.getUTCFullYear()) === new Date(now).getUTCFullYear()
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), ...(local ? {} : { timeZone: 'UTC' }) })
}

/** "Oct 17, 14:05" for tooltips and details. */
export const stamp = (iso: string | null | undefined, local: boolean) => {
  const date = new Date(iso ?? '')
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...(local ? {} : { timeZone: 'UTC' }) })}, ${clock(iso!, local).slice(0, 5)}${local ? '' : ' UTC'}`
}

/** Event time in the Activity panel: clock today, date + clock otherwise. */
export const eventTime = (iso: string, local: boolean, now: number) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const today = local ? date.toDateString() === new Date(now).toDateString() : iso.slice(0, 10) === new Date(now).toISOString().slice(0, 10)
  return today ? clock(iso, local) : `${day(iso, local, now)} ${clock(iso, local).slice(0, 5)}`
}
