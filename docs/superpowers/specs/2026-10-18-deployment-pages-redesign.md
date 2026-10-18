# Deployment pages redesign (/deploy and /deploy/{id})

Date: 2026-10-18 · Worker: `workers/control-plane` (papyrus.beaglabs.com)

The user's words on the current pages: "This UI looks actually awful. The layout sucks… things are clunky as hell visually."

Problems seen on the live page:
- Everything is stacked in one long column: the trial banner, the header with three buttons, the six-step checklist, the plan text, the support card and an unbounded Activity log.
- "Redeploy" appears twice.
- Steps that are done still show their "waiting" copy (e.g. "Papyrus started — Waiting for the health check").
- The Activity log is flooded with hourly "Usage not billed during trial" lines, and raw multi-line Azure errors.
- The pricing text is a run-on sentence.

## Objective

Improve /deploy and /deploy/{id} with:
- clear deployment status;
- animated progress feedback;
- a browser preview of running environments.

Adapt the referenced Cult UI components to Papyrus's neobrutalist design: white grid backgrounds, primary orange accents (#ff5f1f), strong #111 borders, hard offset shadows, and consistent typography (Roboto Condensed display, Work Sans body, JetBrains Mono labels/logs). Keep the black Console sidebar.

## 1. Deployment list (/deploy)

A neobrutalist data table showing:
- name and environment;
- provider, region and configuration where available;
- status and health;
- created date and last status update;
- URL;
- available lifecycle actions.

It supports search, status filtering, sorting, and pagination where needed, plus useful empty, loading and error states. Polling updates individual rows without replacing the table, resetting filters or interrupting the user.

## 2. Animated polling and progress

**When to poll**
- Refresh automatically while provisioning, starting, stopping or deprovisioning.
- A subtle animated indicator shows while a request is in flight.

**How polling behaves**
- Show the last successful update time, and tell stale data apart from a confirmed failure.
- Keep content in place during background refreshes. Animate status changes without replaying the full loading sequence.
- No overlapping requests, and no stale response overwriting newer state.
- Back off after failures, slow down in background tabs, and clean up when the user leaves the page.
- Provide a manual refresh.

**Stages**
- Stages come from backend-reported milestones: completed, active, pending and failed are clearly marked.
- Use determinate progress only when real completion data exists; otherwise indeterminate. Cult UI Halo Progress is the reference for both.

## 3. Detail page (/deploy/{id})

Organised as:
- **Header:** name, current status, URL, primary actions.
- **Overview:** configuration, availability, timestamps.
- **Progress:** current operation and completed milestones.
- **Activity:** timestamped events and available logs.
- **Preview:** browser preview.

Sheets (desktop) and drawers (mobile) hold secondary details. Failures show the failed stage, a useful explanation and the supported recovery actions.

## 4. Browser preview

**Frame and states**
- A neobrutalist browser frame with the URL, a refresh control and "Open environment".
- Distinct states: provisioning, loading, running, stopped, unavailable and failed.
- Load the preview only once the app endpoint is ready, not merely once the VM has started.
- Keep it mounted during polling. Use the active custom domain when one is configured.

**Embedding and fallback**
- Embed only where authentication and framing policies allow. Papyrus sends `frame-ancestors 'self'`, so a live iframe from papyrus.beaglabs.com is blocked, and that protection must NOT be weakened.
- Fallback: a clearly labelled screenshot preview (e.g. Cloudflare Browser Rendering of the public sign-in/setup page, cached, with its capture time) plus open-in-new-tab.
- Never put credentials in preview URLs.

## 5. Activity and loading

**Activity panel**
- A terminal-style panel for real events and logs. Cult UI Terminal Animation is a visual reference only; never play scripted commands as activity.
- Append new events without replaying old ones, with timestamps and severity.
- Users can scroll back without being forced down. Long technical output is expandable.
- Collapse repeated routine events (e.g. hourly "usage not billed during trial") into one summarised line.

**While deploying**
- A loading carousel of concise Papyrus setup tips and next steps (Cult UI Loading Carousel pattern).
- Real status stays visible independently of the carousel.

## 6. Start/stop

- Evaluate a neobrutalist switch.
- Clearly separate the confirmed state from a requested transition: show Starting/Stopping until the backend confirms.
- Block duplicate or conflicting requests.
- Explain what stopping does to active work, and show actionable errors.
- Lifecycle permissions are enforced on the backend.
- Deprovisioning stays separate.
- Use explicit Start/Stop buttons if a switch can't communicate the async behaviour clearly.

## Component references

| Reference | Use |
|---|---|
| Illustration Graph | activity/health visualisation; only real data as telemetry |
| Halo Progress | provisioning and lifecycle progress |
| Terminal Animation | presentation reference for activity/logs |
| Loading Carousel | helpful content while provisioning |
| Data Table | deployment inventory |
| Marker | milestones and event timeline |
| Spinner | polling, refresh, pending actions |
| Navigation Menu | deployment navigation |
| Sheet | desktop config/activity details |
| Drawer | secondary details on small screens |
| Toast | action confirmations and recoverable errors |
| Switch | start/stop, subject to clear transition handling |

Reuse existing Papyrus components where practical.

## Acceptance

- Both routes match the neobrutalist design.
- Status updates arrive without full reloads or flicker.
- Progress reflects actual backend state.
- Polling failures show stale-state feedback and recovery options.
- Running environments get a working preview or a clearly explained fallback.
- Background refreshes don't reset the preview, table controls or activity view.
- Start/stop shows pending, success and failure accurately.
- Loading and activity panels stay useful throughout provisioning.
- Mobile, keyboard and reduced motion are supported.

## Validation

- Exercise provisioning, successful startup, slow startup, failed deployment, stop/start and deprovisioning.
- Test polling interruptions, out-of-order responses, preview authentication and blocked embedding.
- Review desktop and mobile in standard and reduced motion.
