"use client"

import { authClient } from "@/lib/auth-client"

export function useOrgId(): string | null {
  const { data: session } = authClient.useSession()
  return session?.session?.activeOrganizationId ?? null
}
