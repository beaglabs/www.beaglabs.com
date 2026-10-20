import * as Effect from 'effect/Effect'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import { createLocalJWKSet, jwtVerify, type JSONWebKeySet, type JWTPayload } from 'jose'
import { challengeFor } from './auth'
import { randomToken, sha256Hex, toBase64 } from './crypto'
import type { Bindings } from './env'
import { logEvent } from './events'
import { hostedOrgFor } from './hosted'
import { LEGAL } from './legal'
import type { IdentityPayload, SignedIdentity } from './license-rpc'
import { license } from './runner'
import { bindingFor, syncMicrosoftConnection, type MicrosoftBinding } from './microsoft-binding'
import { Env, UserError, first, getDeployment, nowIso, run, type Account, type Deployment } from './services'
import { authenticateDeployment } from './status'

export { bindingFor, type MicrosoftBinding } from './microsoft-binding'

/**
 * One-click Connect Microsoft: papyrus.beaglabs.com brokers Microsoft Entra sign-in for Papyrus deployments with one
 * multi-tenant app (MICROSOFT_CLIENT_ID, redeemed with MICROSOFT_CLIENT_SECRET). Spec:
 * docs/superpowers/specs/2026-10-18-one-click-microsoft-connect-design.md.
 *
 * - Connect (kind `consent`): the owner accepts the terms here, an admin approves the app for their organization
 *   (adminconsent), then signs in once. That binds the deployment to the tenant and makes the admin System Owner.
 * - Sign-in to Papyrus (kind `portal`): Papyrus opens a transaction with its deployment key, the browser signs in here,
 *   and Papyrus redeems a one-time handle (60 s) server-to-server for an identity assertion signed by the license
 *   Worker. Microsoft tokens are used at the callback and then dropped: none is stored or forwarded.
 *
 * - Staff directory (kind `directory`, later and separate): an Entra administrator approves the app's application
 *   permission User.Read.All for the bound tenant (adminconsent with `.default`). Papyrus then asks for an app-only Graph
 *   token with its deployment key (POST /api/microsoft/app-token): for the bound tenant only, an hour at most, and only
 *   once the token carries User.Read.All. Beag Labs mints the token and never reads the directory.
 *
 * Public cloud only. Sign-in itself uses delegated User.Read for the signed-in person's own profile and photo.
 */

const AUTHORITY = 'https://login.microsoftonline.com'
const GRAPH = 'https://graph.microsoft.com/v1.0'
export const MICROSOFT_SCOPES = 'openid profile email https://graph.microsoft.com/User.Read'
/** Everything the app registration lists, including the application permission User.Read.All. */
export const DIRECTORY_SCOPE = 'https://graph.microsoft.com/.default'
export const DIRECTORY_ROLE = 'User.Read.All'
const TRANSACTION_MS = 10 * 60_000
const HANDLE_MS = 60_000
const ASSERTION_MS = 5 * 60_000
const PHOTO_MAX_BYTES = 128 * 1024
const PROFILE_SELECT = 'displayName,mail,userPrincipalName,companyName,department,jobTitle,officeLocation'
const TENANT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const callbackUrl = (env: Pick<Bindings, 'BASE_URL'>) => `${env.BASE_URL}/microsoft/callback`
export const consentedUrl = (env: Pick<Bindings, 'BASE_URL'>) => `${env.BASE_URL}/microsoft/consented`

/** The organizations admin-consent link; with no `state` it is the shareable link for an administrator. */
export const adminConsentUrl = (clientId: string, redirectUri: string, state?: string) =>
  `${AUTHORITY}/organizations/v2.0/adminconsent?${new URLSearchParams({ client_id: clientId, scope: MICROSOFT_SCOPES, redirect_uri: redirectUri, ...(state ? { state } : {}) })}`

/** Admin consent for the staff directory, in the bound tenant only. */
export const directoryConsentUrl = (clientId: string, tenantId: string, redirectUri: string, state: string) =>
  `${AUTHORITY}/${encodeURIComponent(tenantId)}/v2.0/adminconsent?${new URLSearchParams({ client_id: clientId, scope: DIRECTORY_SCOPE, redirect_uri: redirectUri, state })}`

