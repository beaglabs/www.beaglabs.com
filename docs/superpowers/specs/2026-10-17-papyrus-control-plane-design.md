# Papyrus Control Plane: Design

Date: 2026-10-17
Repos: `www.beaglabs.com` → new `workers/control-plane` (papyrus.beaglabs.com); `workers/license` (registration, chat); `papyrus` (VM/container side)

## Intent

Beag Labs runs its own control plane for Papyrus deployments instead of relying on Azure Marketplace. A customer
signs up at papyrus.beaglabs.com, pays through Stripe, connects their own cloud account, and the control plane
deploys the hardened Papyrus container into it, then walks them through DNS and health checks until the deployment
is live. Billing, licensing and Beag Labs messaging (chat bubble, admin app) all key off this one source of truth.

Why: Marketplace plans, BYOL uploads and per-plan user gating were too many flows to manage. One place that knows
every deployment and whether it is paid removes them.

## Goals

- `papyrus.beaglabs.com` with `/signup`, `/login`, `/billing`, `/provision`, `/deploy` (and the setup page they lead to).
- One plan per deployment, unlimited users, after a 14-day free trial, billed through Stripe: **$250/month platform +
  $0.50 per VM hour + $0.00194444 per agent-second (≈ $7/agent-hour)**.
- A provider dropdown, with logos, of every Distilled provider that can run the hardened container, and a credential form
  generated from a per-provider description.
- AWS: a one-click **Connect AWS** button (AWS logo) that creates a role only the control plane can assume.
- A setup step that verifies and shows pass/fail for: credentials, deploy, DNS, container health, registration.
- Deployments created by the control plane are registered with Beag Labs at creation, so the chat bubble, admin app
  and analytics work on any provider, not only Azure Marketplace VMs.
- Papyrus checks in with the control plane and shows suspension when billing lapses.

## Non-goals

- User counting, user caps, grace periods, Team/Organization plans.
- New Marketplace plans or Marketplace billing changes. Existing Marketplace installs keep working as they do today
  (IMDS plan matching, attested registration, manual license upload) as legacy.
- Customers bringing their own image, or running anything other than the published, signed hardened container.
- Distilled providers that are not places to run Papyrus (Stripe, Neon, Slack, …) and app-hosting platforms that can't
  run a long-lived container with a persistent volume (Vercel, Expo EAS, …).

## Anti-goals (failure even if it "works")

- A customer has to manage more than one flow to get running or to pay.
- Cloud credentials stored in plaintext, logged, or usable for anything except deploying and updating that customer's Papyrus.
- A running deployment is suspended because the control plane was unreachable rather than because billing lapsed.
- Existing Marketplace deployments break.

## Decided

### Stack

- One Cloudflare Worker, written with **Effect**, at `papyrus.beaglabs.com`.
- Provider calls go through **Distilled** (`@distilled.cloud/<provider>`, Effect-native, runs on Workers). Stripe can
  go through `@distilled.cloud/stripe` too.
- Distilled is at `1.0.0-rc.15`; pin exact versions.

### Provider dropdown and credential form

- The dropdown lists the Distilled Clouds (aws, azure, gcp, cloudflare, digitalocean, hetzner, hostinger, ovh, stackit)
  and the Platforms that run containers (kubernetes, docker, fly-io, render, coolify, daytona, and similar).
- Each provider is one entry in a registry: id, display name, logo, credential fields (name, label, secret or not,
  "where to find this" link), the cheap read-only call used to check credentials, and the deploy recipe.
  The form renders from the entry; adding a provider is adding an entry.
- Credential fields come from each Distilled package's credential/config layers (the site only documents a few,
  e.g. `CLOUDFLARE_API_TOKEN`, `GOOGLE_ACCESS_TOKEN`, AWS `Credentials.fromChain`).
- On save, the control plane runs the provider's read-only check (e.g. list regions) and shows pass or a clear error.

