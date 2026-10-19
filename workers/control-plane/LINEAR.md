# Linear control-plane lifecycle automation

The control plane queues lifecycle events in `linear_outbox` (D1). A singleton `LinearSync` Durable Object wakes immediately on successful compute-credit issuance and retries on alarms. A five-minute scheduled Worker independently reconciles missing lifecycle jobs from the accounts, compute-credit, and deployments tables, then processes queued events with exponential backoff. Billing/metering remains on its separate hourly schedule. The integration never blocks signup, credit issuance, or deployment checkout.

## Setup
1. Apply the updated `schema.sql` to the control-plane D1 database **before** deploying the Worker (using the existing D1 schema deployment procedure). Verify `linear_outbox` exists.
2. In Linear, obtain the target team's UUID and create or identify an issue label **New Customer**. Obtain that label's UUID.
3. Configure `LINEAR_TEAM_ID` and `LINEAR_NEW_CUSTOMER_LABEL_ID` as Worker environment variables (or secrets). Add `LINEAR_API_KEY` via `wrangler secret put LINEAR_API_KEY --config workers/control-plane/wrangler.jsonc` from the repository root (or the deployment pipeline's equivalent secret-management method). Never put the key in source or `vars`.
4. Deploy the control-plane Worker and confirm both cron triggers are active (`*/5 * * * *` for Linear, `5 * * * *` for billing). `LINEAR_API_KEY` and `LINEAR_TEAM_ID` are required for delivery; the customer label ID is optional for lead issues. The five-minute cron is a fallback, while the Durable Object keeps itself scheduled even after failures. Run `npm run db:apply` before `npm run deploy` after updating the D1 database UUID and verifying the `DB` binding.

## Events
- An email requesting a compute credit **and** a verified control-plane account produces one issue titled `New Lead | {emailDomain}` keyed by account ID, regardless of whether the credit request or signup occurs first.
- A verified Stripe checkout creating the **first** deployment for an account queues a Linear `customerUpsert` keyed to the control-plane account ID, then an issue titled `New Deployment - {orgName} @ {deploymentId}` with **New Customer** label, and a linked Customer Request.
- Existing accounts, signins, repeated credit requests, webhook retries, and subsequent deployments do not generate duplicates from repeated source events.
- Organization data in the issue includes the signup organization/name, email domain and a *candidate* public website. A research brief asks a Linear Agent to enrich the issue, but the personal API key **does not automatically invoke or assign a Linear agent**. Configure an agent-side Linear workflow or agent assignment separately to perform the actual research.

## Operational notes
- The outbox stores step-by-step Linear identifiers for retry recovery; Linear does not offer a transaction across issue/customer/need mutations. An ambiguous network failure after a successful mutation may still require manual deduplication. `customerUpsert` prevents duplicate customer records by external ID or domain.
- Do not send login tokens, credit codes, payment credentials, or confidential deployment settings to Linear.
- Public/free email domains are not added to Linear Customer domains.
- Inspect outstanding jobs: `SELECT key,kind,attempts,next_attempt_at,linear_issue_id,linear_customer_id FROM linear_outbox WHERE delivered_at IS NULL;`
- The Linear scheduler runs every five minutes. Existing missed events are backfilled automatically, including older credit-request + verified-account pairs and the oldest first active deployment per account. No account or credit event is produced for a mere unverified email signup. Retry delays can be longer than five minutes after repeated API errors.
