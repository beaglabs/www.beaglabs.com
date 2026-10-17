import { randomBytes } from 'node:crypto'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'
import { decryptJson, encryptJson } from '../src/crypto'

const key = randomBytes(32).toString('base64')
const credentials = { apiKey: 'dop_v1_secret', orgSlug: 'acme' }

describe('credential encryption', () => {
  it('round-trips with the same account id', async () => {
    const sealed = await Effect.runPromise(encryptJson(key, 'acct_1', credentials))
    expect(sealed).toMatch(/^v1\./)
    expect(sealed).not.toContain('dop_v1_secret')
    expect(await Effect.runPromise(decryptJson(key, 'acct_1', sealed))).toEqual(credentials)
  })

  it('uses a fresh IV every time', async () => {
    const [a, b] = await Effect.runPromise(Effect.all([encryptJson(key, 'acct_1', credentials), encryptJson(key, 'acct_1', credentials)]))
    expect(a).not.toEqual(b)
  })

  it('fails when the account id (associated data) differs', async () => {
    const sealed = await Effect.runPromise(encryptJson(key, 'acct_1', credentials))
    const error = await Effect.runPromise(Effect.flip(decryptJson(key, 'acct_2', sealed)))
    expect(error._tag).toBe('CredentialCryptoError')
    expect(error.message).not.toContain('dop_v1')
  })

  it('fails with the wrong key or a tampered ciphertext', async () => {
    const sealed = await Effect.runPromise(encryptJson(key, 'acct_1', credentials))
    await expect(Effect.runPromise(decryptJson(randomBytes(32).toString('base64'), 'acct_1', sealed))).rejects.toThrow()
    const tampered = sealed.slice(0, -4) + (sealed.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    await expect(Effect.runPromise(decryptJson(key, 'acct_1', tampered))).rejects.toThrow()
  })

  it('rejects a key that is not 32 bytes', async () => {
    await expect(Effect.runPromise(encryptJson(randomBytes(16).toString('base64'), 'acct_1', credentials))).rejects.toThrow(/32 bytes/)
  })
})
