# One-click Connect Microsoft

Date: 2026-10-18. Status: design, for owner review.

## Goal

Today first-run setup asks the customer to register their own Entra app, copy in the tenant ID, client ID, an optional secret and a redirect URI, and then run a second sign-in so Papyrus can add its app roles. This design replaces that with one step: the customer's admin clicks **Connect Microsoft**, consents once, and is signed in as System Owner. Sign-in stays Microsoft Entra in the customer's own tenant. Customers who need their own app registration can still use it as an Advanced option.

## What Papyrus uses Entra and Graph for today

| Capability | Where | Token | Credential |
|---|---|---|---|
| Portal sign-in (OIDC code + PKCE, `tid` must match the configured tenant) | `entra-auth.ts` `startLogin`/`completeLogin`, `http.ts` `/api/auth/entra/*` | ID token, delegated | Customer app, optional secret |
| Roles: 11 `Papyrus.*` app roles read from the `roles` claim. No role means no access (`service.ts` `requirePortalAccess`). The Access page is read-only. | `entra-auth.ts`, `@papyrus/contracts`, `Access.tsx` | ID token | n/a |
| Profile and photo at sign-in (`/me`, `/me/photos/48x48`), cached locally. Also learns the org name. | `entra-auth.ts` `enrichFromGraph` | Delegated `User.Read` | Customer app |
| People picker, Staff page and photos (`/users` search) | `directory/people.ts` | App-only `User.Read.All` (client credentials). It falls back to people who have signed in when there is no secret. | Customer app secret |
| Teams tab SSO (`/api/auth/teams`). The audience is `clientId` or `api://clientId`. | `entra-auth.ts` `verifyTeamsToken` | Teams-issued token | None (JWKS only) |
| Role setup automation (adds app roles to the registration and assigns the admin System Owner) | `entra-app-setup.ts`, `bootstrap-http.ts` | Delegated `Application.ReadWrite.All`, `AppRoleAssignment.ReadWrite.All` | Customer app |
| Factory app sign-in (the `entra` OIDC provider, redirect `/f/<id>/callback`) | `factory-oidc.ts` | ID token | Customer app + secret |
| Stored ID token for Beag Labs chat | `entra-auth.ts` `idTokenFor`, `beaglabs-http.ts` | ID token | Dead: chat was removed on 2026-10-17 |
| Exchange mail and the Graph, Teams, Bookings and SharePoint connectors | `graph-client.ts`, `session-connectors.ts` | Per-connector credential | Separate from sign-in; **unchanged** |

National clouds (`USGov`, `USGovDoD`) use different authority and Graph hosts.

## Registration

- **App:** one multi-tenant app, "Papyrus by Beag Labs", registered in Beag Labs' own Entra tenant (the tenant that holds the license-signing Key Vault). It has a single redirect URI, `https://papyrus.beaglabs.com/microsoft/callback`, and `signInAudience: AzureADMultipleOrgs`.
- **Credential:** a certificate whose private key is non-exportable in Key Vault. The broker signs client assertions through Key Vault, the same way `azure-key-vault-signer.ts` already signs. No client secret exists anywhere.
- **Permissions:**
  - Delegated: `openid`, `profile`, `email`, `User.Read`.
  - Application: `User.Read.All` (directory, Staff page, photos).
  - Nothing else. The role-setup permissions are no longer needed (see Roles).
- **Publisher verification:** link a Microsoft Cloud Partner Program ID to the verified `beaglabs.com` domain. Unverified multi-tenant apps show an "unverified" warning, and many tenants block consent to them. Also set the logo and the terms and privacy URLs.
- **Clouds:** Public cloud only. Gov-cloud tenants use their own app registration (Advanced).

## Consent and tenant binding

