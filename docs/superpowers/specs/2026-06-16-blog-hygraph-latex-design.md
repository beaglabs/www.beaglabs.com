# Blog & Research Publication System — Design Spec

**Date:** 2026-06-16
**Status:** Approved
**Branch:** `feature/design-system-academic-minimal`

## Overview

Add two independent blogs to beaglabs.com — `/blog` for project updates and case studies, `/research` for academic papers and technical deep-dives. Both powered by Hygraph headless CMS with full LaTeX math rendering via remark-math + rehype-katex, supporting Draft → Preview → Publish editorial workflow.

## Architecture

**Pattern:** Next.js ISR + Runtime Math Rendering

- Next.js 16 App Router, React 19 Server Components
- Hygraph GraphQL content API (published + preview endpoints)
- ISR with on-demand revalidation via Hygraph webhook
- `react-markdown` + `remark-math` + `rehype-katex` for server-side math rendering
- Next.js Draft Mode for content preview
- KaTeX CSS loaded once, shared across both blog sections

## Hygraph Content Models

The user will configure these content types in Hygraph's UI. The Next.js app consumes them via GraphQL.

### `BlogPost`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `slug` | String (unique) | Yes | URL identifier |
| `title` | String | Yes | |
| `excerpt` | String | Yes | Max 500 chars, shown on cards |
| `body` | Rich Text (Markdown) | Yes | Main content, may contain LaTeX |
| `coverImage` | Asset | No | Hero/card image |
| `category` | Enum | Yes | `Case Study`, `Project Update`, `Tutorial`, `Opinion` |
| `tags` | String (list) | No | Freeform tags |
| `publishedAt` | Date | Yes | |
| `status` | Enum | Yes | `Draft`, `Published` |
| `seoTitle` | String | No | Overrides title in `<title>` |
| `seoDescription` | String | No | Overrides excerpt in meta description |

### `ResearchPaper`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `slug` | String (unique) | Yes | URL identifier |
| `title` | String | Yes | |
| `abstract` | String | Yes | Max 1000 chars, shown prominently on card and paper page |
| `body` | Rich Text (Markdown) | Yes | Full paper content, heavy LaTeX expected |
| `coverImage` | Asset | No | Less prominent than blog |
| `authors` | String (list) | Yes | e.g. `["James Bohrman", "Jane Smith"]` |
| `publishedAt` | Date | Yes | |
| `status` | Enum | Yes | `Draft`, `Published` |
| `doi` | String | No | DOI link for externally published papers |
| `seoTitle` | String | No | |
| `seoDescription` | String | No | |

## URL Structure

```
/blog                          → listing (paginated, ISR)
/blog/[slug]                   → individual post (ISR)
/blog/category/[category]      → filtered listing (ISR)
/blog/tag/[tag]                → filtered listing (ISR)

/research                      → listing (paginated, ISR)
/research/[slug]               → individual paper (ISR)
/research/authors/[author]     → filtered listing (ISR)

/api/draft                     → enable draft mode (validates secret token)
/api/disable-draft             → exit preview, clear cookies
/api/revalidate                → Hygraph webhook handler for on-demand revalidation
```

## File Structure

```
app/
  blog/
    page.tsx
    layout.tsx
    [slug]/page.tsx
    category/[category]/page.tsx
    tag/[tag]/page.tsx
  research/
    page.tsx
    layout.tsx
    [slug]/page.tsx
    authors/[author]/page.tsx
  api/
    draft/route.ts
    disable-draft/route.ts
    revalidate/route.ts

lib/
  hygraph/
    client.ts          # GraphQL fetch wrapper (draft vs published API)
    queries.ts         # All GraphQL queries for blog + research
    types.ts           # TypeScript types for Hygraph responses

components/
  blog/
    markdown-renderer.tsx     # react-markdown + remark-math + rehype-katex
    blog-card.tsx             # Card for /blog listings
    research-card.tsx         # Card for /research listings
    blog-list.tsx             # Paginated grid of cards
    blog-layout.tsx           # Shared article layout (prose + TOC sidebar)
    draft-banner.tsx          # "You are viewing a draft" bar
    math-styles.tsx           # KaTeX CSS import wrapper
    table-of-contents.tsx     # Auto-generated from markdown headings
    blog-category-filter.tsx  # Category chip navigation
    research-author-list.tsx  # Author attribution component
```

## Component Details

### `markdown-renderer.tsx`

Core math rendering component. Server Component. Wraps `react-markdown` with:
- `remark-math` — parses `$...$` (inline) and `$$...$$` (block) LaTeX
- `rehype-katex` — renders parsed math to HTML + CSS
- Standard markdown features (headings, links, images, code blocks, tables)

```tsx
// Signature
<MarkdownRenderer>{bodyMarkdown}</MarkdownRenderer>
```

### `math-styles.tsx`

