# Papyrus — Tradewinds Awardable outreach pack

**Built:** 14 Sep 2026 · **For:** Beag Labs / Papyrus (UEI `CDQ1WLGN41X6`, CAGE `22QH1`)
**Trigger:** Papyrus assessed **Awardable** on the CDAO Tradewinds Solutions Marketplace.

---

## Files

| File | What it is |
|---|---|
| `contacts.csv` | **The deliverable.** Outreach-ready list — one row per contact, with org, role, person, email, the exact source URL, a priority tier and a verification status. |
| `contacts-all.csv` | Everything collected, including the rows triaged out as unusable (SBA loan/lender staff, press desks, FOIA lines). Kept for completeness. |
| `PLAYBOOK.md` | How "Awardable" converts to a pilot, the four outreach tracks, four ready-to-send email templates, sequencing and compliance notes. |
| `raw/` | Raw researcher output per category, plus verification verdicts (`verify*.tsv`). |
| `scripts/` | The tooling: `harvest-emails.py` (fetch + extract), `build-master.py` (merge/filter/dedupe), `verify-sources.py` (independent re-fetch verification), `tsv-to-csv.py`, `recheck-jina.py`. |

## Do this first

Your Awardable status is a **listing, not a contract**, and only logged-in government users can see
your video. The single highest-value action is the flagging email — TSM publishes the exact procedure:

> Email `success@tradewindAI.com` with the subject line **"Control No. 2025-NOI-0001 - (Name of
> Company)"** and the Title of the Awardable Video and the awardable Video URL in the body.

