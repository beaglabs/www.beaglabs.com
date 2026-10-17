# Admin App / Papyrus Chat: API Contract

This contract implements `2026-10-17-papyrus-admin-app-design.md`.

**Host:** `https://license.beaglabs.com`, served by the `workers/license` Worker.

Bodies are JSON unless noted. Errors are returned as `{ "error": "<code>", "message": "<text>" }` with a 4xx/5xx status.

## Auth

### 1. Staff (admin app)

- **Header:** `Authorization: Bearer <Entra access token>`.
- **Token source:** the Beag Labs tenant (`MICROSOFT_TENANT_ID`), app registration `76fd8c28-6c8d-4b41-ae10-a99da42880a1`.
  - Authorization-code + PKCE through the system browser.
  - Scope: `api://76fd8c28-6c8d-4b41-ae10-a99da42880a1/access_as_user offline_access openid profile`.
- **The Worker checks:**
  - the signature, against `https://login.microsoftonline.com/<MICROSOFT_TENANT_ID>/discovery/v2.0/keys`
  - `iss` = `https://login.microsoftonline.com/<MICROSOFT_TENANT_ID>/v2.0`
  - `aud` ∈ {`api://76fd8c28-6c8d-4b41-ae10-a99da42880a1`, `76fd8c28-6c8d-4b41-ae10-a99da42880a1`}
  - `exp`
- **Roles** come from the `roles` claim:
  - `Papyrus.System.Owner` → `owner`
  - `Papyrus.Account.Manager` → `manager`
  - neither → 403
- **Account manager record:** the first request upserts an `account_managers` row keyed by `oid`.

### 2. Deployment (Papyrus server)

- **Header:** `Authorization: Deployment <deploymentKey>`.
- **Storage:** the Worker stores only SHA-256(key).

### 3. Customer chat session (Papyrus browser)

- **Header:** `Authorization: Bearer <sessionToken>`. WebSockets use `?token=` instead.
- **Format:** an HMAC-SHA256 JWT using `CHAT_SESSION_SECRET`, lasting 1 hour.
- **Claims:** `{ sub: oid, tid, dep, name, kind: "customer" }`.

## Registration

### `POST /api/provision/bootstrap` (no auth)

Request:
```json
{
  "papyrusDeploymentId": "string",
  "attested": { "encoding": "pkcs7", "signature": "<base64 IMDS attested signature>" },
  "nonce": "string",
  "publicOrigin": "https://... | null",
  "version": "string | null",
  "entraClientId": "string | null"
}
```

The Worker:
- verifies the PKCS#7 signature chains to a Microsoft `metadata.azure.com` signing certificate
- checks that the signed `nonce` matches
- reads `subscriptionId`, `vmId` and `plan`
- requires `plan.publisher` / `plan.product` to equal `PAPYRUS_MARKETPLACE_PUBLISHER` / `PAPYRUS_MARKETPLACE_PRODUCT`. If those vars are unset, the plan check is skipped, but the signature check still applies.

Response `201`:
```json
{ "deploymentId": "dep_...", "deploymentKey": "<shown once>" }
```

- Registering the same `vmId` again rotates the key.
- **Side effect:** an Inbox item `deployment.registered` (owners).

## Papyrus-facing

### `POST /api/papyrus/session` (Deployment auth)

Request: `{ "idToken": "<signed-in user's Entra ID token>" }`

**Checks:**
- the signature, against `https://login.microsoftonline.com/<tid>/discovery/v2.0/keys`
- `iss` = `https://login.microsoftonline.com/<tid>/v2.0`
- `exp`
- `aud` equals the deployment's `entraClientId`, when one is set

**Tenant binding:**
- The first valid token binds the deployment to `tid`. A later different `tid` → 403 `tenant_mismatch`.
- Binding:
  - upserts a `tenants` row
  - adds an Inbox item `tenant.bound`
  - cross-checks the subscription against `marketplace_vm_customers`, flagging a mismatch as `tenant.subscription_mismatch` to owners

