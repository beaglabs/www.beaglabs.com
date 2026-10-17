import type { LicenseRpcApi } from './license-rpc'

export interface Bindings {
  DB: D1Database
  /** Service binding to workers/license, entrypoint `LicenseRpc`. */
  LICENSE: LicenseRpcApi
  BASE_URL: string
  /** Origin of the Beag Labs chat API (the license Worker); the bubble calls it directly and the CSP allows it. */
  CHAT_API_ORIGIN: string
  /** ghcr.io/beaglabs/papyrus/papyrus */
  PAPYRUS_IMAGE: string
  /** sha256:… of the signed hardened image every recipe runs. */
  PAPYRUS_IMAGE_DIGEST: string
  MAGIC_LINK_FROM_EMAIL: string
  /** Beag Labs' IAM principal that customer "Connect AWS" roles trust. */
  AWS_PRINCIPAL_ARN: string
  /** S3 URL of the CloudFormation template served at /aws/connect-template.yaml (quick-create needs S3). */
  AWS_CONNECT_TEMPLATE_URL: string
  /** Optional: a Stripe Price id to bill with; otherwise Checkout uses inline price_data ($13,000/month). */
  STRIPE_PRICE_ID?: string

  /** base64 of 32 random bytes: AES-256-GCM key for provider credentials. */
  CREDENTIALS_KEY: string
  /** HMAC key for OAuth state cookies. */
  SESSION_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  /** Access key of AWS_PRINCIPAL_ARN; used only to sts:AssumeRole into customer roles. */
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
}
