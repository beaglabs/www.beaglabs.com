PRAGMA foreign_keys = ON;

-- Absence of a scope record retains the deployment-bound issuance path.
CREATE TABLE IF NOT EXISTS entitlement_license_scopes (
  entitlement_id TEXT PRIMARY KEY REFERENCES entitlements(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  scope TEXT NOT NULL CHECK (scope = 'organization'),
  allowed_tenant_ids_json TEXT NOT NULL,
  allowed_domains_json TEXT,
  version TEXT NOT NULL,
  approved_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Separate from legacy issuances, whose deployment_id is mandatory.
CREATE TABLE IF NOT EXISTS organization_license_issuances (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL UNIQUE,
  entitlement_id TEXT NOT NULL REFERENCES entitlements(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  scope_version TEXT NOT NULL,
  key_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  signed_document_json TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('issued','superseded','revoked')),
  issued_by_oid TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_issuances_entitlement ON organization_license_issuances(entitlement_id,issued_at);
