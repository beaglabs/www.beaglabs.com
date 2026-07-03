# Beag Labs Media-Backed Homepage — Implementation Plan

> Steps use checkbox (`- [ ]`) syntax so implementation can be tracked task-by-task.

**Goal:** Rebuild the homepage around the approved light enterprise direction: a cycling media-backed hero using `public/hero1.gif`, `public/hero2.gif`, and `public/hero3.gif`, followed by a cleaner full-page structure for capabilities, featured work, research, engagement model, CTA, and footer.

**Architecture:** Keep the site in the existing Next.js App Router structure and implement the redesign as a homepage composition refactor. Preserve the current route model and content sources that remain in active use. The hero uses CSS-timed crossfades between local GIF assets layered behind a light overlay. Below the hero, build static marketing sections with room to later hydrate selected areas from existing research content.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, existing local `public/` media assets, current Google font setup unless explicitly changed later.

**Non-goals / Deferred Work:**
- Do **not** rename `Research` to `Field Notes` in this implementation.
- Do **not** redesign the `/research` route yet.
- Do **not** introduce a CMS-driven homepage in this pass.
- Do **not** add new animation libraries; use CSS for hero cycling.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/page.tsx` | Modify | Compose the new homepage section order |
| `app/globals.css` | Modify | Add homepage-specific tokens/utilities and hero keyframes |
| `components/navbar.tsx` | Modify | Align nav styling with the approved light enterprise chrome |
| `components/hero-section.tsx` | Replace/refactor | Implement the approved cycling media hero |
| `components/capabilities-section.tsx` | Modify | Recast as cleaner enterprise capability cards |
| `components/site-footer.tsx` | Modify | Match denser enterprise footer structure |
| `components/capability-tracks-strip.tsx` | Create | Thin track strip immediately below hero |
| `components/featured-work-section.tsx` | Create | Neutral flagship proof/work surface |
| `components/research-preview-section.tsx` | Create | Homepage preview of research content |
| `components/engagement-model-section.tsx` | Create | Four-step process section |
| `components/final-cta-section.tsx` | Create | Dark closing CTA block |

---

## Task 1: Establish Homepage Visual System

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add homepage-specific motion primitives**

Add reusable keyframes and utility classes for the hero media rotation:
- three-layer opacity crossfade
- slight scale drift during active state
- reduced-motion safe fallback (`prefers-reduced-motion` should show a single asset without animation)

- [ ] **Step 2: Add section-level visual utilities**

Add utility classes or tokenized patterns for:
- light warm background sections
- subtle top borders/dividers
- grid overlays used sparingly on the hero
- glass-like cards with restrained blur and borders

- [ ] **Step 3: Keep palette changes narrow**

Do not redesign the entire site token system. Add only what the homepage needs:
- preserve the existing warm background direction
- preserve dark CTA treatment
- preserve orange as a selective accent

- [ ] **Step 4: Verify hero motion degrades safely**

Expected:
- desktop hero crossfades smoothly between all three GIFs
- no visible flashing between frames
- reduced-motion environment shows a stable non-animated first frame/layer

---

## Task 2: Implement The Approved Hero

**Files:**
- Modify: `components/hero-section.tsx`
- Modify: `components/navbar.tsx`

- [ ] **Step 1: Replace the current hero layout**

Implement the approved structure:
- left-aligned eyebrow, large headline, supporting paragraph, two CTAs
- right/background media field using `hero1.gif`, `hero2.gif`, `hero3.gif`
- light overlay and optional faint grid for structure

The hero should feel:
- cinematic but controlled
- premium and readable
- enterprise-oriented, not product-demo-heavy

- [ ] **Step 2: Use local assets from `public/`**

Use:
- `public/hero1.gif`
- `public/hero2.gif`
- `public/hero3.gif`

Implementation should not depend on remote media.

- [ ] **Step 3: Keep hero messaging aligned to approved direction**

Recommended working copy:
- eyebrow: `Applied AI For High-Context Technical Environments`
- headline: `Deploy domain-specific AI systems with operational clarity.`
- supporting text focused on datasets, evaluation protocols, and model systems for robotics, science, and operational environments

Copy can be tuned during implementation, but the tone must stay specific and calm.

- [ ] **Step 4: Refine navbar chrome**

Keep navbar minimal and light:
- logo + wordmark left
- `Research`, `Capabilities`
- dark `Talk to us` CTA right
- subtle translucent background on scroll/over hero

- [ ] **Step 5: Verify mobile behavior**

Expected:
- hero remains legible on small screens
- background media remains atmospheric, not dominant
- CTA stack wraps cleanly
- nav does not crowd or overlap hero copy

---

## Task 3: Add The Thin Capability Tracks Strip

**Files:**
- Create: `components/capability-tracks-strip.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Build a thin post-hero strip**

