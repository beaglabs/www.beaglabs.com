/** Small shared helpers for the admin/chat/registration API. */

export type ErrorStatus = 400 | 401 | 403 | 404 | 405 | 409 | 410 | 411 | 413 | 415 | 416 | 422 | 429 | 500 | 502 | 503

/** JSON API error rendered as `{ error, message }` (same shape as the retired PortalError). */
export class ApiError extends Error {
  constructor(
    readonly status: ErrorStatus,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.code, message: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } })
  }
  console.error('api unhandled error', error)
  return Response.json({ error: 'internal_error', message: 'Internal server error.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
}

export function now(): string {
  return new Date().toISOString()
}

export function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export function str(value: unknown, max = 512): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed && trimmed.length <= max ? trimmed : null
}

export function requireStr(value: unknown, name: string, max = 512): string {
  const result = str(value, max)
  if (!result) throw new ApiError(422, 'validation_error', `${name} is required.`)
  return result
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function readJsonObject(request: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const raw = await readText(request, maxBytes)
  try {
    const value = JSON.parse(raw) as unknown
    if (!isObject(value)) throw new Error('object required')
    return value
  } catch {
    throw new ApiError(400, 'invalid_json', 'Request body must be a JSON object.')
  }
}

export async function readText(request: Request, maxBytes: number): Promise<string> {
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > maxBytes) throw new ApiError(413, 'payload_too_large', `Request body must be at most ${maxBytes} bytes.`)
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new ApiError(413, 'payload_too_large', `Request body must be at most ${maxBytes} bytes.`)
  return raw
}

const encoder = new TextEncoder()

/** Narrows a byte view to the ArrayBuffer-backed form WebCrypto's typings require. */
export function bs(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return bytes as Uint8Array<ArrayBuffer>
}

export function utf8(value: string): Uint8Array<ArrayBuffer> {
  return bs(encoder.encode(value))
}

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(value: string | Uint8Array): Promise<string> {
  const data = typeof value === 'string' ? utf8(value) : bs(value)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

export async function hmacSha256(secret: string, message: string | Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, typeof message === 'string' ? utf8(message) : bs(message)))
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return diff === 0
}

export function base64UrlEncode(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of view) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function base64UrlDecode(value: string): Uint8Array {
  return base64Decode(value.replace(/-/g, '+').replace(/_/g, '/'))
}

export function base64Decode(value: string): Uint8Array {
  const clean = value.replace(/\s+/g, '')
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function randomToken(bytes = 32): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)))
}

/** Decodes a PEM block (any label) to DER bytes. */
export function pemToDer(pem: string): Uint8Array {
  return base64Decode(pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, ''))
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value) as unknown
    return isObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'yahoo.com', 'aol.com', 'proton.me', 'protonmail.com', 'msn.com', 'me.com',
])

export function emailDomain(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const domain = email.split('@')[1]?.trim().toLowerCase() ?? ''
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) return null
  return domain.replace(/^www\./, '')
}

/** Minimal slice of ExecutionContext so modules and tests do not need Workers runtime types. */
export interface WaitUntil { waitUntil(promise: Promise<unknown>): void }

/** Runs a background task without failing the request; logs failures. */
export function background(ctx: WaitUntil | undefined, label: string, task: Promise<unknown>): void {
  const guarded = task.catch((error) => console.error(`${label} failed`, error instanceof Error ? error.message : error))
  if (ctx) ctx.waitUntil(guarded)
}

export const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
