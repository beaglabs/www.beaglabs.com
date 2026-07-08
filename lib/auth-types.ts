export interface SessionUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  onboardingComplete?: boolean
}

export interface ActiveSession {
  id: string
  userId: string
  activeOrganizationId?: string | null
  expiresAt: string
}
