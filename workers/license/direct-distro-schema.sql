CREATE TABLE IF NOT EXISTS direct_enrollment_tokens (
  token_hash TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL REFERENCES entitlements(id),
  stripe_subscription_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deployment_id TEXT,
  claimed_at TEXT
);
CREATE TABLE IF NOT EXISTS direct_deployment_usage (
  deployment_id TEXT NOT NULL REFERENCES deployments(id),
  sequence INTEGER NOT NULL CHECK(sequence > 0),
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  milli_cpus INTEGER NOT NULL CHECK(milli_cpus > 0),
  cpu_milliseconds INTEGER NOT NULL,
  event_identifier TEXT NOT NULL UNIQUE,
  stripe_subscription_item_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','submitted')),
  submitted_at TEXT,
  PRIMARY KEY (deployment_id, sequence)
);
CREATE TABLE IF NOT EXISTS direct_stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL
);
