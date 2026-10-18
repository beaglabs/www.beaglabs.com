import evidence from '@/data/comparisons/platform-evidence.json'
import { getClaim } from '@/lib/claims'

export type EvidenceStatus = 'Verified' | 'Partially supported' | 'Not documented' | 'Not supported'

/** A cell has a sourced answer unless we found nothing either way. */
export const hasSourcedAnswer = (status: EvidenceStatus) => status !== 'Not documented'

export const ATTRIBUTES = [
  { key: 'capabilities', label: 'What it does' },
  { key: 'deployment', label: 'Deployment model' },
  { key: 'marketplaceOffer', label: 'Azure Marketplace offer' },
  { key: 'humanApproval', label: 'Human approval' },
  { key: 'licensing', label: 'Licensing' },
  { key: 'security', label: 'Security controls' },
  { key: 'buyer', label: 'Intended buyer' },
  { key: 'pricing', label: 'Public pricing' },
] as const

export type AttributeKey = (typeof ATTRIBUTES)[number]['key']

export const CATEGORY_LABELS: Record<string, string> = {
  'self-hosted': 'Self-hosted',
  'customer-cloud-tenant': 'Customer cloud tenant',
  'vendor-hosted': 'Vendor-hosted',
  hybrid: 'Hybrid',
  'azure-vm': 'Azure VM',
  'azure-container': 'Azure container',
  'azure-managed-app': 'Azure managed app',
  'azure-saas': 'Azure SaaS',
  'azure-other': 'Azure (other)',
  'not-listed': 'No listing found',
  'open-source': 'Open source',
  'source-available': 'Source available',
  commercial: 'Commercial',
  dual: 'Dual licence',
  unknown: 'Unknown',
}

export interface EvidenceCell {
  status: EvidenceStatus
  value: string
  categories: string[]
  claimId?: string
  caveat?: string
  checked: string[]
}

export interface PlatformNote {
  text: string
  basis: AttributeKey[]
}

export interface Platform {
  slug: string
  name: string
  vendor: string
  officialUrl: string
  marketplaceUrl: string | null
  summary: string
  isBeag: boolean
  cells: Record<AttributeKey, EvidenceCell>
  bestFor: PlatformNote[]
  lessSuitedFor: PlatformNote[]
  notes: string
}

export const platformData = evidence as unknown as {
  verifiedOn: string
  verifiedOnIso: string
  platforms: Platform[]
}

export const platforms = platformData.platforms
export const verifiedOn = platformData.verifiedOn
export const verifiedOnIso = platformData.verifiedOnIso

export const platformCount = platforms.length

export function getPlatform(slug: string) {
  return platforms.find((platform) => platform.slug === slug)
}

/** Filters exposed on the matrix: attribute plus the category values that actually occur. */
export const FILTERS: { key: AttributeKey; label: string }[] = [
  { key: 'deployment', label: 'Deployment' },
  { key: 'marketplaceOffer', label: 'Marketplace offer' },
  { key: 'licensing', label: 'Licensing' },
]

export function filterOptions(key: AttributeKey) {
  const seen = new Set<string>()
  for (const platform of platforms) {
    for (const category of platform.cells[key].categories) seen.add(category)
  }
  return [...seen].filter((category) => category !== 'unknown')
}

/** A claim id only counts as cited if it resolves in the ledger. */
export function citedClaim(cell: EvidenceCell) {
  return cell.claimId ? getClaim(cell.claimId) : undefined
}

export interface Guide {
  slug: string
  title: string
  description: string
  kind: 'guide' | 'head-to-head'
  versus?: string
}

