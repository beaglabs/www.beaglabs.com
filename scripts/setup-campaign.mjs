/**
 * Customer.io Campaign Setup Script
 *
 * This script documents the Customer.io campaign structure to be created
 * via the Customer.io MCP server after authentication.
 *
 * Run after restarting opencode with the Customer.io MCP connected:
 *   1. opencode will prompt you to authenticate via OAuth
 *   2. Once connected, use the cio_* MCP tools to create:
 *      - Segments (for targeting)
 *      - Email templates (from the /components/email/ templates)
 *      - Campaign workflows
 *      - Series (for recurring content)
 *
 * ── Campaign Architecture ──────────────────────────────────────────────
 *
 * CAMPAIGN 1: Onboarding Drip (30-45 days)
 * ─────────────────────────────────────────
 * Trigger: Subscriber signs up (attribute: newsletter_subscriber = true)
 *
 * Day  0 (immediately):  "Your ML Cookbook + Where to Start"
 * Day  2:                "The Smallest Models Are Getting Weirdly Good"
 * Day  4:                "The Death of RLHF?"
 * Day  6:                "Why Everyone Suddenly Cares About Synthetic Data"
 * Day  9:                "Reasoning Isn't Magic"
 * Day 12:                "How Frontier Labs Actually Compress Huge Models"
 * Day 16:                "The Rise of Tiny Frontier Models"
 * Day 20:                "Can a 7B Model Beat a 70B Model?"
 *
 * Goal: Schedule a demo (Cal.com link in every email)
 *
 * ─────────────────────────────────────────────────────────────────────
 *
 * SERIES 1: Research Translation (Weekly · Friday)
 * ─────────────────────────────────────────────────
 * Template: series-research-translation.html
 * Goal: Translate one new paper into practical engineering guidance
 *
 * SERIES 2: Build in Public (Bi-weekly · Wednesday)
 * ─────────────────────────────────────────────────
 * Template: series-build-in-public.html
 * Goal: Publish experiment results (successes and failures)
 *
 * SERIES 3: Recipe Breakdown (Weekly · Tuesday)
 * ──────────────────────────────────────────────
 * Template: series-weekly-recipe.html
 * Goal: Spotlight one Cookbook recipe with implementation details
 *
 * SERIES 4: Small Model Spotlight (Weekly · Thursday)
 * ────────────────────────────────────────────────────
 * Template: series-small-model-spotlight.html
 * Goal: Profile one small model, its training recipe, and benchmarks
 *
 * SERIES 5: Training Trick (Weekly · Monday)
 * ──────────────────────────────────────────
 * Template: series-training-trick.html
 * Goal: ~5 min tip on a specific training technique
 *
 * ── Conversion Goal ────────────────────────────────────────────────────
 * All emails → "Schedule a Demo" button → https://cal.com/lemoncake/meet-the-founder
 * Track Cal.com booking as the primary campaign conversion event.
 *
 * ── Segment ────────────────────────────────────────────────────────────
 * Name: Newsletter Subscribers
 * Condition: newsletter_subscriber = true
 *
 * ── Trigger ───────────────────────────────────────────────────────────
 * Source: API via POST /api/newsletter/signup
 * Event: newsletter_subscription
 * Action: Add to "Newsletter Subscribers" segment → Start "Onboarding Drip"
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Beag Labs Newsletter — Campaign Setup             ║
╠══════════════════════════════════════════════════════════════╣
║                                                            ║
║  Use the Customer.io MCP tools to create:                  ║
║                                                            ║
║  1. Segment: "Newsletter Subscribers"                       ║
║     → newsletter_subscriber = true                         ║
║                                                            ║
║  2. Email Templates (14 total):                             ║
║     → Import from components/email/*.html                  ║
║     → Set subject lines per template                        ║
║     → Set preheader text per template                       ║
║                                                            ║
║  3. Campaign: "Onboarding Drip"                            ║
║     → Trigger: Enters "Newsletter Subscribers" segment      ║
║     → Goal: Schedule a demo (Cal.com booking)               ║
║     → Timeline: Day 0 → Day 2 → Day 4 → Day 6              ║
║                  Day 9 → Day 12 → Day 16 → Day 20           ║
║                                                            ║
║  4. Series (recurring broadcasts):                          ║
║     → "Recipe Breakdown" — Tuesdays                        ║
║     → "Small Model Spotlight" — Thursdays                  ║
║     → "Research Translation" — Fridays                     ║
║     → "This Week's Training Trick" — Mondays               ║
║     → "Build in Public" — Every other Wednesday            ║
║                                                            ║
╚══════════════════════════════════════════════════════════════╝
`)
