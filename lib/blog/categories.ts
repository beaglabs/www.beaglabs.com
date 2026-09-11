// Single source of truth for the blog's categories.
//
// `value` is the Hygraph `BlogPostCategory` enum apiId — the exact string the
// Content API returns for a post's category and the only value it accepts in a
// `where: { category: ... }` filter. `label` is the human-readable name shown in
// the UI. GraphQL enums are case-sensitive, so the URL segment must always carry
// the enum apiId (e.g. `caseStudy`), never the display label (e.g. `Case Study`).
export const BLOG_CATEGORIES = [
  { value: 'caseStudy', label: 'Case Studies' },
  { value: 'projectUpdate', label: 'Project Updates' },
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'opinion', label: 'Opinion' },
] as const

export type BlogCategoryValue = (typeof BLOG_CATEGORIES)[number]['value']

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.value, c.label])
)

/** Human-readable label for a Hygraph category enum value (falls back to the raw value). */
export function blogCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value
}

/** Type guard: is this string one of the known Hygraph category enum values? */
export function isBlogCategory(value: string): value is BlogCategoryValue {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value)
}
