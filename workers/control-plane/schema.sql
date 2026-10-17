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
