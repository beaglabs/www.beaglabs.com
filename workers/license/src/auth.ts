import { betterAuth } from 'better-auth'
import { adminOids, type Bindings } from './env'

export function buildAuth(env: Bindings) {
  const allowed = adminOids(env)
  const tenantId = env.MICROSOFT_TENANT_ID.toLowerCase()

  return betterAuth({
    baseURL: env.BASE_URL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BASE_URL],
    session: {
      expiresIn: 60 * 60 * 8,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 8,
        strategy: 'jwe',
        refreshCache: true,
      },
    },
    account: {
      storeStateStrategy: 'cookie',
      storeAccountCookie: true,
    },
    user: {
      additionalFields: {
        entraOid: {
          type: 'string',
          required: false,
          input: true,
          returned: true,
        },
        entraTenantId: {
          type: 'string',
          required: false,
          input: true,
          returned: true,
        },
      },
      validateUserInfo: ({ user, source }) => {
        const mapped = user as typeof user & { entraOid?: string; entraTenantId?: string }
        const oid = mapped.entraOid?.toLowerCase() ?? ''
        const tid = mapped.entraTenantId?.toLowerCase() ?? ''

        if (source.oauth?.providerId !== 'microsoft' || !oid || !tid || tid !== tenantId || !allowed.has(oid)) {
          return {
            error: 'admin_not_allowed',
            errorDescription: 'This Microsoft Entra identity is not authorized to administer Beag Labs licensing.',
          }
        }
      },
    },
    socialProviders: {
      microsoft: {
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        tenantId: env.MICROSOFT_TENANT_ID,
        authority: 'https://login.microsoftonline.com',
        prompt: 'select_account',
        mapProfileToUser: (profile) => {
          const oid = String(profile.oid ?? '')
          const tid = String(profile.tid ?? '')
          const preferred = typeof profile.preferred_username === 'string' ? profile.preferred_username : undefined
          return {
            email: profile.email ?? preferred ?? `${oid || 'unknown'}@entra.invalid`,
            image: null,
            entraOid: oid,
            entraTenantId: tid,
          }
        },
      },
    },
  })
}

export type LicenseAuth = ReturnType<typeof buildAuth>
