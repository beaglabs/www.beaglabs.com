# Beag Labs License Worker

Cloudflare Worker for Azure Marketplace lead and usage ingestion, the website's trial-click notification, and the backend for the Papyrus admin app, the Papyrus customer chat bubble (chat, attachments, huddles), deployment registration, the tenant event pipe and Sentry error intake. Papyrus offline licenses are issued locally with the `license:issue` CLI.

Design: `docs/superpowers/specs/2026-10-17-papyrus-admin-app-design.md`. API contract (authoritative request/response shapes, plus a Deviations section): `docs/superpowers/specs/2026-10-17-admin-app-api-contract.md`.

## Boundary

- Host: `https://license.beaglabs.com`
- Runtime: Cloudflare Workers
- Database: Turso / libSQL
- License signer: version-pinned Azure Key Vault key; the authority private key never leaves Key Vault
- Customers deploy and are billed through Azure Marketplace. There is no web customer portal, web admin UI or partner program; staff use the native admin app.

## Routes

- `GET /health`
- `POST /api/events/trial-click` — anonymous website trial-button click, forwarded to the Teams webhook (browser origin allowlist + hourly rate limit)
- `POST /api/marketplace/leads` — Microsoft Marketplace lead webhook (`MARKETPLACE_LEAD_WEBHOOK_SECRET`)
- Cron `17 */6 * * *` — syncs Papyrus VM normalized usage from the Partner Center scheduled report

Admin app / Papyrus (see the contract for shapes):

- `POST /api/provision/bootstrap` — no auth; verifies the Azure IMDS attested document (PKCS#7 signed by `*.metadata.azure.com`, chained to the embedded Azure roots in `src/azure-roots.ts`, intermediate fetched from the signer's AIA URL), checks the nonce and optional Marketplace plan, returns a `Deployment` key (only its SHA-256 is stored)
- `POST /api/papyrus/session` — `Authorization: Deployment <key>` + the signed-in user's Entra ID token → 1-hour chat session JWT; first token binds the deployment to its tenant
- `POST /api/v1/track` — Analytics.js batches (Deployment, chat session, staff, or anonymous web); stored in `tenant_events`, forwarded to Customer.io
- `/api/chat/*`, `/api/huddles/*` — conversations, messages, WebSocket (`ConversationRoom` Durable Object), attachments (R2), account manager card/photo, RealtimeKit huddles
- `/api/admin/*` — staff (Entra) API: me, devices, inbox, leads, customers + timeline, account managers, assignment
- `POST /api/sentry/webhook` — Sentry `issue` / `event_alert` webhooks (`Sentry-Hook-Signature`)

Chat, session, track and admin routes allow any CORS origin (no cookies; auth is always an `Authorization` header or `?token=` for WebSockets and attachment downloads).

Module map: `auth.ts` (staff/customer/session/deployment auth), `jwt.ts`, `azure-attested.ts`, `registration.ts`, `track.ts` + `events.ts`, `chat-routes.ts` + `chat-store.ts` + `conversation-room.ts`, `attachments.ts`, `huddles.ts` + `realtimekit.ts`, `admin-routes.ts`, `inbox.ts` + `push.ts`, `sentry.ts`, `visibility.ts`.

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

- `CHAT_SESSION_SECRET` — HMAC key for customer chat session JWTs (`openssl rand -base64 48`)

Optional: `TRIAL_NOTIFICATIONS_WEBHOOK_URL`, `MARKETPLACE_NOTIFICATIONS_WEBHOOK_URL`, `TRIAL_NOTIFICATIONS_FROM`.

Optional admin-app integrations (each is skipped cleanly when unset):

- Huddles: `CF_ACCOUNT_ID`, `REALTIMEKIT_APP_ID`, `REALTIMEKIT_API_TOKEN` (API token with Realtime / Realtime Admin permission). Without them, starting a huddle returns 503 `huddles_not_configured`.
- Customer.io: `CUSTOMERIO_SITE_ID`, `CUSTOMERIO_API_KEY` (Track API credentials), optional `CUSTOMERIO_REGION=eu`.
- Sentry: `SENTRY_CLIENT_SECRET` (internal integration client secret; webhook URL `https://license.beaglabs.com/api/sentry/webhook`, enable issue + alert-rule-action webhooks). Without it the webhook returns 503.
- Android push: `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` (service-account key JSON with the Firebase Messaging role).
- macOS push: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` (.p8 contents), optional `APNS_ENVIRONMENT=sandbox`.
- Registration plan pin: `PAPYRUS_MARKETPLACE_PUBLISHER`, `PAPYRUS_MARKETPLACE_PRODUCT` (unset = only the Microsoft signature is checked).

Configured non-secret vars: `BASE_URL`, `MARKETPLACE_FROM_EMAIL`, `TRIAL_NOTIFICATIONS_EMAIL`, `ADMIN_API_CLIENT_ID`, `APNS_BUNDLE_ID`, `REALTIMEKIT_PRESET_NAME` (must name a preset that exists in the RealtimeKit app).

Cloudflare resources: R2 bucket `beaglabs-chat-attachments` (`npx wrangler r2 bucket create beaglabs-chat-attachments`) and the `ConversationRoom` Durable Object (created by the `v1-conversation-room` migration on deploy).

## Entra setup for the admin app

In the Beag Labs tenant, on app registration `76fd8c28-6c8d-4b41-ae10-a99da42880a1`:

1. **Expose an API**: set the Application ID URI to `api://76fd8c28-6c8d-4b41-ae10-a99da42880a1` and add the delegated scope `access_as_user` (admins and users can consent).
2. **Manifest**: set `requestedAccessTokenVersion` (`accessTokenAcceptedVersion` in the legacy manifest) to `2`. The Worker only accepts v2 issuers (`https://login.microsoftonline.com/<tenant>/v2.0`).
3. **App roles** (allowed member type Users/Groups): `Papyrus.System.Owner` and `Papyrus.Account.Manager`. Assign them to staff under Enterprise applications → Users and groups. Users with neither role get 403.
4. **Authentication**: add a *Mobile and desktop applications* platform with the Tauri app's redirect URIs (for example a loopback `http://localhost` / `http://127.0.0.1` redirect for macOS and the Android custom-scheme or App Link redirect the app registers), and set **Allow public client flows** to *Yes* (authorization code + PKCE without a client secret).
5. The app requests `api://76fd8c28-6c8d-4b41-ae10-a99da42880a1/access_as_user offline_access openid profile`.

Papyrus customer sign-in uses each customer's own (multi-tenant) app registration; when Papyrus sends `entraClientId` at registration, `/api/papyrus/session` requires the ID token's `aud` to match it.

## Database

```bash
npm install
npm run db:apply
```

`db:apply` applies the SQL schema files and data migrations idempotently, ending with `papyrus-admin-schema.sql` (admin app, chat, events, errors, inbox, devices). Tables from the retired portal, admin and partner features are left in place; nothing drops them.

## Validation and deploy

```bash
npm run typecheck
npm test
npx wrangler deploy --dry-run --config wrangler.jsonc --outdir .wrangler-dry-run
npm run deploy
```

Tests run on plain Vitest with an in-memory libSQL database loaded from the real schema files, fake R2 / Durable Object bindings, and locally generated Entra signing keys. The IMDS attested-data fixture is synthetic (`tests/fixtures/make-attested-fixture.sh` regenerates it with OpenSSL); a real document can only come from an Azure VM.

`npm run check` runs TypeScript typechecking and a Wrangler dry-run bundle. `wrangler.jsonc` declares `license.beaglabs.com` as a Cloudflare Worker Custom Domain and disables the `workers.dev` hostname.
