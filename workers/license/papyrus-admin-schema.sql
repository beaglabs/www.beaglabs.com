PRAGMA foreign_keys = ON;

-- Papyrus deployment registration, tenant event pipe and error intake.
-- Additive only: never alters or drops existing tables.
--
-- 2026-10-17: the admin app and customer chat were removed in favour of email
-- support. Their tables (staff_roles, staff_devices, tenant_users, lead_pipeline,
-- conversations, messages, conversation_reads, chat_attachments, huddles,
-- huddle_participants, inbox_items, inbox_item_done) are no longer created or
-- used. Existing databases keep them with their data; they are not dropped.

-- Registered Papyrus VMs (verified with IMDS attested data). Distinct from the
-- legacy `deployments` table, which belongs to the retired licensing flow.
CREATE TABLE IF NOT EXISTS papyrus_deployments (
  id TEXT PRIMARY KEY,
  vm_id TEXT NOT NULL UNIQUE,
  papyrus_deployment_id TEXT NOT NULL,
  subscription_id TEXT,
  plan_publisher TEXT,
  plan_product TEXT,
  plan_name TEXT,
  sku TEXT,
  region TEXT,
  vm_size TEXT,
  public_origin TEXT,
  version TEXT,
  entra_client_id TEXT,
  tenant_id TEXT,
  key_sha256 TEXT NOT NULL UNIQUE,
  key_issued_at TEXT NOT NULL,
  registered_at TEXT NOT NULL,
  last_seen_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_papyrus_deployments_tenant ON papyrus_deployments(tenant_id);

-- Replay guard for attested documents (each signed nonce is accepted once per VM).
CREATE TABLE IF NOT EXISTS attested_nonces (
  vm_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  used_at TEXT NOT NULL,
  PRIMARY KEY (vm_id, nonce)
);

CREATE TABLE IF NOT EXISTS tenants (
  tenant_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  linked_at TEXT,
  linked_by_oid TEXT
);
CREATE INDEX IF NOT EXISTS idx_tenants_org ON tenants(organization_id);

CREATE TABLE IF NOT EXISTS tenant_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('papyrus','admin','web','system')),
  deployment_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('track','identify','page')),
  event TEXT,
  user_id TEXT,
  anonymous_id TEXT,
  properties_json TEXT NOT NULL DEFAULT '{}',
  traits_json TEXT NOT NULL DEFAULT '{}',
  context_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tenant_events_tenant ON tenant_events(tenant_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS tenant_errors (
  id TEXT PRIMARY KEY,
  sentry_issue_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT,
  deployment_id TEXT,
  source TEXT,
  title TEXT NOT NULL,
  culprit TEXT,
  level TEXT,
  sentry_url TEXT,
  alert_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  last_alerted_at TEXT,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tenant_errors_tenant ON tenant_errors(tenant_id, last_seen_at DESC);

-- Deployments created by the Papyrus control plane (papyrus.beaglabs.com) through
-- the LicenseRpc service binding. Each has a papyrus_deployments row (vm_id
-- 'control-plane:<id>', unusable placeholder key) until Papyrus exchanges its
-- one-time bootstrap token for a real deployment key.
CREATE TABLE IF NOT EXISTS control_plane_deployments (
  deployment_id TEXT PRIMARY KEY REFERENCES papyrus_deployments(id),
  account_id TEXT NOT NULL,
  hostname TEXT NOT NULL,
  provider TEXT NOT NULL,
  organization TEXT NOT NULL,
  bootstrap_sha256 TEXT NOT NULL UNIQUE,
  bootstrap_expires_at TEXT NOT NULL,
  exchanged_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_control_plane_deployments_account ON control_plane_deployments(account_id);
-- Control-plane deployments the customer deleted (LicenseRpc.revokeDeployment). A revoked deployment's status is always
-- suspended and its deployment key never verifies again. A side table so this file stays idempotent (no ALTER).
CREATE TABLE IF NOT EXISTS control_plane_revocations (
  deployment_id TEXT PRIMARY KEY REFERENCES control_plane_deployments(deployment_id),
  revoked_at TEXT NOT NULL
);
