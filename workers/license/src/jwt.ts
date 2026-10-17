import { ApiError, base64UrlDecode, bs, base64UrlEncode, constantTimeEqual, hmacSha256, isObject, pemToDer, utf8 } from './util'

export type JwtHeader = { alg?: string; kid?: string; typ?: string }
export type JwtClaims = Record<string, unknown>

export type DecodedJwt = {
  header: JwtHeader
  claims: JwtClaims
  signingInput: Uint8Array
  signature: Uint8Array
}

const decoder = new TextDecoder()

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split('.')
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]*$/.test(part))) {
    throw new ApiError(401, 'invalid_token', 'Token is malformed.')
  }
  try {
    const header = JSON.parse(decoder.decode(base64UrlDecode(parts[0]))) as unknown
    const claims = JSON.parse(decoder.decode(base64UrlDecode(parts[1]))) as unknown
    if (!isObject(header) || !isObject(claims)) throw new Error('not an object')
    return {
      header: header as JwtHeader,
      claims,
      signingInput: utf8(`${parts[0]}.${parts[1]}`),
      signature: base64UrlDecode(parts[2]),
    }
  } catch {
    throw new ApiError(401, 'invalid_token', 'Token is malformed.')
  }
}

/** Validates exp / nbf with a small clock-skew allowance. `nowSeconds` is injectable for tests. */
export function checkTimes(claims: JwtClaims, nowSeconds = Math.floor(Date.now() / 1000), skew = 60): void {
  if (typeof claims.exp !== 'number' || claims.exp + skew <= nowSeconds) throw new ApiError(401, 'token_expired', 'Token has expired.')
  if (typeof claims.nbf === 'number' && claims.nbf - skew > nowSeconds) throw new ApiError(401, 'invalid_token', 'Token is not valid yet.')
}

// ---------------------------------------------------------------------------
// RS256 via JWKS (Microsoft Entra)

type Jwk = JsonWebKey & { kid?: string; use?: string }
type JwksEntry = { keys: Jwk[]; fetchedAt: number }

const JWKS_TTL_MS = 60 * 60 * 1000
const JWKS_MIN_REFRESH_MS = 60 * 1000
const jwksCache = new Map<string, JwksEntry>()

export function resetJwksCache(): void {
  jwksCache.clear()
}

async function fetchJwks(url: string): Promise<JwksEntry> {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new ApiError(502, 'identity_keys_failed', 'Unable to fetch Microsoft identity signing keys.')
  const body = (await response.json()) as { keys?: Jwk[] }
  const entry = { keys: Array.isArray(body.keys) ? body.keys : [], fetchedAt: Date.now() }
  if (jwksCache.size > 500) jwksCache.clear()
  jwksCache.set(url, entry)
  return entry
}

async function findJwk(url: string, kid: string): Promise<Jwk | null> {
  let entry = jwksCache.get(url)
  if (!entry || Date.now() - entry.fetchedAt > JWKS_TTL_MS) entry = await fetchJwks(url)
  let key = entry.keys.find((candidate) => candidate.kid === kid)
  // Key rollover: refetch once on an unknown kid, but not more than once a minute.
  if (!key && Date.now() - entry.fetchedAt > JWKS_MIN_REFRESH_MS) {
    entry = await fetchJwks(url)
    key = entry.keys.find((candidate) => candidate.kid === kid)
  }
  return key ?? null
}

export async function verifyRs256(decoded: DecodedJwt, jwksUrl: string): Promise<void> {
  if (decoded.header.alg !== 'RS256' || !decoded.header.kid) throw new ApiError(401, 'invalid_token', 'Token must be RS256 with a key id.')
  const jwk = await findJwk(jwksUrl, decoded.header.kid)
  if (!jwk || jwk.kty !== 'RSA' || !jwk.n || !jwk.e) throw new ApiError(401, 'invalid_token', 'Token signing key was not found.')
  const key = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bs(decoded.signature), bs(decoded.signingInput))
  if (!ok) throw new ApiError(401, 'invalid_token', 'Token signature is invalid.')
}

// ---------------------------------------------------------------------------
// HS256 (customer chat session tokens)

export async function signHs256(claims: JwtClaims, secret: string): Promise<string> {
  const header = base64UrlEncode(utf8(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = base64UrlEncode(utf8(JSON.stringify(claims)))
  const signature = base64UrlEncode(await hmacSha256(secret, `${header}.${payload}`))
  return `${header}.${payload}.${signature}`
}

export async function verifyHs256(token: string, secret: string, nowSeconds?: number): Promise<JwtClaims> {
  const decoded = decodeJwt(token)
  if (decoded.header.alg !== 'HS256') throw new ApiError(401, 'invalid_token', 'Session token algorithm is invalid.')
  const expected = base64UrlEncode(await hmacSha256(secret, decoded.signingInput))
  const provided = token.split('.')[2]
  if (!constantTimeEqual(expected, provided)) throw new ApiError(401, 'invalid_token', 'Session token signature is invalid.')
  checkTimes(decoded.claims, nowSeconds, 0)
  return decoded.claims
}

// ---------------------------------------------------------------------------
// Outbound signing (FCM service account RS256, APNs ES256)

export async function signRs256Pem(claims: JwtClaims, pkcs8Pem: string, header: JwtHeader = {}): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', bs(pemToDer(pkcs8Pem)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const encodedHeader = base64UrlEncode(utf8(JSON.stringify({ alg: 'RS256', typ: 'JWT', ...header })))
  const payload = base64UrlEncode(utf8(JSON.stringify(claims)))
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(`${encodedHeader}.${payload}`))
  return `${encodedHeader}.${payload}.${base64UrlEncode(signature)}`
}

/** ES256 JWS; WebCrypto ECDSA already returns the raw r||s form JWS requires. */
export async function signEs256Pem(claims: JwtClaims, pkcs8Pem: string, header: JwtHeader = {}): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', bs(pemToDer(pkcs8Pem)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const encodedHeader = base64UrlEncode(utf8(JSON.stringify({ alg: 'ES256', ...header })))
  const payload = base64UrlEncode(utf8(JSON.stringify(claims)))
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(`${encodedHeader}.${payload}`))
  return `${encodedHeader}.${payload}.${base64UrlEncode(signature)}`
}
