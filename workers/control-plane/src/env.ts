import type { HubNamespace } from './activity-hub'
import type { LicenseRpcApi } from './license-rpc'

export interface Bindings {
  DB: D1Database
  LINEAR_SYNC?: DurableObjectNamespace
  LINEAR_API_KEY?: string
  LINEAR_TEAM_ID?: string
  LINEAR_NEW_CUSTOMER_LABEL_ID?: string
  LINEAR_ISSUE_STATE_ID?: string
  LINEAR_SALES_PIPELINE_LABEL_ID?: string
  LINEAR_ASSIGNEE_ID?: string
  /** Service binding to workers/license, entrypoint `LicenseRpc`. */
  LICENSE: LicenseRpcApi
  BASE_URL: string
  /** ghcr.io/beaglabs/papyrus/papyrus */
  PAPYRUS_IMAGE: string
  /** sha256:… of the signed hardened image every recipe runs. */
  PAPYRUS_IMAGE_DIGEST: string
  /** Sentry for every deployed Papyrus (optional; unset = Sentry off in the containers): the server DSN, */
  PAPYRUS_SENTRY_DSN?: string
  /** the browser DSN (Papyrus falls back to the server DSN), */
  PAPYRUS_WEB_SENTRY_DSN?: string
  /** and the environment name (Papyrus defaults to "production"). */
  PAPYRUS_SENTRY_ENVIRONMENT?: string
  MAGIC_LINK_FROM_EMAIL: string
  /** Beag Labs' IAM principal that customer "Connect AWS" roles trust. */
  AWS_PRINCIPAL_ARN: string
  /** S3 URL of the CloudFormation template served at /aws/connect-template.yaml (quick-create needs S3). */
  AWS_CONNECT_TEMPLATE_URL: string
  /** One ActivityHub Durable Object per account: live Activity over hibernatable WebSockets. */
  ACTIVITY?: HubNamespace
  /** Cloudflare Browser Rendering: screenshots of a deployment's public page for the preview. Optional. */
  BROWSER?: Fetcher
  /** R2 bucket holding the latest preview screenshot per deployment. Optional (no bucket = no screenshots). */
  PREVIEWS?: R2Bucket
  /** Stripe product every Papyrus price belongs to. */
  STRIPE_PRODUCT: string
  /** $250/month platform subscription (licensed). */
  STRIPE_PRICE_PLATFORM: string
  /** $0.50 per VM hour (metered; its Billing Meter is resolved at runtime). */
  STRIPE_PRICE_COMPUTE: string
  /** $0.00194444 per agent-second (metered; its Billing Meter is resolved at runtime). */
  STRIPE_PRICE_EXECUTION: string
  /** "true" turns bring-your-own-cloud on for every account; otherwise only accounts flagged in account_flags. */
  BYOC_ENABLED: string
  /** Hosted by Beag Labs: the Connect AWS role deployed once into Beag Labs' own account. */
  HOSTED_AWS_ROLE_ARN: string
  /** Region of the shared hosted infrastructure (us-east-2). */
  HOSTED_AWS_REGION: string

  /** base64 of 32 random bytes: AES-256-GCM key for provider credentials. */
  CREDENTIALS_KEY: string
  /** HMAC key for OAuth state cookies. */
  SESSION_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  /**
   * Beag Labs' multi-tenant Entra app: "Sign in with Microsoft" here, and one-click Connect Microsoft (src/microsoft.ts,
   * redirect ${BASE_URL}/microsoft/callback). Empty = Connect Microsoft shows "not set up yet".
   */
  MICROSOFT_CLIENT_ID: string
  /** That app's client secret (secret). Redeems sign-in codes; never leaves this Worker. */
  MICROSOFT_CLIENT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  /** Access key of AWS_PRINCIPAL_ARN; used only to sts:AssumeRole into customer roles. */
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  /** ExternalId of the hosted role in Beag Labs' account (fixed; the stack was launched with it). */
  HOSTED_AWS_EXTERNAL_ID: string
  /** Bearer token for /admin/* (the one-time hosted bootstrap). */
  ADMIN_TOKEN: string
}
