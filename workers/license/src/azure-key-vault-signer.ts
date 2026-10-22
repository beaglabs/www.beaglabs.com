import { createHash } from 'node:crypto'
import type { Bindings } from './env.ts'
import { canonical, type LicensePayload, type SignedLicense } from './license.ts'

const KEY_VAULT_API_VERSION = '2025-07-01'
const TOKEN_SKEW_MS = 60_000

/** The cloud is read from the key URI's vault host: Azure public, or Azure Government (which also serves DoD). */
const CLOUDS = [
  { vaultSuffix: '.vault.azure.net', authority: 'https://login.microsoftonline.com', scope: 'https://vault.azure.net/.default' },
  { vaultSuffix: '.vault.usgovcloudapi.net', authority: 'https://login.microsoftonline.us', scope: 'https://vault.usgovcloudapi.net/.default' },
] as const
type Cloud = (typeof CLOUDS)[number]

type CachedToken = { token: string; expiresAt: number }
const cachedTokens = new Map<Cloud, CachedToken>()

type TokenResponse = {
  access_token?: string
  expires_in?: number | string
  token_type?: string
  error?: string
  error_description?: string
}

type KeyResponse = {
  key?: { kid?: string; kty?: string; n?: string; e?: string }
  error?: { code?: string; message?: string }
}

type SignResponse = {
  kid?: string
  value?: string
  error?: { code?: string; message?: string }
}

function keyId(env: Bindings): URL {
  const raw = env.AZURE_KEY_VAULT_KEY_ID?.trim()
  if (!raw) throw new Error('AZURE_KEY_VAULT_KEY_ID is required')
  const parsed = new URL(raw)
  if (parsed.protocol !== 'https:') throw new Error('AZURE_KEY_VAULT_KEY_ID must use HTTPS')
  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length !== 3 || segments[0] !== 'keys' || !segments[1] || !segments[2]) {
    throw new Error('AZURE_KEY_VAULT_KEY_ID must be a versioned key URI: https://<vault>.vault.azure.net/keys/<name>/<version>')
  }
  cloudFor(parsed)
  parsed.search = ''
  parsed.hash = ''
  return parsed
}

function cloudFor(key: URL): Cloud {
  const cloud = CLOUDS.find((c) => key.hostname.endsWith(c.vaultSuffix))
  if (!cloud) throw new Error('AZURE_KEY_VAULT_KEY_ID must reference an Azure Key Vault in Azure public (*.vault.azure.net) or Azure Government (*.vault.usgovcloudapi.net)')
  return cloud
}

async function accessToken(env: Bindings, key: URL): Promise<string> {
  const cloud = cloudFor(key)
  const cached = cachedTokens.get(cloud)
  if (cached && cached.expiresAt - TOKEN_SKEW_MS > Date.now()) return cached.token

  const tenantId = env.AZURE_KEY_VAULT_TENANT_ID?.trim()
  const clientId = env.AZURE_KEY_VAULT_CLIENT_ID?.trim()
  const clientSecret = env.AZURE_KEY_VAULT_CLIENT_SECRET?.trim()
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure Key Vault signer credentials are incomplete')
  }

  const response = await fetch(`${cloud.authority}/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: cloud.scope,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  const body = await response.json().catch(() => ({})) as TokenResponse
  if (!response.ok || !body.access_token) {
    throw new Error(`Azure Key Vault token request failed (${response.status}): ${body.error_description ?? body.error ?? 'unknown error'}`)
  }

  const expiresIn = Number(body.expires_in ?? 3600)
  cachedTokens.set(cloud, {
    token: body.access_token,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
  })
  return body.access_token
}

function toBase64(value: string): string {
  return Buffer.from(value, 'base64url').toString('base64')
}

/**
 * Sign the canonical JSON of `payload` with a version-pinned Azure Key Vault
 * RSA key. The private key never enters the Worker. Key Vault signs the
 * SHA-256 digest with RS256 and returns the signature bytes.
 *
 * The full versioned Azure key URI is returned as `keyId`, which makes key
 * rotation explicit: old documents continue to point at the public key version
 * that actually signed them.
 */
export async function signCanonicalWithAzureKeyVault(env: Bindings, payload: unknown): Promise<{ keyId: string; signature: string }> {
  const key = keyId(env)
  const digest = createHash('sha256').update(canonical(payload)).digest('base64url')
  const token = await accessToken(env, key)
  const endpoint = new URL(`${key.toString()}/sign`)
  endpoint.searchParams.set('api-version', KEY_VAULT_API_VERSION)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ alg: 'RS256', value: digest }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json().catch(() => ({})) as SignResponse
  if (!response.ok || !body.value) {
    throw new Error(`Azure Key Vault sign failed (${response.status}): ${body.error?.message ?? body.error?.code ?? 'unknown error'}`)
  }

  const returnedKeyId = body.kid ? new URL(body.kid).toString() : key.toString()
  if (returnedKeyId !== key.toString()) {
    throw new Error(`Azure Key Vault returned unexpected key id ${returnedKeyId}`)
  }
  return { keyId: key.toString(), signature: toBase64(body.value) }
}

/** Sign one Papyrus license payload; the signature fields sit beside the payload fields. */
export async function signLicenseWithAzureKeyVault(env: Bindings, payload: LicensePayload): Promise<SignedLicense> {
  return { ...payload, ...await signCanonicalWithAzureKeyVault(env, payload) }
}

const PUBLIC_KEY_API_VERSION = '7.4'
const publicKeyCache = new Map<string, string>()

/** Convert an RSA public JWK (Key Vault returns kty `RSA` or `RSA-HSM`) to an SPKI PEM. */
export async function rsaJwkToPem(jwk: { n: string; e: string }): Promise<string> {
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: jwk.n, e: jwk.e, ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true,
    ['verify'],
  )
  const der = Buffer.from(await crypto.subtle.exportKey('spki', key) as ArrayBuffer).toString('base64')
  return `-----BEGIN PUBLIC KEY-----\n${der.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----\n`
}

/**
 * The public key Papyrus trusts for the current signing key, as `{ [keyId]: pem }` (the `PAPYRUS_LICENSE_AUTHORITIES`
 * shape). keyId is the versioned key URI that `signCanonicalWithAzureKeyVault` puts on every document. Cached per isolate.
 */
export async function licenseAuthorities(env: Bindings): Promise<Record<string, string>> {
  const key = keyId(env).toString()
  const cached = publicKeyCache.get(key)
  if (cached) return { [key]: cached }

  const endpoint = new URL(key)
  endpoint.searchParams.set('api-version', PUBLIC_KEY_API_VERSION)
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${await accessToken(env, endpoint)}`, accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json().catch(() => ({})) as KeyResponse
  if (!response.ok || !body.key?.n || !body.key.e) {
    throw new Error(`Azure Key Vault key read failed (${response.status}): ${body.error?.message ?? body.error?.code ?? 'no RSA public key'}`)
  }
  if (body.key.kty && !body.key.kty.startsWith('RSA')) throw new Error(`Azure Key Vault key is ${body.key.kty}, not RSA`)
  if (body.key.kid && new URL(body.key.kid).toString() !== key) {
    throw new Error(`Azure Key Vault returned unexpected key id ${body.key.kid}`)
  }
  const pem = await rsaJwkToPem({ n: body.key.n, e: body.key.e })
  publicKeyCache.set(key, pem)
  return { [key]: pem }
}
