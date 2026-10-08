PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS marketplace_leads (
  id TEXT PRIMARY KEY,
  external_key TEXT NOT NULL UNIQUE,
  action_code TEXT,
  lead_source TEXT,
  offer_title TEXT,
  description TEXT,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  company_name TEXT,
  domain TEXT,
  organization_id TEXT REFERENCES organizations(id),
  contact_id TEXT REFERENCES contacts(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','customer','closed')),
  raw_json TEXT NOT NULL,
  received_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_leads_received ON marketplace_leads(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_status ON marketplace_leads(status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_org ON marketplace_leads(organization_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_email ON marketplace_leads(email);

CREATE TABLE IF NOT EXISTS marketplace_vm_customers (
  id TEXT PRIMARY KEY,
  observation_key TEXT NOT NULL UNIQUE,
  marketplace_subscription_id TEXT,
  customer_id TEXT,
  billing_account_id TEXT,
  customer_name TEXT,
  customer_company_name TEXT,
  customer_country TEXT,
  offer_name TEXT,
  sku TEXT,
  azure_license_type TEXT,
  marketplace_license_type TEXT,
  vm_size TEXT,
  cloud_instance_name TEXT,
  deployment_method TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  normalized_usage REAL,
  raw_usage REAL,
  estimated_charge REAL,
  trial_end_date TEXT,
  sku_billing_type TEXT,
  customer_currency_cc TEXT,
  price_cc REAL,
  estimated_price_pc REAL,
  organization_id TEXT REFERENCES organizations(id),
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_vm_customer ON marketplace_vm_customers(customer_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_vm_org ON marketplace_vm_customers(organization_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_vm_offer ON marketplace_vm_customers(offer_name, sku, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_sync_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed','skipped')),
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_written INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_marketplace_sync_runs_started ON marketplace_sync_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_report_state (
  state_key TEXT PRIMARY KEY,
  query_id TEXT NOT NULL,
  report_id TEXT,
  report_name TEXT,
  report_status TEXT,
  last_execution_id TEXT,
  last_execution_status TEXT,
  last_generated_at TEXT,
  last_synced_execution_id TEXT,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_report_state_report ON marketplace_report_state(report_id);
