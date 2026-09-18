# Papyrus cold email — government mission owners / CSOs

## Subject line

```
Papyrus — Tradewinds Awardable, runs in your boundary (IL4/IL6)
```

Alternates (A/B these if you want):

```
Papyrus — Tradewinds Awardable, self-hosted agentic workspace
Question re: <ORG> requirements work — Papyrus (Tradewinds Awardable)
```

## Body

> [First name] —
>
> I'm James, founder of Beag Labs (UEI CDQ1WLGN41X6, CAGE 22QH1). Our agentic
> workspace, Papyrus, was just listed Awardable on the Tradewinds Solutions
> Marketplace.
>
> What it does: Papyrus turns a plain-language mission problem into requirements,
> user stories, success metrics, and a delivery plan — with product, design,
> engineering, and security agents working off one shared specification.
>
> It's self-hosted and runs entirely inside your boundary. No public relay or
> discovery service. Commercial, NIPRNet/IL4, and SIPRNet/IL6 profiles, with
> NIST SP 800-53 Rev. 5 control mappings, an OSCAL component definition, and
> CycloneDX/SPDX SBOMs already published.
>
> [PERSONALIZATION LINE]
>
> Papyrus is post-competitive on the marketplace — it has already satisfied federal
> competition requirements, so your contracting shop can procure it without further
> competition and without a J&A. They can also request the assessment package and
> the Government Selecting Official Decision Document behind our Awardable status.
>
> Would a 20-minute demo be useful? If not, I'd appreciate a pointer to whoever
> owns this for you.
>
> James
> Beag Labs · beaglabs.com · james@beaglabs.com

## Price positioning

Keep the pilot **at or under $350,000**. That is the general simplified acquisition threshold as of
the 1 Oct 2025 inflation adjustment (it was $250,000 before). Two reasons it matters:

- **Below the SAT** an agency must award to a small business unless the contracting officer
  determines there is no reasonable expectation of two or more responsible small businesses at fair
  market prices (15 U.S.C. §644(j)(1); FAR 19.502-2(a), the Rule of Two). Being under the SAT *and*
  a small business makes Beag Labs the default awardee rather than a discretionary set-aside.
- **Below the SAT** also means FAR Part 13 simplified acquisition procedures, and no certified cost
  or pricing data (the TINA threshold is far higher). The TSM *Customer Handbook* notes the required
  detail of a cost/price proposal scales with **"the total value of the effort and Cost and Pricing
  Data Thresholds"** and **"the status of the vendor (small vs. large / Traditional vs.
  nontraditional)"** — both of which you want working for you.

$350,000 is a **ceiling, not a target**. The further under it the pilot lands, the cleaner the
action. Do not quote a price to the marketplace helpdesk; it anchors you and they are not the buyer.

## Hand this to a mission owner (removes their effort)

These are the *customer's* moves, not yours. Give them verbatim:

```
To:      success@tradewindai.com
Subject: Request for Assessment Package - Papyrus
```

The TSM *Customer Handbook* directs the customer organization, with its contracting activity, to
request the assessment package under that exact subject. What comes back: submission data, the
written assessment, scoring, assessor comments, and the **Government Selecting Official Decision
Document (GSODD)**. ARI also runs "organization, team, or even individual information sessions to
educate contracting personnel" on the Marketplace — a prospective customer's contracting shop can
ask for one.

## What Tradewinds will *not* do

The handbook: the program uses a "federated" or "distributed" contracting model, and **"the CDAO does
not currently provide contracting support to customer organizations unless the awarded effort
includes CDAO equities."** The customer engages its own cognizant contracting activity. Nobody at
Tradewinds will drive an award for you — which is precisely why the mission-owner email is the one
that matters.

## Personalization line, by recipient

| Recipient | Swap in |
|---|---|
| `sourcing@diu.mil` | You run the CSO that this kind of thing is built to come through. I'd like Papyrus in front of whichever DIU mission team is closest to it. |
| `afrl.rgv.SBIRSTTR@us.af.mil` | Writing because the AFVentures Open Topic is the front door for this — but Papyrus is already built and deployed, so this is a transition conversation, not an R&D one. |
| `amanda.roark@sofwerx.org`, `info@sofwerx.org` | SOFWERX is where this gets in front of SOCOM end users rather than a contracting shop. Is there a Tech Tuesday or focus event where a self-hosted agentic workspace fits? |
| `lanora.means@socom.mil`, `osbp@socom.mil`, `esof@socom.mil` | USSOCOM CSO is the vehicle I'd expect this to move through. I'd rather work backwards from an operator's actual problem than submit cold. |
| `alexander.holtet@navy.mil`, `NAVWAR_2.7_CSO@us.navy.mil` | The 2.7 cyber workforce AOI is close to what Papyrus does — it's a governed workspace that turns requirements into delivery artifacts, and it maps its own controls. |
| `AFSC.SW.SoftwareEcosystem@us.af.mil`, `platformone@afwerxpartner.com`, `charlie.bahk@usmc.mil` | You've already solved the platform layer. Papyrus is the layer above it — the requirements-to-delivery work that currently happens in slides and docs. It runs on your stack. |
| `AFLCMC.GBQ.WP-MACH-5@us.af.mil`, `spacecamp@afrl.af.mil` | Adjacent to what Mach 5 / Space CAMP already do, and designed to run inside the same boundary rather than beside it. |
| `aal-baa@army.mil`, `DEVCOM_Partnerships@army.mil`, `SPARX@army.mil` | Submitting/citing against the AAL BAA and SPARX, but I'd rather understand one real problem set first so the submission is aimed at something. |
| `MDA-PartnerWithUs@mail.mil`, `IndustryEngagement@nga.mil`, `SandT.Innovation@hq.dhs.gov` | Requesting a slot through your industry engagement process — Papyrus is self-hosted with IL4/IL6 profiles and published control mappings, so it clears the usual deployment objection. |

## SFBO / SBLO variant (different ask — teaming, not buying)

Swap the "Would a 20-minute demo be useful?" paragraph for:

> I'm not writing to sell you anything. Beag Labs is a small business
> (UEI CDQ1WLGN41X6, CAGE 22QH1), Tradewinds Awardable, and I'm looking to
> team or subcontract into programs where a self-hosted agentic workspace is
> the gap. Who handles supplier and small-business intake for your group?

## Send notes

- **No attachments.** Government mail filters strip them. Link or describe.
- **One recipient per email.** Do not CC SBLOs and mission owners together —
  the SBLO reads it as a sales blast and the mission owner reads it as circular.
- **Send from `james@beaglabs.com`**, plain text-ish, no tracking pixel, no
  marketing footer. It should look like a person typed it.
- **Follow up once**, 7–10 days, two sentences: "Bumping this once in case it
  got buried. Happy to be told it's not relevant."
- **Reply-to is the goal, not the demo.** A "not me, try X" reply is a win.