const notConfigured = () => new UserError({ message: "Connect Microsoft isn't set up on papyrus.beaglabs.com yet. Email james@beaglabs.com and we'll turn it on.", status: 503 })

/** The broker's app registration; a clear error (not a crash) until it is configured. */
export const microsoftClient = Effect.gen(function* () {
  const env = yield* Env
  const id = env.MICROSOFT_CLIENT_ID?.trim()
  const secret = env.MICROSOFT_CLIENT_SECRET?.trim()
  if (!id || !secret) return yield* notConfigured()
  return { id, secret }
})

// Terms --------------------------------------------------------------------------------------------------------------

export interface TermsAcceptance {
  accepted_by_account_email: string
  organization: string
  termsVersion: string
  privacyVersion: string
  acceptedAt: string
  ip?: string
  userAgent?: string
}

export const termsFor = (deploymentId: string) =>
  first<{ acceptance: string }>('SELECT acceptance FROM terms_acceptances WHERE deployment_id = ?', deploymentId).pipe(
    Effect.map((row) => {
      try {
        return row ? (JSON.parse(row.acceptance) as TermsAcceptance) : null
      } catch {
        return null
      }
    }),
  )

/** Record that the signed-in owner accepted the current terms for their organization (a newer version replaces it). */
export const acceptTerms = (deployment: Pick<Deployment, 'id' | 'hostname'>, account: Account, context: { ip?: string | null; userAgent?: string | null }) =>
  Effect.gen(function* () {
    const org = yield* hostedOrgFor(deployment.id)
    const acceptance: TermsAcceptance = {
      accepted_by_account_email: account.email,
      organization: account.organization || org?.org_name || deployment.hostname || account.email,
      termsVersion: LEGAL.termsVersion,
      privacyVersion: LEGAL.privacyVersion,
      acceptedAt: nowIso(),
      ...(context.ip ? { ip: context.ip.slice(0, 64) } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 300) } : {}),
    }
    yield* run(
      `INSERT INTO terms_acceptances (deployment_id, acceptance, accepted_at) VALUES (?, ?, ?)
       ON CONFLICT(deployment_id) DO UPDATE SET acceptance = excluded.acceptance, accepted_at = excluded.accepted_at`,
      deployment.id,
      JSON.stringify(acceptance),
      acceptance.acceptedAt,
    )
    return acceptance
  })

// Bindings and transactions -------------------------------------------------------------------------------------------

interface Transaction {
  id: string
  kind: 'consent' | 'portal' | 'directory'
  deployment_id: string
  account_id: string | null
  phase: string
  tenant_id: string | null
  nonce: string
  verifier: string | null
  client_state: string | null
  client_nonce: string | null
  return_origin: string | null
  handle_sha256: string | null
  identity_json: string | null
  created_at: string
  expires_at: string
  used_at: string | null
}

/** Drop expired transactions and handles (the cron, and whenever a transaction is created). */
export const pruneTransactions = () => Effect.suspend(() => run('DELETE FROM microsoft_transactions WHERE expires_at < ?', nowIso()))

