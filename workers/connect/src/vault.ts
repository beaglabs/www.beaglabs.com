import type { Bindings } from './env'

/**
 * Reads the Stripe secrets from Beag Labs' Azure Key Vault with the Worker's Entra app (client credentials), the same
 * way the license Worker reaches its signing key. Values stay in this isolate's memory for ten minutes; they are never
 * logged, stored or returned.
 */
const TOKEN_SKEW_MS = 60_000
const SECRET_TTL_MS = 10 * 60_000
let token: { value: string; expiresAt: number } | undefined
const secrets = new Map<string, { value: string; expiresAt: number }>()

async function accessToken(env: Bindings): Promise<string> {
  if (token && token.expiresAt - TOKEN_SKEW_MS > Date.now()) return token.value
  const tenantId = env.AZURE_KEY_VAULT_TENANT_ID?.trim(), clientId = env.AZURE_KEY_VAULT_CLIENT_ID?.trim(), clientSecret = env.AZURE_KEY_VAULT_CLIENT_SECRET?.trim()
  if (!tenantId || !clientId || !clientSecret) throw new Error('Azure Key Vault credentials are incomplete (AZURE_KEY_VAULT_TENANT_ID, _CLIENT_ID, _CLIENT_SECRET)')
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials', scope: 'https://vault.azure.net/.default' }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number | string; error_description?: string; error?: string }
  if (!response.ok || !body.access_token) throw new Error(`Azure Key Vault token request failed (${response.status}): ${body.error_description ?? body.error ?? 'unknown error'}`)
  const expiresIn = Number(body.expires_in ?? 3600)
  token = { value: body.access_token, expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000 }
  return token.value
}

export async function vaultSecret(env: Bindings, name: string): Promise<string> {
  const cached = secrets.get(name)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  const base = env.AZURE_KEY_VAULT_URL?.trim().replace(/\/$/, '')
  if (!base || !/^https:\/\/[a-z0-9-]+\.vault\.azure\.net$/i.test(base)) throw new Error('AZURE_KEY_VAULT_URL must be https://<vault>.vault.azure.net')
  if (!/^[0-9a-zA-Z-]{1,127}$/.test(name)) throw new Error('Key Vault secret names are letters, digits and dashes')
  const response = await fetch(`${base}/secrets/${name}?api-version=7.4`, { headers: { authorization: `Bearer ${await accessToken(env)}`, accept: 'application/json' }, signal: AbortSignal.timeout(10_000) })
  const body = await response.json().catch(() => ({})) as { value?: string; error?: { message?: string } }
  if (!response.ok || typeof body.value !== 'string') throw new Error(`Key Vault secret ${name} could not be read (${response.status}): ${body.error?.message ?? 'unknown error'}`)
  secrets.set(name, { value: body.value, expiresAt: Date.now() + SECRET_TTL_MS })
  return body.value
}
