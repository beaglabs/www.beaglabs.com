PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS partner_applications (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  annual_revenue_usd INTEGER NOT NULL CHECK (annual_revenue_usd >= 0),
  uei TEXT NOT NULL,
  cage_code TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('distributor','reseller','prime','systems_integrator','referral','technology')),
  main_poc_name TEXT NOT NULL,
  main_poc_email TEXT NOT NULL,
  sku_interests_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decision_token_hash TEXT NOT NULL UNIQUE,
  decision_expires_at TEXT NOT NULL,
  approved_by_oid TEXT,
  approved_at TEXT,
  rejected_at TEXT,
  partner_id TEXT REFERENCES partners(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_applications_uei ON partner_applications(uei);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(main_poc_email);

CREATE TABLE IF NOT EXISTS partner_invites (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  auth_user_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_invites_partner ON partner_invites(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_invites_email ON partner_invites(email, status);

CREATE TABLE IF NOT EXISTS partner_users (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  auth_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(partner_id, email)
);

CREATE INDEX IF NOT EXISTS idx_partner_users_partner ON partner_users(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_users_email ON partner_users(email);

CREATE TABLE IF NOT EXISTS partner_order_submissions (
  order_id TEXT PRIMARY KEY REFERENCES orders(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  partner_user_id TEXT NOT NULL REFERENCES partner_users(id),
  end_customer_name TEXT,
  end_customer_uei TEXT,
  end_customer_cage TEXT,
  notes TEXT,
  requires_quote INTEGER NOT NULL DEFAULT 0 CHECK (requires_quote IN (0,1)),
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_order_submissions_partner ON partner_order_submissions(partner_id, submitted_at DESC);
