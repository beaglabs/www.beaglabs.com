import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required')

const client = createClient({ url, authToken })
await client.executeMultiple(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'))
console.log('Applied workers/connect/schema.sql')
client.close()
