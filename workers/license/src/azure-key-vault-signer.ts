import { createHash } from 'node:crypto'
import type { Bindings } from './env'
import { canonical, type LicensePayload, type SignedLicense } from './license'

const KEY_VAULT_API_VERSION = '2025-07-01'
const TOKEN_SCOPE = 'https://vault.azure.net/.default'
const TOKEN_SKEW_MS = 60_000

type CachedToken = { token: string; expiresAt: number }
let cachedToken: CachedToken | undefined

type TokenResponse = {
  access_token?: string
  expires_in?: number | string
  token_type?: string
  error?: string
  error_description?: string
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
  if (!parsed.hostname.endsWith('.vault.azure.net')) {
    throw new Error('AZURE_KEY_VAULT_KEY_ID must reference an Azure Key Vault public-cloud vault')
  }
  parsed.search = ''
  parsed.hash = ''
  return parsed
}

async function accessToken(env: Bindings): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_SKEW_MS > Date.now()) return cachedToken.token

  const tenantId = env.AZURE_KEY_VAULT_TENANT_ID?.trim()
  const clientId = env.AZURE_KEY_VAULT_CLIENT_ID?.trim()
  const clientSecret = env.AZURE_KEY_VAULT_CLIENT_SECRET?.trim()
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure Key Vault signer credentials are incomplete')
  }

  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: TOKEN_SCOPE,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  const body = await response.json().catch(() => ({})) as TokenResponse
  if (!response.ok || !body.access_token) {
    throw new Error(`Azure Key Vault token request failed (${response.status}): ${body.error_description ?? body.error ?? 'unknown error'}`)
  }

  const expiresIn = Number(body.expires_in ?? 3600)
  cachedToken = {
    token: body.access_token,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
  }
  return body.access_token
}

function toBase64(value: string): string {
  return Buffer.from(value, 'base64url').toString('base64')
}

/**
 * Sign one canonical Papyrus license payload with a version-pinned Azure Key
 * Vault RSA key. The private key never enters the Worker. Key Vault signs the
 * SHA-256 digest with RS256 and returns the signature bytes.
 *
 * The full versioned Azure key URI is embedded as `keyId`, which makes key
 * rotation explicit: old licenses continue to point at the public key version
 * that actually signed them.
 */
export async function signLicenseWithAzureKeyVault(env: Bindings, payload: LicensePayload): Promise<SignedLicense> {
  const key = keyId(env)
  const digest = createHash('sha256').update(canonical(payload)).digest('base64url')
  const token = await accessToken(env)
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

  return {
    ...payload,
    keyId: key.toString(),
    signature: toBase64(body.value),
  }
}
