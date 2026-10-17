/**
 * Test replacement for src/db: a real SQLite (libSQL) in-memory database loaded
 * with the Worker's actual schema files, so visibility rules run as real SQL.
 */
import { readFileSync } from 'node:fs'
import { createClient, type Client, type ResultSet } from '@libsql/client'

type Statement = string | { sql: string; args?: readonly unknown[] }

let client: Client | null = null

function args(values: readonly unknown[] = []) {
  return values.map((value) => (value === undefined ? null : typeof value === 'boolean' ? (value ? 1 : 0) : value)) as never
}

function normalize(statement: Statement) {
  return typeof statement === 'string' ? statement : { sql: statement.sql, args: args(statement.args) }
}

const SCHEMA_FILES = ['schema.sql', 'marketplace-schema.sql', 'provisioning-schema.sql', 'papyrus-admin-schema.sql']

export async function resetDb(): Promise<Client> {
  client?.close()
  client = createClient({ url: ':memory:' })
  for (const file of SCHEMA_FILES) {
    await client.executeMultiple(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'))
  }
  return client
}

export function rawDb(): Client {
  if (!client) throw new Error('call resetDb() first')
  return client
}

export function getDb() {
  const db = rawDb()
  return {
    execute: (statement: Statement) => db.execute(normalize(statement)),
    batch: (statements: readonly Statement[]) => db.batch(statements.map(normalize), 'write'),
  }
}

export function rows<T>(result: ResultSet): T[] {
  return result.rows.map((row) => ({ ...row }) as unknown as T)
}

export function first<T>(result: ResultSet): T | null {
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
