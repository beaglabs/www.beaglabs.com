import { createHash, sign } from 'node:crypto'
import type { DeploymentProfile } from './env'

export interface LicensePayload {
  licenseId: string
  licensee: string
  deploymentId: string
  profiles: DeploymentProfile[]
  features: string[]
  issuedAt: string
  expiresAt: string | null
}

export interface SignedLicense extends LicensePayload {
  keyId: string
  signature: string
}

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(',')}}`
}

function normalizePem(value: string): string {
  return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value
}

export function signLicense(payload: LicensePayload, keyId: string, privateKeyPem: string): SignedLicense {
  const signature = sign('sha256', Buffer.from(canonical(payload)), normalizePem(privateKeyPem)).toString('base64')
  return { ...payload, keyId, signature }
}

export function payloadSha256(payload: LicensePayload): string {
  return createHash('sha256').update(canonical(payload)).digest('hex')
}

export function deploymentIdForPublicKey(publicKeyPem: string): string {
  return createHash('sha256').update(publicKeyPem).digest('hex')
}
