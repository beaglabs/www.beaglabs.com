import { randomBytes } from 'node:crypto'
import { Hono, type Context } from 'hono'
import type { Database } from './db'
import type { Bindings, Mode } from './env'
import { deploymentIdOf, IdentityError, verifyLicense, verifyRequest } from './identity'
import { PlaidError, type PlaidGateway } from './plaid'

/**
 * Beag Labs' service for Papyrus installs: reading a payee's bank details through Plaid.
 *
 * Papyrus never holds Plaid's keys: installs ask this Worker, which holds them (from Key Vault) and answers only
 * registered installs whose license (or claimed Marketplace deployment) is current. Nothing about a payee is kept:
 * the details go back once, signed, to the install that asked. Money never passes through Beag Labs.
 *
 * Routes (JSON):
 *   POST /v1/installs          register with { license, publicKeyPem, origin } → { installId, webhookSecret }
 *   POST /v1/plaid/link-token  a Plaid Link token (Auth, and Identity Match where the bank offers it)
 *   POST /v1/plaid/account     exchange Link's token for one account's details and name match; nothing kept
 */
type Install = { id: string; owner_key: string; license_id: string; public_key_pem: string; origin: string; webhook_secret: string; license_expires_at: string | null }
type Env = { Bindings: Bindings; Variables: { install: Install } }

export interface AppDeps {
  database: (env: Bindings) => Database
  plaid?: (env: Bindings) => PlaidGateway
  now?: () => Date
  /** A Marketplace VM claimed in Beag Labs provisioning (license service `managed_deployments`), by Papyrus deployment id. */
  managedDeployment?: (env: Bindings, deploymentId: string) => Promise<{ organizationId: string; status: string; publicOrigin?: string | undefined } | undefined>
}

class ApiError extends Error { constructor(readonly status: number, readonly code: string, message: string) { super(message) } }
const MODES: Mode[] = ['test', 'live']

