import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'

/** Raised for any credential encryption/decryption failure. The message never contains plaintext. */
export class CredentialCryptoError extends Data.TaggedError('CredentialCryptoError')<{ message: string }> {}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

export const toBase64Url = (bytes: Uint8Array): string => toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const randomBytes = (length: number): Uint8Array<ArrayBuffer> => crypto.getRandomValues(new Uint8Array(length))

/** URL-safe random token (default 32 bytes). */
export const randomToken = (length = 32): string => toBase64Url(randomBytes(length))

export const sha256Hex = (text: string): Effect.Effect<string> =>
  Effect.promise(async () => {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)))
    return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('')
  })

const importKey = (keyBase64: string) =>
  Effect.tryPromise({
    try: async () => {
      const raw = fromBase64(keyBase64)
      if (raw.length !== 32) throw new Error('length')
      return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    },
    catch: () => new CredentialCryptoError({ message: 'CREDENTIALS_KEY must be base64 of 32 bytes' }),
  })

/**
 * AES-256-GCM with the customer account id as associated data. Output: `v1.<iv b64>.<ciphertext+tag b64>`.
 * A ciphertext moved to another account fails to decrypt.
 */
export const encryptJson = (keyBase64: string, accountId: string, value: unknown) =>
  Effect.gen(function* () {
    const key = yield* importKey(keyBase64)
    const iv = randomBytes(12)
    const sealed = yield* Effect.tryPromise({
      try: () => crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(accountId) }, key, encoder.encode(JSON.stringify(value))),
      catch: () => new CredentialCryptoError({ message: 'Encryption failed' }),
    })
    return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(sealed))}`
  })

export const decryptJson = <T = unknown>(keyBase64: string, accountId: string, sealed: string) =>
  Effect.gen(function* () {
    const [version, ivText, bodyText] = sealed.split('.')
    if (version !== 'v1' || !ivText || !bodyText) return yield* new CredentialCryptoError({ message: 'Unknown ciphertext format' })
    const key = yield* importKey(keyBase64)
    const plain = yield* Effect.tryPromise({
      try: () => crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(ivText), additionalData: encoder.encode(accountId) }, key, fromBase64(bodyText)),
      catch: () => new CredentialCryptoError({ message: 'Decryption failed (wrong key or account)' }),
    })
    return JSON.parse(decoder.decode(plain)) as T
  })

/** HMAC-SHA256, base64url. Used for short-lived signed cookies (OAuth state). */
export const hmac = (secret: string, text: string): Effect.Effect<string> =>
  Effect.promise(async () => {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text))))
  })

export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
