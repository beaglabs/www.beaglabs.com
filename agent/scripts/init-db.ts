import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env from agent directory
dotenv.config({ path: resolve(__dirname, '../.env') })

async function main() {
  const client = createClient({
    url: process.env.LIBSQL_URL || 'file:./data/flue.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  })

  console.log('Connecting to:', process.env.LIBSQL_URL)

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      credential_id TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0,
      device_type TEXT,
      aaguid TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);
    CREATE INDEX IF NOT EXISTS idx_verification_email ON email_verification_codes(email);
  `)

  console.log('✓ Database tables created successfully')
  await client.close()
}

main().catch((err) => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})
