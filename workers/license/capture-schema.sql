PRAGMA foreign_keys = ON;

-- Flexible entity metadata layered over the stable organizations table used by
-- orders, entitlements, deployments, and partner flows.
CREATE TABLE IF NOT EXISTS crm_entity_profiles_v2 (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  entity_kind TEXT NOT NULL DEFAULT 'organization',
  parent_organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  website_url TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  tracking_status TEXT NOT NULL DEFAULT 'active',
  summary TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  naics_json TEXT NOT NULL DEFAULT '[]',
  psc_json TEXT NOT NULL DEFAULT '[]',
  small_business_programs_json TEXT NOT NULL DEFAULT '[]',
  owner_oid TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_entity_v2_kind ON crm_entity_profiles_v2(entity_kind, tracking_status);
CREATE INDEX IF NOT EXISTS idx_crm_entity_v2_parent ON crm_entity_profiles_v2(parent_organization_id);

-- Vehicle metadata is deliberately broad: this can represent an IDIQ/GWAC,
-- BOA/BPA, OTA consortium, CSO/BAA program, SBIR program, prime contract,
-- marketplace/channel program, or another reusable procurement route.
CREATE TABLE IF NOT EXISTS crm_vehicle_profiles (
  vehicle_id TEXT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_kind TEXT NOT NULL DEFAULT 'other',
  owner_entity_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  managing_entity_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  source_url TEXT,
  source_system TEXT,
  ceiling_cents INTEGER,
  ordering_end_date TEXT,
  summary TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_vehicle_entities (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  contract_number TEXT,
  notes TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  created_at TEXT NOT NULL,
  UNIQUE(vehicle_id, organization_id, role)
);

CREATE INDEX IF NOT EXISTS idx_crm_vehicle_entities_vehicle ON crm_vehicle_entities(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_crm_vehicle_entities_entity ON crm_vehicle_entities(organization_id);

-- A pursuit is the universal "thing we are trying to advance." It is not
-- required to be a direct sale. Examples: RFP, CSO, BAA, SBIR, task order,
-- subcontracting outreach, prime teaming, OEM/reseller motion, pilot, or sale.
CREATE TABLE IF NOT EXISTS crm_pursuits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  pursuit_type TEXT NOT NULL DEFAULT 'other',
  stage TEXT NOT NULL DEFAULT 'watching',
  priority TEXT NOT NULL DEFAULT 'normal',
  target_entity_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  primary_vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  parent_pursuit_id TEXT REFERENCES crm_pursuits(id) ON DELETE SET NULL,
  legacy_opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
  identifier TEXT,
  source_url TEXT,
  source_system TEXT,
  posted_at TEXT,
  due_at TEXT,
  expected_decision_at TEXT,
  estimated_value_cents INTEGER,
  probability_percent INTEGER CHECK (probability_percent IS NULL OR (probability_percent >= 0 AND probability_percent <= 100)),
  next_action TEXT,
  next_action_at TEXT,
  owner_oid TEXT,
  summary TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_pursuits_stage ON crm_pursuits(stage, due_at);
CREATE INDEX IF NOT EXISTS idx_crm_pursuits_type ON crm_pursuits(pursuit_type, stage);
CREATE INDEX IF NOT EXISTS idx_crm_pursuits_entity ON crm_pursuits(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_pursuits_vehicle ON crm_pursuits(primary_vehicle_id);

CREATE TABLE IF NOT EXISTS crm_pursuit_entities (
  id TEXT PRIMARY KEY,
  pursuit_id TEXT NOT NULL REFERENCES crm_pursuits(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(pursuit_id, organization_id, role)
);

CREATE INDEX IF NOT EXISTS idx_crm_pursuit_entities_pursuit ON crm_pursuit_entities(pursuit_id);
CREATE INDEX IF NOT EXISTS idx_crm_pursuit_entities_entity ON crm_pursuit_entities(organization_id);

CREATE TABLE IF NOT EXISTS crm_pursuit_people (
  id TEXT PRIMARY KEY,
  pursuit_id TEXT NOT NULL REFERENCES crm_pursuits(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES crm_people(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'stakeholder',
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(pursuit_id, person_id, role)
);

CREATE INDEX IF NOT EXISTS idx_crm_pursuit_people_pursuit ON crm_pursuit_people(pursuit_id);
CREATE INDEX IF NOT EXISTS idx_crm_pursuit_people_person ON crm_pursuit_people(person_id);

-- A pursuit can have multiple outbound packages: capability statement, white
-- paper, solution brief, quote, full proposal, forms, etc.
CREATE TABLE IF NOT EXISTS crm_submissions (
  id TEXT PRIMARY KEY,
  pursuit_id TEXT NOT NULL REFERENCES crm_pursuits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'planned',
  due_at TEXT,
  submitted_at TEXT,
  delivery_method TEXT,
  destination TEXT,
  confirmation_id TEXT,
  notes TEXT,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_submissions_pursuit ON crm_submissions(pursuit_id, status, due_at);

-- New document model supports both reference material and files we intend to
-- send. It intentionally coexists with crm_attachments for backward compatibility.
CREATE TABLE IF NOT EXISTS crm_documents (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  storage_key TEXT,
  external_url TEXT,
  direction TEXT NOT NULL DEFAULT 'reference',
  document_type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'reference',
  description TEXT,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (storage_key IS NOT NULL OR external_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_crm_documents_resource ON crm_documents(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_documents_status ON crm_documents(status, direction);

-- Engagements cover sales and subcontracting outreach as well as ordinary
-- capture activity. Link one interaction to any combination of entity, person,
-- pursuit, and vehicle.
CREATE TABLE IF NOT EXISTS crm_engagements (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  person_id TEXT REFERENCES crm_people(id) ON DELETE SET NULL,
  pursuit_id TEXT REFERENCES crm_pursuits(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'other',
  direction TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL DEFAULT 'completed',
  subject TEXT,
  body TEXT,
  outcome TEXT,
  external_url TEXT,
  occurred_at TEXT NOT NULL,
  follow_up_at TEXT,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_engagements_entity ON crm_engagements(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_engagements_person ON crm_engagements(person_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_engagements_pursuit ON crm_engagements(pursuit_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_engagements_vehicle ON crm_engagements(vehicle_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS crm_capture_references (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  url TEXT,
  label TEXT,
  notes TEXT,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_capture_references_resource ON crm_capture_references(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_crm_capture_references_identifier ON crm_capture_references(reference_type, identifier);
