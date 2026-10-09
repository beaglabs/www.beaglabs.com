# Azure trial notifications (Beag Labs Internal / Notifications)

Two signals are intentionally separate:

1. **Homepage click:** both “Start a one-month trial” links emit an anonymous
   `trial.cta.clicked` event to `/api/events/trial-click` before continuing to
   `/provision/commercial`. This does not identify a visitor or prove a trial.
2. **Reported Marketplace trial usage:** the existing License Worker scheduled
   Partner Center VM usage import (every six hours) sends one alert for a
   first-seen usage observation with a valid `TrialEndDate` and a recent
   `UsageDate`. It is delayed usage data, *not* a real-time trial activation.

Both notification messages are sent via Resend to the email address of the
Internal team's **Notifications** Teams channel:
`4661da0e.beaglabs.onmicrosoft.com@amer.teams.ms`.

## Before activating

**Cloudflare website and License Worker**
- `RESEND_API_KEY`: existing secret of the Cloudflare license Worker.
- `TRIAL_NOTIFICATIONS_EMAIL` is configured in `workers/license/wrangler.jsonc`:
  `4661da0e.beaglabs.onmicrosoft.com@amer.teams.ms`.
- Optional `TRIAL_NOTIFICATIONS_FROM`: a verified sender such as
  `Beag Labs Marketplace <sales@mail.beaglabs.com>`.
- Deploy the Cloudflare website and `workers/license` Worker changes. Trial CTA events now post directly to `https://license.beaglabs.com/api/events/trial-click`; no Next.js API route or Vercel env configuration is needed.

**Cloudflare License Worker**
- `TRIAL_NOTIFICATIONS_EMAIL` is already defined in `wrangler.jsonc`.
- `RESEND_API_KEY` must exist as a Worker secret (also used by existing
  Marketplace email handling).
- Deploy `workers/license` and verify the scheduled trigger is active.
- Confirm `MARKETPLACE_ANALYTICS_*` (or the existing fallback Microsoft
  credentials) has access to Partner Center analytics and that the VM scheduled
  report ingestion completes.

**Microsoft Teams**
- Open Internal → Notifications → channel settings → email integration.
- Make sure the channel accepts email from the verified sending domain.
- Send a harmless test message from that sender to verify delivery.
- Channel email may be disabled by tenant policy; this code does not
  override Teams mail restrictions.

**Abuse prevention**
- The website route checks Origin and Sec-Fetch-Site and suppresses repeated
  notifications per IP/CTA within a warm instance. This is **not** distributed
  rate limiting. Before enabling high-traffic production alerts, configure
  a Cloudflare WAF rate-limit rule for POST `/api/events/trial-click` (and consider
  switching to hourly rollups). Origin is not an authentication boundary.
- Neither flow transmits browser IP addresses, session IDs, or customer
  email addresses in notifications.

## Verification

1. Click the hero or final homepage CTA and confirm normal navigation.
   Verify an internal Teams notification arrives. If not, check Cloudflare Worker logs and Resend email delivery logs.
2. Use a **new valid trial usage** fixture containing `TrialEndDate` and
   recent `UsageDate` in a staging Partner Center report. Verify one alert;
   re-import the same observation and verify no repeat alert.
3. Existing historical usage rows are ignored for notification if the
   `UsageDate` is older than 72 hours, avoiding backfill floods.

Marketplace report ingestion is shared with CRM; do not purge it to retest.
