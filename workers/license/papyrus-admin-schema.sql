PRAGMA foreign_keys = ON;

-- Papyrus admin app, customer chat, huddles, tenant event pipe and error intake.
-- Additive only: reuses organizations, marketplace_leads, account_managers and
-- organization_account_managers; never alters or drops existing tables.

-- Role last seen in the staff member's Entra token (refreshed on every request).
CREATE TABLE IF NOT EXISTS staff_roles (
  account_manager_id TEXT PRIMARY KEY REFERENCES account_managers(id),
  role TEXT NOT NULL CHECK (role IN ('owner','manager')),
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_roles_role ON staff_roles(role);

CREATE TABLE IF NOT EXISTS staff_devices (
  id TEXT PRIMARY KEY,
  account_manager_id TEXT NOT NULL REFERENCES account_managers(id),
  platform TEXT NOT NULL CHECK (platform IN ('android','macos')),
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_devices_manager ON staff_devices(account_manager_id);

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

-- Customer users seen through /api/papyrus/session (used for names and org suggestions).
CREATE TABLE IF NOT EXISTS tenant_users (
  tenant_id TEXT NOT NULL,
  oid TEXT NOT NULL,
  name TEXT,
  email TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, oid)
);

CREATE TABLE IF NOT EXISTS lead_pipeline (
  lead_id TEXT PRIMARY KEY REFERENCES marketplace_leads(id),
  stage TEXT NOT NULL CHECK (stage IN ('new','contacted','qualified','trial','won','lost')),
  notes TEXT NOT NULL DEFAULT '',
  updated_by_oid TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('team','private')),
  owner_oid TEXT,
  owner_name TEXT,
  support TEXT NOT NULL DEFAULT 'none' CHECK (support IN ('none','open','resolved')),
  last_message_at TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_team ON conversations(tenant_id) WHERE kind = 'team';
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  seq INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer','staff','system')),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  huddle_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, seq);

CREATE TABLE IF NOT EXISTS conversation_reads (
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  reader_type TEXT NOT NULL CHECK (reader_type IN ('customer','staff')),
  reader_id TEXT NOT NULL,
  last_read_seq INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (conversation_id, reader_type, reader_id)
);

CREATE TABLE IF NOT EXISTS chat_attachments (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  message_id TEXT REFERENCES messages(id),
  uploader_type TEXT NOT NULL CHECK (uploader_type IN ('customer','staff')),
  uploader_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','video','document')),
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);

CREATE TABLE IF NOT EXISTS huddles (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  meeting_id TEXT NOT NULL,
  started_by_type TEXT NOT NULL,
  started_by_id TEXT NOT NULL,
  started_by_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_heartbeat_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_huddles_live ON huddles(conversation_id) WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS huddle_participants (
  huddle_id TEXT NOT NULL REFERENCES huddles(id),
  participant_type TEXT NOT NULL CHECK (participant_type IN ('customer','staff')),
  participant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  last_heartbeat_at TEXT NOT NULL,
  left_at TEXT,
  PRIMARY KEY (huddle_id, participant_type, participant_id)
);

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

CREATE TABLE IF NOT EXISTS inbox_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tenant_id TEXT,
  lead_id TEXT,
  conversation_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inbox_items_created ON inbox_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_items_coalesce ON inbox_items(kind, conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inbox_item_done (
  item_id TEXT NOT NULL REFERENCES inbox_items(id),
  account_manager_id TEXT NOT NULL REFERENCES account_managers(id),
  done_at TEXT NOT NULL,
  PRIMARY KEY (item_id, account_manager_id)
);
