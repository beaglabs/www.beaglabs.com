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

const marketplaceMigration = spawnSync(process.execPath, [new URL('./migrate-marketplace-usage.mjs', import.meta.url).pathname], { stdio: 'inherit', env: process.env })
if (marketplaceMigration.status !== 0) process.exit(marketplaceMigration.status ?? 1)

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
const provisioningSchema = await readFile(new URL('../provisioning-schema.sql', import.meta.url), 'utf8')
await client.executeMultiple(provisioningSchema)
console.log('Applied workers/license/provisioning-schema.sql')
const directSchema = await readFile(new URL('../direct-distro-schema.sql', import.meta.url), 'utf8')
await client.executeMultiple(directSchema)
console.log('Applied workers/license/direct-distro-schema.sql')
client.close()
