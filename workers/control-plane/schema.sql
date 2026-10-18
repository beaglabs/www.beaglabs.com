-- Papyrus control plane (D1). Idempotent: safe to apply on every deploy.

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  organization TEXT,
  created_at TEXT NOT NULL
);

-- Magic links: only the SHA-256 of the token is stored.
CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  -- From the signup form; applied when the link is redeemed (the address is only trusted then).
  name TEXT,
  organization TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  expires_at TEXT NOT NULL
);

-- One row per Papyrus deployment. One Stripe subscription each.
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  -- papyrus_deployments.id in the license Worker, set when the deploy step registers it.
  license_deployment_id TEXT UNIQUE,
  provider TEXT,
  hostname TEXT,
  -- 'none' until Stripe Checkout completes; then 'active' or 'suspended' from webhooks.
  billing_state TEXT NOT NULL DEFAULT 'none',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_status TEXT,
  -- AES-256-GCM, account id as associated data. Never logged, decrypted only for check/deploy/update.
  credentials_ciphertext TEXT,
  -- Bootstrap token + signed license from LicenseRpc.createDeployment, kept (encrypted) so deploy retries reuse them.
  deploy_secrets_ciphertext TEXT,
  aws_external_id TEXT,
  resources TEXT NOT NULL DEFAULT '{}',
  dns_records TEXT NOT NULL DEFAULT '[]',
  steps TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS deployments_account ON deployments(account_id);

-- Stripe webhook idempotency.
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL
);

-- Beag Labs switches bring-your-own-cloud on for one account (BYOC_ENABLED="true" turns it on for everyone).
-- Enable: INSERT OR REPLACE INTO account_flags (account_id, byoc_enabled) VALUES ('acct_…', 1);
CREATE TABLE IF NOT EXISTS account_flags (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id),
  byoc_enabled INTEGER NOT NULL DEFAULT 0
);

-- Hosted org names: <org_name>.papyrus.beaglabs.com. The primary key is the uniqueness check.
-- slot: per-customer listener rule priority, and (offset) the POSIX uid/gid of the customer's EFS access point.
CREATE TABLE IF NOT EXISTS hosted_orgs (
  org_name TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL UNIQUE REFERENCES deployments(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  slot INTEGER NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- Shared hosted infrastructure ids (one row, id 'aws'), written by POST /admin/hosted/bootstrap.
CREATE TABLE IF NOT EXISTS hosted_infra (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Trial end from Stripe (customer.subscription.* webhooks), for the Plan card.
CREATE TABLE IF NOT EXISTS billing_periods (
  deployment_id TEXT PRIMARY KEY REFERENCES deployments(id),
  trial_end TEXT,
  updated_at TEXT NOT NULL
);

-- Activity log: append-only, scoped to an account (deployment_id NULL = account-wide, e.g. sign-ins).
-- level: ok | info | wait | error. Messages are shown to the customer and never contain secrets.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  deployment_id TEXT,
  at TEXT NOT NULL,
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS events_account ON events(account_id, id);

-- Billing Meter behind each metered Stripe price (price.recurring.meter → meter.event_name), resolved at runtime.
CREATE TABLE IF NOT EXISTS stripe_meters (
  price_id TEXT PRIMARY KEY,
  meter_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- One row per usage report (compute: <deploymentId>:<hourStart>; execution: <deploymentId>:<reportId>).
-- status: sending | sent | failed (retried by the hourly cron) | trial (dropped while trialing) | unbilled (no subscription).
CREATE TABLE IF NOT EXISTS meter_pushes (
  identifier TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES deployments(id),
  kind TEXT NOT NULL,
  value INTEGER NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS meter_pushes_deployment ON meter_pushes(deployment_id, period_start);

-- Stop/Start and Delete (src/lifecycle.ts). No row = running. state: running | stopped | deleting | deleted.
-- changed_at: when it last changed (the VM-hour cron skips hours that started after a stop). teardown: per-step progress JSON.
CREATE TABLE IF NOT EXISTS deployment_lifecycle (
  deployment_id TEXT PRIMARY KEY REFERENCES deployments(id),
  state TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  teardown TEXT NOT NULL DEFAULT '{}'
);

-- Browser preview: the latest screenshot per deployment lives in R2 (PREVIEWS); this row is its capture time and the
-- rate limit (attempted_at). Never holds credentials: url is the bare public origin.
CREATE TABLE IF NOT EXISTS preview_captures (
  deployment_id TEXT PRIMARY KEY REFERENCES deployments(id),
  url TEXT,
  captured_at TEXT,
  attempted_at TEXT,
  error TEXT
);

-- Automatic read-only checks while a deployment page is open (DNS, health, Microsoft, registration, teardown):
-- a lease so two open tabs do not run the same check at once.
CREATE TABLE IF NOT EXISTS auto_checks (
  deployment_id TEXT PRIMARY KEY REFERENCES deployments(id),
  claimed_at TEXT NOT NULL
);
