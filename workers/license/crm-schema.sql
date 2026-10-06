PRAGMA foreign_keys = ON;

-- CRM people are intentionally separate from legacy contacts. A person can exist
-- before a customer/account exists, then be linked to an organization later.
CREATE TABLE IF NOT EXISTS crm_people (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  lead_stage TEXT NOT NULL DEFAULT 'new' CHECK (lead_stage IN ('new','contacted','qualified','nurture','customer','closed','do_not_contact')),
  lead_source TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'lead' CHECK (relationship_type IN ('lead','contact','customer','partner','other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  owner_oid TEXT,
  notes TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  last_contacted_at TEXT,
  next_follow_up_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_people_org ON crm_people(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_people_stage ON crm_people(lead_stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_people_email ON crm_people(email);
CREATE INDEX IF NOT EXISTS idx_crm_people_linkedin ON crm_people(linkedin_url);

CREATE TABLE IF NOT EXISTS crm_organization_profiles (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  website_url TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  account_stage TEXT NOT NULL DEFAULT 'prospect' CHECK (account_stage IN ('prospect','qualified','active_customer','partner','inactive')),
  owner_oid TEXT,
  notes TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Polymorphic people links let one person participate in several records without
-- forcing primary/billing/contact semantics into every core table.
CREATE TABLE IF NOT EXISTS crm_record_people (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES crm_people(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('organization','opportunity','order','vehicle')),
  resource_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'stakeholder',
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  created_at TEXT NOT NULL,
  UNIQUE(person_id, resource_type, resource_id, role)
);

CREATE INDEX IF NOT EXISTS idx_crm_record_people_resource ON crm_record_people(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_crm_record_people_person ON crm_record_people(person_id);

-- SAM.gov notice IDs, award IDs, prime contract IDs, task orders, etc. all use
-- the same model so any CRM record can carry procurement identifiers.
CREATE TABLE IF NOT EXISTS crm_references (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('organization','opportunity','order','vehicle')),
  resource_id TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('sam_notice','sam_award','solicitation','prime_contract','subcontract','task_order','purchase_order','vehicle','other')),
  identifier TEXT NOT NULL,
  url TEXT,
  label TEXT,
  notes TEXT,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_references_resource ON crm_references(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_crm_references_identifier ON crm_references(reference_type, identifier);

CREATE TABLE IF NOT EXISTS crm_attachments (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('person','organization','opportunity','order','vehicle')),
  resource_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  storage_key TEXT,
  external_url TEXT,
  description TEXT,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (storage_key IS NOT NULL OR external_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_crm_attachments_resource ON crm_attachments(resource_type, resource_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_activities (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  person_id TEXT REFERENCES crm_people(id) ON DELETE SET NULL,
  resource_type TEXT CHECK (resource_type IN ('person','organization','opportunity','order','vehicle')),
  resource_id TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('note','email','call','meeting','task','status','file','contract','other')),
  subject TEXT,
  body TEXT,
  occurred_at TEXT NOT NULL,
  created_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_resource ON crm_activities(resource_type, resource_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_org ON crm_activities(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_person ON crm_activities(person_id, occurred_at DESC);
