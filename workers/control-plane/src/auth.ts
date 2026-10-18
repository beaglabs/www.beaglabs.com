import * as Effect from 'effect/Effect'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import { fromBase64, hmac, randomToken, sha256Hex, timingSafeEqual, toBase64Url } from './crypto'
import type { Bindings } from './env'
import { logEvent } from './events'
import { Env, UserError, first, newId, nowIso, run, type Account } from './services'

/**
 * Sign-in to papyrus.beaglabs.com itself (not to Papyrus): email magic link, Sign in with Microsoft, Sign in with Google.
 * Sessions are random cookies; D1 stores only their SHA-256.
 */

export const SESSION_COOKIE = 'cp_session'
export const STATE_COOKIE = 'cp_oauth'
const SESSION_DAYS = 30
const MAGIC_LINK_MINUTES = 20

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const isEmail = (email: string) => EMAIL.test(email) && email.length <= 254

/** Find or create the account for a verified email. */
export const accountForEmail = (email: string, profile: { name?: string | null; organization?: string | null } = {}) =>
  Effect.gen(function* () {
    const normalized = normalizeEmail(email)
    const created = yield* run(
      'INSERT OR IGNORE INTO accounts (id, email, name, organization, created_at) VALUES (?, ?, ?, ?, ?)',
      newId('acct'),
      normalized,
      profile.name ?? null,
      profile.organization ?? null,
      nowIso(),
    )
    if (profile.name || profile.organization) {
      yield* run('UPDATE accounts SET name = COALESCE(name, ?), organization = COALESCE(organization, ?) WHERE email = ?', profile.name ?? null, profile.organization ?? null, normalized)
    }
    const account = yield* first<Account>('SELECT * FROM accounts WHERE email = ?', normalized)
    if (!account) return yield* new UserError({ message: 'Could not create the account', status: 500 })
    if (created > 0) yield* logEvent({ accountId: account.id, level: 'ok', source: 'account', message: `Account created for ${normalized}` })
    return account
  })

export const createSession = (accountId: string) =>
  Effect.gen(function* () {
    const token = randomToken()
    const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
    yield* run('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)', yield* sha256Hex(token), accountId, expires.toISOString())
    return { token, cookie: `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}` }
  })

export const sessionAccount = (token: string | undefined) =>
  Effect.gen(function* () {
    if (!token) return null
    return yield* first<Account>(
      'SELECT a.* FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.id_hash = ? AND s.expires_at > ?',
      yield* sha256Hex(token),
      nowIso(),
    )
  })

export const endSession = (token: string | undefined) =>
  Effect.gen(function* () {
    if (token) yield* run('DELETE FROM sessions WHERE id_hash = ?', yield* sha256Hex(token))
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  })

/** Email a one-time sign-in link (Resend). */
export const sendMagicLink = (email: string, profile: { name?: string | null; organization?: string | null } = {}) =>
  Effect.gen(function* () {
    const env = yield* Env
    const normalized = normalizeEmail(email)
    if (!isEmail(normalized)) return yield* new UserError({ message: 'Enter a valid email address', status: 400 })
    const token = randomToken()
    yield* run(
      'INSERT INTO login_tokens (token_hash, email, name, organization, expires_at) VALUES (?, ?, ?, ?, ?)',
      yield* sha256Hex(token),
      normalized,
      profile.name?.trim().slice(0, 200) || null,
      profile.organization?.trim().slice(0, 200) || null,
      new Date(Date.now() + MAGIC_LINK_MINUTES * 60_000).toISOString(),
    )
    const link = `${env.BASE_URL}/login/email?token=${encodeURIComponent(token)}`
    const client = yield* HttpClient.HttpClient
    const response = yield* client
      .execute(
        HttpClientRequest.post('https://api.resend.com/emails').pipe(
          HttpClientRequest.bearerToken(env.RESEND_API_KEY),
          HttpClientRequest.bodyText(
            JSON.stringify({
              from: env.MAGIC_LINK_FROM_EMAIL,
              to: [normalized],
              subject: 'Sign in to Papyrus',
              text: `Sign in to papyrus.beaglabs.com:\n\n${link}\n\nThe link works once and expires in ${MAGIC_LINK_MINUTES} minutes. If you didn't ask for it, ignore this email.`,
            }),
            'application/json',
          ),
        ),
      )
      .pipe(Effect.mapError(() => new UserError({ message: 'Could not send the email. Try again.', status: 502 })))
    if (response.status >= 300) return yield* new UserError({ message: 'Could not send the email. Try again.', status: 502 })
  })

/** Redeem a magic link: one use, unexpired. */
export const redeemMagicLink = (token: string) =>
  Effect.gen(function* () {
    const hash = yield* sha256Hex(token)
    const used = yield* run('UPDATE login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?', nowIso(), hash, nowIso())
    if (used === 0) return yield* new UserError({ message: 'This sign-in link has expired or was already used. Request a new one.', status: 400 })
    const row = yield* first<{ email: string; name: string | null; organization: string | null }>('SELECT email, name, organization FROM login_tokens WHERE token_hash = ?', hash)
    return yield* accountForEmail(row!.email, { name: row!.name, organization: row!.organization })
  })

