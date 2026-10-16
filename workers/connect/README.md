# Beag Labs service for Papyrus installs (`connect.beaglabs.com`)

Reads a payee's bank details through Plaid, so Papyrus installs never hold Plaid's keys. A Papyrus workflow asks a payee
for their bank details; the payee connects their bank on the install's `/bank-details/` page; the install asks this
Worker to exchange Plaid Link's one-time token for that one account's routing and account number, with Plaid's check of
the account owner's name. The Worker keeps nothing about the payee and removes the connection at Plaid straight away.

No money passes through Beag Labs. Card payments, invoices and refunds belong to each city's own Stripe account, which
Papyrus reaches through Stripe's MCP server and Stripe's webhooks to the install; bank payments go out in ACH files the
city uploads to its own bank.

Installs call this Worker signed with their deployment key, after registering with their signed license. See
`src/app.ts` for the routes, and Papyrus `apps/server/src/agent/money/connect-client.ts` for the client.

## One-time setup

1. **Plaid**: a Beag Labs Plaid account with **Auth** and **Identity Match** enabled.
2. **Azure Key Vault** (Beag Labs'): secrets `plaid-client-id`, `plaid-secret-sandbox` and `plaid-secret-production`
   (names can be overridden with `PLAID_CLIENT_ID_NAME` / `PLAID_SECRET_TEST_NAME` / `PLAID_SECRET_LIVE_NAME`). Give the
   Worker's Entra app **Key Vault Secrets User** on that vault only.
3. **Turso**: a database for this Worker; `npm run db:apply` applies `schema.sql`.
4. **Worker secrets**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AZURE_KEY_VAULT_TENANT_ID`, `AZURE_KEY_VAULT_CLIENT_ID`,
   `AZURE_KEY_VAULT_CLIENT_SECRET`, `LICENSE_AUTHORITIES` (the same JSON of keyId → public key PEM that Papyrus uses).
   Var: `AZURE_KEY_VAULT_URL`.
5. **Azure Marketplace VMs** have no signed license. They register with their deployment key alone and are accepted
   once the customer has claimed them in provisioning: the Worker looks the deployment id up in the license service's
   `managed_deployments`. Give it a **read-only** Turso token for the license database as `LICENSE_DATABASE_URL` /
   `LICENSE_DATABASE_TOKEN` (secrets). Without them, Marketplace VMs are refused. A retired deployment, or one moved to
   another organization, is cut off on its next request.

Each install chooses Plaid's sandbox or production with `PAPYRUS_PLAID_ENVIRONMENT` (`sandbox`, or production by default).

## Local

`npm test` runs the route tests against a stand-in for Plaid. For a real Plaid sandbox round trip, run `npm run dev`
with `.dev.vars` holding the secrets above plus `ALLOW_LOCALHOST_ORIGINS=true`, and point a Papyrus at it with
`PAPYRUS_STRIPE_CONNECT_URL=http://localhost:8787` and `PAPYRUS_PLAID_ENVIRONMENT=sandbox`.