That instruction sits on the [Tradewinds Opportunities page](https://www.tradewindai.com/opportunities)
for a market-research activity whose **requiring activity is AFLCMC/GBG** and **contracting activity
AFLCMC/GBK**.

**Re-verified 14 Sep 2026:** the live page states there are **no active Shopping Notices** and **no
active Special Topics**, and the NOI-0001 instruction is expressly for solutions *"submitted to a
Shopping Notice in June 2026"* that *"received an Awardable status in July 2026."* The
control-number email is therefore correct **only if that is Papyrus's history** — otherwise send the
helpdesk question (template 5a-B in `PLAYBOOK.md`) and ask which notices are open now.

The notice also names the humans who administer the TSM vehicle:
**Sarah Weigandt** (`sarah.b.weigandt.civ@army.mil`) and **Molly Lewis**
(`molly.j.lewis4.civ@army.mil`), both ACC-RI. Full detail and templates: `PLAYBOOK.md`.

## What's in the list

**1,525 unique email addresses** (1,248 of them in the outreach list). `contacts.csv` holds the
**1,400 outreach-ready rows**; `contacts-all.csv` holds all **1,677 rows** including those triaged out. Tiered by how directly each
contact can move Papyrus:

| Tier | Rows | Who |
|---|---|---|
| **P1 · TSM / Awardable pathway** | 18 | Tradewinds helpdesk and acquisition support, the ACC-RI contracting POCs who administer TSM, CDAO-adjacent channels |
| **P2 · CSO mission owners** | 196 | DIU, AFWERX/AFVentures, SpaceWERX, SOFWERX, USSOCOM, NavalX/Navy PEOs and NIWC CSOs, Army AAL/DEVCOM/xTech, Platform One, Kessel Run, BESPIN, MDA, NGA, DHS S&T/SVIP, DARPA |
| **P3 · Gov small business / SBLO-side** | 629 | DoD component OSBPs, the full federal OSDBU set, Army small-business offices in every state, SBA, and the APEX Accelerator network |
| **P4 · Prime SBLO / supplier diversity** | 306 | Named SBLOs and supplier-diversity offices at 173 organizations — GD by business unit, Northrop per sector, RTX, Lockheed Martin, Boeing, Leidos, Booz Allen, KBR, Parsons, Peraton, ManTech, Amentum and more |
| **P5 · Prime innovation / scouting** | 60 | Innovation, venture, licensing and technology-transfer contacts at mid-tiers, FFRDCs and newer defense-tech |
| **P6 · Portal / channel only** | 30 | Where no email exists and the real path is a form or an event |

## Top 20 to send first

Ordered by expected yield for a mission-requirements / product-management AI tool that is already
Awardable. Every address below was re-fetched and confirmed against its source.

| # | Email | Who | Why |
|---|---|---|---|
| 1 | `success@tradewindai.com` | TSM help desk — **the only address TSM publishes** | Flagging Awardable videos into market research; also the route to ARI for assessment packages and info sessions |
| 2 | `sarah.b.weigandt.civ@army.mil` | ACC-RI, primary POC on the TSM special notice | Administers the vehicle Papyrus is listed on |
| 3 | `sourcing@diu.mil` | DIU commercial-solutions intake | DIU's CSO front door if the Awardable status came from DIU rather than TSM |
| 4 | `AFLCMC.GBQ.WP-MACH-5@us.af.mil` | Mach 5, AFLCMC/GBQD | Same directorate family as the requiring activity on the live shopping notice |
| 5 | `AFSC.SW.SoftwareEcosystem@us.af.mil` | Kessel Run / AFSC software | Software delivery org with a standing requirements problem |
| 6 | `platformone@afwerxpartner.com` | Platform One (AFLCMC/HNC) | Runs its own CSO and already mandates SBOM/OSCAL-style artifacts Papyrus ships |
| 7 | `eSOF@socom.mil` | USSOCOM Engage SOF | Published literally as "for vendor inquiries" — SOCOM's BD door |
| 8 | `osbp@socom.mil` | USSOCOM Office of Small Business Programs | Routing into SOCOM program offices |
| 9 | `MDA-PartnerWithUs@mail.mil` | MDA industry engagement | Purpose-built industry entry point |

> **Known-bad address.** `support@tradewindai.com` ("TSM Acquisition Support") was listed here
> earlier as rank 3. It is **not a TSM address** — its only provenance was a third-party vendor
> blog (rise8.us), while Tradewinds' own Opportunities page, FAQ, and October 2025 Customer
> Handbook name only `success@tradewindai.com`. The user reports it bounces. It is now hard-blocked
> in `scripts/build-master.py`. The human channel is *Tradewinds Real People Time* weekly office
> hours — a Bookings link, not an email (see `PLAYBOOK.md` §1).
| 11 | `IndustryEngagement@nga.mil` | NGA Industry Engagement | Named team for exactly this |
| 12 | `SandT.Innovation@hq.dhs.gov` | DHS S&T Industry Liaison | Job is tracking emerging commercial products |
| 13 | `DEVCOM_Partnerships@army.mil` | Army DEVCOM partnerships | "To submit solutions: send an email to…" |
| 14 | `afrl.rgv.SBIRSTTR@us.af.mil` | AFWERX/AFVentures SBIR-STTR | The real AFWERX program mailbox |
| 15 | `DAFSmallBusinessInquiries@outlook.com` | Dept. of the Air Force | Published channel for **unsolicited proposals** |
| 16 | `osd.pentagon.ousd-atl.mbx.osbp-info@mail.mil` | DoD Office of Small Business Programs | OSD-level small-business front door |
| 17 | `crystal.l.king@rtx.com` | RTX Supplier Diversity Lead & SBLO | Named SBLO from the official DoW directory |
| 18 | `pasquale.m.desanto@lmco.com` | Lockheed Martin Corporate SBLO | Same |
| 19 | `NGCSmallBusiness@ngc.com` | Northrop Grumman corporate OSBP | Per-sector mailboxes also in `contacts.csv` |
| 20 | `smallbusiness@gd-ms.com` | GD Mission Systems Lead SBLO | GD publishes an SBLO for every business unit |

## Where the addresses came from

The strongest sources were official rather than scraped-aggregator:

- **DoW (DoD) Prime Contractor Directory, Dec 2025** — the newest official SBLO roster with named
  liaisons and direct emails.
- **NASA MSFC Marshall Prime Contractor Supplier Council list (Jul 2025)** — a table literally
  headed `ORGANIZATION | SBLO | EMAIL`, 143 addresses.
- **DHS OSDBU prime-contractor directory** — each entry labelled `Small Business Liaison: <Name>`.
- **HQDA "Army Small Business Offices by State"** (updated 23 Jul 2026, 9 pages, 94 emails) — every
  state and territory, MICC offices, National Guard USPFO contracting offices, USACE districts.
- **business.defense.gov Federal Small Business Offices** — the OSD/component mailbox table.
- **DLA Small Business contact page** — including `DLASBIR2@dla.mil` and
  `strategictechnolgoyvendorrelations@dla.mil` (spelling is DLA's own).
- **APEX Accelerator national directory** — 196 addresses across 134 offices.
- **The SAM.gov public API** — the only way to read notice POCs, because `sam.gov/opp/<id>/view` is a
  JavaScript shell that contains no addresses.

## Verification — and its exact limits

Every row carries the URL it was read from, and the list was then re-checked by **independently
re-fetching each source** and string-matching the address in the returned bytes. That pass produced:

| Status | Rows | Meaning |
|---|---|---|
| `confirmed` | 1,001 | I re-fetched the source myself and found the exact address in the returned page source |
| `unchecked: <reason>` | 247 | Source can't be settled from this machine — the reason is recorded per row |
| `n/a` | 152 | Portal/event/LinkedIn rows with no email by design |

Every unverifiable row carries a specific reason rather than a generic flag. The five reasons that
account for all 246:

- **134** — SAM.gov notice pages are a JavaScript shell containing no addresses; the POCs come from
  the SAM.gov API, which now requires an API key I don't have.
- **56** — the APEX national directory publishes addresses ROT13-/URI-encoded, so a plain string
  match cannot confirm them (the researcher decoded the payload).
- **27** — read from Wayback snapshots because the live sites block scripted fetches.
- **15** — the GD supplier portal publishes SBLO addresses but returns only a partial render here.
- **15** — Minnesota APEX bot challenge (9), Cloudflare-obfuscated addresses (4), a newsroom-published
  address (1) and one further rendering edge case (1).

Being straight about the limits:

- **Full independent re-verification of all 1,524 addresses was not possible.** Government hosts
  (Akamai-fronted `.mil`, `business.defense.gov`) and many vendor sites block scripted fetches.
  Where I could not settle a source I recorded *why* rather than implying failure. **No row is marked
  `confirmed` unless I re-fetched the source and matched the address myself.**
- **Two known method artifacts were caught and corrected, not papered over:** an early verification
  run reported false misses because it stripped `<script>` blocks (where schema.org JSON-LD contact
  data lives) and because sending a browser User-Agent to the reader proxy triggered its Cloudflare
  challenge, returning a challenge page that looked like a failed verification. Both are fixed in
  `scripts/verify-sources.py`.
- **Researchers were required to cite a source URL for every address and forbidden from constructing
  addresses from name patterns.** They reported their own rejected false positives, which is the
  behaviour you want: a Palantir address that turned out to be a CMS redirect rule, `email@company.com`
  form placeholders, `HSSE@kbr.com` from a fraud-alert line, and a third-party-directory BAE
  webmaster address were all found and discarded rather than shipped.

## What could not be found (recorded as negatives, not guesses)

- **CDAO AIRCC and Alpha-1** — no discoverable contact anywhere; `cdao.mil` does not resolve and
  `ai.mil` blocks scripted fetches.
- **AFWERX / SpaceWERX publish no business-development address** — only a media inbox. Their intake is
  a web form, and STRATFI/TACFI require a *government* POC to submit, so a vendor cannot self-submit.
- **Army xTech** — no email at all, only a web form.
- **Screeners with no email published:** CENTCOM, NRO, DIA, NGA, DHA, DFAS, TRANSCOM, HQMC/MARCORSYSCOM.
- **Primes with no supplier-diversity contact:** ASRC Federal (a full 106-page sitemap enumeration found
  no supplier page), Axiologic, Palantir, Govini and Vannevar Labs (contact form only).
- **The large primes publish essentially no innovation/scouting/venture intake email** — Lockheed, RTX,
  Northrop, Boeing, GD, BAE, L3Harris, Booz Allen, Leidos, SAIC, CACI, HII, Peraton, Parsons, Accenture
  Federal, KBR, Amentum, ICF, Maximus, Palantir and Scale AI all gate it behind a form. The small-business
  side is the open door; see `PLAYBOOK.md` §4.

## Two things to confirm before you send

1. **Which "Awardable"?** Tradewinds (CDAO) and DIU's own CSO both use the term. Your `data/company.ts`
   badge and the SAM.gov notice `W519TC-23-S-CTSM` point to Tradewinds, but the outreach path differs
   enough that it's worth being certain.
2. **The shopping-notice window.** The published flagging instruction is scoped to solutions assessed
   Awardable in **July 2026**. Confirm with `success@tradewindai.com` which notices are open now.

## Caveats on the data

- Some addresses are role mailboxes that appear in several official directories (e.g.
  `crystal.l.king@rtx.com` appears in both the DoW and NASA rosters) — corroboration, not duplication.
- The DLA specialist directory mirrored at `wispro.org` is dated **2018**; it is flagged as vintage in
  the notes. Prefer the current DLA contact page rows.
- Mississippi's APEX Accelerator publishes `apexacclerator@mississippi.org` — the typo is in the
  source, reproduced exactly. Check deliverability before relying on it.
- Where a prime publishes only a press inbox, the row says so. A press desk is not a BD channel — using
  it as one costs credibility.