export function createConnectApp(deps: AppDeps) {
  const app = new Hono<Env>()
  const now = () => deps.now?.() ?? new Date()
  const db = (c: Context<Env>) => deps.database(c.env)
  const one = async <T>(c: Context<Env>, sql: string, args: unknown[]) => ((await db(c).execute({ sql, args })).rows[0] as unknown as T | undefined)

  app.onError((error, c) => {
    if (error instanceof ApiError) return c.json({ error: error.message, code: error.code }, error.status as 400)
    if (error instanceof IdentityError) return c.json({ error: error.message, code: error.code }, 401)
    if (error instanceof PlaidError) return c.json({ error: error.message, code: error.code }, error.status as 400)
    console.error(JSON.stringify({ event: 'connect.error', path: c.req.path, error: error instanceof Error ? error.message : String(error) }))
    return c.json({ error: 'The Beag Labs service failed. Details are in its log.', code: 'CONNECT_FAILED' }, 500)
  })

  // Registration: the license proves who the install belongs to; the key it sends signs everything after.
  app.post('/v1/installs', async c => {
    const body = await c.req.json().catch(() => ({})) as { license?: unknown; publicKeyPem?: unknown; origin?: unknown }
    if (typeof body.publicKeyPem !== 'string' || !body.publicKeyPem.includes('BEGIN PUBLIC KEY')) throw new ApiError(400, 'KEY_REQUIRED', 'The install public key (PEM) is required')
    const origin = checkOrigin(c.env, body.origin)
    const id = deploymentIdOf(body.publicKeyPem), secret = randomBytes(32).toString('hex'), stamp = now().toISOString()
    const owner = body.license !== undefined && body.license !== null
      ? verifyLicense(body.license, JSON.parse(c.env.LICENSE_AUTHORITIES || '{}') as Record<string, string>, body.publicKeyPem, now())
      : await marketplaceOwner(c.env, id, origin)
    // Registering again replaces the install's key and origin (a rebuilt VM, a new license, a new address).
    await db(c).execute({ sql: `INSERT INTO connect_installs(id, owner_key, license_id, license_expires_at, public_key_pem, origin, webhook_secret, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET owner_key=excluded.owner_key, license_id=excluded.license_id, license_expires_at=excluded.license_expires_at, public_key_pem=excluded.public_key_pem,
      origin=excluded.origin, webhook_secret=excluded.webhook_secret, updated_at=excluded.updated_at`, args: [id, owner.ownerKey, owner.licenseId, owner.expiresAt, body.publicKeyPem, origin, secret, stamp, stamp] })
    return c.json({ installId: id, webhookSecret: secret })
  })

  // Every other /v1 route is signed by a registered install whose license has not expired.
  app.use('/v1/*', async (c, next) => {
    if (c.req.path === '/v1/installs') return next()
    const installId = c.req.header('x-papyrus-install')
    const install = installId ? await one<Install>(c, 'SELECT * FROM connect_installs WHERE id=?', [installId]) : undefined
    if (!install) throw new ApiError(401, 'INSTALL_UNKNOWN', 'This install is not registered')
    const body = c.req.method === 'GET' ? '' : await c.req.raw.clone().text()
    const url = new URL(c.req.url)
    verifyRequest({ method: c.req.method, path: url.pathname + url.search, timestamp: c.req.header('x-papyrus-timestamp') ?? null, signature: c.req.header('x-papyrus-signature') ?? null, body, publicKeyPem: install.public_key_pem, now: now() })
    if (install.license_expires_at && Date.parse(install.license_expires_at) <= now().getTime()) throw new ApiError(401, 'INSTALL_UNKNOWN', 'The license this install registered with has expired; register again with the new one')
    // A Marketplace VM stays entitled only while its managed deployment is not retired (or moved to another organization).
    if (install.license_id.startsWith('marketplace:')) {
      const managed = await deps.managedDeployment?.(c.env, install.id)
      if (!managed || managed.status === 'retired' || `org:${managed.organizationId}` !== install.owner_key) throw new ApiError(401, 'INSTALL_UNKNOWN', 'This Marketplace deployment is no longer linked to the organization')
    }
    c.set('install', install)
    return next()
  })

  /**
   * An install with no signed license: an Azure Marketplace VM, entitled by its Marketplace plan. It is accepted once the
   * customer has claimed it in Beag Labs provisioning, which links the deployment id (the hash of the key it sent) to
   * an organization: the same organization id an organization license carries, so either way reaches the same accounts.
   */
  const marketplaceOwner = async (env: Bindings, deploymentId: string, origin: string) => {
    const managed = await deps.managedDeployment?.(env, deploymentId)
    if (!managed) throw new IdentityError('LICENSE_REQUIRED', 'This deployment has no signed license and is not a claimed Azure Marketplace deployment. Activate a license, or finish Marketplace onboarding at beaglabs.com.')
    if (managed.status === 'retired') throw new IdentityError('DEPLOYMENT_RETIRED', 'This Marketplace deployment is retired')
    if (managed.publicOrigin && new URL(managed.publicOrigin).origin !== origin) throw new IdentityError('ORIGIN_MISMATCH', 'The origin does not match the one recorded for this Marketplace deployment')
    return { ownerKey: `org:${managed.organizationId}`, licenseId: `marketplace:${deploymentId}`, expiresAt: null }
  }

  // Plaid: bank account details from the account holder's own bank. Each call names the install's owner as the Plaid
  // user, and nothing is stored: the details go back once, signed, to the install that asked.
  const plaid = (c: Context<Env>) => { if (!deps.plaid) throw new ApiError(503, 'PLAID_UNAVAILABLE', 'Bank linking is not set up on this service'); return deps.plaid(c.env) }
  app.post('/v1/plaid/link-token', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const purpose = 'payee'
    // Plaid's client user id: stable per owner and purpose, never anyone's name or email.
    const clientUserId = `${install.owner_key}:${purpose}:${typeof body.reference === 'string' ? body.reference.slice(0, 64) : 'setup'}`
    const result = await plaid(c).linkToken(mode, { clientUserId, clientName: optional(body.clientName, 30) ?? 'Papyrus' })
    console.log(JSON.stringify({ event: 'plaid.link_token', install: install.id, owner: install.owner_key, mode, purpose }))
    return c.json(result)
  })
  app.post('/v1/plaid/account', async c => {
    const body = await json(c), mode = modeOf(body.mode), install = c.get('install')
    const details = await plaid(c).accountDetails(mode, { publicToken: text(body.publicToken, 'Public token', 200), accountId: text(body.accountId, 'Account', 200),
      legalName: optional(body.legalName, 200), institutionName: optional(body.institutionName, 100) })
    console.log(JSON.stringify({ event: 'plaid.account', install: install.id, owner: install.owner_key, mode, tokenized: details.tokenized, nameMatch: details.nameMatch?.score ?? null }))
    return c.json(details)
  })

  return app
}

function checkOrigin(env: Bindings, value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(400, 'ORIGIN_REQUIRED', 'The install origin is required')
  let url: URL
  try { url = new URL(value) } catch { throw new ApiError(400, 'ORIGIN_INVALID', 'The install origin is not a URL') }
  const local = env.ALLOW_LOCALHOST_ORIGINS === 'true' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !local) || url.pathname !== '/' || url.search || url.hash || url.username) throw new ApiError(400, 'ORIGIN_INVALID', `The install origin must be an https origin, like https://papyrus.city.gov (got ${url.origin})`)
  return url.origin
}
const modeOf = (value: unknown): Mode => { if (!MODES.includes(value as Mode)) throw new ApiError(400, 'MODE_INVALID', 'mode is test or live'); return value as Mode }
const text = (value: unknown, name: string, max: number) => { if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, 'INPUT_INVALID', `${name} is required (up to ${max} characters)`); return value.trim() }
const optional = (value: unknown, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined
const json = async (c: Context<Env>) => await c.req.json().catch(() => ({})) as Record<string, unknown>
