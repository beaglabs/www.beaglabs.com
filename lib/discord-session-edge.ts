// Edge-compatible session encryption/decryption using Web Crypto API
// Used by middleware (Edge Runtime) where Node.js 'crypto' is unavailable

const SESSION_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET || 'fallback-dev-secret-change-me'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    'HMAC',
    false,
    ['sign']
  )
  const hash = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode('discord-session'))
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface SessionData {
  userId: string
  username: string
  globalName: string | null
  avatar: string | null
  iat: number
}

export async function encryptSession(data: SessionData): Promise<string> {
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const json = JSON.stringify(data)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    encoder.encode(json)
  )
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  return `${b64(iv)}:${b64(new Uint8Array(encrypted))}:${expiry}`
}

export async function decryptSession(token: string): Promise<SessionData | null> {
  try {
    const [ivB64, encrypted, expiryStr] = token.split(':')
    if (!ivB64 || !encrypted || !expiryStr) return null

    const expiry = parseInt(expiryStr, 10)
    if (Math.floor(Date.now() / 1000) > expiry) return null

    const key = await deriveKey()
    const iv = ub64(ivB64)
    const data = ub64(encrypted)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      data
    )
    const json = new TextDecoder().decode(decrypted)
    return JSON.parse(json) as SessionData
  } catch {
    return null
  }
}

function b64(buf: Uint8Array): string {
  let binary = ''
  for (const byte of buf) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function ub64(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
