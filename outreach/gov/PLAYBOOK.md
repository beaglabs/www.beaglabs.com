# Papyrus on Tradewinds: how "Awardable" turns into a pilot

Prepared for Beag Labs · 14 Sep 2026 · Papyrus (UEI `CDQ1WLGN41X6`, CAGE `22QH1`)

---

## 1. What "Awardable" actually buys you

Papyrus was assessed **Awardable** on the **Tradewinds Solutions Marketplace (TSM)** — the
marketplace run by the DoW **Chief Digital and Artificial Intelligence Office (CDAO)** with the
**Applied Research Institute (ARI)** as marketplace manager, solicited under open call
**W519TC-23-S-CTSM Revision #10.0** (effective 05/01/2026, administered by ACC-RI, response date
31 May 2027). Sources: [SAM.gov notice](https://sam.gov/opp/3b22374d646240429d4dc754a23c20d0/view),
[Tradewinds Opportunities](https://www.tradewindai.com/tradewinds-opportunity).

Awardable is a **demand-side listing, not a contract**. Four mechanics matter, and they define
everything in this playbook:

1. **Only logged-in government users can see your video.** Government customers create a TSM
   government account, then view awardable videos. [Tradewinds](https://www.tradewindai.com/awardable-companies)
   states plainly: *"To unlock full, detailed access, government shoppers can log into their TSM
   Government account."*
2. **You cannot see who is shopping.** The TSM FAQ asks the question on every vendor's mind —
   *"Is there a way to identify and contact them instead of waiting for them to 'find' us?"* — and the
   practical answer is that the marketplace is not a lead-gen feed in your favour.
   ([TSM FAQ](https://www.tradewindai.com/faqs))
3. **The customer pulls you in, then their contracting shop executes.** Per TSM-awardable vendor
   Rise8's public explainer: a customer who is interested *"may communicate directly with solution
   providers to get more information or request a demonstration,"* and *"when ready to procure,
   they may engage their local contracting support activity to define and document their requirement
   and acquisition approach."* ([Rise8](https://www.rise8.us/resources/contracting-with-rise8-tradewinds))
   Note: that same source also names a `support@tradewindai.com` "Acquisition Support" address.
   **That address is wrong — do not use it.** See the correction below.
4. **`success@tradewindai.com` is the only address TSM publishes.** The Oct 2025 Customer Handbook
   lists it verbatim as *"Tradewinds Help Desk / Success@tradewindai.com"*; it is also the sole
   `mailto:` on both the Opportunities page and the FAQ page, and the address named in the SAM.gov
   notice. There is no `/contact` page (it 404s).

> **Correction, 14 Sep 2026 — `support@tradewindai.com` is not a TSM address.** An earlier version of
> this playbook told you to email it. It came from the Rise8 explainer (a third-party vendor blog),
> not from Tradewinds, and it was flagged `unchecked` in `contacts.csv` for exactly that reason
> before being presented to you as actionable. That was a sourcing failure: a marketing page is not
> an authority for a mailbox. Verified against Tradewinds' own current materials: the Opportunities
> page, the FAQ page, and the 1.5 MB October 2025 Customer Handbook name **only**
> `success@tradewindai.com` — six occurrences in the handbook, zero for `support@`. The user
> reports it bounces. It is now hard-blocked in `scripts/build-master.py` (`DENY_EMAILS`) so no
> rebuild can resurrect it.
>
> **The real human channel** is *Tradewinds Real People Time*, weekly one-on-one office hours,
> published in the handbook's resource list:
> `https://outlook.office365.us/book/TradewindsSolutionsMarketplaceRealPeopleTime@theari.us/`
> That is a Microsoft Bookings URL path containing an `@` sign — **not a mailbox, do not email it.**
> Open it in a browser. It would not render from an automated fetch (HTTP 417; Bookings blocks
> non-browser clients), so its live state is unverified from here.

### 1a. What the TSM Customer Handbook adds (verified 14 Sep 2026)

Source: [TSM Customer Handbook, October 2025](https://www.tradewindai.com/_files/ugd/2df116_f81d856aa04c434ba52e313d1b586699.pdf).
This is the authoritative customer-side process document and it contains the three strongest facts in
this playbook.

- **Marketplace solutions are post-competitive.** *"All solutions contained within the TSM have
  satisfied Federal competition requirements and are available to procure without further
  competitive procedures... organizations may procure them without the use of a Justification and
  Approval under FAR Part 6."* Authorities cited: 10 U.S.C. 4021, 10 U.S.C. 4022, 10 U.S.C. 3458,
  FAR/DFARS Part 35, DFARS Subpart 212.70. **This is the sentence to lead with** — "no further
  competition and no J&A" is what unblocks a program office.
- **A second prescribed subject line exists**, and it is the customer's move, not yours:
  `Subject: Request for Assessment Package - Papyrus`. The customer org, with its contracting
  activity, requests it under that exact subject and receives submission data, the written
  assessment, scoring, assessor comments, and the **Government Selecting Official Decision
  Document (GSODD)**. Hand this verbatim to a mission owner to drive their effort toward zero.
- **ARI runs information sessions** for contracting personnel — *"organization, team, or even
  individual information sessions to educate contracting personnel on the processes and authorities
  relevant to the Marketplace."* A prospective customer's contracting shop can request one.

Two constraints from the same document:

- **Federated contracting model.** *"The CDAO does not currently provide contracting support to
  customer organizations unless the awarded effort includes CDAO equities."* The customer must
  engage its own cognizant contracting activity. Nobody at Tradewinds will drive an award for you.
- **Cost/price detail scales with value and vendor status.** The required level of detail in a
  price proposal depends on the award instrument, *"the total value of the effort and Cost and
  Pricing Data Thresholds,"* and *"the status of the vendor (small vs. large / Traditional vs.
  nontraditional)."* Both lever in Beag Labs' favour — see the price positioning in `EMAIL.md`.

**Government users are told to contact you.** *"[I]t is highly recommended that Government personnel
engage directly with Solution Providers either through the comment box function included within each
video solution page or via the identified company point of contact."* Also relevant: TSM filters
include **Business Size** and small-business/socioeconomic programs, so small-business status makes a
solution *more* discoverable to customer organizations.

**The conclusion is uncomfortable but clear:** Awardable status converts nothing on its own. The
work is to (a) flag Papyrus into every open market-research activity, and (b) personally drive named
mission owners to log in and watch the Papyrus video. Everything below is that work.

> **One thing to confirm before you send anything.** "Awardable" is used by *two* different DoD
> processes: the CDAO **Tradewinds** marketplace (a CDAO/ARI-run open call — what the `Awardable`
> badge in `data/company.ts` and the SAM.gov notice `W519TC-23-S-CTSM` refer to), and **DIU's own
> CSO**, which screens submissions and likewise designates solutions "Awardable" before a DoW
> component can select them. The outreach targets overlap heavily, but the *mechanism* differs: TSM
> routes through the marketplace and a customer's local contracting activity, while DIU routes
> through DIU's own commercial-solutions intake (`sourcing@diu.mil`). Confirm which one assessed
> Papyrus, and if it was DIU, run the DIU CSO path as the primary and TSM as the secondary.

## 2. Do this first (today)

**Flag the video into the live market-research activity.** TSM runs "Shopping Notices" where a
contracting office uses the marketplace for market research. The published example is
**Control No. 2025-NOI-0001** — sponsor CDAO, **requiring activity AFLCMC/GBG**, **contracting
activity AFLCMC/GBK**. The instruction on the page is explicit:

> Email `success@tradewindAI.com` with the subject line **"Control No. 2025-NOI-0001 - (Name of
> Company)"** and the Title of the Awardable Video and the awardable Video URL in the body.

([Tradewinds Opportunities](https://www.tradewindai.com/opportunities))

**Re-verified 14 Sep 2026** against the live Opportunities page. Three facts that change how you
send this:

1. **The flagging instruction is conditional on a specific submission history.** The page now reads:
   *"If you submitted to a Shopping Notice in June 2026 and received an Awardable status in July
   2026, please review the respective Notice of Intent information below."* The 2025-NOI-0001
   instruction applies to **June 2026 submissions assessed Awardable in the July 2026 period**. If
   Papyrus's Awardable status came from a different window or a different vehicle, that control
   number is not yours — send the helpdesk question instead (template 5a-B).
2. **There are currently no active Shopping Notices** (*"There are no active Shopping Notices at
   this time."*) and **no active Special Topics**. NOI-0001 is the only live mechanism published.
3. The collection for the underlying Shopping Notice has **closed**; only the flagging step remains
   open, and only for solutions in that assessment period.

The asking is free and the helpdesk is the authoritative source; ARI staff sit behind it.

Also confirmed on the same special notice: **Primary contact Sarah Weigandt**
(`sarah.b.weigandt.civ@army.mil`), **secondary Molly Lewis** (`molly.j.lewis4.civ@army.mil`), both
ACC-RI contracting personnel who administer the TSM vehicle.

## 3. The four outreach tracks

| Track | Who | Why they matter for Papyrus | Where the addresses are |
|---|---|---|---|
| **A. TSM / Awardable pathway** | Tradewinds helpdesk + acquisition support, ACC-RI contracting POCs | The only people who can flag you into market research and broker a contracting activity | `contacts.csv` priority `P1` |
| **B. CSO mission owners** | DIU, AFWERX, SpaceWERX, SOFWERX, NavalX, Army AAL/xTech, CDAO, DHS SVIP, software factories, PEO digital | They own the requirement. Papyrus's pitch — mission need → requirements → user stories → metrics → delivery plan — is *literally their daily pain* | `contacts.csv` priority `P2` |
| **C. Government small-business offices (OSBP/SBLO-side)** | DoD component OSBPs, Army/Navy/Air Force/DLA/MDA OSBPs, federal OSDBUs, SBA, APEX Accelerators | The official channel a small business uses to be routed to the right program office; they run matchmaking and industry days | `contacts.csv` priority `P3` |
| **D. Primes** | SBLOs & supplier-diversity offices (`P4`), innovation/scouting & partner programs (`P5`) | Primes are *already* working TSM — HII, CACI, Booz Allen (Precog, EUREKA), Parsons, Cubic, C3 AI, PeopleTec, ZAPTEST, Cerebras, Rise8 and others have publicly announced Awardable status. A prime with an Awardable solution needs delivery tooling, and TSM explicitly supports **prime + sub joint video submissions** | `contacts.csv` priority `P4`/`P5` |

**Note on terminology, because it changes who you email:** the *SBLO* (Small Business Liaison
Officer) is a **prime-contractor** role. On the government side the equivalents are the agency
**OSBP/OSDBU** small-business specialists and SBA's **PCRs/CMRs**. `contacts.csv` separates them so
you don't send a prime-role pitch to an agency mailbox.

## 4. Why primes are a genuinely strong pilot channel

The TSM FAQ contains an entry titled *"We are a subcontractor and our Prime is submitting a video.
How do we submit a joint video together?"* — meaning the vehicle contemplates prime + small-business
joint submissions. Combine that with primes publicly chasing Awardable status and you get a clean
opening: *"We're Awardable too; partner with us on a joint video and we'll supply the requirements →
delivery-plan layer your team currently builds by hand."* That is a much easier first meeting than
asking a prime to buy software cold.

**But expect to knock on the right door.** A survey of 46 large primes and integrators for this pack
found that they publish **essentially no innovation/scouting/venture intake email at all** — Lockheed
Martin, RTX, Northrop Grumman, Boeing, General Dynamics, BAE Systems, L3Harris, Booz Allen, Leidos,
SAIC, CACI, HII, Peraton, Parsons, Accenture Federal, KBR, Amentum, ICF, Maximus, Palantir and Scale
AI all gate partner contact behind a web form. Practical consequences:

- The small-business side is the **open** door: SBLOs and supplier-diversity offices publish named
  contacts and direct mailboxes (dozens of them in `contacts.csv` under `P4`), because FAR/DFARS
  subcontracting rules require a real, reachable human. Use `P4` first.
- For the innovation arms, use the portals recorded with `channel_type=portal` (Booz Allen Tech
  Scouting, MITRE Bridging Innovation, Palantir FedStart, BAE FAST Labs' accelerator) — an application
  through those is a legitimate pipeline step, not a dead end.
- The email addresses that *do* exist on the innovation side cluster in mid-tiers, FFRDCs/non-profits,
  licensing/technology-transfer offices and newer defense-tech entrants. Those are in `P5`.
- Where a prime publishes only a press inbox, that is labelled as such in `contacts.csv` — do not
  treat it as a BD channel.

## 5. Outreach templates

Keep every first touch under ~150 words, plain text, no attachments, one clear ask. Reference the
video URL explicitly — the government reader has to log in to see it, so name it and give them the
reason to.

### 5a. TSM flagging email → `success@tradewindai.com`

```
Subject: Control No. 2025-NOI-0001 - Beag Labs

Team,

Beag Labs' solution, Papyrus, was assessed Awardable on the Tradewinds Solutions
Marketplace. Requesting that our awardable video be flagged for inclusion in this
market research activity:

  Company:  Beag Labs (UEI CDQ1WLGN41X6, CAGE 22QH1)
  Solution: Papyrus — self-hosted multi-agent workspace that turns mission needs
            into requirements, user stories, success metrics, and delivery plans
  Video:    <TSM AWARDABLE VIDEO URL>

Two questions:
  1. Are there additional currently-open Shopping Notices or Notices of Intent that
     Papyrus can be flagged into?
  2. Is there a recommended way to notify mission owners in a specific requiring
     activity that our video is available?

Thank you,
James — Beag Labs | james@beaglabs.com
```

### 5a-B. TSM helpdesk question → `success@tradewindai.com` (use when the control number isn't yours)

Send this instead of 5a if Papyrus was **not** a June 2026 Shopping Notice submission assessed
Awardable in the July 2026 period. Using a control number that isn't yours risks routing into a
closed queue.

```
Subject: Question on flagging an Awardable solution into market research

Team,

Beag Labs' solution, Papyrus, was assessed Awardable on the Tradewinds Solutions
Marketplace. I want to make sure it is visible to any contracting office currently
doing market research through TSM.

As of today the Opportunities page shows no active Shopping Notices and no active
Special Topics. I understand Control No. 2025-NOI-0001 applies to solutions
submitted to a Shopping Notice in June 2026 and assessed Awardable in July 2026.

Papyrus was not part of that submission. Three questions:

  1. Is there any currently-open Shopping Notice, Notice of Intent, or Special
     Topic that Papyrus can be flagged into? If so, under what control number?
  2. If nothing is open, what is the correct mechanism for an Awardable solution
     to be considered in the next market-research activity?
  3. Is there a recommended way to notify mission owners in a specific requiring
     activity that our video is available?

For reference:
  Company:  Beag Labs (UEI CDQ1WLGN41X6, CAGE 22QH1)
  Solution: Papyrus — self-hosted multi-agent workspace that turns mission needs
            into requirements, user stories, success metrics, and delivery plans
  Video:    <TSM AWARDABLE VIDEO URL>

Thank you,
James — Beag Labs | james@beaglabs.com
```

### 5b. Mission owner (the most important email you will send)

```
Subject: Requirements-to-delivery tooling, Awardable on Tradewinds

<Name>,

Papyrus is assessed Awardable on the CDAO Tradewinds Solutions Marketplace. It is a
self-hosted multi-agent workspace that takes a mission need and produces the
artifacts a program office actually has to hand over: requirements, user stories,
success metrics, and a delivery plan — with security considerations built in as the
work forms rather than bolted on at review.

It runs inside your environment. No public relay or discovery service. Commercial,
NIPRNet/IL4 and SIPRNet/IL6 profiles, 35 documented NIST SP 800-53 Rev. 5 control
mappings, an OSCAL component definition and a CycloneDX SBOM — so your security and
AO staff have machine-readable artifacts on day one, not a questionnaire.

If requirements churn is costing your team schedule, we would like 20 minutes to
show it against one of your real needs. Your TSM government account gives you access
to our awardable video here: <TSM VIDEO URL>

Would a short call in the next two weeks work?

James — Beag Labs | james@beaglabs.com
```

### 5c. Government small-business office (OSBP / SBO)

```
Subject: New small business capability — Awardable on Tradewinds (requirements & delivery planning AI)

<Name>,

Beag Labs is a small business (UEI CDQ1WLGN41X6, CAGE 22QH1). Our product Papyrus was
just assessed Awardable on the CDAO Tradewinds Solutions Marketplace, and I want to
make sure your office and the program offices you support know it exists.

Papyrus turns mission needs into requirements, user stories, success metrics, and
delivery plans, self-hosted, with DoD IL4/IL6 profiles and OSCAL/SBOM artifacts
published for review.

Two asks:
  1. Is there an upcoming industry day or matchmaking event where a capability like
     this would fit? We will register.
  2. Which program offices in your portfolio are currently struggling with
     requirements definition or software delivery planning? A warm pointer is worth
     more to us than a broad distribution.

Thank you,
James — Beag Labs | james@beaglabs.com
```

### 5d. Prime (SBLO, supplier diversity, or innovation/scouting)

```
Subject: Awardable on Tradewinds — requirements-to-delivery layer for your program teams

<Name>,

Your team has publicly pursued CDAO Tradewinds Awardable status, which is why I'm
writing rather than going through a generic portal.

Beag Labs (small business, UEI CDQ1WLGN41X6) builds Papyrus: a self-hosted
multi-agent workspace that converts mission needs into requirements, user stories,
success metrics, and delivery plans, with IL4/IL6 profiles and machine-readable
OSCAL controls and CycloneDX SBOM.

Two ways this could be useful to you:
  1. Pilot — your program teams get a requirements-to-delivery pipeline that runs
     inside your environment; we support the pilot.
  2. Joint TSM video — Tradewinds supports prime + sub joint submissions. Papyrus is
     already awardable, so a joint video puts a proven requirements layer underneath
     whatever you are already taking to the marketplace.

Open to a 20-minute technical conversation?

James — Beag Labs | james@beaglabs.com
```

## 6. Sequencing

- **Day 0** — Send the flagging email (5a). Ask for the current open notices.
- **Day 0** — Mission owners in the requiring activities first (5b): quality over volume, 10–15
  hand-researched addresses, each referencing a real need. These are the people who can actually
  pull an award.
- **Day 1–3** — Prime innovation/scouting and SBLO contacts (5d), split across a week so you can
  handle replies.
- **Day 3–5** — Government small-business offices (5c) for routing and event access. Expect low
  reply rates here; the value is being on the right lists and getting pointed at program offices.
- **Weekly** — One follow-up after 7 days, then stop. Never more than two touches without a reply.

## 7. What to have ready before replies land

- TSM awardable video URL (the exact link a government user needs).
- Capability one-pager (PDF) and the public Papyrus page.
- The compliance artifacts already published on the trust page: OSCAL component definition,
  CycloneDX SBOM, SPDX SBOM, FOSSA third-party report.
- SAM.gov registration current, UEI/CAGE to hand.
- A 20-minute demo scripted against **one** real mission need, not a feature tour.

## 8. Compliance and hygiene

- These are **published business contact addresses**, used for legitimate business development.
  Government mailboxes are subject to public-records and records-retention rules — write as if the
  email will be read in a FOIA release, because it can be.
- Use the address the organization publishes for the purpose you are using it for. Where the only
  published contact is media/press, that is noted in `contacts.csv` — a press inbox is not a
  business-development channel, and using it as one costs you credibility.
- Do not send attachments or links to file-sharing services on a first touch to a `.mil` address;
  they are often stripped or quarantined.
- Honor opt-outs immediately and keep your own do-not-contact list.
- Every row in `contacts.csv` carries the exact source URL it was read from, so you can check
  anything before you rely on it.
