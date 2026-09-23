import { createClient, type Client, type ResultSet } from '@libsql/client/web'
import type { Bindings } from './env'

type SqlArg = string | number | bigint | null | ArrayBuffer
export type LooseStatement = string | { sql: string; args?: readonly unknown[] }

export interface Database {
  execute(statement: LooseStatement): Promise<ResultSet>
  batch(statements: readonly LooseStatement[], mode?: 'write'): Promise<ResultSet[]>
}

type Cache = { url: string; authToken: string; database: Database }
let cache: Cache | undefined

function sqlArgs(values: readonly unknown[] = []): SqlArg[] {
  return values.map((value) => {
    if (value === undefined || value === null) return null
    if (typeof value === 'boolean') return value ? 1 : 0
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint' || value instanceof ArrayBuffer) return value
    throw new TypeError(`Unsupported libSQL argument type: ${typeof value}`)
  })
}

function normalize(statement: LooseStatement) {
  if (typeof statement === 'string') return statement
  return { sql: statement.sql, args: sqlArgs(statement.args) }
}

function wrapClient(client: Client): Database {
  return {
    execute(statement) {
      return client.execute(normalize(statement))
    },
    batch(statements, mode = 'write') {
      return client.batch(statements.map(normalize), mode)
    },
  }
}

export function getDb(env: Bindings): Database {
  if (cache?.url === env.TURSO_DATABASE_URL && cache.authToken === env.TURSO_AUTH_TOKEN) {
    return cache.database
  }

  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })
  const database = wrapClient(client)
  cache = { url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN, database }
  return database
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
