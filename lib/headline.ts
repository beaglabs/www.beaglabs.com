/**
 * Split a title for the edgy hero: the last word (or last two short words) goes on the slab.
 * "Self-hosted AI agent platforms" -> ["Self-hosted AI agent", "platforms", ""]
 */
export function splitHeadline(title: string): [string, string, string] {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) return ['', title.trim(), '']
  const last = words[words.length - 1]
  const take = words.length > 2 && last.replace(/[^\p{L}\p{N}]/gu, '').length <= 6 ? 2 : 1
  return [words.slice(0, -take).join(' '), words.slice(-take).join(' '), '']
}
