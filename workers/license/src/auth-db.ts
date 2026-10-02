import { createClient } from '@libsql/client/web'
import { Kysely } from 'kysely'
import { LibsqlDialect } from 'kysely-libsql'
import type { Bindings } from './env'

type Cached = {
  url: string
  token: string
  db: Kysely<Record<string, never>>
}

let cached: Cached | undefined

function databaseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: cause instanceof Error
        ? { name: cause.name, message: cause.message, stack: cause.stack }
        : cause,
    }
  }
  return { value: String(error) }
}

export function getAuthDb(env: Bindings): Kysely<Record<string, never>> {
  if (cached?.url === env.TURSO_DATABASE_URL && cached.token === env.TURSO_AUTH_TOKEN) return cached.db

  // The license Worker runs on Cloudflare, so construct the same web-safe libSQL
  // client used by the rest of the service and hand it to the Kysely dialect.
  // This avoids letting kysely-libsql select a generic runtime transport itself.
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })

  const db = new Kysely<Record<string, never>>({
    dialect: new LibsqlDialect({ client }),
    log(event) {
      if (event.level !== 'error') return
      // Do not log query parameters: OAuth/session writes can contain tokens.
      console.error('Better Auth database query failed', {
        sql: event.query.sql,
        error: databaseError(event.error),
      })
    },
  })

  cached = { url: env.TURSO_DATABASE_URL, token: env.TURSO_AUTH_TOKEN, db }
  return db
}
