import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required')

const client = createClient({ url, authToken })
const info = await client.execute("PRAGMA table_info(marketplace_vm_customers)")
if (!info.rows.length) {
  client.close()
  console.log('Marketplace usage table does not exist yet; base schema will create it')
  process.exit(0)
}

const existing = new Set(info.rows.map((row) => String(row.name)))
const columns = [
  ['trial_end_date', 'TEXT'],
  ['sku_billing_type', 'TEXT'],
  ['customer_currency_cc', 'TEXT'],
  ['price_cc', 'REAL'],
  ['estimated_price_pc', 'REAL'],
]

for (const [name, type] of columns) {
  if (existing.has(name)) continue
  await client.execute(`ALTER TABLE marketplace_vm_customers ADD COLUMN ${name} ${type}`)
  console.log(`Added marketplace_vm_customers.${name}`)
}

client.close()
console.log('Verified Marketplace trial/billing columns')