const createTransaction = (row: Pick<Transaction, 'kind' | 'deployment_id' | 'phase'> & Partial<Pick<Transaction, 'account_id' | 'tenant_id' | 'client_state' | 'client_nonce' | 'return_origin'>>) =>
  Effect.gen(function* () {
    yield* pruneTransactions()
    const id = `mtx_${randomToken(24)}`
    const now = Date.now()
    yield* run(
      `INSERT INTO microsoft_transactions (id, kind, deployment_id, account_id, phase, tenant_id, nonce, client_state, client_nonce, return_origin, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      row.kind,
      row.deployment_id,
      row.account_id ?? null,
      row.phase,
      row.tenant_id ?? null,
      randomToken(16),
      row.client_state ?? null,
      row.client_nonce ?? null,
      row.return_origin ?? null,
      new Date(now).toISOString(),
      new Date(now + TRANSACTION_MS).toISOString(),
    )
    return id
  })

const expired = () => new UserError({ message: 'This Microsoft sign-in expired or was already used. Start again.', status: 400 })

const liveTransaction = (id: string | undefined) =>
  Effect.gen(function* () {
    const txn = id ? yield* first<Transaction>('SELECT * FROM microsoft_transactions WHERE id = ?', id) : null
    if (!txn || txn.used_at || !(Date.parse(txn.expires_at) > Date.now())) return yield* expired()
    return txn
  })

/** Sign-in at the customer's tenant: code + PKCE, our own nonce, back to /microsoft/callback with the transaction id as state. */
const authorizeUrl = (txn: Pick<Transaction, 'id' | 'tenant_id'>) =>
  Effect.gen(function* () {
    const env = yield* Env
    const client = yield* microsoftClient
    const verifier = randomToken(32)
    const nonce = randomToken(16)
    yield* run('UPDATE microsoft_transactions SET verifier = ?, nonce = ? WHERE id = ?', verifier, nonce, txn.id)
    const params = new URLSearchParams({
      client_id: client.id,
      response_type: 'code',
      response_mode: 'query',
      redirect_uri: callbackUrl(env),
      scope: MICROSOFT_SCOPES,
      state: txn.id,
      nonce,
      code_challenge: yield* challengeFor(verifier),
      code_challenge_method: 'S256',
    })
    return `${AUTHORITY}/${encodeURIComponent(txn.tenant_id!)}/oauth2/v2.0/authorize?${params}`
  })

// Connect Microsoft (consent) -----------------------------------------------------------------------------------------

/** GET /deploy/:id/microsoft/connect: the admin-consent URL for this deployment's owner. */
export const startConsent = (deployment: Deployment, account: Account) =>
  Effect.gen(function* () {
    const env = yield* Env
    if (deployment.lifecycle === 'deleting' || deployment.lifecycle === 'deleted') return yield* new UserError({ message: 'This deployment was deleted.', status: 409 })
    if (!deployment.license_deployment_id) return yield* new UserError({ message: 'Deploy first. Connect Microsoft once Papyrus is deployed.', status: 409 })
    if (!(yield* termsFor(deployment.id))) return yield* new UserError({ message: 'Accept the Terms of Service and Privacy Policy first.', status: 409 })
    if (yield* syncMicrosoftConnection(deployment)) return `/deploy/${deployment.id}`
    const client = yield* microsoftClient
    const id = yield* createTransaction({ kind: 'consent', deployment_id: deployment.id, account_id: account.id, phase: 'consent' })
    return adminConsentUrl(client.id, callbackUrl(env), id)
  })

/** An administrator has to approve: the shareable consent link and what Microsoft said. */
export interface AdminApproval {
  deploymentId: string
  consentUrl: string
  detail: string | null
}

export type CallbackResult = { kind: 'redirect'; url: string } | ({ kind: 'admin' } & AdminApproval)

/** Errors that mean "an administrator must approve this app" rather than "sign-in failed". */
const NEEDS_ADMIN = /AADSTS(90094|90095|65001|900941)\b/

const clip = (value: unknown, max = 256) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined)

const domainOf = (address: string | undefined) => (address?.includes('@') ? address.split('@').pop()!.toLowerCase() : undefined)

/** Who signed in, from the verified ID token and Graph /me. Optional fields are omitted, never null. */
type Profile = Pick<IdentityPayload, 'tid' | 'oid'> & Omit<Partial<IdentityPayload>, 'type' | 'aud' | 'tid' | 'oid' | 'nonce' | 'issuedAt' | 'expiresAt'>

const defined = <T extends Record<string, unknown>>(value: T) => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T

const failed = (message: string, status = 502) => new UserError({ message, status })

const getJson = (url: string, token?: string) =>
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const request = HttpClientRequest.get(url, { headers: { accept: 'application/json' } })
    const response = yield* http.execute(token ? request.pipe(HttpClientRequest.bearerToken(token)) : request)
    const body = yield* response.json.pipe(Effect.orElseSucceed(() => null))
    return { status: response.status, body: body as Record<string, unknown> | null }
  }).pipe(Effect.timeout('15 seconds'))

/** The 48×48 photo as a data: URI (image/* only, at most 128 KiB), or nothing. */
const photo = (token: string) =>
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const response = yield* http.execute(HttpClientRequest.get(`${GRAPH}/me/photos/48x48/$value`).pipe(HttpClientRequest.bearerToken(token)))
    const type = (response.headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase()
    if (response.status !== 200 || !/^image\/[a-z0-9.+-]+$/.test(type) || Number(response.headers['content-length'] ?? 0) > PHOTO_MAX_BYTES) return undefined
    const bytes = new Uint8Array(yield* response.arrayBuffer)
    return bytes.length && bytes.length <= PHOTO_MAX_BYTES ? `data:${type};base64,${toBase64(bytes)}` : undefined
  }).pipe(Effect.timeout('15 seconds'), Effect.orElseSucceed(() => undefined))

/** Redeem the code, verify the ID token, read /me and the photo. Every Microsoft token stays inside this function. */
const signIn = (txn: Transaction, code: string) =>
  Effect.gen(function* () {
    const env = yield* Env
    const client = yield* microsoftClient
    const tenant = txn.tenant_id!
    const http = yield* HttpClient.HttpClient
    const response = yield* http
      .execute(
        HttpClientRequest.post(`${AUTHORITY}/${encodeURIComponent(tenant)}/oauth2/v2.0/token`).pipe(
          HttpClientRequest.bodyUrlParams({
            client_id: client.id,
            client_secret: client.secret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: callbackUrl(env),
            code_verifier: txn.verifier!,
            scope: MICROSOFT_SCOPES,
          }),
        ),
      )
      .pipe(Effect.mapError(() => failed('Could not reach Microsoft. Try again.')))
    const tokens = (yield* response.json.pipe(Effect.orElseSucceed(() => ({})))) as { id_token?: string; access_token?: string }
    if (response.status !== 200 || !tokens.id_token || !tokens.access_token) return yield* failed('Microsoft sign-in failed. Try again.')

    const keys = yield* getJson(`${AUTHORITY}/${encodeURIComponent(tenant)}/discovery/v2.0/keys`).pipe(Effect.mapError(() => failed('Could not reach Microsoft. Try again.')))
    if (keys.status !== 200 || !Array.isArray(keys.body?.keys)) return yield* failed('Could not read Microsoft signing keys. Try again.')
    const verified = yield* Effect.tryPromise({
      try: () => jwtVerify(tokens.id_token!, createLocalJWKSet(keys.body as unknown as JSONWebKeySet), { issuer: `${AUTHORITY}/${tenant}/v2.0`, audience: client.id, algorithms: ['RS256'], clockTolerance: 120 }),
      catch: () => failed('Microsoft sign-in could not be verified. Try again.', 400),
    })
    const claims: JWTPayload & Record<string, unknown> = verified.payload
    if (claims.nonce !== txn.nonce || claims.tid !== tenant || typeof claims.oid !== 'string' || !claims.oid) return yield* failed('Microsoft sign-in could not be verified. Try again.', 400)

    const me = (yield* getJson(`${GRAPH}/me?$select=${PROFILE_SELECT}`, tokens.access_token).pipe(Effect.orElseSucceed(() => ({ status: 0, body: null })))).body ?? {}
    const pictureUrl = yield* photo(tokens.access_token)
    return defined({
      tid: tenant,
      oid: claims.oid,
      name: clip(me.displayName) ?? clip(claims.name),
      preferredUsername: clip(claims.preferred_username) ?? clip(me.userPrincipalName),
      email: clip(me.mail) ?? clip(claims.email),
      companyName: clip(me.companyName),
      department: clip(me.department),
      jobTitle: clip(me.jobTitle),
      officeLocation: clip(me.officeLocation),
      pictureUrl,
    }) satisfies Profile as Profile
  })

const ownerLabel = (profile: Pick<Profile, 'name' | 'email' | 'preferredUsername'>) => profile.name ?? profile.email ?? profile.preferredUsername ?? 'The administrator'

/** Connect finished: bind the tenant (one per deployment), make the admin System Owner, pass the step if it can run. */
const finishConsent = (txn: Transaction, profile: Profile, account: Account) =>
  Effect.gen(function* () {
    const deployment = yield* getDeployment(txn.deployment_id)
    if (!deployment || deployment.account_id !== account.id || !deployment.license_deployment_id) return yield* new UserError({ message: 'Deployment not found', status: 404 })
    const existing = yield* bindingFor(deployment.id)
    yield* run("UPDATE microsoft_transactions SET phase = 'done', used_at = ? WHERE id = ?", nowIso(), txn.id)
    if (existing && existing.tenant_id !== profile.tid)
      return yield* new UserError({ message: 'This deployment is connected to a different Microsoft organization. Contact Beag Labs support to change it.', status: 409 })
    const email = profile.email ?? profile.preferredUsername ?? null
    yield* run(
      `INSERT INTO microsoft_bindings (deployment_id, license_deployment_id, tenant_id, owner_oid, owner_name, owner_email, bound_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(deployment_id) DO UPDATE SET owner_oid = excluded.owner_oid, owner_name = excluded.owner_name, owner_email = excluded.owner_email`,
      deployment.id,
      deployment.license_deployment_id,
      profile.tid,
      profile.oid,
      profile.name ?? null,
      email,
      nowIso(),
    )
    const owner = ownerLabel(profile)
    yield* syncMicrosoftConnection(deployment)
    const org = domainOf(email ?? undefined)
    yield* logEvent({ accountId: account.id, deploymentId: deployment.id, level: 'ok', source: 'microsoft', message: ['Microsoft connected', org, `${owner} is System Owner`].filter(Boolean).join(' · ') })
    return { kind: 'redirect', url: `/deploy/${deployment.id}` } satisfies CallbackResult
  })

/** Sign-in to Papyrus finished: sign the identity for that deployment and hand Papyrus a one-time handle. */
const finishPortal = (txn: Transaction, profile: Profile) =>
  Effect.gen(function* () {
    const deployment = yield* getDeployment(txn.deployment_id)
    const binding = yield* bindingFor(txn.deployment_id)
    if (!deployment?.license_deployment_id || !binding) return yield* new UserError({ message: 'This Papyrus is not connected to Microsoft yet.', status: 409 })
    if (profile.tid !== binding.tenant_id) {
      const org = domainOf(binding.owner_email ?? undefined) ?? deployment.hostname ?? 'your organization'
      return yield* new UserError({ message: `Sign in with your ${org} Microsoft account.`, status: 403 })
    }
    const issued = Date.now()
    const { tid, oid, ...rest } = profile
    const payload: IdentityPayload = {
      type: 'papyrus-identity',
      aud: deployment.license_deployment_id,
      tid,
      oid,
      ...rest,
      nonce: txn.client_nonce!,
      issuedAt: new Date(issued).toISOString(),
      expiresAt: new Date(issued + ASSERTION_MS).toISOString(),
    }
    const signed = yield* license('Signing the sign-in failed', (rpc) => rpc.signIdentity(payload))
    const handle = randomToken(32)
    yield* run(
      "UPDATE microsoft_transactions SET phase = 'handle', handle_sha256 = ?, identity_json = ?, expires_at = ? WHERE id = ?",
      yield* sha256Hex(handle),
      JSON.stringify(signed),
      new Date(Date.now() + HANDLE_MS).toISOString(),
      txn.id,
    )
    return { kind: 'redirect', url: `${txn.return_origin}/api/auth/entra/callback?${new URLSearchParams({ handle, state: txn.client_state! })}` } satisfies CallbackResult
  })

/**
 * Back from the staff-directory approval: always to Papyrus's Staff page, saying how it went. Microsoft's answer only
 * says consent was given; whether it took effect shows in the app token's roles (appToken).
 */
const finishDirectory = (txn: Transaction, query: { error?: string; tenant?: string; admin_consent?: string }) =>
  Effect.gen(function* () {
    const back = (directory: 'allowed' | 'denied' | 'wrong-tenant') => ({ kind: 'redirect', url: `${txn.return_origin}/portal/staff?${new URLSearchParams({ directory })}` }) satisfies CallbackResult
    if (txn.phase !== 'consent' || !(yield* run('UPDATE microsoft_transactions SET phase = ?, used_at = ? WHERE id = ? AND used_at IS NULL', 'done', nowIso(), txn.id))) return yield* expired()
    if (query.error || query.admin_consent?.toLowerCase() !== 'true') return back('denied')
    if (query.tenant?.toLowerCase() !== txn.tenant_id) return back('wrong-tenant')
    const deployment = yield* getDeployment(txn.deployment_id)
    if (deployment) yield* logEvent({ accountId: deployment.account_id, deploymentId: deployment.id, level: 'ok', source: 'microsoft', message: 'Staff directory allowed · Papyrus can list everyone in the organization' })
    return back('allowed')
  })

/** GET /microsoft/callback: Microsoft's answer to adminconsent (consent) or authorize (signin, start). */
export const microsoftCallback = (
  query: { state?: string; code?: string; error?: string; error_description?: string; tenant?: string; admin_consent?: string },
  account: Account | null,
) =>
  Effect.gen(function* () {
    const env = yield* Env
    const client = yield* microsoftClient
    const txn = yield* liveTransaction(query.state)
    if (txn.kind === 'directory') return yield* finishDirectory(txn, query)
    // Connect binds a tenant to a deployment: only the account that started it can finish it.
    if (txn.kind === 'consent' && (!account || account.id !== txn.account_id))
      return yield* new UserError({ message: 'Sign in to papyrus.beaglabs.com with the account that started Connect Microsoft, then try again.', status: 403 })

    if (query.error) {
      yield* run('UPDATE microsoft_transactions SET used_at = ? WHERE id = ?', nowIso(), txn.id)
      const detail = clip(query.error_description?.split(/\r?\n/)[0], 300) ?? query.error
      if (txn.kind === 'consent' && (txn.phase === 'consent' || NEEDS_ADMIN.test(query.error_description ?? '') || query.error === 'consent_required'))
        return { kind: 'admin', deploymentId: txn.deployment_id, consentUrl: adminConsentUrl(client.id, consentedUrl(env)), detail } satisfies CallbackResult
      return yield* new UserError({ message: `Microsoft sign-in didn't finish: ${detail}`, status: 400 })
    }

    if (txn.kind === 'consent' && txn.phase === 'consent') {
      if (!TENANT_ID.test(query.tenant ?? '') || query.admin_consent?.toLowerCase() !== 'true') return yield* new UserError({ message: "Microsoft didn't confirm the approval. Try again.", status: 400 })
      const moved = yield* run("UPDATE microsoft_transactions SET phase = 'signin', tenant_id = ? WHERE id = ? AND phase = 'consent' AND used_at IS NULL", query.tenant!.toLowerCase(), txn.id)
      if (!moved) return yield* expired()
      return { kind: 'redirect', url: yield* authorizeUrl({ id: txn.id, tenant_id: query.tenant!.toLowerCase() }) } satisfies CallbackResult
    }

    const ready = (txn.kind === 'consent' && txn.phase === 'signin') || (txn.kind === 'portal' && txn.phase === 'start')
    if (!ready || !query.code || !txn.tenant_id || !txn.verifier) return yield* expired()
    // One code redemption per transaction.
    if (!(yield* run("UPDATE microsoft_transactions SET phase = 'redeeming' WHERE id = ? AND phase = ? AND used_at IS NULL", txn.id, txn.phase))) return yield* expired()
    const profile = yield* signIn(txn, query.code).pipe(Effect.tapError(() => run('UPDATE microsoft_transactions SET used_at = ? WHERE id = ?', nowIso(), txn.id).pipe(Effect.ignore)))
    return txn.kind === 'consent' ? yield* finishConsent(txn, profile, account!) : yield* finishPortal(txn, profile)
  })

// Papyrus's side (deployment key) ---------------------------------------------------------------------------------------

const notBound = () => new UserError({ message: 'Connect Microsoft at papyrus.beaglabs.com first', status: 409, code: 'not_bound' })

const controlPlaneDeployment = (licenseId: string) =>
  Effect.gen(function* () {
    const row = yield* first<{ id: string; hostname: string | null; billing_state: string }>('SELECT id, hostname, billing_state FROM deployments WHERE license_deployment_id = ?', licenseId)
    if (!row) return yield* new UserError({ message: 'Not a control-plane deployment', status: 404, code: 'not_found' })
    return row
  })

const field = (body: unknown, name: string) => {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>)[name] : undefined
  return typeof value === 'string' && value.length > 0 && value.length <= 256 ? value : null
}

