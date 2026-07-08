import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_AUTH_URL || process.env.DATABASE_URL,
})

export const auth = betterAuth({
  database: pool,
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
