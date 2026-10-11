# Direct Papyrus distribution: billing backend

Status: **draft implementation — not production enabled**. Customer-hosted only; no SaaS/Turso migration of Papyrus itself.

## API

- `POST /api/direct/enrollment-tokens` — Microsoft Entra-authenticated licensing administrator, JSON `{entitlementId,stripeSubscriptionId}`. Requires active entitlement and a verified active Stripe subscription with `metadata.organization_id` and `metadata.entitlement_id`. Returns a 30-minute bearer enrollment grant (only hash persisted).
- `POST /api/direct/enroll` — grant in Authorization header, `{proof:{deploymentId,publicKeyPem,profile,nonce,issuedAt,signature}}`. Checks P-256 deployment signature, grant atomic claim, entitlement limits, stripe state, and returns Azure-Key-Vault-signed `{license,installationId}`.
- `POST /api/direct/usage` — public-key-signed usage intervals; verifies registered deployment, subscription, and configured meter, persists an idempotent outbox item and submits to Stripe; returns acknowledged sequences.
- `POST /api/direct/stripe/webhook` — verifies Stripe timestamp/HMAC and records unique incoming webhook IDs. Webhooks **never** directly mint licenses.

## Configuration

Worker secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_METER_EVENT_NAME`, `STRIPE_METER_ID`. Licensing still depends on Azure Key Vault signing credentials. Run the current schema application script (adds `direct-distro-schema.sql`).

Stripe metered price must reference `STRIPE_METER_ID`. Configure the meter to **sum integer millicpu-seconds**: 3,600,000 units = one licensed vCPU-hour. Stripe Customer mapping key must be `stripe_customer_id` and usage key `value`. Do not configure a per-vCPU-hour price as if each event were already one vCPU-hour.

Appliance environment (when enabled): `PAPYRUS_DIRECT_ENROLLMENT_ENDPOINT=https://license.beaglabs.com/api/direct/enroll`, `PAPYRUS_ENROLLMENT_TOKEN_FILE` pointing to a protected secret, `PAPYRUS_DIRECT_METER_ENDPOINT=https://license.beaglabs.com/api/direct/usage`, and `PAPYRUS_LICENSED_MILLICPUS` as an explicitly licensed capacity integer. The last value is currently host-provided and **not cryptographically enforced against contractual quantity**.

## Release blockers

- Build, typecheck, schema migration and integration tests have not been run in this change.
- No recurring signed license renewal after the initial 24-hour lease; **do not enable production issuance** without a renewal implementation.
- No independent scheduled reconciliation if the device is no longer retrying; outbox retry is currently device-driven.
- Concurrent deployment-limit claims need transaction-level locking or a capacity reservation.
- Stripe reconciliation and invoice/payment failures require operational backoffice and lifecycle testing. Do not confuse an active subscription status with guaranteed collection on all future invoices.
- Configure encryption, operational alerts, rate limiting, replay controls, and Key Vault signing continuity.
- Compose/Helm secrets and entitlement-proven CPU caps are the following distribution sweep.

The implementation intentionally retains the existing Entra and signed licensing model; no Stripe secret is shipped to a Papyrus appliance.
