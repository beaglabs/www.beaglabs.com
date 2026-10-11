CREATE TABLE IF NOT EXISTS direct_device_authorizations (
  device_code_hash TEXT PRIMARY KEY,
  user_code_hash TEXT NOT NULL UNIQUE,
  deployment_id TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  deployment_profile TEXT NOT NULL CHECK(deployment_profile IN ('commercial','government')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','denied')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  poll_after TEXT NOT NULL,
  poll_interval_seconds INTEGER NOT NULL DEFAULT 5,
  organization_id TEXT,
  entitlement_id TEXT,
  stripe_subscription_id TEXT,
  approved_by_oid TEXT,
  approved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_direct_device_deployment ON direct_device_authorizations(deployment_id,created_at);
