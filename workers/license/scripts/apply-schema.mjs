import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'
import { spawnSync } from 'node:child_process'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required')
}

let client = createClient({ url, authToken })
for (const file of ['../schema.sql', '../partner-schema.sql', '../marketplace-schema.sql']) {
  const schema = await readFile(new URL(file, import.meta.url), 'utf8')
  await client.executeMultiple(schema)
  console.log(`Applied workers/license/${file.split('/').at(-1)}`)
}
client.close()

// Normalize/rebuild legacy deployment rows before creating tables that reference
// deployments, so old databases cannot leave a foreign key targeting the v2
// migration's temporary table.
const migration = spawnSync(process.execPath, [new URL('./migrate-profile-v2.mjs', import.meta.url).pathname], { stdio: 'inherit', env: process.env })
if (migration.status !== 0) process.exit(migration.status ?? 1)

client = createClient({ url, authToken })
const brandingSchema = await readFile(new URL('../branding-schema.sql', import.meta.url), 'utf8')
await client.executeMultiple(brandingSchema)
console.log('Applied workers/license/branding-schema.sql')
const organizationSchema = await readFile(new URL('../organization-license-schema.sql', import.meta.url), 'utf8')
await client.executeMultiple(organizationSchema)
console.log('Applied workers/license/organization-license-schema.sql')
const crmSchema = await readFile(new URL('../crm-schema.sql', import.meta.url), 'utf8')
await client.executeMultiple(crmSchema)
console.log('Applied workers/license/crm-schema.sql')
const captureSchema = await readFile(new URL('../capture-schema.sql', import.meta.url), 'utf8')
await client.executeMultiple(captureSchema)
console.log('Applied workers/license/capture-schema.sql')
client.close()
