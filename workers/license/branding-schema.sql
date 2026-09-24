PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS deployment_branding (
  deployment_id TEXT PRIMARY KEY REFERENCES deployments(id) ON DELETE CASCADE,
  entra_app_logo_url TEXT,
  updated_by_oid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