1. In first-run setup, the admin clicks **Connect Microsoft**. Papyrus asks the broker to start a `consent` transaction (see Redirect handling).
2. The broker sends the admin to the admin-consent endpoint (`/organizations/v2.0/adminconsent`, `scope=.default`). If they are already signed in, a normal sign-in to identify them follows without a prompt. Granting `User.Read.All` needs a Global Administrator or Privileged Role Administrator. If the admin lacks the right, the error page gives them a consent link to send to someone who has it.
3. **Binding:** the first successful consent writes `tenant_id` on the deployment row (license Worker). From then on the broker refuses any sign-in whose `tid` differs, and Papyrus also checks `tid` against its own saved `entra.tenantId`. Only Beag Labs support can rebind, from the control plane.
4. The admin who consented becomes System Owner, and Papyrus finishes setup. The control plane's **Connect Microsoft** step passes when the binding exists.

## Redirect handling

**(a) Central callback broker.** Recommended.

Every sign-in goes through `papyrus.beaglabs.com`:

1. Papyrus creates a transaction `{ kind: portal | consent | factory:<id>, state, nonce, returnTo }` with `POST /api/microsoft/transactions`, authenticated with its deployment key, and redirects the browser to `/microsoft/start?txn=…`.
2. The broker runs Entra's code + PKCE flow with its own verifier. At the callback it redeems the code using the Key Vault certificate, verifies the ID token, and checks `tid` against the binding.
3. The broker calls `/me` and the photo with the delegated token, then **discards every Microsoft token**.
4. The broker builds an identity assertion: `type: papyrus-identity`, `aud` = deployment ID, `oid`, `tid`, the name and profile fields, the nonce, and a 5-minute expiry. The license Worker signs it with a dedicated Key Vault key. The key ID goes in `PAPYRUS_LICENSE_AUTHORITIES`, and the `type` field stops a license being replayed as an assertion.
5. The browser comes back to `https://<host>/api/auth/entra/callback?handle=…&state=…`. Papyrus redeems the one-time handle (valid 60 seconds) **server-to-server with its deployment key**, so assertions and photos never pass through the browser. It verifies the assertion with the key it already trusts and issues its normal portal cookie.

The result: no secrets on deployments, no per-deployment Entra changes, and Factory app sign-in works the same way.

**(b) Per-deployment redirect URIs added through Graph.** Rejected.

- An app registration allows at most 256 redirect URIs. Factory apps add one more per published app (`/f/<id>/callback`), so the limit arrives quickly.
- Each deployment would have to redeem codes with the app's credential. A shared secret or certificate on every deployment lets one compromised deployment get app-only `User.Read.All` tokens for **every** customer tenant that has consented.

**(c) Bounce only: the broker forwards the code, and the deployment redeems it with a federated credential.** Considered and rejected for the same reason as (b). The federated credential is a credential for the app, not for one tenant, so any deployment holding one can reach every consenting tenant.

**The trade-off, stated plainly:** under (a), Beag Labs becomes an identity broker for customer sign-ins.

- Beag Labs sees each sign-in's identity and profile and can mint assertions that Papyrus will accept. Anyone who compromises the broker or its signing key could sign in as any user of any hosted deployment.
- Sign-in depends on `papyrus.beaglabs.com` being up. Existing sessions last one hour.

Customers who cannot accept this use their own app registration.

## Roles

**Decision: Papyrus-managed roles.** The multi-tenant app declares no app roles.

- A `role_assignments(oid, role, granted_by, granted_at)` table in the deployment, with every change audited. The 11 role names and the rules stay the same, including that Owner does not imply `Payments.Approve` or `Ledger.Manage`.
- The consenting admin is seeded as System Owner. Owners grant and revoke roles on the Access page, which becomes writable, using the existing people picker.
- An authenticated user with no role sees "Ask your Papyrus owner for access". `requirePortalAccess` reads the table instead of the token.
- Tenants that want Entra to gate access can still switch on "Assignment required" on the enterprise app. That needs no Papyrus change.
- Why not app roles on the multi-tenant app: assigning the first owner would need `AppRoleAssignment.ReadWrite.All` in the one-click consent, and every later role change would mean a trip to the Entra portal.
- With their own app registration, effective roles = token app roles ∪ Papyrus assignments, so existing deployments keep working.
- `docs/security.md` ("no local user database or role assignment") must be updated.

## Graph tokens

