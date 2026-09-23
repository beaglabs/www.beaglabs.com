import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required')
}

const client = createClient({ url, authToken })
for (const file of ['../schema.sql', '../partner-schema.sql']) {
  const schema = await readFile(new URL(file, import.meta.url), 'utf8')
  await client.executeMultiple(schema)
  console.log(`Applied workers/license/${file.split('/').at(-1)}`)
}
client.close()
