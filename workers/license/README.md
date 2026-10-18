# Beag Labs License Worker

Cloudflare Worker for Azure Marketplace lead and usage ingestion, the website's trial-click notification, Papyrus deployment registration (Marketplace and control plane), the tenant event pipe and Sentry error intake. Papyrus offline licenses are issued locally with the `license:issue` CLI.

The admin app, customer chat, huddles, push and the staff API were removed on 2026-10-17; support is by email (see `docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md`).

## Boundary

- Host: `https://license.beaglabs.com`
- Runtime: Cloudflare Workers
- Database: Turso / libSQL
- License signer: version-pinned Azure Key Vault key; the authority private key never leaves Key Vault
- Customers deploy and are billed through Azure Marketplace. There is no web customer portal, web admin UI or partner program.

## Routes

- `GET /health`
- `POST /api/events/trial-click` — anonymous website trial-button click, forwarded to the Teams webhook (browser origin allowlist + hourly rate limit)
- `POST /api/marketplace/leads` — Microsoft Marketplace lead webhook (`MARKETPLACE_LEAD_WEBHOOK_SECRET`)
- Cron `17 */6 * * *` — syncs Papyrus VM normalized usage from the Partner Center scheduled report

Papyrus:

- `POST /api/provision/bootstrap` — no auth; verifies the Azure IMDS attested document (PKCS#7 signed by `*.metadata.azure.com`, chained to the embedded Azure roots in `src/azure-roots.ts`, intermediate fetched from the signer's AIA URL), checks the nonce and optional Marketplace plan, returns a `Deployment` key (only its SHA-256 is stored)
- `POST /api/provision/control-plane/exchange` — one-time control-plane bootstrap token → deployment key
- `POST /api/v1/track` — Analytics.js batches (`Authorization: Deployment <key>` or anonymous web); stored in `tenant_events`, forwarded to Customer.io
- `POST /api/sentry/webhook` — Sentry `issue` / `event_alert` webhooks (`Sentry-Hook-Signature`), recorded in `tenant_errors`
- `LicenseRpc` (service binding for the control plane): `createDeployment`, `verifyDeploymentKey`, `signStatus`, `registrationState`

The track route allows any CORS origin (no cookies; auth is an `Authorization` header).

Module map: `auth.ts` (deployment keys), `azure-attested.ts`, `registration.ts`, `control-plane.ts` + `license-rpc.ts`, `track.ts` + `events.ts`, `sentry.ts`.

## Issuing offline licenses

```bash
cd workers/license
npm run license:issue -- --help
```

Organization license (any VM in the listed Entra tenants):

```bash
npm run license:issue -- --scope organization --licensee "Acme County" \
  --sku PAP-FED-PILOT-90 --tenant <entra-tenant-uuid> --domain acme.gov --out acme.license.json
```

Deployment license (one Papyrus deployment ID):

```bash
npm run license:issue -- --scope deployment --licensee "Acme County" \
  --deployment-id <papyrus-deployment-id> --sku PAP-FED-DISC-1Y
```

`--sku` fills features, profiles and term from the SKUs seeded in `schema.sql`; `--features`, `--profile`, `--expires`/`--days` and `--classification <level>` override them. `--dry-run` prints the unsigned payload without calling Key Vault. The output is the same signed JSON document the retired admin API returned, so Papyrus verification is unchanged.

The CLI reads `AZURE_KEY_VAULT_TENANT_ID`, `AZURE_KEY_VAULT_CLIENT_ID`, `AZURE_KEY_VAULT_CLIENT_SECRET` and `AZURE_KEY_VAULT_KEY_ID` from the environment; the npm script loads `.dev.vars` if present. Issued licenses are not recorded in the database, so keep the output file (or its `licenseId`) with the customer record.

## Azure Key Vault license authority

Use an Azure Key Vault **Premium** vault with an HSM-backed RSA key. Signing uses `RS256`; a 3072-bit `RSA-HSM` key keeps compatibility with Papyrus's SHA-256/RSA verification path while keeping the private key non-exportable.

Create the signing key with sign/verify operations only and pin `AZURE_KEY_VAULT_KEY_ID` to the returned key **version**, not merely the key name. Key rotation then produces a new `keyId`, while already-issued licenses continue to identify the exact public key that signed them.

Authenticate with a dedicated Microsoft Entra service principal using client credentials. Grant it only `Microsoft.KeyVault/vaults/keys/sign/action` at the individual key scope (preferred custom role), or `Key Vault Crypto User` scoped to the individual key.

Papyrus must trust the corresponding public key through `PAPYRUS_LICENSE_AUTHORITIES`, using the exact versioned Azure key URI as the map key:

```json
{
  "https://beag-license.vault.azure.net/keys/papyrus-license/<version>": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

## Offline revocation semantics

Papyrus disconnected deployments do not phone home. A license document already imported into an offline deployment cannot be revoked retroactively; expiration or replacement is the enforcement mechanism.

## Environment

Copy `.dev.vars.example` to `.dev.vars` for local development. Real values must never be committed.

Required Worker secrets:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` — Partner Center analytics credentials (overridable with `MARKETPLACE_ANALYTICS_*`)
- `RESEND_API_KEY`
- `MARKETPLACE_LEAD_WEBHOOK_SECRET`

Optional: `TRIAL_NOTIFICATIONS_WEBHOOK_URL`, `MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL`, `TRIAL_NOTIFICATIONS_FROM`.

Optional integrations (each is skipped cleanly when unset):

- Customer.io: `CUSTOMERIO_SITE_ID`, `CUSTOMERIO_API_KEY` (Track API credentials), optional `CUSTOMERIO_REGION=eu`.
- Sentry: `SENTRY_CLIENT_SECRET` (internal integration client secret; webhook URL `https://license.beaglabs.com/api/sentry/webhook`, enable issue + alert-rule-action webhooks). Without it the webhook returns 503.
- Registration plan pin: `PAPYRUS_MARKETPLACE_PUBLISHER`, `PAPYRUS_MARKETPLACE_PRODUCT` (unset = only the Microsoft signature is checked).

Configured non-secret vars: `BASE_URL`, `MARKETPLACE_FROM_EMAIL`, `TRIAL_NOTIFICATIONS_EMAIL`.

The `ConversationRoom` Durable Object is deleted by the `v2-remove-conversation-room` migration on deploy. The R2 bucket `beaglabs-chat-attachments` is no longer bound; delete it by hand once its contents are no longer needed.

## Database

```bash
npm install
npm run db:apply
```

`db:apply` applies the SQL schema files and data migrations idempotently, ending with `papyrus-admin-schema.sql` (deployments, events, errors). The admin app and chat tables are no longer created or used but are not dropped. Tables from the retired portal, admin and partner features are left in place; nothing drops them.

## Validation and deploy

```bash
npm run typecheck
npm test
npx wrangler deploy --dry-run --config wrangler.jsonc --outdir .wrangler-dry-run
npm run deploy
```

Tests run on plain Vitest with an in-memory libSQL database loaded from the real schema files, fake R2 / Durable Object bindings, and locally generated Entra signing keys. The IMDS attested-data fixture is synthetic (`tests/fixtures/make-attested-fixture.sh` regenerates it with OpenSSL); a real document can only come from an Azure VM.

`npm run check` runs TypeScript typechecking and a Wrangler dry-run bundle. `wrangler.jsonc` declares `license.beaglabs.com` as a Cloudflare Worker Custom Domain and disables the `workers.dev` hostname.
