export type Bindings = {
  BASE_URL: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  /** Partner Center analytics fall back to these when MARKETPLACE_ANALYTICS_* are unset. */
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string
  MICROSOFT_TENANT_ID: string
  /** Key Vault license/status signer: the offline CLI (scripts/issue-license.ts) and LicenseRpc (control plane). */
  AZURE_KEY_VAULT_TENANT_ID: string
  AZURE_KEY_VAULT_CLIENT_ID: string
  AZURE_KEY_VAULT_CLIENT_SECRET: string
  AZURE_KEY_VAULT_KEY_ID: string
  RESEND_API_KEY: string
  TRIAL_NOTIFICATIONS_WEBHOOK_URL?: string
  /** Teams (Power Automate) webhook for Marketplace subscription events. Falls back to TRIAL_NOTIFICATIONS_WEBHOOK_URL. */
  MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL?: string
  TRIAL_NOTIFICATIONS_EMAIL?: string
  TRIAL_NOTIFICATIONS_FROM?: string
  MARKETPLACE_LEAD_WEBHOOK_SECRET: string
  MARKETPLACE_FROM_EMAIL?: string
  MARKETPLACE_ANALYTICS_TENANT_ID?: string
  MARKETPLACE_ANALYTICS_CLIENT_ID?: string
  MARKETPLACE_ANALYTICS_CLIENT_SECRET?: string

  // --- Deployment registration and event pipe --------------------------------
  /** Optional Marketplace plan pin for deployment registration. Unset = plan check skipped. */
  PAPYRUS_MARKETPLACE_PUBLISHER?: string
  PAPYRUS_MARKETPLACE_PRODUCT?: string
  /** Customer.io Track API. Forwarding is skipped when unset. */
  CUSTOMERIO_SITE_ID?: string
  CUSTOMERIO_API_KEY?: string
  /** 'us' (default) or 'eu'. */
  CUSTOMERIO_REGION?: string
  /** Sentry integration client secret used to verify Sentry-Hook-Signature. */
  SENTRY_CLIENT_SECRET?: string
}

export const DEPLOYMENT_PROFILES = ['commercial', 'government', 'disconnected'] as const
export type DeploymentProfile = (typeof DEPLOYMENT_PROFILES)[number]

export const CLASSIFICATION_LEVELS = ['unclassified', 'cui', 'confidential', 'secret', 'top-secret', 'top-secret-sci'] as const
export type ClassificationLevel = (typeof CLASSIFICATION_LEVELS)[number]
export const CLASSIFICATION_BANNER_FEATURE = 'classification-banners' as const

export function isDeploymentProfile(value: unknown): value is DeploymentProfile {
  return typeof value === 'string' && DEPLOYMENT_PROFILES.includes(value as DeploymentProfile)
}

export function isClassificationLevel(value: unknown): value is ClassificationLevel {
  return typeof value === 'string' && CLASSIFICATION_LEVELS.includes(value as ClassificationLevel)
}