- **Delegated (profile at sign-in):** the broker uses the token at the callback and passes only the resulting profile, inside the assertion. Deployments never hold delegated tokens.
- **App-only (directory):** `POST /api/microsoft/app-token`, authenticated with the deployment key. The broker returns a Graph token, valid for an hour, for the **bound tenant only**, and `PeopleDirectory.appToken()` calls this instead of client credentials. Beag Labs mints the token but never sees the directory data.
- **Teams SSO:** Papyrus verifies the Teams token directly against Microsoft's signing keys (JWKS). The audience is the Beag Labs app ID and `tid` must match the binding. No broker call is needed.
- **New Graph features later:** each adds its permission to the app, and consent is requested when the feature is turned on, through incremental consent and the same broker. On-behalf-of is not needed: deployments hold no user tokens.
- **Connectors:** unchanged. They use their own credentials.

## Coexistence

- `config.entra.mode: 'beaglabs' | 'byo'`. Every existing deployment has a saved `tenantId`/`clientId`, so it loads as `byo` and works exactly as today.
- New hosted deployments default to `beaglabs`. First-run setup shows the **Connect Microsoft** button, with "Use your own app registration" under Advanced, which is today's form and role automation, unchanged.
- `byo` is required for gov clouds, the `disconnected` profile, and any deployment that has not registered with Beag Labs.
- **Switching `byo` → `beaglabs`:** an owner reconnects from Settings. The tenant must match. Previously signed-in people are listed so roles can be granted quickly.

## Changes

**Control plane (`workers/control-plane`):**
- Routes:
  - Broker: `/microsoft/start`, `/microsoft/callback`, `/microsoft/consent`.
  - Deployment-key routes: `/api/microsoft/transactions`, `/api/microsoft/redeem`, `/api/microsoft/app-token`.
- A D1 table for transactions and one-time handles, with a TTL.
- A Key Vault client-assertion signer.
- The **Connect Microsoft** setup step checks the binding.
- A script that manages the app registration's manifest.

**License Worker:**
- `bindTenant(deploymentId, tenantId)` and `boundTenant(deploymentId)` on `LicenseRpc`, reviving `papyrus_deployments.tenant_id`, which the control-plane spec had dropped.
- `signIdentityAssertion(payload)` with its own key ID.
- Revoked deployments get no assertions or tokens.

**Papyrus:**
- `Onboarding.tsx`: the one button, with Advanced for your own app.
- `bootstrap-http.ts`: start and return routes for consent.
- `entra-auth.ts`: a broker sign-in path and verification of the assertion.
- `people.ts`: the new token source.
- `factory-oidc.ts`: the `entra` provider goes through the broker.
- A role store, a writable `Access.tsx`, and `requirePortalAccess` reading the store.
- Remove `idTokenFor` and the chat leftovers in `beaglabs-http.ts`.
- Ship the new key ID in the default authorities.

## Failure modes

| Failure | Behaviour |
|---|---|
| Broker down | New sign-ins fail with "Microsoft sign-in is unavailable". Signed-in sessions continue. |
| Admin lacks rights to grant consent | The error page offers a shareable admin-consent link. |
| User from another tenant | Rejected at the broker and again at Papyrus. |
| Consent revoked in the tenant | Sign-in shows Entra's error. Owners see **Reconnect Microsoft**. |
| Lost handle or expired transaction | Sign-in restarts. Handles are single-use, deployment-bound and expire after 60 seconds. |
| Assertion key rotation | The new key ID ships in authorities before signing switches over. |

## Decisions (owner, 2026-10-18)

1. **Broker:** yes. Beag Labs (papyrus.beaglabs.com) brokers sign-in for one-click deployments.
2. **Directory access:** ask later. One-click consent covers sign-in only; staff-directory access is a separate, later consent.
3. **Bring-your-own app registrations:** keep their Entra app roles as they work today. There are no paying customers on them, so no migration. *(Claude's call: the owner was unsure, and this is the no-work option that can be revisited.)*
4. **Publisher verification:** the owner gave "beaglabs". That looks like the Partner Center *publisher* ID. Publisher verification needs the numeric Microsoft Partner ID (Partner Center → Account settings → Identifiers → Partner ID). Until that's set, the consent screen shows "unverified"; nothing else is blocked.
