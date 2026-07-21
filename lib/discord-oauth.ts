import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const DISCORD_API = 'https://discord.com/api/v10'
const ALLOWED_USER_ID = process.env.DISCORD_PORTAL_USER_ID || '1387255717794152519'
const SESSION_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET || 'fallback-dev-secret-change-me'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// ─── Token exchange ────────────────────────────────────────────────────────

export async function exchangeCode(code: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}> {
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_OAUTH_CLIENT_ID!,
      client_secret: process.env.DISCORD_OAUTH_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_OAUTH_REDIRECT_URI!,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord token exchange failed (${res.status}): ${text}`)
  }
  return res.json()
}

// ─── User profile ──────────────────────────────────────────────────────────

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  global_name: string | null
  avatar: string | null
  email?: string
}

export async function fetchUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch Discord user (${res.status})`)
  return res.json()
}

// ─── Authorization ─────────────────────────────────────────────────────────

export function isAuthorized(userId: string): boolean {
  return userId === ALLOWED_USER_ID
}

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_OAUTH_REDIRECT_URI!,
    response_type: 'code',
    scope: 'identify',
    prompt: 'consent',
  })
  return `https://discord.com/oauth2/authorize?${params}`
}

// ─── Session encryption ────────────────────────────────────────────────────

// Derive a 32-byte key from the secret
function deriveKey(): Buffer {
  return createHmac('sha256', 'discord-session').update(SESSION_SECRET).digest()
}

export interface SessionData {
  userId: string
  username: string
  globalName: string | null
  avatar: string | null
  iat: number
}

export function encryptSession(data: SessionData): string {
  const key = deriveKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const json = JSON.stringify(data)
  let encrypted = cipher.update(json, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  // iv:encrypted:expiry
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  return `${iv.toString('base64')}:${encrypted}:${expiry}`
}

export function decryptSession(token: string): SessionData | null {
  try {
    const [ivB64, encrypted, expiryStr] = token.split(':')
    if (!ivB64 || !encrypted || !expiryStr) return null

    const expiry = parseInt(expiryStr, 10)
    if (Math.floor(Date.now() / 1000) > expiry) return null

    const key = deriveKey()
    const iv = Buffer.from(ivB64, 'base64')
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return JSON.parse(decrypted) as SessionData
  } catch {
    return null
  }
}