### Connect AWS

- A button with the AWS logo opens the AWS console with a CloudFormation quick-create link. The template creates an
  IAM role trusting Beag Labs' AWS principal, with an `ExternalId` unique to the customer, scoped to what the deploy
  recipe needs.
- When the stack completes, the setup page picks up the role ARN (customer pastes it, or a callback) and verifies it by
  assuming it.

### Setup page

Pick provider → connect → deploy → DNS → health → Connect Microsoft → registration. Each step shows pending/pass/fail with the reason and a
retry. Done when all are green.

- **Deploy**: run the signed image `ghcr.io/beaglabs/papyrus/papyrus@<digest>` with a persistent volume at
  `/var/lib/papyrus`, as the image's non-root user, with the env described under Registration.
- **DNS**: the customer picks a hostname; the page shows the record(s) to create and verifies them.
- **Health**: `GET https://<hostname>/api/health` succeeds over valid TLS.
- **Connect Microsoft**: sign-in stays Microsoft Entra in the customer's own tenant. This step hands off to the Entra onboarding
  Papyrus already has, and passes once a system owner has completed it.
- **Registration**: the deployment has exchanged its bootstrap token (below).

### Billing

- One Stripe subscription per deployment on product `prod_VSbVkLF1STkdjO` (`STRIPE_PRODUCT`), with three items:
  - Platform: **$250/month**, licensed price `STRIPE_PRICE_PLATFORM` (quantity 1).
  - VM compute: **$0.50 per VM hour**, metered price `STRIPE_PRICE_COMPUTE`.
  - Agent execution: **$0.00194444 per agent-second** (≈ $7/agent-hour), metered price `STRIPE_PRICE_EXECUTION`.
  Price ids are wrangler vars. Checkout creates the subscription with all three items (metered items without a quantity),
  a 14-day trial and the card collected at signup; the Stripe customer portal handles cards and invoices.
- Metered prices are tied to Stripe Billing Meters. The control plane resolves each one at runtime
  (`price.recurring.meter` → `GET /v1/billing/meters/{id}` → `event_name`) and caches it in D1 (`stripe_meters`). No event
  names are hardcoded and the control plane creates no Stripe objects.
- Compute: an hourly cron (`5 * * * *`) sends one meter event, value 1, per deployment that was running during the hour
  that just ended (provider set, deploy step passed before the hour ended, billing active). Identifier and Idempotency-Key
  `<deploymentId>:<hourStart ISO>`. Failed sends are retried by later runs for 24 hours.
- Execution: Papyrus reports agent-seconds to `POST /api/deployments/usage` (contract below); each report becomes one meter
  event, value `executionSeconds`, identifier `<deploymentId>:<reportId>`.
- While a subscription is trialing no meter events are sent: the usage is recorded as dropped and logged as INFO.
  Every meter push (sent, dropped, failed) is one `billing` line in Activity, never with customer ids or keys.
- The trial end comes from Stripe's `trial_end` on `customer.subscription.*` webhooks (`billing_periods`); a trialing
  deployment without one is backfilled from `GET /v1/subscriptions/{id}`. The Plan card and Billing page show
  "Trial · N days left · ends Oct 31", and a slim trial banner sits at the top of every console page while trialing.
- The Plan card and Billing page show the three prices and "This month so far: N VM hours · M agent minutes · $X estimated"
  from local meter records. The plan step before payment shows the three charges and an estimate by organization size,
  both rendered from constants (`src/pricing.ts`).
- The trial starts when the customer subscribes; deploying is allowed during the trial.
- Stripe webhooks set each deployment's billing state: `trialing`/`active` → active; `past_due`/`unpaid`/`canceled` → `suspended`.
- Nothing is ever deleted from the customer's cloud. A cancelled or unpaid deployment stays suspended; the customer removes
  the resources themselves. Paying again lifts the suspension.

### Licensing (check-in)

