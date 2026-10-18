# Papyrus Control Plane Worker

`https://papyrus.beaglabs.com` — sign-up, billing, provisioning and setup for Papyrus deployments. The default is
**Hosted by Beag Labs**: sign up → pay → pick an org name → live at `<org>.papyrus.beaglabs.com` → Connect Microsoft →
registration. Bring-your-own-cloud (BYOC) is kept but off (see BYOC below).
Design: `docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md` (the contract section is authoritative).

Cloudflare Worker, Effect throughout, provider calls through Distilled (`@distilled.cloud/*`, pinned `1.0.0-rc.15`),
D1 for state, the license Worker (`LicenseRpc`) through the `LICENSE` service binding for deployment rows, deployment
keys and signing.

## Routes

- `/signup`, `/login` — email magic link (Resend), Sign in with Microsoft / Google (OIDC code + PKCE)
- `/billing` — Stripe Checkout per deployment ($250/month platform + $0.50 per VM hour + $0.00194444 per agent-second;
  one subscription with three items, 14-day trial, card up front), customer portal
- `POST /api/stripe/webhook` — `trialing`/`active` → active; `past_due`/`unpaid`/`canceled` (and anything else) → suspended
- `/deploy/:id` (hosted, the default) — org-name form (live check at `GET /api/org-names/check?name=`; lowercase DNS
  label, 3–40 chars, unique, reserved list in `src/hosted.ts`); `POST /deploy/:id/org` claims it and deploys
- `POST /admin/hosted/bootstrap` — one-time shared hosted infrastructure (`Authorization: Bearer $ADMIN_TOKEN`)
- BYOC only: `/provision` — provider dropdown + credential form generated from `src/providers/registry.ts`; read-only check on save;
  Connect AWS (CloudFormation quick-create, per-deployment ExternalId; template at `/aws/connect-template.yaml`)
- `/deploy`, `/deploy/:id` (setup page) — connect → deploy → DNS (DoH 1.1.1.1) → health → Connect Microsoft → registration
- Console (signed in): `/deploy` (one deployment = its page; several = a list), `/billing`, `/team`, `/support`, `/settings`
- `GET /api/events` — Activity for the signed-in account: `deployment`, `filter` (all/deploy/billing/team/errors), `source`,
  `level` (comma lists), `before`/`after` ids, `limit` (≤ 100). Rows are written by setup steps, Stripe webhooks, sign-ins,
  org-name claims and BYOC credential checks (`src/events.ts`); never secrets
- `GET /api/events/live` — WebSocket to the account's `ActivityHub` Durable Object; pushes each new event (session cookie, same origin)
- `GET /api/deployments/status` — Papyrus check-in: Bearer deployment key + `X-Papyrus-Deployment-Id` → signed status
- `POST /api/deployments/usage` — Papyrus agent-execution usage (same auth) → Stripe meter event (`src/metering.ts`)
- `POST /deploy/:id/stop`, `POST /deploy/:id/start` — scale the ECS service to 0 / 1 (hosted and AWS BYOC); see below
- `POST /deploy/:id/delete` (Settings → Delete deployment; body `confirm` = the org name, or the hostname for BYOC),
  `POST /deploy/:id/teardown` — retry or continue a teardown
- Cron `5 * * * *` — one VM-hour meter event per running deployment (none for hours that start while stopped; nothing is
  sent while trialing), then continues teardowns that are waiting (not failed ones: those wait for Retry)

## Hosted by Beag Labs

