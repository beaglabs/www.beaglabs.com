import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required')

const client = createClient({ url, authToken })
const LEGACY_GOVERNMENT = new Set(['government-il4', 'government-il6', 'gcc', 'gcch', 'dod', 'restricted'])
const normalizeProfile = (value) => value === 'commercial' || value === 'disconnected' ? value : LEGACY_GOVERNMENT.has(value) ? 'government' : value
const normalizeProfiles = (raw) => {
  try {
    const values = JSON.parse(String(raw ?? '[]'))
    return JSON.stringify([...new Set((Array.isArray(values) ? values : []).map(normalizeProfile).filter((value) => ['commercial', 'government', 'disconnected'].includes(value)))])
  } catch { return '[]' }
}

const deploymentSchema = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='deployments'")
const deploymentSql = String(deploymentSchema.rows[0]?.sql ?? '')
if (deploymentSql && !deploymentSql.includes("'government'")) {
  await client.execute('PRAGMA foreign_keys=OFF')
  await client.executeMultiple(`
    BEGIN IMMEDIATE;
    CREATE TABLE deployments_v2 (
      id TEXT PRIMARY KEY,
      entitlement_id TEXT NOT NULL REFERENCES entitlements(id),
      customer_organization_id TEXT NOT NULL REFERENCES organizations(id),
      deployment_name TEXT NOT NULL,
      papyrus_deployment_id TEXT NOT NULL UNIQUE,
      deployment_profile TEXT NOT NULL CHECK (deployment_profile IN ('commercial','government','disconnected')),
      activation_public_key_pem TEXT,
      status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','licensed','suspended','retired')),
      registered_by_oid TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO deployments_v2 (
      id,entitlement_id,customer_organization_id,deployment_name,papyrus_deployment_id,deployment_profile,
      activation_public_key_pem,status,registered_by_oid,created_at,updated_at
    ) SELECT
      id,entitlement_id,customer_organization_id,deployment_name,papyrus_deployment_id,
      CASE
        WHEN deployment_profile='commercial' THEN 'commercial'
        WHEN deployment_profile='disconnected' THEN 'disconnected'
        ELSE 'government'
      END,
      activation_public_key_pem,status,registered_by_oid,created_at,updated_at
    FROM deployments;
    DROP TABLE deployments;
    ALTER TABLE deployments_v2 RENAME TO deployments;
    CREATE INDEX IF NOT EXISTS idx_deployments_entitlement ON deployments(entitlement_id);
    CREATE INDEX IF NOT EXISTS idx_deployments_customer ON deployments(customer_organization_id);
    COMMIT;
  `)
  await client.execute('PRAGMA foreign_keys=ON')
  console.log('Migrated deployments to commercial/government/disconnected profiles')
}

for (const table of ['products', 'entitlements']) {
  const result = await client.execute(`SELECT id,allowed_profiles_json FROM ${table}`)
  for (const row of result.rows) {
    const normalized = normalizeProfiles(row.allowed_profiles_json)
    if (normalized !== String(row.allowed_profiles_json ?? '[]')) {
      await client.execute({ sql: `UPDATE ${table} SET allowed_profiles_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`, args: [normalized, row.id] })
    }
  }
}

client.close()
console.log('Normalized legacy profile aliases')