export const guides: Guide[] = [
  {
    slug: 'self-hosted-ai-agent-platforms',
    title: 'Self-Hosted AI Agent Platforms Compared (2026)',
    description:
      'Six customer-controlled agent platforms, including Papyrus, the agentic ERP, compared on deployment model, Azure Marketplace offer, human approval, licensing, security and intended buyer. Every cell links to its source.',
    kind: 'guide',
  },
  {
    slug: 'papyrus-vs-corral-ai',
    title: 'Papyrus vs Corral AI',
    description: 'A sourced head-to-head, including where Corral AI may be the better fit.',
    kind: 'head-to-head',
    versus: 'corral-ai',
  },
  {
    slug: 'papyrus-vs-heartbeatagents',
    title: 'Papyrus vs HeartBeatAgents',
    description: 'A sourced head-to-head, including where HeartBeatAgents may be the better fit.',
    kind: 'head-to-head',
    versus: 'heartbeatagents',
  },
  {
    slug: 'papyrus-vs-openclaw',
    title: 'Papyrus vs OpenClaw',
    description: 'A sourced head-to-head, including where OpenClaw may be the better fit.',
    kind: 'head-to-head',
    versus: 'openclaw',
  },
]

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug)
}

/** Papyrus' marketing page lives at /products/papyrus, so its sourced profile gets its own slug. */
export const BEAG_PROFILE_SLUG = 'papyrus-by-beaglabs'

export function profileSlug(platform: Pick<Platform, 'slug' | 'isBeag'>) {
  return platform.isBeag ? BEAG_PROFILE_SLUG : platform.slug
}

export function productHref(platform: Pick<Platform, 'slug' | 'isBeag'>) {
  return `/products/${profileSlug(platform)}`
}

export function getPlatformByProfileSlug(slug: string) {
  return platforms.find((platform) => profileSlug(platform) === slug)
}

const LOCAL_LOGOS: Record<string, string> = {
  'corral-ai': '/logos/corral-ai.svg', // vendor's own mark, from getcorral.ai
}

/** Public logo source: our own asset, a GitHub org avatar, or the vendor site's favicon. */
export function logoUrl(platform: Platform) {
  if (platform.isBeag) return '/papyrus-logo.png'
  // Locally hosted where the favicon service has no usable icon for the vendor's domain.
  if (LOCAL_LOGOS[platform.slug]) return LOCAL_LOGOS[platform.slug]
  try {
    const { hostname, pathname } = new URL(platform.officialUrl)
    if (hostname === 'github.com') return `https://github.com/${pathname.split('/')[1]}.png?size=128`
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch {
    return undefined
  }
}

export type Stat =
  | { kind: 'meter'; label: string; value: number; max: number; note: string }
  | { kind: 'count'; label: string; value: number; note: string }
  | { kind: 'tags'; label: string; tags: string[] }
  | { kind: 'text'; label: string; value: string }

/** Stats are computed from the evidence itself, so they update whenever the data does. */
export function productStats(platform: Platform): Stat[] {
  const cells = Object.values(platform.cells)
  const answered = cells.filter((cell) => hasSourcedAnswer(cell.status)).length
  const partial = cells.filter((cell) => cell.status === 'Partially supported').length
  const gaps = cells.filter((cell) => cell.status === 'Not documented').length
  const cited = cells.filter((cell) => cell.claimId).length
  const tags = (key: AttributeKey) =>
    platform.cells[key].categories.map((category) =>
      category === 'unknown' ? 'Not documented' : (CATEGORY_LABELS[category] ?? category),
    )
  return [
    { kind: 'meter', label: 'Evidence coverage', value: answered, max: cells.length, note: `attributes with a sourced answer${partial ? `, ${partial} only partially supported` : ''}` },
    { kind: 'count', label: 'Cited claims', value: cited, note: 'records in the Claim Ledger' },
    { kind: 'count', label: 'Documentation gaps', value: gaps, note: 'attributes not documented in sources checked' },
    { kind: 'tags', label: 'Deployment', tags: tags('deployment') },
    { kind: 'tags', label: 'Licensing', tags: tags('licensing') },
    { kind: 'tags', label: 'Azure Marketplace', tags: tags('marketplaceOffer') },
    { kind: 'text', label: 'Last verified', value: verifiedOn },
  ]
}
