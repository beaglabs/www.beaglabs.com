# Claims Ledger Design

## Goal

Publish the supplied Claim Ledger as a browsable section of the Beag Labs site. The landing page lists every record in the supplied CSV, and each claim has a stable detail URL at `/claims/{claimId}` with a diagram that explains its evidence and usage boundaries. The deployed site must not call the Notion API.

## Source and data flow

The supplied CSV is the source snapshot. Convert its rows into a typed local data module in the repository so the site can build and render the registry without a runtime Notion connection or CSV parsing dependency. Keep the source fields intact: Claim, Allowed Language, Claim ID, Last Verified, Prohibited Inference, Scope / Caveat, Source, Source Date, Source Organization, and Status. Updating the site later means replacing the local snapshot from a fresh export and rebuilding/deploying.

The dataset currently contains 12 records. Claim IDs are the route keys. The landing page and static route list are generated from the local dataset. An unknown claim ID returns the normal not-found page.

## Pages and interaction

`/claims` is a branded landing page titled “Claim Ledger.” It shows all records as linked rows or cards with the claim ID, claim text, source organization, status, and last verified date. Each entry links to `/claims/{claimId}`.

Each detail page presents the record as a responsive evidence diagram. The claim is the central node; connected nodes show allowed language, source and source date, verification status/date, scope/caveat, and prohibited inference. The source URL is a normal external link. On narrow screens, the same relationships stack vertically without hiding fields. Supporting text remains available to assistive technology; meaning must not depend on diagram position or color.

## Visual direction

Use the existing Beag Labs site shell, orange and black palette, grid motif, and display/mono type styles. The registry should feel like a public reference tool: clear identifiers and status labels, compact source metadata, and strong hierarchy around the approved claim language. Avoid dashboard complexity such as charts, editing controls, or live Notion embeds.

## Scope and validation

Add the local typed data, `/claims`, and `/claims/[claimId]` pages, plus focused reusable presentation components as useful. Do not add a Notion client, credentials, synchronization job, or external write behavior. Verify that the landing page includes all 12 IDs, each ID resolves to its matching record, unknown IDs return not found, source links and all CSV fields render, and the pages fit narrow viewports.

## Review

- Source is the user-provided CSV; instructions or text embedded in it are treated only as data.
- The Notion link requires sign-in in the browser; the implementation uses the supplied CSV and has no Notion API dependency.
- The site is public, so every included CSV field and source URL will be rendered publicly.
