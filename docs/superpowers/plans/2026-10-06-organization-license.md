# Organization License Implementation Plan

> For agentic workers: use superpowers:executing-plans to implement task-by-task.

**Goal:** Issue one tenant-bound, optionally hostname-bound offline entitlement usable by unlimited Papyrus VMs.

**Architecture:** Add a versioned organization scope alongside the existing deployment scope. Persist restrictions on an entitlement, issue through Azure Key Vault, and enforce signed restrictions using resolved runtime configuration and trusted request routing.

**Tech Stack:** TypeScript, Zod, Hono, Turso SQL, Azure Key Vault, Node crypto, Vitest, Next.js.

**Spec:** docs/superpowers/specs/2026-10-06-organization-license-design.md

## Global constraints
- Legacy documents without scope remain deployment-bound.
- Nonempty approved tenant UUIDs; optional exact allowed hostnames; no wildcard values.
- Organization license expiry is mandatory.
- License fields derive from persisted entitlements, not issuance request overrides.
- Existing Marketplace licensing retains its current behavior.
- Invalid activation cannot replace a valid license.
- Offline revocation and administrator-proof enforcement are not promised.

## Review focus
- Bootstrap onboarding must allow configuration before organization license activation, without bypassing entitlement checks.
- Auth configuration changes must invalidate mismatched organization licenses.
- Forwarded host headers must not create an allowlist bypass.
- Unknown scope or partial organization fields must fail closed.
- Shared entitlement issuance must not supersede licenses for unrelated deployments.

## Task 1: Versioned signed contract and runtime scope validation
Files: /Users/jdbohrman/papyrus/packages/contracts/src/index.ts; /Users/jdbohrman/papyrus/apps/server/src/license.ts; new /Users/jdbohrman/papyrus/apps/server/src/organization-license.ts; /Users/jdbohrman/papyrus/apps/server/tests/agent-license-organization.test.ts.

- [ ] Write failing tests using two LicenseService instances with distinct generated identity directories. Sign an organization document with the same organizationId, entitlementId, tenant allowlist, optional hostname allowlist, and expiry; assert both instances accept it.
- [ ] Add negative cases for wrong/missing tenant, wrong/missing hostname, invalid scope, empty allowlists, malformed timestamps, expired licenses, tampered claims, and invalid authority.
- [ ] Extend LicensePayload as a discriminated union: legacy/deployment scope retains deploymentId; organization scope uses organizationId, entitlementId, allowedTenantIds, optional allowedDomains, and non-null expiresAt.
- [ ] Add organization validation that verifies signature before consuming claims, rejects invalid structure and date values, then compares resolved tenant/public origin with canonical signed values. Maintain existing deployment, profile, feature, and authority checks.
- [ ] Ensure validation precedes persistence; test invalid activation leaves installed valid document untouched.
- [ ] Run `pnpm --filter @papyrus/server exec vitest run tests/agent-license-organization.test.ts tests/agent-license.test.ts tests/agent-license-branding.test.ts`.

## Task 2: Runtime wiring and request boundaries
Files: /Users/jdbohrman/papyrus/apps/server/src/agent/service.ts; /Users/jdbohrman/papyrus/apps/server/src/index.ts; onboarding/bootstrap and request middleware discovered through service entry points.

- [ ] Pass a resolved configuration accessor into LicenseService instead of relying solely on environment variables; persisted Entra onboarding configuration is supported.
- [ ] Test organization activation during onboarding with missing tenant: reject until the customer has configured Entra identity; retain access to permitted setup routes.
- [ ] Test runtime config changes: matching license becomes invalid when tenant or public origin changes.
- [ ] Identify trusted ingress handling and enforce exact hostname policy for organization-scoped requests without accepting untrusted forwarded-host values; retain health/setup behavior as explicitly required.
- [ ] Run license enforcement, Entra auth, bootstrap, and Marketplace regression tests. Run server and contracts type checks.

## Task 3: Persist entitlement scope and issue organization licenses
Files: workers/license/src/license.ts; workers/license/src/schemas.ts; workers/license/src/index.ts; workers/license/src/entry.ts; new workers/license/src/organization-licensing.ts; new workers/license/organization-license-schema.sql; workers/license/scripts/apply-schema.mjs.

- [ ] Create additive scope storage keyed by entitlement ID with customer organization ownership, tenant/domain JSON, explicit organization scope, timestamps, and approving administrator identity.
- [ ] Add Beag-admin-only `PUT /api/v1/entitlements/:id/license-scope` to persist validated scope. Reject expired/inactive entitlements, missing mandatory expiry, invalid UUIDs, wildcard/URL domain values, and unknown scope.
- [ ] Add `POST /api/v1/entitlements/:id/licenses` for organization issuance; derive organization, term, profiles, features, and restrictions entirely from persisted records.
- [ ] Reuse Azure Key Vault signing and canonical payload hashing. Store organization issuance independently of the current non-null deployment foreign key rather than fabricating a deployment ID.
- [ ] Audit scope changes and issuance; scope updates require reissue and do not mutate already-signed licenses. Supersede only organization issuances for this entitlement.
- [ ] Test unauthenticated/partner denial, tenant normalization, exact hostname normalization, active term checks, signing failure with no committed issuance, and database ownership joins.
- [ ] Run `npm run typecheck` in workers/license and the endpoint tests. Validate the additive SQL on a local scratch database. Do not apply production migrations or deploy during implementation.

## Task 4: Administration, generation workflow, and documentation
Files: components/licensing/licensing-console.tsx; components/licensing/order-lifecycle-manager.tsx; workers/license/README.md; Papyrus licensing documentation and dev minting scripts.

- [ ] Add an explicit scope selector and approved tenant/domain fields for entitled customers. Show term, organization, restrictions, and issuance history before generating.
- [ ] Provide organization license generation/download through the entitlement endpoint; retain the existing per-deployment activation and download flow.
- [ ] Label organization licenses as unlimited deployments within the licensed organization, with offline validation and explicit expiry.
- [ ] Update documentation with issuance through www.beaglabs.com/licensing, backend license.beaglabs.com, Azure Key Vault signing, migrations, issuer/runtime rollout order, and renewal behavior.
- [ ] Run UI syntax/type checks and review organization issuance/download behavior. Run both repositories' diff checks, relevant tests, and contracts drift check. Report unrelated baseline failures separately.

## Execution
Recommended: native implementation in this session, with security-focused final review. No production migration, key changes, license issuance for a real customer, or deployment is included.