Create a section directly below the hero with four concise track labels:
- Synthetic data systems
- Forward deployed ML
- Evaluation protocols
- Robotics workflows

- [ ] **Step 2: Keep it lighter than a stats bar**

This is a structural bridge, not a KPI section.
It should read as capability framing, not dashboard proof.

- [ ] **Step 3: Verify spacing transition from hero**

Expected:
- the strip feels like a continuation of the hero narrative
- it helps anchor the page before larger content sections begin

---

## Task 4: Rework Capabilities Section

**Files:**
- Modify: `components/capabilities-section.tsx`

- [ ] **Step 1: Keep four-card structure but increase enterprise clarity**

Retain a 2x2 card rhythm, but rewrite and restyle to focus on:
- dataset generation
- forward deployed ML
- model adaptation
- evaluation systems

- [ ] **Step 2: Remove brochure-style language**

Card copy should sound operational and specific, not agency-generic.

- [ ] **Step 3: Match the approved page language**

Cards should visually align with the hero and not revert to the older academic-minimal style.

---

## Task 5: Add Featured Work Surface

**Files:**
- Create: `components/featured-work-section.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create a neutral flagship proof section**

Since `Chaveta` is no longer valid, build this section as a reusable featured work surface rather than naming a stale project.

- [ ] **Step 2: Use one strong media frame**

This section may use one of the approved hero assets or another local visual, but it should feel like a proof artifact, not a fake product dashboard.

- [ ] **Step 3: Keep copy abstract enough to be true**

Use wording around:
- operational systems
- Earth-scale data
- robotics or real-world deployment

Avoid invented project claims or fake metrics.

---

## Task 6: Add Research Preview Section

**Files:**
- Create: `components/research-preview-section.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add a homepage research preview block**

Build a section that previews recent research in an editorial list style.

- [ ] **Step 2: Start with static placeholders or light hydration**

Preferred implementation order:
1. build the layout first
2. wire real data only if it can be done cleanly with existing research fetching patterns

If live data is added, keep the section lightweight and avoid pulling excessive body content.

- [ ] **Step 3: Preserve current naming**

Label the section `Research` for now.
Add a short comment or note in the plan implementation context that `Field Notes` is a future rename, not part of this pass.

---

## Task 7: Add Engagement Model Section

**Files:**
- Create: `components/engagement-model-section.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the four-step section**

Use the approved process structure:
- Frame the domain
- Build the data
- Adapt the model
- Deploy with the team

- [ ] **Step 2: Keep the section simple and legible**

This should support enterprise credibility, not feel like a heavy timeline or diagram.

---

## Task 8: Add Final CTA And Footer Refresh

**Files:**
- Create: `components/final-cta-section.tsx`
- Modify: `components/site-footer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the dark closing CTA block**

Use the approved contrast shift near the bottom of the page:
- dark background
- one strong line of copy
- primary CTA and secondary supporting action

- [ ] **Step 2: Refresh footer density and structure**

Keep footer light but denser and more enterprise-ready:
- brand block
- capabilities column
- work/resources column
- company/legal column

- [ ] **Step 3: Verify the CTA-to-footer transition**

Expected:
- dark CTA feels intentional, not abrupt
- footer return to light background feels clean and finished

---

## Task 9: Compose And Verify Homepage End-To-End

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Compose the new homepage in this order**

1. Navbar + Hero
2. Capability tracks strip
3. Capabilities
4. Featured work
5. Research preview
6. Engagement model
7. Final CTA
8. Footer

- [ ] **Step 2: Remove or replace obsolete homepage sections**

Do not leave the current Gleap CTA section in place if it clashes with the new closing CTA. Either:
- remove it from the homepage composition, or
- split the Gleap behavior into a new CTA component that matches the approved design

- [ ] **Step 3: Verify across breakpoints**

Check:
- desktop hero scale and readability
- tablet section spacing
- mobile CTA stacking
- footer column collapse behavior

- [ ] **Step 4: Run validation commands**

Run:
```bash
npm run lint
```

Expected:
- no new lint failures from the homepage refactor

---

## Implementation Notes

- The hero is the anchor of this redesign; if implementation tradeoffs appear, bias toward preserving the approved hero feel over adding extra below-the-fold complexity.
- Do not let placeholder proof content drift into fake specificity. Generic but true is better than invented claims.
- Keep `Research` naming unchanged in code, copy, and nav for this pass.
- If the three hero GIFs feel too heavy in the actual app, optimize only after the first design-faithful implementation lands.