Response:
```json
{
  "token": "...",
  "expiresAt": "ISO",
  "tenantId": "...",
  "user": { "oid": "...", "name": "..." }
}
```

### `POST /api/v1/track`

Analytics.js-shaped batches.

**Auth:**
- Deployment auth: the tenant comes from the binding.
- Staff auth: `source=admin`.
- No auth: `source=web`. Tenantless only, rate-limited per IP, each item ≤ 1 KB.

Request:
```json
{ "batch": [ {
  "type": "track | identify | page",
  "event": "object.action",
  "userId": "string?",
  "anonymousId": "string?",
  "properties": {},
  "traits": {},
  "timestamp": "ISO",
  "context": {}
} ] }
```

- At most 100 items and 256 KB per batch.
- Stored in `tenant_events` and forwarded to the Customer.io Track API (`CUSTOMERIO_SITE_ID` / `CUSTOMERIO_API_KEY`). Forwarding is skipped if those are unset.
- `support.requested` creates an Inbox item.

Response: `{ "accepted": n }`.

## Chat

Customer session tokens and staff tokens both work on these routes.

### Visibility

- A customer sees their tenant's `team` conversation plus their own `private` conversations.
- A manager sees conversations of tenants whose organization is assigned to them.
- An owner sees all conversations.

### Routes

