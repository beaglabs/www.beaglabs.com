import { createHash, verify } from 'node:crypto'

/**
 * Who is calling. A Papyrus install proves itself with the signed license Beag Labs issued it (checked against the
 * license authorities' public keys, exactly as Papyrus checks it) and its deployment key: the deployment id is the
 * SHA-256 of that key's PEM, and every request after registration is signed with it.
 */

export interface LicenseDocument {
  scope?: 'deployment' | 'organization'
  licenseId: string; expiresAt: string | null
  deploymentId?: string; organizationId?: string; allowedTenantIds?: string[]
  keyId: string; signature: string
  [key: string]: unknown
}

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`
}

export const deploymentIdOf = (publicKeyPem: string) => createHash('sha256').update(publicKeyPem).digest('hex')

/**
 * Checks the license and returns what Stripe accounts are bound to: the organization for an organization license,
 * the deployment for a deployment license (which must be this install's).
 */
export function verifyLicense(document: unknown, authorities: Record<string, string>, publicKeyPem: string, now = new Date()): { ownerKey: string; licenseId: string; expiresAt: string | null } {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new IdentityError('LICENSE_INVALID', 'A signed license document is required')
  const { signature, keyId, ...payload } = document as LicenseDocument
  const authority = typeof keyId === 'string' ? authorities[keyId] : undefined
  if (!authority || typeof signature !== 'string') throw new IdentityError('LICENSE_INVALID', 'The license was not issued by a known Beag Labs authority')
  if (!verify('sha256', Buffer.from(canonical(payload)), authority, Buffer.from(signature, 'base64'))) throw new IdentityError('LICENSE_INVALID', 'The license signature does not verify')
  const license = document as LicenseDocument
  if (license.expiresAt && Date.parse(license.expiresAt) <= now.getTime()) throw new IdentityError('LICENSE_EXPIRED', 'The license has expired')
  if (license.scope === 'organization') {
    if (typeof license.organizationId !== 'string' || !license.organizationId) throw new IdentityError('LICENSE_INVALID', 'The organization license names no organization')
    return { ownerKey: `org:${license.organizationId}`, licenseId: license.licenseId, expiresAt: license.expiresAt }
  }
  if (license.deploymentId !== deploymentIdOf(publicKeyPem)) throw new IdentityError('LICENSE_MISMATCH', 'The deployment license belongs to another deployment')
  return { ownerKey: `dep:${license.deploymentId}`, licenseId: license.licenseId, expiresAt: license.expiresAt }
}

/** Checks a request signature: the install's P-256 key over {method, path, timestamp, bodySha256}, five-minute window. */
export function verifyRequest(input: { method: string; path: string; timestamp: string | null; signature: string | null; body: string; publicKeyPem: string; now?: Date }): void {
  if (!input.timestamp || !/^\d{10}$/.test(input.timestamp) || !input.signature) throw new IdentityError('SIGNATURE_REQUIRED', 'Signed requests only')
  const now = (input.now ?? new Date()).getTime() / 1000
  if (Math.abs(now - Number(input.timestamp)) > 300) throw new IdentityError('SIGNATURE_STALE', 'The request is too old or from the future; check the server clock')
  const bodySha256 = createHash('sha256').update(input.body).digest('hex')
  const payload = canonical({ method: input.method, path: input.path, timestamp: input.timestamp, bodySha256 })
  let ok = false
  try { ok = verify('sha256', Buffer.from(payload), input.publicKeyPem, Buffer.from(input.signature, 'base64')) } catch { ok = false }
  if (!ok) throw new IdentityError('SIGNATURE_INVALID', 'The request signature does not verify')
}

export class IdentityError extends Error {
  constructor(readonly code: string, message: string) { super(message) }
}
