# Beag Labs License Provisioning Worker

Private Cloudflare Worker for Beag Labs commercial/provisioning state and Papyrus offline license issuance.

## Boundary

- Host: `https://license.beaglabs.com`
- Runtime: Cloudflare Workers
- Database: Turso / libSQL
- Admin authentication: Microsoft Entra ID through Better Auth
- Partner self-service: **not implemented**
- Papyrus licensing: deployment-bound signed offline JSON compatible with the existing Papyrus `LicenseService`

Every `/api/v1/*` endpoint requires a Microsoft session whose Entra tenant ID matches `MICROSOFT_TENANT_ID` and whose immutable Entra object ID (`oid`) appears in `ADMIN_MICROSOFT_OIDS`.

## Commercial flow

The service intentionally does not infer contract acceptance from a partner or opportunity record.

1. Create/maintain customer, partner, contact, vehicle, and opportunity records.
2. Create an order.
3. Explicitly move the order to `booked` or `fulfilled` after the commercial/contract event is known.
4. Explicitly create an entitlement from a license-product order item.
5. Register a Papyrus deployment using its activation `deploymentId` and deployment profile.
6. Explicitly issue a license from that deployment.

The license issuance endpoint does **not** accept arbitrary license fields. Licensee, deployment ID, profile, features, and expiration are derived from Turso records.

## Products seeded by `schema.sql`

- `PAP-FED-PILOT-90` — Papyrus Federal 90-Day Mission Pilot — $250,000 FFP list price
- `PAP-FED-ENT-1Y` — Papyrus Federal Enterprise — Annual
- `PAP-FED-DISC-1Y` — Papyrus Federal Disconnected — Annual
- `PAP-FED-SUPPORT-PREM` — Premium Mission Support

## Environment

Copy `.dev.vars.example` to `.dev.vars` for local development. Real values must never be committed.

Required Worker secrets:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BETTER_AUTH_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- `ADMIN_MICROSOFT_OIDS` — comma-separated Entra object IDs, not email addresses
- `PAPYRUS_LICENSE_KEY_ID`
- `PAPYRUS_LICENSE_PRIVATE_KEY_PEM`

The corresponding public key must be configured in Papyrus under `PAPYRUS_LICENSE_AUTHORITIES` using the same `PAPYRUS_LICENSE_KEY_ID`.

## Microsoft app registration

Register this production redirect URI in Microsoft Entra:

`https://license.beaglabs.com/api/auth/callback/microsoft`

For local development, add the callback URL printed by Wrangler for the local origin.

## Database

From `workers/license`:

```bash
npm install
npm run db:apply
```

`db:apply` executes `schema.sql` against the Turso database identified by `.dev.vars`.

## Validation

```bash
npm run check
```

This runs TypeScript typechecking and a Wrangler dry-run bundle.

## Deploy

Set each required secret on the Worker, then:

```bash
npm run deploy
```

`wrangler.jsonc` declares `license.beaglabs.com` as a Cloudflare Worker Custom Domain and disables the `workers.dev` hostname.

## API

Public/bootstrap routes:

- `GET /health`
- `GET /login`
- `/api/auth/*` — Better Auth

Microsoft-admin-only routes:

- `GET /api/v1/me`
- `GET /api/v1/products`
- `GET|POST /api/v1/organizations`
- `GET|PATCH /api/v1/organizations/:id`
- `GET|POST /api/v1/contacts`
- `PATCH /api/v1/contacts/:id`
- `GET|POST /api/v1/partners`
- `PATCH /api/v1/partners/:id`
- `GET|POST /api/v1/vehicles`
- `PATCH /api/v1/vehicles/:id`
- `GET|POST /api/v1/opportunities`
- `PATCH /api/v1/opportunities/:id`
- `GET|POST /api/v1/orders`
- `GET|PATCH /api/v1/orders/:id`
- `GET|POST /api/v1/entitlements`
- `GET|PATCH /api/v1/entitlements/:id`
- `GET|POST /api/v1/deployments`
- `GET|PATCH /api/v1/deployments/:id`
- `GET /api/v1/licenses`
- `POST /api/v1/deployments/:id/licenses`
- `GET /api/v1/licenses/:id/download`
- `POST /api/v1/licenses/:id/revoke`
- `GET /api/v1/audit`

## Offline revocation semantics

Papyrus disconnected deployments do not phone home. Marking a license issuance `revoked` in this service records Beag Labs' commercial/admin state but cannot retroactively invalidate a license document that was already imported into an offline deployment. Expiration or replacement is the enforcement mechanism available to the disconnected runtime.
