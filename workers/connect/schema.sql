-- Beag Labs' service for Papyrus installs (Plaid bank details). One row per Papyrus install that registered, owned by
-- its license owner (an organization, or one deployment).
CREATE TABLE IF NOT EXISTS connect_installs (
  id TEXT PRIMARY KEY,                -- the deployment id: SHA-256 of the install's public key PEM
  owner_key TEXT NOT NULL,            -- org:<organizationId> or dep:<deploymentId>
  license_id TEXT NOT NULL,
  license_expires_at TEXT,
  public_key_pem TEXT NOT NULL,
  origin TEXT NOT NULL,               -- the install's https origin
  webhook_secret TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS connect_installs_owner ON connect_installs(owner_key);
