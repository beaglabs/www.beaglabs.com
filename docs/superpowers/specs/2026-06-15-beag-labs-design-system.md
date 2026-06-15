# Beag Labs Design System & Enterprise Landing Page

**Date:** 2026-06-15
**Status:** Approved
**Direction:** Academic Minimal — restrained, institutional, flat. Inspired by Anthropic.com's design language, adapted for Beag Labs' identity.

---

## Goal

Rebuild the Beag Labs homepage as a sharp, enterprise-grade landing page with a cohesive design system. The result should feel like a serious AI research institution — credible, polished, and distinctive.

---

## Design Tokens

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--foreground` | `#111111` | Primary text, headings |
| `--background` | `#FAFAF9` | Page background (warm off-white, avoids pure white) |
| `--surface` | `#FFFFFF` | Cards, content panels |
| `--muted` | `#555555` | Body paragraphs |
| `--subtle` | `#999999` | Secondary labels, captions, metadata |
| `--accent` | `#8B7355` | Section labels, warm taupe accent (replaces primary orange for non-interactive use) |
| `--brand` | `#FF5F1F` | CTAs only, `::selection` highlight. Used sparingly — never for body text or labels |
| `--border` | `rgba(0,0,0,0.06)` | Subtle section/row dividers |
| `--border-strong` | `rgba(0,0,0,0.10)` | Card borders, hover states |

### Typography

| Level | Family | Weight | Size / Line-height | Letter-spacing | Usage |
|---|---|---|---|---|---|
| Hero headline | Inter | 500 | 44px mobile, 56px lg+ / 1.12 | -0.025em | Main page heading |
| Section heading | Inter | 500 | 28–32px / 1.2 | -0.02em | Section titles |
| Card heading | Inter | 500 | 16–18px / 1.3 | -0.01em | Card titles |
| Body | Inter | 400 | 15–16px / 1.75 | 0 | Paragraphs |
| Nav link | Inter | 400 | 12–13px / 1.4 | 0 | Navigation items |
| Section label | JetBrains Mono | 500 | 9px / 1.4 | 3px | Uppercase section labels (warm taupe) |
| Card ID | JetBrains Mono | 400 | 11px / 1.4 | 0 | Service card numbering |
| Footer link | Inter | 400 | 13px / 1.6 | 0 | Footer link lists |
| Copyright | JetBrains Mono | 400 | 10px / 1.4 | 2px | Footer legal text |

