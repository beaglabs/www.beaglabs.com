import { createClient, type Client, type ResultSet } from '@libsql/client/web'
import type { Bindings } from './env'

type Cache = { url: string; authToken: string; client: Client }
let cache: Cache | undefined

export type SqlArg = string | number | bigint | boolean | null | ArrayBuffer | Uint8Array | Date

export function sqlArgs(values: readonly unknown[]): SqlArg[] {
  return values.map((value) => {
    if (value === undefined) return null
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean' ||
      value instanceof ArrayBuffer ||
      value instanceof Uint8Array ||
      value instanceof Date
    ) {
      return value
    }
    throw new TypeError(`Unsupported libSQL argument type: ${typeof value}`)
  })
}

export function statement(sql: string, values: readonly unknown[] = []) {
  return { sql, args: sqlArgs(values) }
}

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
  return result.rows.map((row) => ({ ...row }) as unknown as T)
}

export function first<T extends Record<string, unknown>>(result: ResultSet): T | null {
  const row = result.rows[0]
  return row ? ({ ...row } as unknown as T) : null
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
