# Organization license administration

Licenses are generated in **https://www.beaglabs.com/licensing**, using the dedicated **https://license.beaglabs.com** backend and a version-pinned Azure Key Vault signing key. This feature requires both the updated issuer and the updated Papyrus runtime; it does not issue real customer licenses automatically.

## Generate and deliver

1. Sign in as an approved Beag Microsoft administrator. Partner accounts cannot approve restrictions or generate licenses.
2. Book the customer order and create its entitlement. The entitlement must be active, belong to the active customer organization, and have a started, finite, future expiry. Features, profiles, and term come from this record.
3. Open **Entitlements → Organization licensing** and select the entitlement.
4. Choose **Organization · unlimited VMs**. Enter approved customer Entra directory UUIDs. Optionally enter exact public hostnames, including any disaster recovery names. URLs, wildcard domains, and wildcard tenants are rejected. Empty hostname input means no hostname restriction; tenant binding is always required.
5. Save the approved scope, review the customer and expiry, and select **Generate license**. The signed document opens in the download panel. History can reopen previously issued documents.
6. Deliver the JSON document to the customer. On a new Papyrus deployment, upload it during first-run setup together with the Entra app configuration. A configured deployment can import it through `/api/license/activate`.

The same organization document can activate unlimited independently keyed VMs within its approved tenant and hostname restrictions. Organization licenses do not require registering every VM in the deployment registry. Single-deployment licenses retain their registration and issuance flow on the **Deployments** tab; scope defaults to deployment until explicitly approved otherwise.

## Rollout

1. Apply `workers/license/organization-license-schema.sql` to the issuer database. The existing schema application script now includes it after the base and branding schemas. It adds two tables and leaves the legacy deployment issuance foreign key intact.
2. Deploy the updated Papyrus runtime before delivering any organization documents. Old runtimes understand deployment-bound documents only.
3. Deploy the updated licensing Worker, then the website console. Updated deployment issuance also reads the scope table, so migration must precede the Worker rollout.
4. Configure existing `PAPYRUS_LICENSE_AUTHORITIES` with the issuing Key Vault public key and its exact versioned key URI. No private key belongs in Papyrus or the website.
5. Configure Papyrus’s canonical public origin and Entra identity. If domains are restricted, every reverse proxy must preserve the external hostname in the raw `Host` header. Forwarded-host headers cannot satisfy the license allowlist. The default appliance nginx configuration already preserves `Host`.

Implementation verification uses scratch databases and generated test keys. No production migration, key change, deployment, or real license issuance was performed.

## Renewal and limits

Save new restrictions or extend the commercial term, then generate and distribute a replacement document. Reissue supersedes only prior organization issuances for that entitlement in the administration database; it leaves unrelated deployment licenses alone. Old offline documents remain usable until their signed expiry. Changing scope does not revoke documents already distributed.

License verification runs locally, without a Beag callback. It checks the authority signature, profile, expiry, configured Entra tenant, configured public origin, and restricted request hostname. A changed tenant or origin invalidates a mismatched license. Portal sign-in still follows the configured Entra tenant’s token verification and connectivity requirements; offline licensing does not make Entra authentication offline.

This restricts ordinary deployment use. A customer with administrator control over the VM can modify software or its clock; this is not tamper-proof enforcement against the machine owner. DNS ownership is not inferred from a hostname, and an organization name does not substitute for a tenant ID.

## API

All routes require Beag Microsoft administrator identity:

- `GET /api/v1/entitlements/:id/license-scope`: scope, organization, term, restrictions.
- `PUT /api/v1/entitlements/:id/license-scope`: `{ "scope": "organization", "allowedTenantIds": ["directory-uuid"], "allowedDomains": ["papyrus.customer.com"] }`. Omit `allowedDomains` to omit hostname restrictions. `{ "scope": "deployment" }` restores the deployment issuance path.
- `POST /api/v1/entitlements/:id/licenses`: send `{}`; claim overrides are rejected. Returns `{ issuanceId, document }` after signing and database commit.
- `GET /api/v1/entitlements/:id/licenses`: organization issuance history, including signed documents for download.

Scope changes and issuance are audited. A signer failure writes no issuance. If entitlement rights, ownership, or scope change during signing, issuance fails without returning the uncommitted document.
