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

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options)
console.log(`Better Auth migrations: ${toBeCreated.length} tables to create, ${toBeAdded.length} fields to add`)
await runMigrations()

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
const missing = requiredTables.filter((table) => !present.has(table))
if (missing.length) {
  throw new Error(`Better Auth migration verification failed; missing tables: ${missing.join(', ')}`)
}

await db.destroy()
client.close()
console.log(`Applied and verified Better Auth schema (${requiredTables.length} tables)`)
