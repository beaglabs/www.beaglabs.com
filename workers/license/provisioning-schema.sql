PRAGMA foreign_keys = ON;

-- Customer-facing provisioning/control-plane state. This deliberately lives
-- beside licensing data without reintroducing a general-purpose CRM.

CREATE TABLE IF NOT EXISTS account_managers (
  id TEXT PRIMARY KEY,
  entra_oid TEXT NOT NULL UNIQUE,
  entra_tenant_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  avatar_url TEXT,
  booking_url TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_account_managers_active ON account_managers(active,display_name);

CREATE TABLE IF NOT EXISTS organization_account_managers (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  account_manager_id TEXT NOT NULL REFERENCES account_managers(id),
  role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','technical','executive')),
  assigned_by_oid TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  PRIMARY KEY (organization_id, role)
);
CREATE INDEX IF NOT EXISTS idx_org_account_managers_manager ON organization_account_managers(account_manager_id);

CREATE TABLE IF NOT EXISTS organization_tenants (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  tenant_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('commercial','government')),
  verified_at TEXT NOT NULL,
  verified_by_oid TEXT NOT NULL,
  PRIMARY KEY (tenant_id, environment)
);
CREATE INDEX IF NOT EXISTS idx_org_tenants_org ON organization_tenants(organization_id);

CREATE TABLE IF NOT EXISTS provision_oauth_states (
  state_hash TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('commercial','government')),
  return_to TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provision_portal_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  oid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('commercial','government')),
  organization_id TEXT REFERENCES organizations(id),
  arm_token_ciphertext TEXT,
  arm_expires_at TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_provision_sessions_tenant ON provision_portal_sessions(tenant_id,environment);
CREATE INDEX IF NOT EXISTS idx_provision_sessions_org ON provision_portal_sessions(organization_id);

CREATE TABLE IF NOT EXISTS provisioning_claims (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK (environment IN ('commercial','government')),
  papyrus_deployment_id TEXT NOT NULL,
  azure_resource_id TEXT NOT NULL,
  public_origin TEXT,
  marketplace_publisher TEXT,
  marketplace_product TEXT,
  marketplace_plan TEXT,
  activation_public_key_pem TEXT,
  claimed_by_session_id TEXT REFERENCES provision_portal_sessions(id),
  claimed_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_provisioning_claims_deployment ON provisioning_claims(papyrus_deployment_id);

CREATE TABLE IF NOT EXISTS managed_deployments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  environment TEXT NOT NULL CHECK (environment IN ('commercial','government')),
  deployment_kind TEXT NOT NULL DEFAULT 'vm' CHECK (deployment_kind IN ('vm','container')),
  papyrus_deployment_id TEXT NOT NULL UNIQUE,
  azure_resource_id TEXT UNIQUE,
  azure_subscription_id TEXT,
  azure_region TEXT,
  azure_vm_size TEXT,
  vcpu_count INTEGER,
  marketplace_publisher TEXT,
  marketplace_product TEXT,
  marketplace_plan TEXT,
  public_origin TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('provisioning','running','stopped','resizing','error','retired')),
  papyrus_version TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_managed_deployments_org ON managed_deployments(organization_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS deployment_operations (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES managed_deployments(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('resize','start','stop','restart')),
  requested_by_oid TEXT NOT NULL,
  requested_value TEXT,
  previous_value TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployment_operations_deployment ON deployment_operations(deployment_id,created_at DESC);

CREATE TABLE IF NOT EXISTS agreement_acceptances (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  deployment_id TEXT REFERENCES managed_deployments(id),
  actor_oid TEXT NOT NULL,
  actor_tenant_id TEXT NOT NULL,
  actor_email TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('commercial','government')),
  agreement_type TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  agreement_sha256 TEXT NOT NULL,
  source_ip TEXT,
  user_agent TEXT,
  accepted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_org ON agreement_acceptances(organization_id,accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_type ON agreement_acceptances(organization_id,agreement_type,agreement_version);
