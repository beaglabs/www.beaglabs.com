import { Pool } from "pg"

/**
 * CSP partner access requests and approvals.
 *
 * The partner materials page carries commercial terms — margins, price lists — so access
 * is an explicit allowlist rather than a "is signed in" check. That allowlist lives in
 * Postgres rather than an environment variable for one practical reason: approving a
 * partner must not require a redeploy. An env var would make every approval a code change
 * and a release, which is not a workable way to onboard a channel.
 *
 * Fail closed everywhere. If the database is unreachable, nobody is approved. The
 * CSP_PARTNER_EMAILS environment allowlist in the page gate stays as break-glass so a
 * database outage cannot lock Beag Labs out of its own partner page.
 */

let pool: Pool | null = null
let schemaReady: Promise<void> | null = null

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_AUTH_URL || process.env.DATABASE_URL
  if (!connectionString) return null
  pool ??= new Pool({ connectionString })
  return pool
}

export type PartnerAccessStatus = "pending" | "approved" | "denied"

export interface PartnerAccessRequest {
  email: string
  name?: string
  company?: string
  cspProgramId?: string
  note?: string
}

export interface PartnerAccessRecord {
  email: string
  name: string | null
  company: string | null
  cspProgramId: string | null
  note: string | null
  status: PartnerAccessStatus
  createdAt: Date
  decidedAt: Date | null
  decidedBy: string | null
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Create the table on first use. Cheaper than a migration step for a single table, and
 * idempotent so concurrent requests are harmless. A failed attempt clears the cached
 * promise rather than poisoning every later call with the same rejection.
 */
async function ensureSchema(): Promise<Pool> {
  const client = getPool()
  if (!client) throw new Error("No database configured (DATABASE_AUTH_URL / DATABASE_URL)")

  schemaReady ??= (async () => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_access (
        email TEXT PRIMARY KEY,
        name TEXT,
        company TEXT,
        csp_program_id TEXT,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        decided_at TIMESTAMPTZ,
        decided_by TEXT
      )
    `)
    await client.query(
      `CREATE INDEX IF NOT EXISTS partner_access_status_idx ON partner_access (status)`,
    )
  })().catch((error) => {
    schemaReady = null
    throw error
  })

  await schemaReady
  return client
}

/** True only for an email explicitly approved. Any failure resolves to false. */
export async function isApprovedPartner(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  try {
    const client = await ensureSchema()
    const result = await client.query(
      `SELECT 1 FROM partner_access WHERE email = $1 AND status = 'approved' LIMIT 1`,
      [normalized],
    )
    return result.rowCount === 1
  } catch (error) {
    console.error("[partner-access] approval lookup failed; denying access", error)
    return false
  }
}

/**
 * Record an application. Deliberately does not touch `status` on conflict: a repeat
 * application must never silently reset a decision, whether that decision was an
 * approval or a denial. A denied applicant re-applying stays denied until someone
 * changes it on purpose.
 */
export async function requestPartnerAccess(
  input: PartnerAccessRequest,
): Promise<{ status: PartnerAccessStatus }> {
  const client = await ensureSchema()
  const result = await client.query(
    `INSERT INTO partner_access (email, name, company, csp_program_id, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, partner_access.name),
       company = COALESCE(EXCLUDED.company, partner_access.company),
       csp_program_id = COALESCE(EXCLUDED.csp_program_id, partner_access.csp_program_id),
       note = COALESCE(EXCLUDED.note, partner_access.note)
     RETURNING status`,
    [
      normalizeEmail(input.email),
      input.name ?? null,
      input.company ?? null,
      input.cspProgramId ?? null,
      input.note ?? null,
    ],
  )
  return { status: (result.rows[0]?.status as PartnerAccessStatus) ?? "pending" }
}

export async function listPartnerAccess(
  status?: PartnerAccessStatus,
): Promise<PartnerAccessRecord[]> {
  const client = await ensureSchema()
  const result = status
    ? await client.query(
        `SELECT email, name, company, csp_program_id, note, status, created_at, decided_at, decided_by
         FROM partner_access WHERE status = $1 ORDER BY created_at DESC`,
        [status],
      )
    : await client.query(
        `SELECT email, name, company, csp_program_id, note, status, created_at, decided_at, decided_by
         FROM partner_access ORDER BY created_at DESC`,
      )

  return result.rows.map((row) => ({
    email: String(row.email),
    name: row.name === null ? null : String(row.name),
    company: row.company === null ? null : String(row.company),
    cspProgramId: row.csp_program_id === null ? null : String(row.csp_program_id),
    note: row.note === null ? null : String(row.note),
    status: String(row.status) as PartnerAccessStatus,
    createdAt: row.created_at as Date,
    decidedAt: (row.decided_at as Date | null) ?? null,
    decidedBy: row.decided_by === null ? null : String(row.decided_by),
  }))
}

/** Returns false when there is no such application, so callers can report it. */
export async function setPartnerAccessStatus(
  email: string,
  status: PartnerAccessStatus,
  decidedBy?: string,
): Promise<boolean> {
  const client = await ensureSchema()
  const result = await client.query(
    `UPDATE partner_access
     SET status = $2, decided_at = now(), decided_by = $3
     WHERE email = $1`,
    [normalizeEmail(email), status, decidedBy ?? null],
  )
  return (result.rowCount ?? 0) > 0
}
