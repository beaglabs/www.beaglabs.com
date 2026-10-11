# Direct distribution — Phase 1 device authorization

**Scope:** Beag Labs licensing control plane. Papyrus remains customer-hosted with local SQLite/AgentFS. The client/bootstrap integration and online entitlement enforcement are Phase 2.

## Device API

- `POST /api/direct/device/start` — installation submits signed enrollment proof `{proof: {deploymentId, publicKeyPem, profile, nonce, issuedAt, signature}}`; the service returns a 10-minute opaque `device_code`, 64-bit `user_code`, `verification_uri`, and minimum 5-second `interval`. Only hashes of device and user codes are stored.
- `POST /api/direct/device/poll` — installation submits `{device_code}`. Response `authorization_pending`, `slow_down`, `expired_token`, `access_denied`, or approved installation binding. Repeated premature polls increase delay.
- `GET /activate` — human approval UI using an existing Microsoft Entra-authenticated provisioning session.
- `GET /api/direct/device/options` — uses the provisioning session's organization; searches Stripe for active subscriptions with matching `metadata.organization_id` and matches their `metadata.entitlement_id` to active Turso entitlements.
- `POST /api/direct/device/approve` — requires same-origin browser request and an Entra provisioning session with an organization, matching deployment environment/profile, an active entitlement and an active paid Stripe subscription linked by metadata. Performs transactional one-time approval and deployment binding.

**Important:** Stripe subscription search is eventually consistent. A newly provisioned subscription may require a short delay before it appears. Billing failure state is verified through an expanded latest invoice when approving, and should be reconciled independently through the webhook pipeline.

The existing enrollment-token and Key Vault-signed direct-license code is present in the draft branch from the previous architecture. It is NOT called by this device-code API. Removal is deferred to Phase 4 after Papyrus's Phase 2 client no longer depends on those paths.

## Required environments

Existing `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, Microsoft Entra provisioning configuration, `BASE_URL`, and `STRIPE_SECRET_KEY`. Apply `direct-device-schema.sql` through `scripts/apply-schema.mjs`.

Subscriptions must have `metadata.organization_id` matching the organization record and `metadata.entitlement_id` matching the commercial entitlement record.

## Phase 1 acceptance tests before enabling production

1. Device proof with invalid signature, mismatched public key, expired timestamp, or wrong profile is rejected.
2. Device code is never stored in plaintext; public verification code cannot be used to poll.
3. Polling returns pending, slow-down, expiration and approved states correctly.
4. Approval requires a valid Microsoft Entra provisioning session and same-origin request.
5. Cross-organization entitlement and tenant profile mismatch are rejected.
6. Stripe inactive, unpaid, unavailable, and metadata mismatch do not approve.
7. Concurrent approvals on one user code produce one successful binding.
8. Reinstall with the same preserved public key is recognized; deployment identity bound to a different organization is rejected.
9. Approved device only returns an installation binding present in Turso.
10. Migration is idempotent and preserves existing organization and deployment data.

**Not run:** No build/typecheck, database migration, integration test suite, Cloudflare WAF throttling or live Stripe test has been executed in this change. Do not deploy to production yet. Full self-service purchase, lifecycle webhooks, entitlement refresh and signed usage reconciliation are Phase 2/3/4 responsibilities.