- The control plane is the source of truth for whether a deployment is allowed to run.
- Papyrus periodically fetches a signed status `{ deploymentId, state: 'active' | 'suspended', issuedAt, expiresAt }`
  from the control plane, authenticated with its deployment key. Signed with the existing Key Vault signer
  (`azure-key-vault-signer.ts`) and verified with the keys Papyrus already trusts.
- When suspended, every user sees: **"This workspace has an overdue invoice and is currently suspended. Please talk to your admins."**
  Nothing runs while suspended: sign-in, agents, workflows and schedules all stop. Data is kept, and everything resumes when paid.
- When the control plane creates a deployment it also issues a normal signed license (every feature, `commercial` profile,
  bound to the customer's hostname), installed at deploy. The signed status sits beside it and only says active or suspended.
- Control-plane-managed deployments don't need Marketplace plan matching or license upload.

### Messaging (chat bubble, admin app, analytics)

- Today registration requires an Azure IMDS attested document (`provisioning-control-plane.ts`, `workers/license/src/registration.ts`),
  which is why the bubble never appears off Azure.
- Control-plane deployments are registered at creation: the control plane creates the `papyrus_deployments` row and
  passes the container a one-time bootstrap token and deployment ID. On first start, Papyrus exchanges the token for
  its deployment key and stores it (same storage it uses today), then registration state is `registered`.
- Chat, huddles, inbox and leads are unchanged. The admin app shows control-plane deployments and their billing state.

## Calls made by Claude (check these)

- The new Worker lives at `www.beaglabs.com/workers/control-plane`, next to `license` and `connect`.
- The control plane reaches the license Worker's data through a **service binding** rather than sharing code, so
  deployment rows and deployment keys keep a single owner.
- Credentials are stored in D1 encrypted with AES-256-GCM, key held as a Worker secret, the customer account id as
  associated data. Decrypted only inside a deploy, update or check.
- The container needs a 32-byte master key for its local secret store off Azure. The deploy recipe generates it per
  deployment and supplies it as a provider secret mounted read-only (`PAPYRUS_SECRET_KEY_FILE`), never in the image or
  the data volume.
- Check-in every hour. A deployment that can't reach the control plane keeps its last status until it expires (7 days);
  only an explicit `suspended`, or an expired status, suspends it.
- DNS verification uses DNS-over-HTTPS to 1.1.1.1.
- Sign-in to papyrus.beaglabs.com itself (not to Papyrus): email magic link plus Sign in with Microsoft and Google.
- The status signer stays in the license Worker; the control plane signs through the service binding.

## Left to the builder

- The deploy recipe per provider (e.g. ECS Fargate + EFS vs. EC2 on AWS; Container Apps vs. VM on Azure), within the
  constraints above.
- Which Platforms make the first list, based on persistent-volume support.
- D1 schema, Effect service layout, and how deploy progress is tracked (Durable Object or Workflows).
- TLS approach per provider.
- How updates roll out to existing deployments.


## Contract between the three pieces

### License Worker RPC (service binding `LICENSE` from the control plane)

`workers/license` exports `class LicenseRpc extends WorkerEntrypoint<Bindings>` (named entrypoint `LicenseRpc`) with:

- `createDeployment({ accountId: string, hostname: string, provider: string, organization: string }) → { deploymentId: string, bootstrapToken: string, license: SignedLicense }`
  Creates the `papyrus_deployments` row (source `control-plane`), a one-time bootstrap token (stored as sha256, expires 7 days),
  and a signed deployment-scope license: every feature, profiles `['commercial']`, `publicOrigin: https://<hostname>`, `expiresAt: null`.
- `verifyDeploymentKey(deploymentId: string, deploymentKey: string) → boolean`
- `signStatus({ deploymentId, state: 'active' | 'suspended' }) → SignedStatus` with `issuedAt` now and `expiresAt` now + 7 days.
- `registrationState(deploymentId: string) → 'pending' | 'registered'`
- `chatSession({ accountId, userId, email, name, deploymentId?, tenantId? }) → { token, expiresAt, tenantId, user }` (same shape as `POST /api/papyrus/session`). Scoped to the tenant of the account's deployment once a Papyrus user has bound it, otherwise to `cp:<accountId>`; pre-tenant conversations move into the tenant when it resolves.

`SignedStatus = { payload: { deploymentId: string, state: 'active' | 'suspended', issuedAt: string, expiresAt: string }, keyId: string, signature: string }`,
signed exactly like licenses (canonical JSON, Key Vault RS256, same `keyId` scheme), so Papyrus verifies it with the keys it already trusts.

### Public routes Papyrus calls

- `POST https://license.beaglabs.com/api/provision/control-plane/exchange` body `{ deploymentId, bootstrapToken }` →
  `200 { deploymentId, deploymentKey }`; second use or expired → `410`; unknown → `404`. Marks the deployment registered.
- `GET https://papyrus.beaglabs.com/api/deployments/status` with `Authorization: Bearer <deploymentKey>` and
  `X-Papyrus-Deployment-Id: <id>` → `200 SignedStatus`; bad key → `401`.
- `POST https://papyrus.beaglabs.com/api/deployments/usage` with the same `Authorization: Bearer <deploymentKey>` and
  `X-Papyrus-Deployment-Id: <id>` (verified with `LICENSE.verifyDeploymentKey`), JSON body
  `{ periodStart: string, periodEnd: string, executionSeconds: number, reportId: string }`:
  - `periodStart`/`periodEnd` ISO 8601; `periodEnd` after `periodStart`, at most 1 hour later, not in the future (60s skew allowed).
  - `executionSeconds` a non-negative integer: agent execution seconds in the period.
  - `reportId` 1–128 of `A–Z a–z 0–9 . _ : -`, unique per deployment; Papyrus reuses it when retrying the same report.
  - `200 { accepted: true, duplicate: boolean, billed: boolean }`. A repeated `reportId` answers `duplicate: true` and sends
    nothing. `billed: false` while trialing (dropped) or with no subscription. `400 { error }` invalid body; `401` bad key;
    `404` not a control-plane deployment; `502` Stripe refused the event (retry later with the same `reportId`).
  - Forwarded as one Stripe meter event: value `executionSeconds`, identifier `<deploymentId>:<reportId>`.

### Live Activity (control plane only)

- `GET https://papyrus.beaglabs.com/api/events/live`: WebSocket upgrade, signed-in session cookie, same origin only.
  One Durable Object (`ActivityHub`) per account holds that account's hibernatable sockets; every event insert notifies it
  and it broadcasts `{ type: 'event', event }` (the `GET /api/events` row shape) to that account only. Clients send
  `ping` (answered `pong`); the page falls back to polling `GET /api/events` with backoff reconnects.

### Container environment set by the deploy step

`PAPYRUS_CONTROL_PLANE_URL=https://papyrus.beaglabs.com`, `PAPYRUS_DEPLOYMENT_ID`, `PAPYRUS_BOOTSTRAP_TOKEN` (secret),
`PAPYRUS_LICENSE` (the signed license JSON; secret), `PAPYRUS_PUBLIC_ORIGIN=https://<hostname>`,
`PAPYRUS_SECRET_KEY_FILE` (path of the read-only mounted 32-byte key), data volume at `/var/lib/papyrus`.

### Suspension in Papyrus

Suspended = latest verified status says `suspended`, or the latest status has expired. Then every `/api/*` route except
`/api/health` and `/api/control-plane/status` answers `402 { code: 'WORKSPACE_SUSPENDED', message }` with the exact message
from this spec; the web app shows the message full screen; schedules, workflow runs and agent runs don't start. No status
fetched yet on a control-plane deployment (first boot) is not suspension.
