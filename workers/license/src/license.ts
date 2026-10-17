import { createHash } from 'node:crypto'
import type { DeploymentProfile } from './env'

export interface LicenseBase {
  licenseId: string
  licensee: string
  profiles: DeploymentProfile[]
  features: string[]
  issuedAt: string
  expiresAt: string | null
}
export interface DeploymentLicensePayload extends LicenseBase {
  scope?: 'deployment'
  deploymentId: string
  branding?: { entraAppLogoUrl: string }
}
export interface OrganizationLicensePayload extends LicenseBase {
  scope: 'organization'
  organizationId: string
  entitlementId: string
  allowedTenantIds: string[]
  allowedDomains?: string[]
  expiresAt: string
  deploymentId?: never
}
export type LicensePayload = DeploymentLicensePayload | OrganizationLicensePayload
export type SignedLicense = LicensePayload & { keyId: string; signature: string }

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(',')}}`
}

export function payloadSha256(payload: LicensePayload): string {
  return createHash('sha256').update(canonical(payload)).digest('hex')
}
