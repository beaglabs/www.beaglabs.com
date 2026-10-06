import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
const confirmed = process.argv.includes('--yes') || process.env.CRM_RESET_CONFIRM === 'RESET_CRM_DATA'

if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required')
if (!confirmed) {
  throw new Error('Refusing to clear CRM data. Re-run with --yes or CRM_RESET_CONFIRM=RESET_CRM_DATA.')
}

const client = createClient({ url, authToken })
const found = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
const existing = new Set(found.rows.map((row) => String(row.name)))

const deletionOrder = [
  'crm_activities',
  'crm_attachments',
  'crm_references',
  'crm_record_people',
  'crm_organization_profiles',
  'crm_people',
  'organization_license_issuances',
  'entitlement_license_scopes',
  'deployment_branding',
  'license_issuances',
  'deployments',
  'entitlement_addons',
  'entitlements',
  'partner_order_submissions',
  'order_items',
  'orders',
  'opportunities',
  'partner_invites',
  'partner_users',
  'partner_applications',
  'organization_vehicles',
  'vehicles',
  'marketplace_leads',
  'marketplace_vm_customers',
  'marketplace_sync_runs',
  'marketplace_report_state',
  'contacts',
  'partners',
  'audit_events',
  'organizations',
]

for (const table of deletionOrder) {
  if (!existing.has(table)) continue
  const before = await client.execute(`SELECT COUNT(*) AS count FROM ${table}`)
  await client.execute(`DELETE FROM ${table}`)
  console.log(`Cleared ${table}: ${Number(before.rows[0]?.count ?? 0)} row(s)`)
}

client.close()
console.log('CRM/business data cleared. Product catalog and Better Auth/session/JWKS tables were preserved.')
console.log('R2 attachment objects are not touched by this SQL-only reset; the admin CRM reset endpoint removes them when the bucket binding is configured.')
