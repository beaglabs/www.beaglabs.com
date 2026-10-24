'use client'

import { createAuthClient } from 'better-auth/react'
import { passkeyClient } from '@better-auth/passkey/client'

// The marketplace has its own Better Auth instance and D1 database.
// Keep this separate from the site's existing model-service auth client.
export const marketplaceAuth = createAuthClient({
  baseURL: 'https://api.beaglabs.com',
  fetchOptions: { credentials: 'include' },
  plugins: [passkeyClient()],
})
