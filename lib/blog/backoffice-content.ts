export const BACKOFFICE_POST_SLUGS = [
  'papyrus-awardable-tradewinds-solutions-marketplace',
  'the-most-valuable-federal-ai-work-is-boring',
  'cui-classification-is-an-ai-problem-hiding-in-plain-sight',
  '2-485-audit-findings-what-governed-automation-could-and-couldnt-fix',
] as const

export function isBackofficePost(slug: string) {
  return (BACKOFFICE_POST_SLUGS as readonly string[]).includes(slug)
}