/** POST /api/microsoft/transactions `{ state, nonce }` → `{ url }` for the browser: Papyrus's sign-in through the broker. */
export const createPortalTransaction = (authorization: string | null | undefined, deploymentId: string | null | undefined, body: unknown) =>
  Effect.gen(function* () {
    const env = yield* Env
    const licenseId = yield* authenticateDeployment(authorization, deploymentId)
    const state = field(body, 'state')
    const nonce = field(body, 'nonce')
    if (!state || !nonce) return yield* new UserError({ message: 'state and nonce are required (at most 256 characters each)', status: 400, code: 'validation_error' })
    const deployment = yield* controlPlaneDeployment(licenseId)
    const binding = yield* bindingFor(deployment.id)
    if (!binding || !deployment.hostname) return yield* notBound()
    const id = yield* createTransaction({
      kind: 'portal',
      deployment_id: deployment.id,
      phase: 'start',
      tenant_id: binding.tenant_id,
      client_state: state,
      client_nonce: nonce,
      return_origin: `https://${deployment.hostname}`,
    })
    return { url: `${env.BASE_URL}/microsoft/start?txn=${encodeURIComponent(id)}` }
  })

/** GET /microsoft/start?txn=: off to the bound tenant's sign-in. */
export const startPortal = (txnId: string | undefined) =>
  Effect.gen(function* () {
    const txn = yield* liveTransaction(txnId)
    if (txn.kind !== 'portal' || txn.phase !== 'start' || !txn.tenant_id) return yield* expired()
    return yield* authorizeUrl(txn)
  })

