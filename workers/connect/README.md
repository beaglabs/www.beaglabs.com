# Beag Labs Stripe Connect service (`connect.beaglabs.com`)

Holds the Stripe platform key so Papyrus installs never do. Each city has its own Stripe account (V2 account, full
dashboard, Stripe collects fees and carries losses). Residents pay on Stripe-hosted Checkout as direct charges on the
city's account, with Beag Labs' application fee. Papyrus installs call this Worker, signed with their deployment key,
after registering with their signed license; the Worker acts only on the Stripe accounts of the license's
organization (or, for a deployment license, that deployment).

See `src/app.ts` for the routes, and Papyrus `apps/server/src/agent/payments/stripe-connect.ts` for the client.

## One-time setup

1. **Stripe (platform account).** Connect: "Sellers will collect payments directly", full-dashboard accounts, Stripe
   carries losses. Turn on Accounts v2. In Connect payment method settings, turn on cards (with Apple Pay / Google Pay /
   Link) and ACH Direct Debit for connected accounts.
2. **Event destinations**, for each mode (test, live):
   - Snapshot, events from **Connected accounts**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`,
     `payout.paid`, `payout.failed` → `https://connect.beaglabs.com/stripe/webhook/<mode>/snapshot`
   - Thin (advanced options → payload style Thin), events from **Connected accounts**: `v2.core.account[requirements].updated`,
     `v2.core.account[configuration.merchant].capability_status_updated`, `v2.core.account[configuration.customer].capability_status_updated`
     → `https://connect.beaglabs.com/stripe/webhook/<mode>/thin`
3. **Azure Key Vault** (Beag Labs'): secrets `stripe-secret-key-test`, `stripe-secret-key-live` (restricted keys are fine),
   `stripe-webhook-secret-test`, `stripe-webhook-secret-live` (snapshot destinations), `stripe-thin-webhook-secret-test`,
   `stripe-thin-webhook-secret-live`. Give the Worker's Entra app **Key Vault Secrets User** on that vault only.
   Names can be overridden with the `STRIPE_*_NAME` vars.
4. **Turso**: a database for this Worker; `npm run db:apply` applies `schema.sql`.
5. **Worker secrets**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AZURE_KEY_VAULT_TENANT_ID`, `AZURE_KEY_VAULT_CLIENT_ID`,
   `AZURE_KEY_VAULT_CLIENT_SECRET`, `LICENSE_AUTHORITIES` (the same JSON of keyId → public key PEM that Papyrus uses).
   Vars: `AZURE_KEY_VAULT_URL`, `APPLICATION_FEE_BPS`, `APPLICATION_FEE_FIXED_CENTS`, `PLAN_MONTHLY_CENTS` (the Papyrus
   Payments plan, default 25000 = $250/month; the price is created in Stripe on first use, lookup key `papyrus_payments_monthly`).
   The plan is a Stripe Billing subscription on the platform with the city's V2 account as the customer (`customer_account`);
   turn on the Billing customer portal in the platform's Stripe settings (test and live).
6. **Azure Marketplace VMs** have no signed license. They register with their deployment key alone and are accepted
   once the customer has claimed them in provisioning: the Worker looks the deployment id up in the license service's
   `managed_deployments` (same `organizations.id` as organization licenses, so both reach the same Stripe account).
   Give it a **read-only** Turso token for the license database as `LICENSE_DATABASE_URL` / `LICENSE_DATABASE_TOKEN`
   (secrets). Without them, Marketplace VMs are refused. A retired deployment, or one moved to another organization,
   is cut off on its next request.

7. **Plaid** (bank account details for payees and the city's own accounts): a Beag Labs Plaid account with **Auth** and
   **Identity Match** enabled. Put the client id and secrets in the same Key Vault as `plaid-client-id`,
   `plaid-secret-sandbox` (test mode) and `plaid-secret-production` (live). Names can be overridden with
   `PLAID_CLIENT_ID_NAME` / `PLAID_SECRET_TEST_NAME` / `PLAID_SECRET_LIVE_NAME`. The Worker keeps nothing: it exchanges Link's token, reads one account, checks the owner's
   name, returns that once to the install that asked, and removes the connection at Plaid.

## Local

`npm test` runs the route tests against a stand-in for Stripe. For a real Stripe test-mode round trip, run
`npm run dev` with `.dev.vars` holding the secrets above plus `ALLOW_LOCALHOST_ORIGINS=true`, point a Papyrus at it with
`PAPYRUS_STRIPE_CONNECT_URL=http://localhost:8787`, and forward Stripe events with
`stripe listen --forward-connect-to localhost:8787/stripe/webhook/test/snapshot` (and `--thin-events … --forward-thin-to …/thin`).
