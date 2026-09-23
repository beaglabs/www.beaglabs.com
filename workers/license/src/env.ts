export type Bindings = {
  BASE_URL: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  BETTER_AUTH_SECRET: string
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string
  MICROSOFT_TENANT_ID: string
  ADMIN_MICROSOFT_OIDS: string
  PAPYRUS_LICENSE_KEY_ID: string
  PAPYRUS_LICENSE_PRIVATE_KEY_PEM: string
  RESEND_API_KEY: string
  PARTNERS_EMAIL: string
  PARTNER_FROM_EMAIL: string
  LOGO_DEV_TOKEN: string
}

export const DEPLOYMENT_PROFILES = [
  'commercial',
  'government-il4',
  'government-il6',
  'gcc',
  'gcch',
  'dod',
  'restricted',
  'disconnected',
] as const

export type DeploymentProfile = (typeof DEPLOYMENT_PROFILES)[number]

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
