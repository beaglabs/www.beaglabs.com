import { libsql } from '@flue/libsql'
import { createClient, type ResultSet, type Client } from '@libsql/client'

let _client: Client | null = null

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.LIBSQL_URL || 'file:./data/flue.db',
    })
  }
  return _client
}

// Lazy client proxy
const client = new Proxy({} as Client, {
  get(_, prop) {
    const c = getClient()
    const val = c[prop as keyof Client]
    if (typeof val === 'function') {
      return val.bind(c)
    }
    return val
  },
})

const toRows = (rs: ResultSet) =>
  rs.rows.map((row) =>
    Object.fromEntries(rs.columns.map((col) => [col, row[col]]))
  )

let tail: Promise<unknown> = Promise.resolve()
const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = tail.then(operation, operation)
  tail = result.then(() => undefined, () => undefined)
  return result
}

// Auth database operations
export async function initAuthDb() {
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
}

export async function getUserByEmail(email: string) {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  })
  return result.rows[0] || null
}

export async function getUserById(id: string) {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  })
  return result.rows[0] || null
}

export async function createUser(id: string, email: string, name: string) {
  await client.execute({
    sql: 'INSERT INTO users (id, email, name) VALUES (?, ?, ?)',
    args: [id, email, name],
  })
}

export async function verifyUser(email: string) {
  await client.execute({
    sql: "UPDATE users SET verified = 1, updated_at = datetime('now') WHERE email = ?",
    args: [email],
  })
}

export async function saveCredential(userId: string, credential: {
  id: string
  name: string
  credentialId: string
  publicKey: string
  counter: number
  deviceType?: string
  aaguid?: string
}) {
  await client.execute({
    sql: `INSERT INTO webauthn_credentials (id, user_id, name, credential_id, public_key, counter, device_type, aaguid)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      credential.id,
      userId,
      credential.name,
      credential.credentialId,
      credential.publicKey,
      credential.counter,
      credential.deviceType || null,
      credential.aaguid || null,
    ],
  })
}

export async function getCredentialsByUserId(userId: string) {
  const result = await client.execute({
    sql: 'SELECT * FROM webauthn_credentials WHERE user_id = ?',
    args: [userId],
  })
  return result.rows
}

export async function getCredentialById(credentialId: string) {
  const result = await client.execute({
    sql: 'SELECT * FROM webauthn_credentials WHERE credential_id = ?',
    args: [credentialId],
  })
  return result.rows[0] || null
}

export async function updateCredentialCounter(credentialId: string, counter: number) {
  await client.execute({
    sql: "UPDATE webauthn_credentials SET counter = ?, last_used_at = datetime('now') WHERE credential_id = ?",
    args: [counter, credentialId],
  })
}

export async function deleteCredential(id: string) {
  await client.execute({
    sql: 'DELETE FROM webauthn_credentials WHERE id = ?',
    args: [id],
  })
}

export async function saveVerificationCode(email: string, code: string, expiresAt: string) {
  const id = crypto.randomUUID()
  await client.execute({
    sql: 'INSERT INTO email_verification_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)',
    args: [id, email, code, expiresAt],
  })
  return id
}

export async function getVerificationCode(email: string, code: string) {
  const result = await client.execute({
    sql: `SELECT * FROM email_verification_codes
          WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
          ORDER BY created_at DESC LIMIT 1`,
    args: [email, code],
  })
  return result.rows[0] || null
}

export async function markVerificationCodeUsed(id: string) {
  await client.execute({
    sql: 'UPDATE email_verification_codes SET used = 1 WHERE id = ?',
    args: [id],
  })
}

export { client }

export default libsql({
  query: (text, params = []) =>
    serialize(async () => toRows(await client.execute({ sql: text, args: params ?? [] }))),
  transaction: (fn) =>
    serialize(async () => {
      const tx = await client.transaction('write')
      try {
        const result = await fn({
          query: async (text, params = []) =>
            toRows(await tx.execute({ sql: text, args: params ?? [] })),
        })
        await tx.commit()
        return result
      } catch (error) {
        await tx.rollback()
        throw error
      } finally {
        tx.close()
      }
    }),
  close: () => client.close(),
})
