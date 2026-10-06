# Organization-bound Papyrus licensing

## Purpose
Support unlimited customer-hosted VMs under one signed organization entitlement, with approved Microsoft Entra tenants, optional exact hostname restrictions, and a fixed expiry. Preserve existing deployment-bound licenses.

## License contract
Use a discriminated scope: legacy documents without scope remain deployment-bound. New organization documents use scope=organization, a stable customer organization ID, entitlement ID, nonempty approved tenant UUIDs, optional exact allowed hostnames, profiles, features, issuedAt, and mandatory expiresAt. Organization documents do not depend on a VM's deployment key. No wildcard tenant or domain values. Normalize hostnames and tenant IDs before signing. The issuer derives commercial rights from persisted entitlements, never arbitrary issuance request fields.

## Issuer and administration
Extend organization/entitlement administration with approved tenant IDs, optional hostnames, and explicit organization scope. Scope remains deployment by default. Organization scope must be explicitly enabled by a Beag administrator. Preserve Azure Key Vault signing, issuance audit records, and authority pinning. Record an issuance against an organization entitlement; do not supersede another deployment's license unintentionally. Provide an admin issuance action and download using the existing licensing service.

## Runtime enforcement
Verify the signature before using organization claims. Require the resolved Microsoft Entra configuration's tenant ID to match the signed allowlist. Existing token verification already rejects tokens from other configured tenants. When domains are restricted, require the configured public origin's hostname to match and validate external request routing against the approved hostname without trusting arbitrary forwarded headers. Continue expiry, feature, profile, and authority checks. Reject malformed scope, missing tenant configuration, malformed dates, and unknown fields that could downgrade enforcement. Failed activation must not replace a valid installed license. Scope must be checked on runtime license validation, including after configuration changes.

## Offline and unlimited deployment behavior
The same organization document may activate multiple independently keyed deployments. Local validation requires no Beag callback. Copying a deployment identity is unnecessary. Offline revocation and tamper-proof enforcement against the machine administrator are not promised. Entra authentication has its own connectivity and sovereign-environment requirements; offline license validation does not imply fully offline Entra sign-in.

## Compatibility
Existing deployment documents and Azure Marketplace entitlement validation retain their current behavior. No domain-only substitute for organization identity. Internal aliases and disaster recovery hostnames must be explicitly included when hostname restrictions are enabled. This feature does not infer organization ownership from a typed company name or DNS suffix.

## Validation
Cover issuance authorization, persisted entitlement constraints, correct tenant, wrong tenant, missing tenant, correct/wrong hostname, malformed claims, signature tampering, expiry, profile restrictions, legacy licenses, Marketplace licenses, configuration changes, and reuse across two distinct deployment keys. Run the issuer's type checks and relevant Papyrus license/auth tests.
