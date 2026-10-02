import { createClient } from '@libsql/client'
import { betterAuth } from 'better-auth'
import { getMigrations } from 'better-auth/db/migration'
import { jwt, magicLink } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { Kysely } from 'kysely'
import { LibsqlDialect } from 'kysely-libsql'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
const secret = process.env.BETTER_AUTH_SECRET

if (!url || !authToken || !secret) {
  throw new Error('TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, and BETTER_AUTH_SECRET are required')
}

const client = createClient({ url, authToken })
const db = new Kysely({ dialect: new LibsqlDialect({ client }) })

const auth = betterAuth({
  database: {
    db,
    type: 'sqlite',
    // Keep migrations aligned with the Cloudflare runtime. Remote Turso/libSQL
    // should not depend on an interactive transaction for auth operations.
    transaction: false,
  },
  secret,
  baseURL: process.env.BASE_URL || 'https://license.beaglabs.com',
  advanced: {
    database: {
      validateSchema: false,
    },
  },
  user: {
    additionalFields: {
      entraOid: { type: 'string', required: false, input: false, returned: true },
      entraTenantId: { type: 'string', required: false, input: false, returned: true },
    },
  },
  plugins: [
    jwt(),
    magicLink({ sendMagicLink: async () => {}, storeToken: 'hashed' }),
    oauthProvider({
      loginPage: '/partner/login',
      consentPage: '/oauth/consent',
      allowDynamicClientRegistration: false,
      scopes: ['openid', 'profile', 'email', 'offline_access', 'partner:catalog', 'partner:orders'],
    }),
  ],
})

const before = await getMigrations(auth.options)
console.log(`Better Auth migrations: ${before.toBeCreated.length} tables to create, ${before.toBeAdded.length} fields to add`)
await before.runMigrations()

const requiredTables = [
  'user',
  'session',
  'account',
  'verification',
  'jwks',
  'oauthClient',
  'oauthResource',
  'oauthClientResource',
  'oauthRefreshToken',
  'oauthAccessToken',
  'oauthConsent',
  'oauthClientAssertion',
]

const schema = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
const present = new Set(schema.rows.map((row) => String(row.name)))
const missingTables = requiredTables.filter((table) => !present.has(table))
if (missingTables.length) {
  throw new Error(`Better Auth migration verification failed; missing tables: ${missingTables.join(', ')}`)
}

// Print only schema metadata, never row values. This is deliberately useful when
// diagnosing a production callback failure: Better Auth 1.7's OAuth path joins
// account -> user before creating a session, so a single stale/missing column can
// make the callback fail even though an unauthenticated /api/v1/me read succeeds.
for (const table of ['user', 'account', 'session', 'verification']) {
  const info = await client.execute(`PRAGMA table_info("${table}")`)
  const columns = info.rows.map((row) => String(row.name)).filter(Boolean)
  console.log(`${table} columns (${columns.length}): ${columns.join(', ')}`)
}

// Table existence is not enough. Re-run Better Auth's migration planner against
// the live database and fail unless every configured field is now present.
const after = await getMigrations(auth.options)
if (after.toBeCreated.length || after.toBeAdded.length) {
  const pendingTables = after.toBeCreated.map((migration) => migration.table)
  const pendingFields = after.toBeAdded.map((migration) => `${migration.table}.${migration.field}`)
  throw new Error(
    `Better Auth migration incomplete after run; pending tables: ${pendingTables.join(', ') || 'none'}; pending fields: ${pendingFields.join(', ') || 'none'}`,
  )
}

await db.destroy()
client.close()
console.log(`Applied and verified complete Better Auth schema (${requiredTables.length} tables, 0 pending fields)`)
