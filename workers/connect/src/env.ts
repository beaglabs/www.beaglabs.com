export type Mode = 'test' | 'live'

export interface Bindings {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  /** Entra app that may read the Stripe secrets from Beag Labs' Key Vault (client credentials). */
  AZURE_KEY_VAULT_TENANT_ID: string
  AZURE_KEY_VAULT_CLIENT_ID: string
  AZURE_KEY_VAULT_CLIENT_SECRET: string
  /** e.g. https://beaglabs-connect.vault.azure.net */
  AZURE_KEY_VAULT_URL: string
  /**
   * Key Vault secret names (not values). Each mode has the platform secret key and two event destinations' signing
   * secrets: "snapshot" (Connect events from connected accounts: checkout, charges, payouts) and "thin" (v2 account events).
   */
  STRIPE_SECRET_KEY_TEST_NAME?: string
  STRIPE_SECRET_KEY_LIVE_NAME?: string
  STRIPE_WEBHOOK_SECRET_TEST_NAME?: string
  STRIPE_WEBHOOK_SECRET_LIVE_NAME?: string
  STRIPE_THIN_WEBHOOK_SECRET_TEST_NAME?: string
  STRIPE_THIN_WEBHOOK_SECRET_LIVE_NAME?: string
  /**
   * Read-only access to the license service's database, to recognize Azure Marketplace VMs: they have no signed
   * license, but once the customer claims one in provisioning it is a managed deployment of an organization.
   */
  LICENSE_DATABASE_URL?: string
  LICENSE_DATABASE_TOKEN?: string
  /** License authorities: JSON object of keyId → public key PEM, the same document Papyrus uses (PAPYRUS_LICENSE_AUTHORITIES). */
  LICENSE_AUTHORITIES: string
  /** Platform fee on each charge: basis points plus fixed cents (e.g. "100" and "0" for 1%). */
  APPLICATION_FEE_BPS?: string
  APPLICATION_FEE_FIXED_CENTS?: string
  /** The Papyrus Payments plan, billed monthly to each city's Stripe account, in cents (default 250000 = $2,500). */
  PLAN_MONTHLY_CENTS?: string
  /** Key Vault secret names for Plaid (Auth + Identity Match): one client id, a secret per environment (sandbox for test, production for live). */
  PLAID_CLIENT_ID_NAME?: string
  PLAID_SECRET_TEST_NAME?: string
  PLAID_SECRET_LIVE_NAME?: string
  /** Set to "true" only in local development: lets installs register with http://localhost origins. */
  ALLOW_LOCALHOST_ORIGINS?: string
}
