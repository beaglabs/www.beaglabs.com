-- Beag Labs Stripe Connect service. One row per Papyrus install that registered; Stripe accounts belong to the
-- license owner (an organization, or one deployment), never to a single VM.
CREATE TABLE IF NOT EXISTS connect_installs (
  id TEXT PRIMARY KEY,                -- the deployment id: SHA-256 of the install's public key PEM
  owner_key TEXT NOT NULL,            -- org:<organizationId> or dep:<deploymentId>
  license_id TEXT NOT NULL,
  license_expires_at TEXT,
  public_key_pem TEXT NOT NULL,
  origin TEXT NOT NULL,               -- https origin; events are forwarded to <origin>/ledger/webhooks/stripe
  webhook_secret TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS connect_installs_owner ON connect_installs(owner_key);

CREATE TABLE IF NOT EXISTS connect_accounts (
  owner_key TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  account_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (owner_key, mode)
);

-- Stripe events for a connected account, normalized for Papyrus and kept for its installs (pushed, or polled by
-- installs that take no inbound webhooks).
CREATE TABLE IF NOT EXISTS connect_events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  owner_key TEXT NOT NULL,
  mode TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS connect_events_owner ON connect_events(owner_key, seq);

-- Push delivery of each event to each of the owner's installs, retried by the cron until it lands or gives up.
CREATE TABLE IF NOT EXISTS connect_deliveries (
  event_seq INTEGER NOT NULL,
  install_id TEXT NOT NULL,
  delivered_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT,
  PRIMARY KEY (event_seq, install_id)
);
CREATE INDEX IF NOT EXISTS connect_deliveries_due ON connect_deliveries(delivered_at, next_attempt_at);
