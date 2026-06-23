# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Beag Labs website. The setup includes client-side initialization via `instrumentation-client.ts` (Next.js 15.3+ pattern), a server-side PostHog client in `lib/posthog-server.ts`, a reverse proxy via Next.js rewrites in `next.config.mjs`, and 11 event captures across 8 files covering the full visitor journey from content discovery to engagement CTAs. New client components (`PostTracker`, `PostTags`, `ResearchDoiLink`, `ProjectCardLink`) were created to enable event tracking from server-rendered pages without converting them to full client components.

| Event Name | Description | File |
|---|---|---|
| `engagement_cta_clicked` | User clicks the primary "Start an engagement" CTA in the hero section linking to cal.com. | `components/hero-section.tsx` |
| `projects_link_clicked` | User clicks the secondary "View projects" link in the hero section. | `components/hero-section.tsx` |
| `contact_cta_clicked` | User clicks the "Contact" button in the navbar linking to cal.com. | `components/navbar.tsx` |
| `contact_email_clicked` | User clicks the "CONTACT US" email CTA in the contact section. | `components/cta-section.tsx` |
| `gleap_cta_opened` | User clicks the "Ask about Murmurative Attention" button that opens the Gleap chat widget. | `components/gleap-provider.tsx` |
| `blog_post_viewed` | User views a blog post article page, marking top-of-funnel content engagement. | `app/blog/[slug]/page.tsx` |
| `research_paper_viewed` | User views a research paper page, indicating high-intent engagement with Beag Labs' research output. | `app/research/[slug]/page.tsx` |
| `research_pdf_downloaded` | User clicks the "Download PDF" / DOI link on a research paper to access the full paper. | `app/research/[slug]/page.tsx` |
| `blog_tag_clicked` | User clicks a tag on a blog post to explore related content. | `app/blog/[slug]/page.tsx` |
| `blog_category_filtered` | User selects a blog category filter to narrow their content browsing. | `components/blog/blog-category-filter.tsx` |
| `project_card_clicked` | User clicks the Chaveta project card to navigate to the external project site. | `app/projects/page.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/481962/dashboard/1747732)
- [Total CTA clicks (30d)](https://us.posthog.com/project/481962/insights/SRNrRwdh)
- [CTA Clicks over time](https://us.posthog.com/project/481962/insights/hFzc4st9)
- [Content views over time](https://us.posthog.com/project/481962/insights/HqTq5i0L)
- [Content → Engagement funnel](https://us.posthog.com/project/481962/insights/48gyfr73)
- [Research PDF downloads](https://us.posthog.com/project/481962/insights/sIfWFCcL)

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