Client component that imports KaTeX CSS once. Included in both blog and research layouts. The CSS is ~23KB gzipped and cached by the browser across both sections.

### `blog-layout.tsx`

Shared article wrapper for both sections:
- Centered prose column (max-width: 65ch)
- Optional sticky TOC sidebar on desktop (right side)
- Conditionally renders `DraftBanner` when in draft mode
- Accepts `toc` prop (heading tree) and `draftMode` boolean

### `blog-card.tsx`

Listing card for `/blog`:
- White background, accent (#8B7355) left border (2px)
- Cover image at top (16:9, rounded top corners) when present
- Category badge: small filled chip in #8B7355
- Title: Inter bold, text-lg
- Excerpt: 2-line clamp, text-sm, #555
- Meta row: date + tags, text-xs, #999
- Hover: lifts 2px, shadow deepens

### `research-card.tsx`

Listing card for `/research`:
- White background, 1px border (rgba 0,0,0,0.06)
- No cover image (abstract leads visually)
- Authors: JetBrains Mono, text-xs, #555
- Title: Inter bold, text-lg
- Abstract: 3-line clamp, text-sm, #555
- DOI badge when present (mini mono badge)
- Hover: border darkens

### `table-of-contents.tsx`

Auto-generates TOC from markdown headings (h2, h3). Sticky sidebar on desktop. Highlights current section based on scroll position (client component for intersection observer).

### `draft-banner.tsx`

Fixed banner at top of page when Draft Mode is active: "You are viewing a draft. [Exit preview mode]". Background: muted amber/gray. Links to `/api/disable-draft`.

### `blog-category-filter.tsx`

Horizontal row of chip buttons for filtering `/blog` by category. Active chip has filled style.

### `research-author-list.tsx`

Renders author names with optional links to `/research/authors/[author]`. JetBrains Mono font.

## Data Flow

1. **Published content:** Server Component → `fetchHygraph(query, variables)` → Hygraph Published API → ISR caches result → serves HTML
2. **Preview content:** User visits `/api/draft?secret=X&slug=Y&type=blog` → validates secret → sets Draft Mode cookies → redirects to post → page detects `draftMode().isEnabled` → `fetchHygraph(query, variables, draft=true)` → Hygraph Preview API (includes drafts)
3. **Revalidation:** Author publishes in Hygraph → Hygraph webhook → `POST /api/revalidate` → validates signature → `revalidatePath()` / `revalidateTag()` → purges ISR cache
4. **Exit preview:** User clicks "Exit preview" → `/api/disable-draft` → clears cookies → redirects to home

## Environment Variables

```
HYGRAPH_ENDPOINT=https://<region>.graphcms.com/v2/<project-id>
HYGRAPH_PREVIEW_ENDPOINT=https://<region>.graphcms.com/v2/<project-id>/preview
HYGRAPH_TOKEN=permanent-auth-token-for-published-content
HYGRAPH_PREVIEW_TOKEN=permanent-auth-token-for-preview-content
DRAFT_SECRET=random-secret-for-api-draft-route
REVALIDATE_SECRET=random-secret-for-hygraph-webhook
```

## Design System Integration

Both sections use the existing academic-minimal design tokens from `globals.css`:

- Typography: Inter for headings and body, JetBrains Mono for code/meta/authors
- Colors: `--background` (#FAFAF9) for page chrome, `--card` (#000000) for cards, `--foreground` (#111111) for text, `--muted` (#555555) for secondary text, `--accent` (#8B7355) for blog-specific accents, `--border` for card borders
- KaTeX math inherits the mono font where possible (KaTeX renders to spans with its own CSS)

**Navbar update:** Add "Blog" and "Research" links in the existing nav style (text-xs, #555, hover #111). Position between current links: Blog | Research | Projects | [Contact].

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Hygraph API unavailable | ISR serves stale cached page; if no cache, shows error state |
| Invalid slug | Next.js `notFound()` → custom 404 page |
| Draft post accessed without draft mode | Returns 404 (no draft leak) |
| Malformed LaTeX | KaTeX renders error spans inline; page remains readable |
| Webhook signature mismatch | `/api/revalidate` returns 401, logs warning |
| ISR timeout | Next.js fallback behavior; KaTeX renders on first successful request |
| Missing env vars | Build fails with clear error message |

## Dependencies to Add

```
graphql-request        # Lightweight GraphQL client (or native fetch)
react-markdown         # Markdown → React
remark-math            # LaTeX math syntax parsing
rehype-katex           # LaTeX math → HTML/CSS rendering
katex                  # KaTeX core (peer dep of rehype-katex)
```

## Out of Scope

- Comments / discussions on posts
- RSS feed generation (future addition)
- Search across blog content (future addition)
- Hygraph schema creation (user handles this based on content models above)
- Admin dashboard (Hygraph's UI serves this purpose)