/** POST /api/microsoft/redeem `{ handle }` → `{ assertion }`. Once, within 60 seconds, only by the deployment it was made for. */
export const redeemHandle = (authorization: string | null | undefined, deploymentId: string | null | undefined, body: unknown) =>
  Effect.gen(function* () {
    const licenseId = yield* authenticateDeployment(authorization, deploymentId)
    const invalid = () => new UserError({ message: 'This sign-in handle is invalid, expired or already used', status: 404, code: 'handle_invalid' })
    const handle = field(body, 'handle')
    if (!handle) return yield* invalid()
    const deployment = yield* controlPlaneDeployment(licenseId)
    const now = nowIso()
    const redeemed = yield* first<{ id: string; identity_json: string | null }>(
      `UPDATE microsoft_transactions SET used_at = ?
       WHERE handle_sha256 = ? AND deployment_id = ? AND kind = 'portal' AND phase = 'handle' AND used_at IS NULL AND expires_at > ?
       RETURNING id, identity_json`,
      now,
      yield* sha256Hex(handle),
      deployment.id,
      now,
    )
    if (!redeemed?.identity_json) return yield* invalid()
    yield* run('UPDATE microsoft_transactions SET identity_json = NULL WHERE id = ?', redeemed.id)
    return { assertion: JSON.parse(redeemed.identity_json) as SignedIdentity }
  })