Runs in Beag Labs' own AWS account (us-east-2), reusing the AWS recipe's pieces (`src/providers/aws.ts`) from
`src/providers/aws-hosted.ts`. Shared: the default VPC's subnets, one ECS cluster `papyrus-hosted`, one ALB with a
wildcard ACM certificate for `*.papyrus.beaglabs.com` (HTTPS listener answers 404 unless a host rule matches), one
encrypted EFS file system, three security groups. Per customer: an EFS access point (root `/tenants/<deploymentId>`,
uid/gid `100000 + slot`), a target group and a host-header rule (priority = slot) on the shared listener, secrets under
`papyrus/<deploymentId>/` including their own master key, a log group, a task definition (Fargate **ARM64/Graviton**,
2 vCPU / 8 GB; the image digest must be a multi-arch index) and a Fargate service. The setup page has no provider or
DNS-record steps; its "Address" step only confirms `<org>.papyrus.beaglabs.com` resolves to the shared ALB.

ALB quotas to watch: 100 rules per listener and 100 target groups per ALB by default (raise them in Service Quotas).

### One-time setup (owner)

1. Pick an ExternalId (`openssl rand -hex 24`) and launch the Connect AWS stack in Beag Labs' account, us-east-2:
   template `/aws/connect-template.yaml` (same file as the S3 copy), `ExternalId` = that value, `BeagLabsPrincipal` =
   `AWS_PRINCIPAL_ARN`. Put its `RoleArn` output in `HOSTED_AWS_ROLE_ARN` (wrangler.jsonc) if it differs.
2. `wrangler secret put HOSTED_AWS_EXTERNAL_ID` (that value) and `wrangler secret put ADMIN_TOKEN` (`openssl rand -hex 32`).
3. Deploy, then run the bootstrap until it says `ready` (it is idempotent: every resource is looked up first):
   `curl -s -X POST https://papyrus.beaglabs.com/admin/hosted/bootstrap -H "authorization: Bearer $ADMIN_TOKEN" | jq .`
4. In Cloudflare (beaglabs.com zone) add the records it prints, **DNS only** (grey cloud): the ACM validation CNAME,
   and `*.papyrus` CNAME → the ALB's DNS name. Rerun step 3 once ACM has issued the certificate (creates the HTTPS listener).

## Stop, Start and Delete

`src/lifecycle.ts` (effects) and `src/lifecycle-model.ts` (pure). State lives in `deployment_lifecycle` (no row = running):
`running` → `stopped` → `running`, or → `deleting` → `deleted`.

- **Stop** sets the ECS service's `desiredCount` to 0 (hosted through Beag Labs' role, AWS BYOC through the customer's
  role). Data, secrets, target group, DNS and registration are kept. The subscription continues, so the $250/month
  platform fee does too; VM hours stop. Setup steps can't run while stopped. **Start** sets it back to 1, puts health
  back to pending and checks it, as after a redeploy.
- **Delete** (irreversible): the customer types the org name (hosted) or hostname (BYOC). Teardown steps, each one
  Activity line, idempotent and resumable (progress is saved per step; a failed step shows Retry):
  1. cancel the Stripe subscription now (`prorate` + `invoice_now`: credit for unused platform time, usage so far on a
     final invoice); 2. `LicenseRpc.revokeDeployment` (status always `suspended`, key never verifies again);
  then, hosted only: scale to 0 and delete the service → deregister the `papyrus-<id>` task definitions → delete the
  listener rule and target group → delete the EFS access point, then the data directory → delete the
  `papyrus/<licenseDeploymentId>/*` secrets (`ForceDeleteWithoutRecovery`) → delete `/papyrus/<licenseDeploymentId>`
  logs → release the org name. Shared infrastructure (cluster, ALB, listeners, EFS file system, wildcard certificate,
  security groups, DNS) is never deleted: ids that belong to it are refused.
- **The data directory**: EFS has no API to delete files, so a one-off Fargate task (`papyrus-hosted-cleanup`, busybox,
  ARM64, registered on first use and saved in `hosted_infra`) mounts the file system root in the shared cluster and runs
  `rm -rf /efs/tenants/<deploymentId>`; the step waits for it to exit 0 ("Check now", or the next cron run).
