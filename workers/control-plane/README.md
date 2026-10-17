# Papyrus Control Plane Worker

`https://papyrus.beaglabs.com` — sign-up, billing, provisioning and setup for customer-hosted Papyrus deployments.
Design: `docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md` (the contract section is authoritative).

Cloudflare Worker, Effect throughout, provider calls through Distilled (`@distilled.cloud/*`, pinned `1.0.0-rc.15`),
D1 for state, the license Worker (`LicenseRpc`) through the `LICENSE` service binding for deployment rows, deployment
keys and signing.

## Routes

- `/signup`, `/login` — email magic link (Resend), Sign in with Microsoft / Google (OIDC code + PKCE)
- `/billing` — Stripe Checkout per deployment ($13,000/month, 14-day trial, card up front), customer portal
- `POST /api/stripe/webhook` — `trialing`/`active` → active; `past_due`/`unpaid`/`canceled` (and anything else) → suspended
- `/provision` — provider dropdown + credential form generated from `src/providers/registry.ts`; read-only check on save;
  Connect AWS (CloudFormation quick-create, per-deployment ExternalId; template at `/aws/connect-template.yaml`)
- `/deploy`, `/deploy/:id` (setup page) — connect → deploy → DNS (DoH 1.1.1.1) → health → Connect Microsoft → registration
- `GET /api/deployments/status` — Papyrus check-in: Bearer deployment key + `X-Papyrus-Deployment-Id` → signed status

## Providers

Deploy recipes: AWS (ECS Fargate + EFS + ALB/ACM, default VPC) and Fly.io (Machine + encrypted volume + ACME cert).
Every other provider has credentials and a check; its deploy step fails with "not available yet". Adding a provider is
adding an entry to the registry.

## Configuration

Vars (`wrangler.jsonc`): `PAPYRUS_IMAGE_DIGEST`, `AWS_PRINCIPAL_ARN`, `AWS_CONNECT_TEMPLATE_URL` (S3 copy of
`/aws/connect-template.yaml`), D1 `database_id`. Secrets: see `secrets.required`. `CREDENTIALS_KEY` is base64 of 32
random bytes (`openssl rand -base64 32`); rotating it makes saved credentials unreadable.

```bash
npm install
npm run check      # typecheck, tests, wrangler dry run
npm run deploy     # applies schema.sql to D1, deploys
```