/** POST /api/microsoft/directory-consent → `{ url }`: where an Entra administrator approves the staff directory. */
export const createDirectoryTransaction = (authorization: string | null | undefined, deploymentId: string | null | undefined) =>
  Effect.gen(function* () {
    const env = yield* Env
    const licenseId = yield* authenticateDeployment(authorization, deploymentId)
    const deployment = yield* controlPlaneDeployment(licenseId)
    const binding = yield* bindingFor(deployment.id)
    if (!binding || !deployment.hostname) return yield* notBound()
    const client = yield* microsoftClient
    const id = yield* createTransaction({ kind: 'directory', deployment_id: deployment.id, phase: 'consent', tenant_id: binding.tenant_id, return_origin: `https://${deployment.hostname}` })
    return { url: directoryConsentUrl(client.id, binding.tenant_id, callbackUrl(env), id) }
  })

const directoryNotAllowed = () =>
  new UserError({ message: 'An Entra administrator has not allowed the staff directory yet', status: 409, code: 'directory_not_allowed' })

/** The claims of a token Microsoft just issued to us over TLS (read, not verified: it is not ours to accept). */
const claimsOf = (token: string): Record<string, unknown> => {
  try {
    const part = token.split('.')[1] ?? ''
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='))) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * POST /api/microsoft/app-token → `{ accessToken, expiresAt }`: an app-only Graph token for the bound tenant, for the
 * Staff page and people search. Only for a paid-up deployment, and only once the token carries User.Read.All.
 */
export const appToken = (authorization: string | null | undefined, deploymentId: string | null | undefined) =>
  Effect.gen(function* () {
    const licenseId = yield* authenticateDeployment(authorization, deploymentId)
    const deployment = yield* controlPlaneDeployment(licenseId)
    if (deployment.billing_state !== 'active') return yield* new UserError({ message: 'This deployment is suspended', status: 403, code: 'suspended' })
    const binding = yield* bindingFor(deployment.id)
    if (!binding) return yield* notBound()
    const client = yield* microsoftClient
    const http = yield* HttpClient.HttpClient
    const response = yield* http
      .execute(
        HttpClientRequest.post(`${AUTHORITY}/${encodeURIComponent(binding.tenant_id)}/oauth2/v2.0/token`).pipe(
          HttpClientRequest.bodyUrlParams({ client_id: client.id, client_secret: client.secret, grant_type: 'client_credentials', scope: DIRECTORY_SCOPE }),
        ),
      )
      .pipe(Effect.timeout('15 seconds'), Effect.mapError(() => failed('Could not reach Microsoft. Try again.')))
    const body = (yield* response.json.pipe(Effect.orElseSucceed(() => ({})))) as { access_token?: string; expires_in?: number; error_description?: string }
    // No service principal in the tenant, or consent withdrawn: the directory is not allowed (any more).
    if (response.status === 400 || response.status === 401) return yield* directoryNotAllowed()
    if (response.status !== 200 || !body.access_token) return yield* failed('Microsoft did not issue a directory token. Try again.')
    const claims = claimsOf(body.access_token)
    if (claims.tid !== binding.tenant_id) return yield* failed('Microsoft issued a token for another organization.')
    if (!Array.isArray(claims.roles) || !claims.roles.includes(DIRECTORY_ROLE)) return yield* directoryNotAllowed()
    const lifetime = Math.min(Math.max(Number(body.expires_in) || 3600, 60), 3600)
    return { accessToken: body.access_token, expiresAt: new Date(Date.now() + lifetime * 1000).toISOString() }
  })

/** GET /api/microsoft/binding: what Papyrus needs to finish setup on its own once Connect Microsoft is done. */
export const bindingInfo = (authorization: string | null | undefined, deploymentId: string | null | undefined) =>
  Effect.gen(function* () {
    const env = yield* Env
    const licenseId = yield* authenticateDeployment(authorization, deploymentId)
    const binding = yield* first<MicrosoftBinding>('SELECT * FROM microsoft_bindings WHERE license_deployment_id = ?', licenseId)
    if (!binding) return yield* new UserError({ message: 'Connect Microsoft at papyrus.beaglabs.com first', status: 404, code: 'not_bound' })
    return {
      tenantId: binding.tenant_id,
      clientId: env.MICROSOFT_CLIENT_ID,
      owner: { oid: binding.owner_oid, name: binding.owner_name, email: binding.owner_email },
      terms: yield* termsFor(binding.deployment_id),
      boundAt: binding.bound_at,
    }
  })
