import { constants, generateKeyPairSync, privateEncrypt, verify } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { licenseAuthorities, signCanonicalWithAzureKeyVault } from '../src/azure-key-vault-signer'
import type { Bindings } from '../src/env'
import { canonical } from '../src/license'

const GOV_KEY_ID = 'https://beag-gov.vault.usgovcloudapi.net/keys/papyrus-license/fedcba9876543210'
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const SHA256_DIGEST_INFO = Buffer.from('3031300d060960864801650304020105000420', 'hex')

const env = (keyId: string) => ({
  AZURE_KEY_VAULT_TENANT_ID: 'gov-tenant', AZURE_KEY_VAULT_CLIENT_ID: 'gov-client', AZURE_KEY_VAULT_CLIENT_SECRET: 'gov-secret', AZURE_KEY_VAULT_KEY_ID: keyId,
}) as Bindings

afterEach(() => vi.unstubAllGlobals())

describe('Azure Government Key Vault signer', () => {
  it('signs in at login.microsoftonline.us for the usgovcloudapi.net vault scope, then signs and serves the public key', async () => {
    const tokenRequests: { url: string; scope: string | null }[] = []
    vi.stubGlobal('fetch', async (input: string | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/oauth2/v2.0/token')) {
        tokenRequests.push({ url, scope: new URLSearchParams(String(init?.body)).get('scope') })
        return Response.json({ access_token: 'gov-token', expires_in: 3600 })
      }
      if (url === `${GOV_KEY_ID}?api-version=7.4`) {
        const { n, e } = publicKey.export({ format: 'jwk' })
        return Response.json({ key: { kid: GOV_KEY_ID, kty: 'RSA-HSM', n, e } })
      }
      if (url.startsWith(`${GOV_KEY_ID}/sign`)) {
        const digest = Buffer.from(JSON.parse(String(init?.body)).value, 'base64url')
        const signature = privateEncrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.concat([SHA256_DIGEST_INFO, digest]))
        return Response.json({ kid: GOV_KEY_ID, value: signature.toString('base64url') })
      }
      return new Response('unexpected', { status: 404 })
    })

    const payload = { licenseId: 'lic_gov', profiles: ['commercial'] }
    const signed = await signCanonicalWithAzureKeyVault(env(GOV_KEY_ID), payload)
    expect(signed.keyId).toBe(GOV_KEY_ID)
    expect(verify('sha256', Buffer.from(canonical(payload)), publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true)
    expect(tokenRequests[0]).toEqual({ url: 'https://login.microsoftonline.us/gov-tenant/oauth2/v2.0/token', scope: 'https://vault.usgovcloudapi.net/.default' })

    const authorities = await licenseAuthorities(env(GOV_KEY_ID))
    expect(authorities).toEqual({ [GOV_KEY_ID]: publicKey.export({ type: 'spki', format: 'pem' }) })
  })

  it('rejects vaults outside Azure public and Azure Government', async () => {
    await expect(signCanonicalWithAzureKeyVault(env('https://beag.vault.azure.cn/keys/papyrus-license/1'), {})).rejects.toThrow(/Azure public .* or Azure Government/)
  })
})