// OpenID Connect (authorization code + PKCE). The ID token comes straight from the provider's token endpoint over TLS
// with our client secret, so its claims are trusted without a separate signature check (OIDC Core 3.1.3.7).

export type OidcProvider = 'microsoft' | 'google'

const OIDC = {
  microsoft: {
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid email profile',
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
  },
} as const

const clientFor = (env: Bindings, provider: OidcProvider) =>
  provider === 'microsoft' ? { id: env.MICROSOFT_CLIENT_ID, secret: env.MICROSOFT_CLIENT_SECRET } : { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET }

const challengeFor = (verifier: string) =>
  Effect.promise(async () => toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))))

/** Start sign-in: the redirect URL plus a signed, short-lived cookie holding state, nonce and the PKCE verifier. */
export const startOidc = (provider: OidcProvider, returnTo = '/deploy') =>
  Effect.gen(function* () {
    const env = yield* Env
    const client = clientFor(env, provider)
    const state = randomToken(16)
    const nonce = randomToken(16)
    const verifier = randomToken(32)
    const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ provider, state, nonce, verifier, returnTo, exp: Date.now() + 10 * 60_000 })))
    const cookie = `${STATE_COOKIE}=${payload}.${yield* hmac(env.SESSION_SECRET, payload)}; Path=/login; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    const url = new URL(OIDC[provider].authorize)
    url.search = new URLSearchParams({
      client_id: client.id,
      response_type: 'code',
      redirect_uri: `${env.BASE_URL}/login/${provider}/callback`,
      scope: OIDC[provider].scope,
      state,
      nonce,
      code_challenge: yield* challengeFor(verifier),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString()
    return { url: url.toString(), cookie }
  })

const decodeJwtPayload = (jwt: string) => {
  const part = jwt.split('.')[1] ?? ''
  const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (part.length % 4)) % 4)
  return JSON.parse(new TextDecoder().decode(fromBase64(padded))) as Record<string, unknown>
}

/** Finish sign-in: verify state, exchange the code, read the verified email, return the account. */
export const finishOidc = (provider: OidcProvider, query: { code?: string; state?: string; error?: string }, stateCookie: string | undefined) =>
  Effect.gen(function* () {
    const env = yield* Env
    const denied = (message: string) => new UserError({ message, status: 400 })
    if (query.error) return yield* denied('Sign-in was cancelled.')
    const [payload, signature] = (stateCookie ?? '').split('.')
    if (!payload || !signature || !timingSafeEqual(signature, yield* hmac(env.SESSION_SECRET, payload))) return yield* denied('Sign-in expired. Try again.')
    const saved = JSON.parse(new TextDecoder().decode(fromBase64(payload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (payload.length % 4)) % 4)))) as {
      provider: OidcProvider
      state: string
      nonce: string
      verifier: string
      returnTo: string
      exp: number
    }
    if (saved.provider !== provider || saved.exp < Date.now() || !query.state || !timingSafeEqual(saved.state, query.state) || !query.code) return yield* denied('Sign-in expired. Try again.')

    const client = clientFor(env, provider)
    const http = yield* HttpClient.HttpClient
    const response = yield* http
      .execute(
        HttpClientRequest.post(OIDC[provider].token).pipe(
          HttpClientRequest.bodyUrlParams({
            grant_type: 'authorization_code',
            code: query.code,
            redirect_uri: `${env.BASE_URL}/login/${provider}/callback`,
            client_id: client.id,
            client_secret: client.secret,
            code_verifier: saved.verifier,
          }),
        ),
      )
      .pipe(Effect.mapError(() => denied('Could not reach the sign-in provider.')))
    const tokens = (yield* response.json.pipe(Effect.mapError(() => denied('Sign-in failed.')))) as { id_token?: string }
    if (!tokens.id_token) return yield* denied('Sign-in failed.')
    const claims = decodeJwtPayload(tokens.id_token)
    if (claims.aud !== client.id || claims.nonce !== saved.nonce) return yield* denied('Sign-in failed.')
    // Google: require a verified email. Microsoft: `email` is only present when the tenant has it; fall back to the UPN.
    const email = String((provider === 'google' ? (claims.email_verified === true ? claims.email : '') : claims.email ?? claims.preferred_username) ?? '')
    if (!isEmail(normalizeEmail(email))) return yield* denied('Your account has no verified email address.')
    const account = yield* accountForEmail(email, { name: typeof claims.name === 'string' ? claims.name : null })
    return { account, returnTo: saved.returnTo.startsWith('/') && !saved.returnTo.startsWith('//') ? saved.returnTo : '/deploy' }
  })
