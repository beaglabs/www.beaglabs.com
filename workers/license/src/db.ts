import { createClient, type Client, type ResultSet } from '@libsql/client/web'
import type { Bindings } from './env'

type Cache = { url: string; authToken: string; client: Client }
let cache: Cache | undefined

export function getDb(env: Bindings): Client {
  if (cache?.url === env.TURSO_DATABASE_URL && cache.authToken === env.TURSO_AUTH_TOKEN) {
    return cache.client
  }

  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })

  cache = { url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN, client }
  return client
}

export function rows<T extends Record<string, unknown>>(result: ResultSet): T[] {
  return result.rows.map((row) => ({ ...row }) as T)
}

export function first<T extends Record<string, unknown>>(result: ResultSet): T | null {
  const row = result.rows[0]
  return row ? ({ ...row } as T) : null
}

export function parseJsonArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
