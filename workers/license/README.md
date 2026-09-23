# Beag Labs License + Partner Worker

Cloudflare Worker for Beag Labs partner onboarding, commercial/provisioning state, OAuth identity, and Papyrus offline license issuance.

## Boundary

- Host: `https://license.beaglabs.com`
- Runtime: Cloudflare Workers
- Database: Turso / libSQL
- Admin authentication: Microsoft Entra ID through Better Auth
- Partner authentication: approved-invite-only Better Auth magic links
- OAuth/OIDC issuer: Better Auth OAuth Provider
- Partner self-service: catalog access and **draft order submission only**
- Papyrus licensing: Beag-admin-only, deployment-bound signed offline JSON compatible with the existing Papyrus `LicenseService`

Partner OAuth users cannot book orders, create entitlements, register deployments, issue licenses, or revoke licenses. Every `/api/v1/*` endpoint remains Microsoft-admin-only and requires an Entra tenant ID matching `MICROSOFT_TENANT_ID` plus an immutable object ID (`oid`) in `ADMIN_MICROSOFT_OIDS`.

## Partner onboarding

Public application: `GET /partners/apply`

Required application fields:

- Company name
- Company domain
- Annual revenue (USD)
- UEI (12 characters)
- CAGE (5 characters)
- Partner type
- Main POC name
- Main POC email
- One or more SKUs of interest

Flow:

1. The application is stored in `partner_applications` with a one-time decision token.
2. `partners@beaglabs.com` receives an approve/reject email.
3. Email buttons open a review page; **GET never mutates approval state** so mail-security scanners cannot approve an application.
4. A confirmed approval creates or links the commercial organization and partner record.
5. The Main POC receives a 72-hour, single-use partner invitation.
6. The invitation can request a Better Auth magic link only for the exact approved email address.
7. Successful redemption creates the `partner_users` mapping and opens `/portal`.

Existing partners can be invited from the admin portal using their primary contact email without reapplying.

## Partner portal

`GET /portal`

Approved partner users can:

- View active Papyrus SKUs and list prices.
- Submit draft commercial order requests.
- Identify an optional end customer and federal identifiers.
- Track submitted orders.
- Read the provisioning workflow.

Products with no configured list price are automatically marked `quote required`. Partner requests never accept a caller-supplied price and never automatically change an order from `draft` to `booked`.

## Admin portal

`GET /admin`

The Neobrutalist admin portal includes:

- Pending and historical partner applications.
- Active partner table with company logos resolved from company domain using Logo.dev.
- Existing-partner invitation actions.
- Partner-submitted order activity and quote-required state.
- Recent audit events.
- Provisioning boundary/instructions.

Logo.dev uses the publishable token in `LOGO_DEV_TOKEN`. If using a Logo.dev plan that requires attribution, keep the `Logo.dev` attribution rendered below the active-partner table.

## OAuth / OIDC

The Worker mounts Better Auth OAuth Provider with dynamic client registration disabled. The configured partner scopes are:

- `openid`
- `profile`
- `email`
- `offline_access`
- `partner:catalog`
- `partner:orders`

Discovery endpoints are routed from `/.well-known/*` to Better Auth. Partner authorization uses `/partner/login` and `/oauth/consent`.

### CIMD

CIMD is intentionally **not enabled on the Cloudflare Worker**. Better Auth's current CIMD security guidance requires DNS resolution plus connection pinning and explicitly warns against DNS-check-then-`fetch` implementations because they remain vulnerable to DNS rebinding. Standard Workers `fetch` does not expose the required transport pinning primitive. OAuth/OIDC partner identity does not depend on CIMD; CIMD can be added later on a runtime that can satisfy the documented transport requirements.

## Commercial and provisioning flow

The service does not infer contract acceptance from partner activity.

1. Partner submits a draft order request, or Beag creates an order administratively.
2. Beag validates pricing, customer identity, and contract/vehicle flow.
3. Beag explicitly moves the order to `booked` or `fulfilled` after the commercial event is known.
4. Beag explicitly creates an entitlement from a license-product order item.
5. Beag registers a Papyrus deployment using its activation `deploymentId` and deployment profile.
6. Beag explicitly issues the signed deployment-bound license.

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
- `RESEND_API_KEY`

Configured non-secret vars:

- `BASE_URL=https://license.beaglabs.com`
- `PARTNERS_EMAIL=partners@beaglabs.com`
- `PARTNER_FROM_EMAIL=Beag Labs Partners <partners@beaglabs.com>`
- `LOGO_DEV_TOKEN` — Logo.dev publishable key

The Papyrus authority public key must be configured in Papyrus under `PAPYRUS_LICENSE_AUTHORITIES` using the same `PAPYRUS_LICENSE_KEY_ID`.

## Microsoft app registration

Register this production redirect URI in Microsoft Entra:

`https://license.beaglabs.com/api/auth/callback/microsoft`

Microsoft authentication is for Beag administrator access. Approved partner users use Beag passwordless identities, not your internal Microsoft tenant.

## Email setup

The Worker uses Resend for:

- application approval/rejection review emails to `partners@beaglabs.com`;
- approved partner invitations;
- partner magic-link sign-in.

Ensure the domain/address in `PARTNER_FROM_EMAIL` is authorized by the Resend account before production deployment.

## Database

From `workers/license`:

```bash
npm install
npm run db:apply
```

`db:apply` applies:

1. `schema.sql` — commercial/provisioning tables and seeded SKUs;
2. `partner-schema.sql` — partner applications, invites, users, and partner order metadata;
3. Better Auth programmatic migrations — core auth, magic-link, JWT, and OAuth Provider schema.

The migration SQL is idempotent where possible; Better Auth's migrator introspects its own required schema before applying changes.

## Validation

```bash
npm run check
```

This runs TypeScript typechecking and a Wrangler dry-run bundle. GitHub Actions also applies all database migrations to an ephemeral local libSQL database as a smoke test.

## Deploy

Set each required secret on the Worker, apply the database migration, then deploy:

```bash
npm run db:apply
npm run deploy
```

`wrangler.jsonc` declares `license.beaglabs.com` as a Cloudflare Worker Custom Domain and disables the `workers.dev` hostname.

## Route summary

Public/bootstrap:

- `GET /health`
- `GET /partners/apply`
- `POST /api/partner/applications`
- `GET /partner-application/review`
- `POST /partner-application/decision`
- `GET /partner/invite`
- `POST /api/partner/invite/send`
- `GET /partner/login`
- `/api/auth/*` — Better Auth
- `/.well-known/*` — OAuth/OIDC discovery

Approved partner:

- `GET /portal`
- `GET /api/partner/catalog`
- `GET /api/partner/orders`
- `POST /api/partner/orders`
- `GET /oauth/consent`

Microsoft admin:

- `GET /admin`
- `POST /api/partner/admin/partners/:id/invite`
- all existing `/api/v1/*` commercial, entitlement, deployment, license, and audit APIs

## Offline revocation semantics

Papyrus disconnected deployments do not phone home. Marking a license issuance `revoked` records Beag Labs' commercial/admin state but cannot retroactively invalidate a license document already imported into an offline deployment. Expiration or replacement is the enforcement mechanism available to the disconnected runtime.
