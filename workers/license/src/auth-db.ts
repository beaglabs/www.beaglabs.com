import { Kysely } from 'kysely'
import { LibsqlDialect } from 'kysely-libsql'
import { getDb } from './db'
import type { Bindings } from './env'

type Cached = {
  url: string
  token: string
  db: Kysely<Record<string, never>>
}

let cached: Cached | undefined

export function getAuthDb(env: Bindings): Kysely<Record<string, never>> {
  if (cached?.url === env.TURSO_DATABASE_URL && cached.token === env.TURSO_AUTH_TOKEN) return cached.db

  const db = new Kysely<Record<string, never>>({
    dialect: new LibsqlDialect({ client: getDb(env) }),
  })

  cached = { url: env.TURSO_DATABASE_URL, token: env.TURSO_AUTH_TOKEN, db }
  return db
}