- `GET /api/chat/conversations` returns `Conversation[]`. The team thread is created on a customer's first call.
- `POST /api/chat/conversations` (customer), body `{ "kind": "private" }`, returns `Conversation`.
- `GET /api/chat/conversations/:id/messages?before=<messageId>&limit=50` returns `Message[]`, oldest first.
- `GET /api/chat/conversations/:id/ws?token=…` opens a WebSocket handled by the `ConversationRoom` Durable Object, one per conversation id.
- `POST /api/chat/conversations/:id/support`, body `{ "status": "open" | "resolved" }`. Customers may only open.
- `POST /api/chat/attachments`, body `{ "conversationId", "name", "contentType", "size" }`, returns `{ "attachmentId", "uploadUrl" }`.
  - Then `PUT uploadUrl` with the raw bytes and the same auth, which stores them in R2 `CHAT_ATTACHMENTS`.
  - `GET /api/chat/attachments/:id` streams it, auth-checked.
  - **Limits:** image/* ≤ 15 MB; video/mp4 ≤ 200 MB; documents (pdf, docx, xlsx, pptx, txt, csv) ≤ 50 MB.
- `GET /api/chat/account-manager` (customer) returns `{ "name", "title", "photoUrl" } | null`.
- `GET /api/chat/account-managers/:id/photo` returns the public photo from R2.

### Huddles

- `POST /api/chat/conversations/:id/huddle` starts a huddle, or returns the live one.
  - It creates a RealtimeKit meeting (`CF_ACCOUNT_ID`, `REALTIMEKIT_APP_ID`, `REALTIMEKIT_API_TOKEN`) if there's none.
  - A new huddle broadcasts `{ type: "huddle", huddle }` and posts a `huddle.started` system message.
  - When a customer starts it, the account manager gets a push.
  - Returns `Huddle`.
- `POST /api/huddles/:id/join` returns `{ "authToken", "meetingId", "huddle": Huddle }`, a RealtimeKit participant token, for anyone who can see the conversation.
- `POST /api/huddles/:id/leave`.
  - When the participant count reaches 0, the huddle ends: `endedAt` and `durationSeconds` are set, `{type:"huddle"}` is broadcast, and a `huddle.ended` timeline event is recorded.
  - The client also calls this on unload. The Durable Object ends huddles with no heartbeat for 60 s.
- `POST /api/huddles/:id/heartbeat`, sent every 20 s by each participant.
- **Voice activity detection** is client-side. Clients use RealtimeKit's active-speaker / audio-level events, fall back to a Web Audio `AnalyserNode` RMS meter, and treat a level above a threshold for at least 150 ms as speaking. Speaking state is local; it isn't sent through the Worker.

### Shapes

```ts
type Conversation = {
  id: string
  tenantId: string
  kind: 'team' | 'private'
  ownerOid: string | null
  ownerName: string | null
  support: 'none' | 'open' | 'resolved'
  lastMessageAt: string | null
  unread: number
  huddle: Huddle | null
}

type Sender = {
  type: 'customer' | 'staff' | 'system'
  id: string
  name: string
  photoUrl: string | null
}

type Attachment = {
  id: string
  kind: 'image' | 'video' | 'document'
  name: string
  contentType: string
  size: number
  url: string
}

type Huddle = {
  id: string
  conversationId: string
  meetingId: string
  startedBy: Sender
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  participants: Sender[]
}

type Message = {
  id: string
  conversationId: string
  sender: Sender
  body: string
  attachments: Attachment[]
  huddle: Huddle | null
  createdAt: string
}
```

### WebSocket frames

- **Client → server:**
  - `{ "type": "message", "clientId", "body", "attachmentIds": [] }`
  - `{ "type": "typing" }`
  - `{ "type": "read", "messageId" }`
- **Server → client:**
  - `{ "type": "message", "message", "clientId"? }`
  - `{ "type": "typing", "sender" }`
  - `{ "type": "read", "sender", "messageId" }`
  - `{ "type": "support", "status" }`
  - `{ "type": "huddle", "huddle" }`
- **On a customer message**, when no staff member is connected, push to the assigned account manager, or to owners if there isn't one, plus an Inbox item `chat.message`.

## Admin (staff auth)

- `GET /api/admin/me` returns `{ id, oid, name, email, title, photoUrl, role: 'owner' | 'manager' }`. `PUT /api/admin/me` takes `{ title? }`. `PUT /api/admin/me/photo` takes raw image bytes.
- `POST /api/admin/devices` takes `{ platform: 'android' | 'macos', token }`.
- `GET /api/admin/inbox?before=` returns `InboxItem[]`. `POST /api/admin/inbox/:id/done`.
  - `InboxItem = { id, kind, title, body, tenantId?, leadId?, conversationId?, createdAt, doneAt? }`
  - `kind` ∈ `lead.new`, `chat.message`, `support.requested`, `huddle.started`, `error.new`, `error.spike`, `deployment.registered`, `tenant.bound`, `tenant.subscription_mismatch`
  - **Visibility:** managers see items for their tenants and leads; owners see all.
- `GET /api/admin/leads?stage=&q=` returns `Lead[]`. `PATCH /api/admin/leads/:id` takes `{ stage?, notes? }`.
  - `stage` ∈ `new`, `contacted`, `qualified`, `trial`, `won`, `lost`
  - `Lead = { id, name, email, company, offer, stage, notes, organizationId, accountManager: { id, name } | null, tenantId: string | null, createdAt }`
- `GET /api/admin/customers?q=` returns `Customer[]`. `GET /api/admin/customers/:tenantId` returns `CustomerDetail`.
  - `Customer = { tenantId, organizationId, name, accountManager, deployments: number, version, lastSeenAt }`
  - `CustomerDetail` = `Customer` + `{ deploymentList: { id, subscriptionId, region, vmSize, version, publicOrigin, registeredAt, lastSeenAt }[], conversations: Conversation[] }`
- `GET /api/admin/customers/:tenantId/timeline?type=event|error|chat&before=&limit=100` returns `TimelineEntry[]`.
  - `TimelineEntry = { id, type: 'event' | 'error' | 'chat', name, at, properties, sentryUrl? }`
- `GET /api/admin/account-managers` returns `AccountManager[]`.
- `GET /api/admin/assign` (owner) returns `{ unassignedLeads, unlinkedTenants: { tenantId, firstSeenAt, suggestions: { organizationId, name, reason }[] }[], organizations: { id, name, accountManager }[] }`.
  - Suggestions match the email domains of users seen in the tenant against lead emails and organization domains.
- `PUT /api/admin/organizations/:id/account-manager` (owner) takes `{ accountManagerId | null }`.
- `POST /api/admin/tenants/:tenantId/link` (owner) takes `{ organizationId }`.
- `POST /api/admin/leads/:id/assign` (owner) takes `{ accountManagerId }`, creating the organization from the lead if it has none.
- **Analytics:** admin mutations record `source=admin` events:
  - `lead.stage_changed`
  - `lead.assigned`
  - `tenant.linked`
  - `huddle.started`
  - `huddle.joined`
  - `chat.message_sent`
  - `chat.attachment_sent`

## Sentry

- `POST /api/sentry/webhook` is checked with `Sentry-Hook-Signature` (HMAC-SHA256 of the raw body with `SENTRY_CLIENT_SECRET`).
- It handles `issue` (created) and `event_alert`.
- The tenant comes from the `tenant_id` tag.
- It stores `tenant_errors`, deduplicated by issue id.
- It creates `error.new` / `error.spike` and pushes to the account manager. Errors without a tenant go to owners.
- **Tags** set by Papyrus and the app: `tenant_id`, `deployment_id`, `source` (`papyrus-web` | `papyrus-server` | `admin-app`).

## Push

- **FCM HTTP v1:** `FCM_PROJECT_ID` plus the secret `FCM_SERVICE_ACCOUNT_JSON`.
- **APNs** (token-based): `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` = `com.beaglabs.papyrus.admin`, plus the secret `APNS_PRIVATE_KEY`.
- **Payload:** `{ title, body, data: { kind, inboxId, conversationId?, leadId?, tenantId? } }`.
- **Android notification channels:**
  - `leads`: lead sound, and the client vibrates
  - `messages`: message sound (also used for `huddle.started` and `support.requested`)
  - `alerts`: default sound
- If a push provider's configuration is missing, that provider is skipped without failing the request.

## Deviations

This section was added by the backend implementation (`workers/license`). Everything above is implemented as written. The items below are clarifications where the contract was silent, and additive extensions. No request or response shape above has changed.

### Auth
- **Staff tokens must be v2.** The Worker only accepts `iss = https://login.microsoftonline.com/<tenant>/v2.0`, so the app registration must set `requestedAccessTokenVersion: 2`. If a v1 token (`sts.windows.net`) is presented, it's rejected with 401.
- **Error codes:**
  - 401 `token_expired`, `invalid_token`, `invalid_audience`, `unauthorized`
  - 403 `forbidden_role` (the token has neither role), `owner_required` (owner-only routes)
- **Chat session JWT** also carries `iat` and `exp`. When a customer route is called with a staff token, the response is 403 `customer_only`.

### Registration
- **Optional fields:** `POST /api/provision/bootstrap` also accepts `region` and `vmSize`. The attested document doesn't contain them.
- **Nonces are single-use per VM.** Reusing an attested document returns 409 `nonce_reused`, so fetch a fresh document with a new nonce for every call, including retries.
- **Other errors:**
  - 401 `attestation_invalid`, `nonce_mismatch`, `attestation_expired` (the document's `timeStamp.expiresOn` has passed)
  - 403 `plan_not_allowed`
  - 422 `invalid_public_origin`: `publicOrigin` must be HTTPS, and it's stored as its origin only
- **Signer domain:** the signer must be `metadata.azure.com` or a subdomain of it (commercial Azure only).
- **Inbox:** `deployment.registered` is created only when a VM first registers. Key rotation on re-registration doesn't create one.

### Track
- **Customer chat session tokens** (`Bearer`, HS256) are accepted too, as `source=papyrus` with the tenant from the token. This lets the Papyrus browser analytics client send events directly.
- **Staff events** attach to a tenant only when `context.tenantId` names a tenant the caller can see. Otherwise they're stored tenantless.
- **Invalid items are skipped, not rejected.** That covers an unknown `type`, a `track` event that isn't `object.action` (lowercase), and an item over its size cap (1 KB anonymous, 32 KB authenticated). `accepted` counts only stored items.
- **Batch limits:** over 100 items or 256 KB returns 413 `batch_too_large`.
- **Anonymous rate limit:** 30 batches per minute per IP, per Worker isolate. Over the limit returns 429 `rate_limited`.

### Chat
- **Status codes:**
  - `POST /api/chat/conversations` returns 201.
  - `POST /api/chat/attachments` returns 201.
  - Conversations the caller can't see return 404 (`not_found`), not 403.
- **`GET /api/chat/conversations`** (staff) also accepts `?tenantId=` to filter. Results are ordered by tenant, then the team thread first, then by most recent activity.
- **`unread`** counts messages after the caller's last `read` frame, excluding the caller's own messages.
- **`POST /api/chat/conversations/:id/support`** returns the updated `Conversation`.
- **Attachment upload:**
  - `PUT uploadUrl` requires `Content-Length` equal to the declared `size`. A larger body returns 413, a different size returns 422 `size_mismatch`, and a missing length returns 411.
  - `Content-Type`, if sent, must match the declared type.
  - The PUT returns the `Attachment`.
  - Only the uploader may PUT, and only once (409 `already_uploaded`).
- **Attachment download:**
  - `GET /api/chat/attachments/:id` also accepts `?token=`, so `<img>` and `<video>` elements work.
  - It supports `Range` (206) for video seeking.
  - Documents are served `Content-Disposition: attachment`; images and video are served `inline`.
- **Allowed types:**
  - images: JPEG, PNG, GIF, WebP, HEIC/HEIF and AVIF
  - video: `video/mp4`
  - documents: PDF, DOCX, XLSX, PPTX, TXT and CSV
  - SVG is refused (415 `unsupported_type`).
- **Message limits:** a message may have at most 10 attachments, and its body at most 8,000 characters. An attachment can be sent only once, only by its uploader, and only in its own conversation.
- **WebSocket:**
  - The server sends `message` frames to every socket, including the sender's. The sender's frame echoes `clientId`.
  - Extra frames:
    - client `{ "type": "ping" }` → server `{ "type": "pong" }`
    - server → sender `{ "type": "error", "error", "message", "clientId"? }` when a frame is rejected
  - Typing frames are throttled to one per sender every 1.5 s, and they aren't echoed to the sender.
- **Account manager card and photo:**
  - `GET /api/chat/account-manager` picks the organization's `primary` manager first.
  - `PUT /api/admin/me/photo` accepts `image/jpeg`, `image/png` or `image/webp` up to 5 MB, and returns the `me` shape.
  - The Microsoft Graph photo copy isn't implemented: the staff access token is scoped to this API, not Graph, so the app should upload the photo itself. `title` is likewise set via `PUT /api/admin/me`.

### Huddles
- **Return values:** `leave` returns `{ huddle }`, and `heartbeat` returns `{ ok: true, huddle }`.
- **Errors:**
  - join or heartbeat on an ended huddle → 410 `huddle_ended`
  - heartbeat before joining → 409 `not_in_huddle`
  - RealtimeKit vars unset → 503 `huddles_not_configured`
- **RealtimeKit participants:** `custom_participant_id` is `<customer|staff>:<id>`, and the preset is `REALTIMEKIT_PRESET_NAME` (default `group_call_participant`, which must exist in the RealtimeKit app).
- **Ending a huddle:** the meeting is PATCHed to `status: INACTIVE`, best effort.
- **Watchdog:**
  - It runs every 20 s while a huddle is live.
  - It drops participants with no heartbeat for 60 s.
  - It ends the huddle when everyone who joined has left, or when no join or heartbeat has arrived for 60 s. That includes a huddle nobody joined.
- **Timeline:** the `huddle.started` system message appears in `Message.huddle`, with `sender.type = "system"` and body `huddle.started`. `huddle.ended` appears as a `type: "event"` entry (source `system`).

### Admin
- **`InboxItem.doneAt`** is per staff member: marking an item done hides it only for you.
- **`before`** on inbox and timeline accepts an item or entry id, or an ISO timestamp.
- **Inbox coalescing:** `chat.message` and `support.requested` items coalesce per conversation within 10 minutes. The push is still sent each time.
- **Push audiences:**
  - `lead.new` (from the Marketplace lead webhook, skipped for Microsoft test leads): owners plus the assigned manager
  - `chat.message`, `support.requested`, `huddle.started`, `error.*`: the assigned manager, or owners if the tenant is unlinked or unassigned
  - `deployment.registered`, `tenant.bound`, `tenant.subscription_mismatch`: owners
- **Timeline:**
  - It's newest first.
  - Chat entries are named `chat.message` or `huddle.started`, and their properties include `conversationId`, `conversationKind`, `senderType`, `senderName` and `body` (first 280 characters).
  - Event entries include `source`, `type`, `userId`, `deploymentId`, `properties` and `traits`.
  - Error entries include `issueId`, `culprit`, `level`, `source`, `deploymentId`, `alerts` and `firstSeenAt`.
- **Leads:**
  - Lead stage and notes live in a new `lead_pipeline` table. Until a lead is edited, its stage is derived from `marketplace_leads.status` (`customer` → `won`, `closed` → `lost`, otherwise the same name).
  - `Lead.name` is first and last name; `Lead.tenantId` is the first tenant linked to the lead's organization.
- **Customers:** `Customer.name` is the organization name, or the tenant id while unlinked. `lastSeenAt` is the latest of tenant activity and deployment `last_seen_at`.
- **`AccountManager`** is `{ id, oid, name, email, title, photoUrl, role: 'owner' | 'manager' | null, organizations: number }`. `role` is the role from that person's most recent sign-in.
- **Assignment:**
  - Assignments write the organization's `primary` role row in `organization_account_managers`.
  - `GET /api/admin/assign` lists organizations with status other than `inactive`.
  - `unassignedLeads` excludes leads at stage `lost`.
  - A suggestion needs an existing organization: a lead without one is suggested only once it has one.
- **Mutation responses:**
  - `PUT /api/admin/organizations/:id/account-manager` returns `{ id, name, accountManager }`.
  - `POST /api/admin/tenants/:tenantId/link` returns the `Customer`, and also upserts `organization_tenants`.
  - `POST /api/admin/leads/:id/assign` returns the `Lead`.
  - `POST /api/admin/devices` returns 201 `{ ok: true }`. Re-registering a token moves it to the caller.
- **Events:** `huddle.joined` by a customer is recorded with `source=papyrus`.

### Tenant binding cross-check
- `tenant.subscription_mismatch` is a heuristic. Partner Center usage rows (`marketplace_vm_customers`) whose `marketplace_subscription_id` or raw JSON mention the VM's Azure subscription are compared by `customer_id` against the bound tenant.

### Sentry
- **Missing secret:** if `SENTRY_CLIENT_SECRET` is unset, the webhook returns 503.
- **Ignored payloads:** an `issue` other than `created`, and any other resource, return 200 `{ ignored: true }`.
- **Alert rules:**
  - A duplicate `issue.created` doesn't alert.
  - An `event_alert` for an unseen issue is `error.new`.
  - For a known issue, an `event_alert` is `error.spike` at most once every 6 hours per issue; further alerts in that window only update counters.
- **Tenant tag:** the tenant comes from the `tenant_id` tag (event tags, `[[k, v]]` or `[{ key, value }]`). Issue webhooks often carry no tags, so those errors go to owners until an event alert supplies the tenant.

### CORS
- `/api/admin/*` is also open to any origin, like `/api/chat`, `/api/huddles`, `/api/papyrus` and `/api/v1/track`. Every one of them authenticates with headers only, never cookies.

### Push
- **Android:** FCM messages set `android.notification.channel_id` to `leads`, `messages` or `alerts`, and `data` also includes `channel`.
- **macOS:** APNs uses the sounds `lead.caf` and `message.caf` (bundled in the app), or `default`. `thread-id` is the conversation id.
- **Invalid tokens** (FCM `UNREGISTERED`, APNs 410 / `BadDeviceToken`) are deleted.
