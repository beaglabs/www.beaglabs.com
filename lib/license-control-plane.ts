export const LICENSE_CONTROL_PLANE_ORIGIN =
  process.env.NEXT_PUBLIC_LICENSE_API_URL?.replace(/\/$/, '') || 'https://license.beaglabs.com'

export class LicenseControlPlaneError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload: unknown) {
    super(message)
    this.name = 'LicenseControlPlaneError'
    this.status = status
    this.payload = payload
  }
}

export async function licenseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const response = await fetch(`${LICENSE_CONTROL_PLANE_ORIGIN}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') || ''
  const payload: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null
    const message = String(body?.message ?? body?.error ?? `Request failed with HTTP ${response.status}`)
    throw new LicenseControlPlaneError(response.status, message, payload)
  }

  return payload as T
}

export function licensingCallbackUrl(path = '/licensing'): string {
  if (typeof window === 'undefined') return `https://www.beaglabs.com${path}`
  return `${window.location.origin}${path}`
}
