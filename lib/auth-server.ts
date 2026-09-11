import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_AUTH_URL || process.env.DATABASE_URL,
})

export const auth = betterAuth({
  database: pool,
  // Set the origin explicitly instead of letting Better Auth derive it from the
  // incoming request. Env wins; otherwise fall back to a sane per-environment
  // default. Silences: "[better-auth] Base URL is not set".
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://www.beaglabs.com"
      : "http://localhost:3000"),
  // Better Auth already reads BETTER_AUTH_SECRET from env; pass it explicitly for
  // clarity. During `next build` no auth operations actually run, so fall back to
  // a placeholder purely to keep the build log clean. At runtime a real
  // BETTER_AUTH_SECRET MUST be set (see .env.example) or Better Auth will warn.
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (process.env.NEXT_PHASE === "phase-production-build"
      ? "build-only-placeholder-set-BETTER_AUTH_SECRET-in-env"
      : undefined),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      async sendInvitationEmail(data) {
        // TODO: wire up email sending
      },
      hooks: {
        organization: {
          afterCreate: async ({ organization, member }) => {
            console.log(`Organization ${organization.name} created by ${member.userId}`)
          },
        },
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      onboardingComplete: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
})
