# Papyrus Admin App, Customer Chat, and Tenant Event Pipe: Design

Date: 2026-10-17
Status: Draft for review

## Intent

Beag Labs is dropping the web-based provisioning control plane, the CRM/admin pages and the partner program (all removed from `www.beaglabs.com` on 2026-10-17). In their place, the internal team (account managers and system owners) gets one native admin app for Android and macOS. With it they can:

- see what needs attention the moment they open it (notifications first)
- work Marketplace leads and assign them to account managers
- talk with customers in two-way chat that appears as an Intercom-style neobrutalist chat bubble inside the customer's Papyrus
- start live huddles (voice, with optional video) that appear in that same bubble
- open a customer (Entra tenant) record that shows a timeline of that customer's product events and errors

Customer.io-style analytics underpin all of it. Papyrus, the admin app and the website send `analytics.track` / `identify` events keyed by the customer's Entra tenant ID. The events are stored for the customer timeline and forwarded to Customer.io. Errors from Papyrus and the app go through Sentry, are tied to the same tenant ID, and alert the owning account manager.

The owner described the work as "mostly design, analytics.js work, and APIs" built on Cloudflare and the existing Entra setup.

## Goals

1. **Admin app** for Android and macOS, signing in with internal Entra.
2. **Marketplace lead CRM:** leads arrive through the existing `/api/marketplace/leads` webhook. They can be viewed, given a stage and notes, and assigned.
3. **Account manager assignment:** a dedicated tab for assigning account managers to leads and customers.
4. **Two-way chat** between the app and Papyrus. It supports text, emoji, photos, MP4 video and documents.
5. **Papyrus chat bubble:** an Intercom-style launcher and expanded chat inside Papyrus's web UI, styled neobrutalist like the rest of Papyrus. The expanded chat header shows the customer's assigned account manager.
6. **Huddles** (owner's decision, replacing scheduled video calls): Slack-style live calls attached to a conversation.
   - Either side can start one, and the other side sees a "Join huddle" bar.
   - Voice first, with camera and screen-share toggles.
   - **Voice activity detection** highlights whoever is speaking.
   - A huddle ends when the last person leaves. There's no scheduling.
7. **Tenant event pipe:** an Analytics.js-shaped `track` / `identify` / `page` endpoint. Events are keyed by Entra tenant ID, stored for timelines and forwarded to Customer.io.
8. **Error tracking:** Sentry or similar, everywhere in Papyrus and the app. Errors are tagged with tenant ID, attached to the customer record, and alert the account manager.
9. **Customer record:** one page per tenant with profile, account manager, deployments and version, and a filterable timeline of events and errors.
10. **Notifications:**
    - push notifications for new leads, customer DMs and support requests, and errors
    - distinct sounds for messages and for leads
    - a vibration on new leads (Android)
11. **Deployment registration instead of claims:** Papyrus keeps registering on first boot at `/api/provision/bootstrap`. Registration now verifies the VM with Microsoft-signed attested data, issues the deployment credential, and fires a "New deployment" Inbox alert. The web claim step and Papyrus's wait-for-claim gate are removed.

## Non-goals

- **Update links** that trigger Papyrus's update flow from chat. Explicitly dropped by the owner.
- **Licensing** in the app. Explicitly dropped; offline licenses come from the `license:issue` CLI in `workers/license`.
- **Azure Government / GCC High / DoD tenants.** Commercial Entra and commercial Azure only; a tenant is identified by its tenant ID alone. *(The owner said SLED and federal may not be a long-term target.)*
- **Disconnected or air-gapped environments.** The owner says they won't be a focus. Chat, events and errors assume Papyrus can reach Beag Labs over the internet.
- **Data-minimization and compliance hardening** for SLED or federal buyers. The owner says data security isn't a design constraint here and that the market focus is uncertain. Standard good practice (TLS, authentication, no secrets in events) still applies.
- **iOS, Windows, Linux or a web version** of the admin app.
- Bringing back the removed web control plane, CRM or partner program.

## Anti-goals (failure even if it "works")

- An app that opens on a dashboard of charts instead of what needs attention. The first 30 seconds are notifications.
- Error alerts that spam account managers on every repeat of the same error.
- A chat bubble that looks like a generic third-party widget instead of Papyrus's neobrutalist style.
- Customers able to see other tenants' data, or account managers able to act outside their role.

## Users and roles

Roles come from the Entra app registration with client ID `76fd8c28-6c8d-4b41-ae10-a99da42880a1`. They are app roles in the token's `roles` claim:

- **`Papyrus.Account.Manager`:** sees and works their assigned leads and customers, chats with those customers, and starts huddles with them.
- **`Papyrus.System.Owner`:** everything an account manager can do, across all leads and customers, plus the **Assign** tab.

*(The role split is the designer's call: owners see everything and manage assignment. Account managers are limited to what's assigned to them.)*

Customers are Papyrus end users. They aren't app users; they reach Beag Labs only through the chat bubble in their own Papyrus.

### Account managers and customers *(designer's calls)*

- **Account manager records:** created automatically the first time someone with either role signs in to the app, keyed by their Entra object ID. Name and job title come from the token or Microsoft Graph. The photo is copied once from Graph into R2, or uploaded in the app, so customers' browsers can load it in the Papyrus chat header.
- **Assignment stays per organization,** using the existing `organization_account_managers` table. One organization can have several tenants and deployments, and they all share its account manager.
- **Linking leads and tenants to organizations:**
  - When events first arrive from a tenant ID the system hasn't seen, it suggests an organization by matching email domains against Marketplace leads.
  - System owners confirm the suggestion, or link the tenant by hand, in the **Assign** tab.
  - Until a tenant is linked, its alerts go to system owners.
- **Support requests:** a conversation can be flagged as a support request from the Papyrus bubble ("Get help"). The flag carries an open/resolved status that the account manager changes in the app. There are no tickets or SLAs.

## The admin app

### Platform

- **Tauri 2** with a React + Tailwind UI, targeting Android and macOS. *(Designer's call. The reason: the app, the Papyrus chat bubble and the website can share one neobrutalist component set.)*
- **Plugins:** the official notification plugin (https://v2.tauri.app/plugin/notification/) and the haptics plugin.
- **Remote push when the app is closed** needs Firebase Cloud Messaging on Android and Apple Push Notification service on macOS. Tauri has no first-party plugin for this. **First task: spike remote push on both platforms and choose a plugin, or write a thin native bridge.**

### Navigation

- **Android:** a bottom navigation bar.
- **macOS:** a black-rail side nav, matching the website's rail and the Papyrus UI. The tiles are rounded white squares with a black border and a hard shadow, and the active tile is orange.
- **Tabs:**
  - **Inbox:** the default tab
  - **Chats**
  - **Customers**
  - **Leads**
  - **Assign:** system owners only
- Profile, role, settings and sign-out sit behind an avatar in the header or at the bottom of the rail. This keeps the Android bottom bar at five tabs or fewer. *(Designer's call.)*

### Tabs

- **Inbox:** one list, newest first, of everything needing attention:
  - new leads
  - new DMs and support requests
  - error alerts
  
  Tapping an item opens the matching lead, chat or customer record. Items can be marked done.
- **Chats:** conversations grouped by customer. Each customer shows its shared team thread and any private conversations, labelled with the customer user's name, with unread counts. A conversation shows:
  - message bubbles
  - emoji
  - photo, MP4 and document attachments with previews (inline video playback)
  - typing and read indicators
  - a "Start huddle" action and a live huddle bar
- **Customers:** a searchable list of tenants. A customer record has a profile header (organization name and tenant ID, the assigned account manager, deployments and Papyrus version) above a **timeline**. The timeline:
  - combines events and errors in time order
  - filters by events, errors or chat
  - shows each entry's properties when you expand it
  - links errors to Sentry
- **Leads:** Marketplace leads with stage, owner and notes. Stage changes and notes are saved and tracked. Once a lead becomes a customer (it gets a tenant ID), it links to that customer record.
- **Assign:** for system owners. Shows unassigned leads and customers and lets the owner assign or reassign an account manager, either one at a time or in bulk. An assignment applies to the customer's chat too, so the Papyrus chat header updates.

### Notifications

| Trigger | Sound | Haptic (Android) | Who |
|---|---|---|---|
| New Marketplace lead | Distinct "lead" sound | Vibrate | System owners, plus the assigned account manager once assigned |
| New customer DM or support request | Distinct "message" sound | Default | The assigned account manager (system owners if unassigned) |
| Error alert (new kind of error or spike) | Default | None | The assigned account manager |
| Huddle started by a customer | Distinct "message" sound | Default | The assigned account manager (system owners if unassigned) |

- **Android:** separate notification channels per type, so each has its own sound.
- **macOS:** a separate sound per notification. Macs don't vibrate, so the haptic is skipped.

## Papyrus side (`~/papyrus`)

- **Conversations (owner's decision):** each tenant has one **shared team thread** that every signed-in Papyrus user in the tenant can see and post in, plus **private conversations** that any user can start with Beag Labs.
  - Private conversations are visible only to that user and Beag Labs.
  - Every message records which customer user sent it (Entra `oid`, name).
  - In the admin app, the Chats tab and the customer record group conversations by customer: the team thread first, then each private conversation labelled with the user's name.
- **Chat bubble** in `apps/web` (React + Vite):
  - a launcher button that opens an expanded chat panel
  - the header shows the assigned account manager's name, photo and title
  - supports text, emoji and attachments (photo, MP4, document)
  - a "Join huddle" bar while a huddle is live, plus the huddle panel (participants with speaking indicators, plus mute, camera, screen-share and leave buttons)
  - an unread badge on the launcher
  - neobrutalist styling matching Papyrus
- **Analytics:** a small `analytics.track` / `identify` / `page` client in `apps/web`, and server-side tracking in `apps/server`. Every call carries the deployment's Entra tenant ID. That ID is already available on the server through `PAPYRUS_ENTRA_TENANT_ID` or the bootstrap config (see `apps/server/src/index.ts`).
- **Sentry** in `apps/web` and `apps/server`, with the tenant ID (and deployment ID) set as tags on every event.
- **Registration instead of claims (owner's decision)** (`apps/server/src/agent/provisioning-control-plane.ts`, `bootstrap-http.ts`):
  - Keep calling `POST /api/provision/bootstrap` on first boot. Send the IMDS attested document instead of self-reported resource details, and store the deployment credential it returns.
  - Remove the wait-for-claim gate and the `/bootstrap/status` polling, so setup completes without any beaglabs.com step.
  - Replace the `/bootstrap/events` `onboarding_completed` report with `analytics.track('onboarding.completed')`.
  - When the customer admin signs in with Entra during setup, their token links the tenant to the deployment, as described below.
- **Authenticating Papyrus to the backend (owner's decision: Azure Marketplace is the proof, plus Entra):**
  - **Deployment:** when Papyrus first contacts the backend, it sends the VM's Azure Instance Metadata Service *attested data*. That's a document signed by Microsoft containing the VM's subscription ID and Marketplace plan.
    - The backend checks Microsoft's signature and the plan (it must be a Papyrus plan).
    - It then issues a per-deployment credential tied to that subscription and plan.
    - Events, errors and server-side traffic use this credential.
  - **Tenant:** chat and attachment access also needs the signed-in Papyrus user's Entra token.
    - The backend checks Microsoft's signature on the token and uses its `tid` claim as the tenant.
    - It binds that tenant to the verified deployment.
    - Where the Marketplace reports the worker already ingests (`marketplace_vm_customers`) map the subscription to a customer, the binding is cross-checked against them. A mismatch is flagged to system owners.
  - **Isolation:** one tenant can never read or write another tenant's chat, events or attachments. A tenant ID typed in at setup is never trusted on its own.

## Backend (Cloudflare)

- **Deployment registration:** bring back `POST /api/provision/bootstrap` in reshaped form.
  - It checks the IMDS attested data (Microsoft signature, Papyrus Marketplace plan) and records the deployment (subscription, plan, region, VM size if supplied).
  - It returns the per-deployment credential.
  - It posts a "New deployment" item to system owners' Inbox, and to the account manager once the tenant is linked.
  - The old claim, status and private provisioning endpoints stay removed.

These parts live in `workers/license` (already on `license.beaglabs.com`, with the database, Marketplace lead webhook and Customer.io-style trial events) or in a sibling worker. That choice is the builder's.

- **Admin API:**
  - validates Entra access tokens issued for client ID `76fd8c28-…`
  - enforces roles: account managers are limited to their assigned leads and tenants
  - endpoints for leads, assignments, customers, timelines and chat history
- **Chat:**
  - one Durable Object per conversation (the tenant's team thread, or one private conversation). It holds WebSocket connections from the app and from Papyrus users, and only users allowed into that conversation can join.
  - stores message history
  - sends typing and read signals
  - triggers push notifications when the recipient is offline
- **Attachments:** stored in R2 and uploaded through signed URLs, with size limits per type (photo, MP4, document).
- **Huddles:** at most one live Cloudflare RealtimeKit meeting per conversation.
  - Starting a huddle creates the meeting if none is live, then posts a huddle-started message and a push to the other side.
  - Joining returns a participant token.
  - When the last participant leaves, the huddle ends and records its duration on the timeline.
  - **Voice activity detection:** the client uses RealtimeKit's active-speaker events, falling back to a Web Audio level meter, to show speaking indicators. It mutes noise below a threshold.
- **Event pipe:**
  - accepts Analytics.js-shaped `track` / `identify` / `page` payloads from Papyrus, the app and the website
  - checks the source's credential
  - stores events by tenant for the timeline
  - forwards them to Customer.io
  - turns DM and support-request events into account-manager notifications
- **Error intake:** Sentry webhooks (alert rules for new issues and spikes) go to the worker, which uses the tenant tag to:
  - attach the error to the customer timeline
  - send the account manager a notification and Inbox item
- **Data:** reuse the existing tables (`marketplace_leads`, `organizations`, `account_managers`, `organization_account_managers`) where they fit, and add tables for conversations, messages, huddles, events, errors and device push tokens.

## Event naming

All three sources use the same names: Papyrus, the admin app and the website. The minimum set:

- **Papyrus:**
  - `user.signed_in`, `document.created`, `workflow.run`
  - `chat.opened`, `chat.message_sent`, `support.requested`, `huddle.started`, `huddle.joined`
- **Admin app:**
  - `lead.viewed`, `lead.stage_changed`, `lead.assigned`
  - `chat.message_sent`, `chat.attachment_sent`
  - `huddle.started`, `huddle.joined`, `notification.opened`

The builder may extend this list and should keep names in `object.action` form.

## Constraints

- Cloudflare for the backend, using Workers, Durable Objects, R2 and Realtime, plus the existing Entra tenant and app registration.
- Neobrutalist visual language shared with the website and Papyrus.
- `workers/license` has been cut down to `/health`, the trial-click webhook, the Marketplace lead webhook and the usage-sync cron (uncommitted, undeployed). **Don't deploy that cut until the Papyrus build without the claim gate is the one in the Marketplace image**, or new Marketplace VMs will stall during setup. No customer VMs exist yet, so there's nothing already running to keep compatible and no stub endpoints are needed.

## Left to the builder

- Whether the backend lives in `workers/license` or a sibling worker, and the exact schema.
- The Papyrus-to-backend authentication mechanism, within the isolation requirement above.
- Which Tauri push plugin to use, or a custom bridge, after the spike.
- Sentry SaaS or a compatible alternative, and the alert-rule thresholds that count as a "spike".
- Attachment size limits and formats.
- Where the app's shared UI components live, so that the app and the Papyrus bubble can both use them.
