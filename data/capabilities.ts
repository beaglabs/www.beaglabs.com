import capabilitiesData from './capabilities.json'

export const capabilities = capabilitiesData as Array<{
  slug: string
  number: string
  eyebrow: string
  title: string
  subtitle: string
  description: string
  hero: { src: string; alt: string; badge: string }
  includes: { title: string; blurb: string; bullets: string[] }[]
  process: { step: string; title: string; blurb: string }[]
  proof: { metric: string; label: string }[]
  cta: { headline: string; blurb: string; chatPrompt: string }
  metaDescription: string
}>

export function capabilityBySlug(slug: string) {
  return capabilities.find((c) => c.slug === slug)
}

export function getAllSlugs() {
  return capabilities.map((c) => ({ slug: c.slug }))
}