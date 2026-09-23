import { betterAuth } from 'better-auth'
import { jwt, magicLink } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { adminOids, type Bindings } from './env'
import { getAuthDb } from './auth-db'
import { first, getDb } from './db'
import { sendMagicLinkEmail } from './email'

async function canUsePartnerEmail(env: Bindings, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const row = first<Record<string, unknown>>(await getDb(env).execute({
    sql: `SELECT 1 AS allowed FROM partner_users
          WHERE lower(email)=? AND status='active'
          UNION ALL
          SELECT 1 AS allowed FROM partner_invites
          WHERE lower(email)=? AND status='pending' AND expires_at>?
          LIMIT 1`,
    args: [normalized, normalized, new Date().toISOString()],
  }))
  return Boolean(row)
}

export function buildAuth(env: Bindings) {
  const allowed = adminOids(env)
  const tenantId = env.MICROSOFT_TENANT_ID.toLowerCase()

  return betterAuth({
    database: getAuthDb(env),
    baseURL: env.BASE_URL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BASE_URL],
    session: {
      expiresIn: 60 * 60 * 8,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 30,
        strategy: 'jwe',
        refreshCache: true,
      },
    },
    account: {
      storeStateStrategy: 'cookie',
    },
    advanced: {
      database: {
        joins: false,
      },
    },
    user: {
      additionalFields: {
        entraOid: {
          type: 'string',
          required: false,
          input: false,
          returned: true,
        },
        entraTenantId: {
          type: 'string',
          required: false,
          input: false,
          returned: true,
        },
      },
      validateUserInfo: ({ user, source }) => {
        // Magic-link partner accounts are admitted by sendMagicLink below. Any
        // OAuth-created account is reserved for the Beag admin Microsoft tenant.
        if (!source.oauth) return
        if (source.oauth.providerId !== 'microsoft') {
          return {
            error: 'microsoft_required',
            errorDescription: 'Microsoft Entra ID is required for Beag Labs licensing administration.',
          }
        }

        const profile = (source.oauth.profile ?? {}) as Record<string, unknown>
        const mapped = user as typeof user & { entraOid?: string; entraTenantId?: string }
        const oid = String(profile.oid ?? mapped.entraOid ?? '').toLowerCase()
        const tid = String(profile.tid ?? mapped.entraTenantId ?? '').toLowerCase()

        if (!oid || !tid || tid !== tenantId || !allowed.has(oid)) {
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
            entraOid: oid,
            entraTenantId: tid,
          }
        },
      },
    },
    plugins: [
      jwt(),
      magicLink({
        expiresIn: 15 * 60,
        storeToken: 'hashed',
        sendMagicLink: async ({ email, url }) => {
          if (!(await canUsePartnerEmail(env, email))) {
            throw new Error('partner_not_invited')
          }
          await sendMagicLinkEmail(env, email, url)
        },
      }),
      oauthProvider({
        loginPage: '/partner/login',
        consentPage: '/oauth/consent',
        allowDynamicClientRegistration: false,
        scopes: [
          'openid',
          'profile',
          'email',
          'offline_access',
          'partner:catalog',
          'partner:orders',
        ],
      }),
    ],
  })
}

export type LicenseAuth = ReturnType<typeof buildAuth>
