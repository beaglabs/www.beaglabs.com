export type R2ObjectLike = {
  body: ReadableStream<Uint8Array>
  size?: number
  httpMetadata?: { contentType?: string }
}

export type R2BucketLike = {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>
  get(key: string): Promise<R2ObjectLike | null>
  delete(key: string | string[]): Promise<void>
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{ objects: Array<{ key: string }>; truncated: boolean; cursor?: string }>
}

export type Bindings = {
  BASE_URL: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  BETTER_AUTH_SECRET: string
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string
  MICROSOFT_TENANT_ID: string
  ADMIN_MICROSOFT_OIDS: string
  AZURE_KEY_VAULT_TENANT_ID: string
  AZURE_KEY_VAULT_CLIENT_ID: string
  AZURE_KEY_VAULT_CLIENT_SECRET: string
  AZURE_KEY_VAULT_KEY_ID: string
  /** Deprecated. Production issuance uses Azure Key Vault. */
  PAPYRUS_LICENSE_KEY_ID?: string
  /** Deprecated. Production issuance uses Azure Key Vault and keeps the private key non-exportable. */
  PAPYRUS_LICENSE_PRIVATE_KEY_PEM?: string
  RESEND_API_KEY: string
  TRIAL_NOTIFICATIONS_EMAIL?: string
  TRIAL_NOTIFICATIONS_FROM?: string
  PARTNERS_EMAIL: string
  PARTNER_FROM_EMAIL: string
  LOGO_DEV_TOKEN: string
  MARKETPLACE_LEAD_WEBHOOK_SECRET: string
  MARKETPLACE_FROM_EMAIL?: string
  MARKETPLACE_ANALYTICS_TENANT_ID?: string
  MARKETPLACE_ANALYTICS_CLIENT_ID?: string
  MARKETPLACE_ANALYTICS_CLIENT_SECRET?: string
  PROVISION_COMMERCIAL_CLIENT_ID?: string
  PROVISION_COMMERCIAL_CLIENT_SECRET?: string
  PROVISION_GOVERNMENT_CLIENT_ID?: string
  PROVISION_GOVERNMENT_CLIENT_SECRET?: string
  PAPYRUS_VCPU_HOURLY_USD?: string
}

export const DEPLOYMENT_PROFILES = ['commercial', 'government', 'disconnected'] as const
export type DeploymentProfile = (typeof DEPLOYMENT_PROFILES)[number]

export const CLASSIFICATION_LEVELS = ['unclassified', 'cui', 'confidential', 'secret', 'top-secret', 'top-secret-sci'] as const
export type ClassificationLevel = (typeof CLASSIFICATION_LEVELS)[number]
export const CLASSIFICATION_BANNER_FEATURE = 'classification-banners' as const

export function adminOids(env: Bindings): Set<string> {
  return new Set(
    env.ADMIN_MICROSOFT_OIDS.split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isDeploymentProfile(value: unknown): value is DeploymentProfile {
  return typeof value === 'string' && DEPLOYMENT_PROFILES.includes(value as DeploymentProfile)
}

export function isClassificationLevel(value: unknown): value is ClassificationLevel {
  return typeof value === 'string' && CLASSIFICATION_LEVELS.includes(value as ClassificationLevel)
}
