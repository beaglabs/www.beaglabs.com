PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('federal_agency','state_local','commercial','prime','distributor','reseller','integrator','partner')),
  legal_name TEXT NOT NULL,
  display_name TEXT,
  uei TEXT,
  cage_code TEXT,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','prospect')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_uei ON organizations(uei);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  contact_type TEXT NOT NULL DEFAULT 'other' CHECK (contact_type IN ('mission_owner','contracting','technical','security','billing','partner_manager','sales','executive','other')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id),
  partner_type TEXT NOT NULL CHECK (partner_type IN ('distributor','reseller','prime','systems_integrator','referral','technology')),
  partner_status TEXT NOT NULL DEFAULT 'prospect' CHECK (partner_status IN ('prospect','active','inactive','terminated')),
  agreement_status TEXT NOT NULL DEFAULT 'none' CHECK (agreement_status IN ('none','negotiating','active','expired','terminated')),
  discount_tier TEXT,
  portal_enabled INTEGER NOT NULL DEFAULT 0 CHECK (portal_enabled IN (0,1)),
  onboarded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vehicle_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT,
  holder_organization_id TEXT REFERENCES organizations(id),
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','expired','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_vehicles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  relationship_type TEXT NOT NULL,
  contract_number TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(organization_id, vehicle_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  product_family TEXT NOT NULL DEFAULT 'papyrus',
  term_type TEXT NOT NULL CHECK (term_type IN ('fixed_days','annual','service')),
  provisioning_type TEXT NOT NULL CHECK (provisioning_type IN ('license','service')),
  list_price_cents INTEGER,
  default_features_json TEXT NOT NULL DEFAULT '[]',
  allowed_profiles_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  customer_organization_id TEXT NOT NULL REFERENCES organizations(id),
  originating_partner_id TEXT REFERENCES partners(id),
  transacting_partner_id TEXT REFERENCES partners(id),
  primary_contact_id TEXT REFERENCES contacts(id),
  name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('identified','qualified','pilot_proposed','technical_validation','procurement','verbal','closed_won','closed_lost')),
  estimated_value_cents INTEGER,
  vehicle_id TEXT REFERENCES vehicles(id),
  expected_product_id TEXT REFERENCES products(id),
  expected_close_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_organization_id TEXT NOT NULL REFERENCES organizations(id),
  purchaser_organization_id TEXT REFERENCES organizations(id),
  originating_partner_id TEXT REFERENCES partners(id),
  transacting_partner_id TEXT REFERENCES partners(id),
  vehicle_id TEXT REFERENCES vehicles(id),
  opportunity_id TEXT REFERENCES opportunities(id),
  contract_number TEXT,
  task_order_number TEXT,
  po_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','booked','fulfilled','cancelled','refunded')),
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  ordered_at TEXT,
  start_date TEXT,
  end_date TEXT,
  primary_contact_id TEXT REFERENCES contacts(id),
  billing_contact_id TEXT REFERENCES contacts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(transacting_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  list_price_cents INTEGER,
  unit_price_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  extended_price_cents INTEGER NOT NULL,
  service_start TEXT,
  service_end TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES order_items(id),
  customer_organization_id TEXT NOT NULL REFERENCES organizations(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','expired','suspended','revoked')),
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  feature_set_json TEXT NOT NULL DEFAULT '[]',
  allowed_profiles_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  issued_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entitlements_customer ON entitlements(customer_organization_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_status ON entitlements(status);

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL REFERENCES entitlements(id),
  customer_organization_id TEXT NOT NULL REFERENCES organizations(id),
  deployment_name TEXT NOT NULL,
  papyrus_deployment_id TEXT NOT NULL UNIQUE,
  deployment_profile TEXT NOT NULL CHECK (deployment_profile IN ('commercial','government-il4','government-il6','gcc','gcch','dod','restricted','disconnected')),
  activation_public_key_pem TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','licensed','suspended','retired')),
  registered_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deployments_entitlement ON deployments(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_deployments_customer ON deployments(customer_organization_id);

CREATE TABLE IF NOT EXISTS license_issuances (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL UNIQUE,
  deployment_id TEXT NOT NULL REFERENCES deployments(id),
  entitlement_id TEXT NOT NULL REFERENCES entitlements(id),
  key_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  signed_document_json TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','revoked','superseded')),
  issued_by_oid TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_license_issuances_deployment ON license_issuances(deployment_id);
CREATE INDEX IF NOT EXISTS idx_license_issuances_entitlement ON license_issuances(entitlement_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  organization_id TEXT,
  partner_id TEXT,
  request_id TEXT NOT NULL,
  source_ip TEXT,
  user_agent TEXT,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_events(resource_type, resource_id);

INSERT OR IGNORE INTO products (
  id, sku, name, description, product_family, term_type, provisioning_type,
  list_price_cents, default_features_json, allowed_profiles_json, active, created_at, updated_at
) VALUES
  ('prod_pap_fed_pilot_90', 'PAP-FED-PILOT-90', 'Papyrus Federal 90-Day Mission Pilot', 'Fixed-price 90-day federal mission pilot.', 'papyrus', 'fixed_days', 'license', 25000000, '["core","teams","email","security-connectors","action-executors","agent-peers"]', '["commercial","government-il4","government-il6","gcc","gcch","dod","restricted","disconnected"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_pap_fed_ent_1y', 'PAP-FED-ENT-1Y', 'Papyrus Federal Enterprise — Annual', 'Annual Papyrus Federal enterprise entitlement.', 'papyrus', 'annual', 'license', NULL, '["core","teams","email","security-connectors","action-executors","agent-peers"]', '["commercial","government-il4","government-il6","gcc","gcch","dod","restricted"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_pap_fed_disc_1y', 'PAP-FED-DISC-1Y', 'Papyrus Federal Disconnected — Annual', 'Annual entitlement for disconnected or air-gapped Papyrus deployments.', 'papyrus', 'annual', 'license', NULL, '["core","email","security-connectors","action-executors","agent-peers"]', '["disconnected"]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_pap_fed_support_prem', 'PAP-FED-SUPPORT-PREM', 'Premium Mission Support', 'Premium Papyrus mission support.', 'papyrus', 'service', 'service', NULL, '[]', '[]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