- **BYOC delete** deletes nothing in the customer's account: billing and license only, then a list of the resources to
  remove themselves, with the names and ids we stored.
- Deleted deployments disappear from the console but stay in D1 (`deployments` + `deployment_lifecycle`) for audit.

### One-time stack update (owner)

The teardown and the health-check fix need new permissions on the Connect AWS role. Beag Labs' hosted role uses the same
template, so until it is updated, Delete stops at its first AWS step with an access-denied error (Retry once updated);
Stop/Start and deploys work without it.

1. Upload the new template (also served at `/aws/connect-template.yaml`; a copy is at `~/Desktop/connect-aws.yaml`):
   `aws s3 cp ~/Desktop/connect-aws.yaml s3://beaglabs-public/connect-aws.yaml --content-type text/yaml`
   (https://beaglabs-public.s3.us-east-2.amazonaws.com/connect-aws.yaml).
2. Update the `BeagLabsPapyrus` stack in Beag Labs' account (us-east-2): CloudFormation → the stack → Update → Replace
   existing template → that S3 URL → keep both parameters as they are → acknowledge IAM → Submit. Or:
   `aws cloudformation update-stack --region us-east-2 --stack-name BeagLabsPapyrus --template-url https://beaglabs-public.s3.us-east-2.amazonaws.com/connect-aws.yaml --parameters ParameterKey=ExternalId,UsePreviousValue=true ParameterKey=BeagLabsPrincipal,UsePreviousValue=true --capabilities CAPABILITY_NAMED_IAM`
3. Apply both schemas (`npm run db:apply` here; `npm run db:apply` in `workers/license` for `control_plane_revocations`),
   deploying the license Worker before this one (the control plane calls `revokeDeployment`).

BYOC customers only need the update for the health-check fix on redeploy; Stop/Start uses `ecs:UpdateService`, which
they already have, and BYOC delete makes no AWS calls.

## BYOC

Off by default. `BYOC_ENABLED="true"` turns it on for every account; otherwise one account at a time:
`wrangler d1 execute papyrus-control-plane --remote --command "INSERT OR REPLACE INTO account_flags (account_id, byoc_enabled) VALUES ('acct_…', 1)"`.
When off, `/provision`, the credential form posts, the Connect AWS template route and the hostname form answer 404/409
and nothing links to them. When on, the org-name card shows "Deploy in your own cloud instead", which opens the
unchanged provider flow.

## Providers

Deploy recipes: AWS (ECS Fargate + EFS + ALB/ACM, default VPC) and Fly.io (Machine + encrypted volume + ACME cert).
Every other provider has credentials and a check; its deploy step fails with "not available yet". Adding a provider is
adding an entry to the registry.

## Configuration

Vars (`wrangler.jsonc`): `PAPYRUS_IMAGE_DIGEST`, `AWS_PRINCIPAL_ARN`, `AWS_CONNECT_TEMPLATE_URL` (S3 copy of
`/aws/connect-template.yaml`; **re-upload it to S3 whenever the template changes** — it last gained the scoped delete
actions for hosted teardown, `ecs:RunTask`/`ecs:StopTask` for the data cleanup task and
`elasticloadbalancing:ModifyTargetGroup` for the health-check fix; see "One-time stack update"),
`BYOC_ENABLED`, `HOSTED_AWS_ROLE_ARN`, `HOSTED_AWS_REGION`, `STRIPE_PRODUCT`, `STRIPE_PRICE_PLATFORM`, `STRIPE_PRICE_COMPUTE`,
`STRIPE_PRICE_EXECUTION` (metered prices' meters are looked up at runtime), D1 `database_id`. Secrets: see `secrets.required`. `CREDENTIALS_KEY` is base64 of 32
random bytes (`openssl rand -base64 32`); rotating it makes saved credentials unreadable.

```bash
npm install
npm run check      # typecheck, tests, wrangler dry run
npm run deploy     # applies schema.sql to D1, deploys
```