### Spacing Scale

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 56 / 64 / 72 / 80 / 96 / 120`

Section vertical padding: 96–120px. Card internal padding: 32–48px. Grid gaps: 1px (border-based) or 24–32px (gap-based).

### Interactive Tokens

- **Border radius:** Pill (full) for buttons, 0 for cards (flat), 4–6px for images/logos
- **Shadows:** None. Flat design throughout.
- **Transitions:** `transition-colors duration-200` for links, `duration-300` for card borders
- **Hover:** Links shift from `--muted` to `--foreground`. Cards shift border from `--border` to `--border-strong`. Dark pill buttons lighten slightly.

---

## Component Specifications

### 1. Navbar (`components/navbar.tsx`)

- **Position:** Fixed top, `z-50`
- **Background:** `white/95` with `backdrop-blur-sm`
- **Border:** Bottom, `1px solid rgba(0,0,0,0.06)`
- **Height:** 56px (`h-14`)
- **Layout:** Max-width `7xl`, flex row, items-center
- **Left:** Logo image (28×28) + "Beag Labs" wordmark in Inter Medium 14px
- **Center/Right:** Text links (Research, Services, Projects) in Inter 12px, `--muted` color, hover to `--foreground`
- **CTA:** Dark pill button (`bg-[#111] text-white rounded-full px-5 py-2 text-xs font-medium`), "Contact"

### 2. Hero Section (`components/hero-section.tsx`)

- **Height:** Minimum 100vh, flex centered
- **Background:** `--background` with SVG grid pattern at 4% opacity (same as current, preserved)
- **Content container:** Max-width `7xl`, 2-column grid (content + visual)
- **Left column:**
  - Section label: Mono 9px, `--accent` (warm taupe), uppercase, ls-3px, "Applied AI Research Laboratory"
  - Headline: Inter Medium 44–56px, ls-[-0.025em], leading-[1.12], `--foreground`
  - Body: Inter 16px, `--muted`, max-width 440px, leading-[1.75]
  - CTAs: Dark pill (`bg-[#111] text-white rounded-full px-7 py-3 text-sm font-medium`) + text link ("View projects →")
- **Right column (desktop only):** Decorative visual — retains the dithering shader effect with the large "B_" character and `mix-blend-difference`. This is a distinctive Beag Labs signature element.
- **Bottom-left corner label:** Mono 9px, `--subtle`, "BEAG LABS / AI RESEARCH"

### 3. Capabilities Section (`components/capabilities-section.tsx`)

- **Background:** `--surface` (white)
- **Top border:** `1px solid --border`
- **Padding:** `py-24 lg:py-28`
- **Section header (2-col, 12-grid):**
  - Left (4 cols): Mono label "Capabilities" in `--accent` + Inter Medium 28–32px heading "Research-driven AI services"
  - Right (6 cols, offset 1): Body paragraph in `--muted`
- **Service grid:** 2×2 CSS grid with `gap-px` and `--border` separators
  - Each card: White bg, p-8–10, hover to `bg-[#FAFAFA]`
  - Card ID: Mono 11px `--subtle` top-right or top-left ("01", "02", etc.)
  - Card heading: Inter Medium 16–18px `--foreground`
  - Card body: Inter 13px `--muted`
  - No icon boxes — numbers are enough. (Simpler, more institutional.)
- **Services:** Dataset Generation, Robotics, Fine-Tuning, SLM Curation

### 4. Projects Section (`components/approach-section.tsx` → renamed `projects-section.tsx`)

- **Background:** `--background` (warm off-white)
- **Top border:** `1px solid --border`
- **Section header:** Same 2-col pattern as Capabilities
- **Project card:** Full-width bordered card
  - Border: `1px solid --border`, hover to `--border-strong`
  - Padding: p-10–14
  - Layout: Logo + title/description + arrow icon
  - Mono label: "Active — 2026" in `--accent`
  - Title: Inter Medium 24–28px
  - Description: Inter 15px `--muted`
  - Arrow: `--subtle`, hover to `--brand`
  - Currently shows Chaveta project

### 5. Footer (`components/site-footer.tsx`)

- **Background:** `--surface` (white)
- **Top border:** `1px solid --border`
- **Padding:** `py-16`
- **Top area:** Logo + wordmark + tagline
- **Link grid (new):** 3–4 columns mirroring Anthropic's dense footer pattern
  - Columns: Products, Resources, Company
  - Each: bold header in Inter 500 13px, link stack in Inter 400 13px `--muted`
- **Bottom bar:** Border-top, copyright in Mono 10px `--subtle`, GitHub link

### 6. Design Tokens CSS (update `app/globals.css`)

Note: `app/globals.css` is the active CSS file loaded by the layout. `styles/globals.css` is stale and should be left untouched or removed in a separate cleanup. All token changes go into `app/globals.css`.

CSS custom properties updated to match the academic minimal palette:
- `--primary` becomes `#111111` (dark, for buttons/key elements)
- `--accent` becomes `#8B7355` (warm taupe, for section labels)
- `--brand` / `--chart-1` stays `#FF5F1F` (reserved for CTAs and ::selection)
- Background shifts to `#FAFAF9`
- Body text to `#555555`

---

## Page Composition

```
┌──────────────────────────────────────┐
│ Navbar (fixed)                       │
├──────────────────────────────────────┤
│                                      │
│ Hero Section                         │
│ - Grid pattern bg                    │
│ - Headline + body + CTAs            │
│ - Dithering visual (right, desktop)  │
│                                      │
├──────────────────────────────────────┤
│ Capabilities Section                 │
│ - Section header (2-col)            │
│ - 2×2 service grid                  │
├──────────────────────────────────────┤
│ Projects Section                     │
│ - Section header (2-col)            │
│ - Featured project card             │
├──────────────────────────────────────┤
│ Footer                               │
│ - Logo + tagline                    │
│ - Link columns                      │
│ - Copyright bar                     │
└──────────────────────────────────────┘
```

---

## What Changes vs. Current Site

| Element | Current | New |
|---|---|---|
| Primary accent | `#FF5F1F` used liberally (labels, headings, icons, borders) | `#8B7355` warm taupe for labels. Orange reserved for CTAs + ::selection |
| Headings | Bold (700) | Medium (500) — more refined, less shouty |
| Card borders | Visible `#E5E7EB` borders | Barely-there `rgba(0,0,0,0.06)` or no borders |
| Section labels | Mono `#FF5F1F` | Mono `#8B7355` |
| Button style | Rectangular, sharp corners | Pill (rounded-full), dark |
| Body text color | `#6B7280` | `#555555` |
| Background | Pure white `#FFFFFF` | Warm off-white `#FAFAF9` |
| Service cards | Icons in orange-bordered boxes | Numbers only, cleaner |
| Hero visual | Dithering + "B_" | Preserved — signature element |
| Footer | 2-col minimal | Multi-column link grid |

## What Stays the Same

- Tech stack: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Radix primitives
- Inter + JetBrains Mono font pairing
- Grid pattern on hero
- Dithering shader effect (Paper Design)
- Logo at `/public/logo.png`
- "Beag Labs — Applied AI Research" brand identity
- All Radix UI / shadcn component infrastructure
