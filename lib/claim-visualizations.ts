import { claims, getClaim, type ClaimRecord } from '@/lib/claims'

export type ClaimMetric = {
  label: string
  value: number
  displayValue: string
  unit: string
  qualifier?: 'approximate' | 'more-than'
  derived?: boolean
}

export type ClaimVisualization =
  | { kind: 'metrics'; title: string; metrics: ClaimMetric[]; note: string }
  | { kind: 'split'; title: string; metrics: ClaimMetric[]; note: string }
  | { kind: 'relationship'; title: string; nodes: string[]; caption: string }

function findBillions(text: string) {
  const match = text.match(/\$\s*([\d,.]+)\s*B\b/i)
  return match ? Number(match[1].replaceAll(',', '')) : undefined
}

function findCount(text: string, pattern: RegExp) {
  const match = text.match(pattern)
  return match ? Number(match[1].replaceAll(',', '')) : undefined
}

function statedMetric(
  label: string,
  value: number | undefined,
  unit: string,
  qualifier?: ClaimMetric['qualifier'],
  prefix = '',
  suffix = '',
): ClaimMetric | undefined {
  if (value === undefined) return undefined
  const formattedValue = Number.isInteger(value) ? value.toLocaleString('en-US') : String(value)
  const marker = qualifier === 'more-than' ? '>' : ''
  return { label, value, displayValue: `${prefix}${marker}${formattedValue}${suffix}`, unit, qualifier }
}

function visualFor(claim: ClaimRecord): ClaimVisualization {
  const money = findBillions(claim.claim)

  switch (claim.claimId) {
    case 'BL-CLM-1':
      return {
        kind: 'metrics',
        title: 'FY2025 improper-payment estimate',
        metrics: [
          statedMetric('Estimated payments', money, 'USD billions', 'approximate', '~$', 'B')!,
          statedMetric('Agencies', findCount(claim.claim, /(\d+)\s+federal agencies/i), 'agencies')!,
          statedMetric('Programs', findCount(claim.claim, /across\s+(\d+)\s+programs/i), 'programs')!,
        ],
        note: 'Three reported measures, shown on separate scales. Improper payments include several causes; they are not synonymous with fraud.',
      }
    case 'BL-CLM-2': {
      const total = findBillions(getClaim('BL-CLM-1')?.claim ?? '')
      const remainder = total !== undefined && money !== undefined ? total - money : undefined
      return {
        kind: 'split',
        title: 'Overpayments within the FY2025 estimate',
        metrics: [
          statedMetric('Overpayments', money, 'USD billions', 'approximate', '~$', 'B')!,
          remainder === undefined
            ? undefined!
            : { label: 'Remaining estimate', value: remainder, displayValue: `~$${remainder}B`, unit: 'USD billions', qualifier: 'approximate' as const, derived: true },
        ].filter(Boolean),
        note: `${claim.scopeCaveat} Remaining estimate is derived: approximately $${total}B total − $${money}B overpayments. It is not labeled as underpayments because the balance can include other causes.`,
      }
    }
    case 'BL-CLM-3':
      return {
        kind: 'metrics', title: 'FY2025 audit findings',
        metrics: [statedMetric('Material weaknesses', findCount(claim.claim, /(\d+)\s+material weaknesses/i), 'weaknesses')!],
        note: 'FY2025 DoD/DoW financial-statement audit. A material weakness is a significant control deficiency, not necessarily a software defect.',
      }
    case 'BL-CLM-4':
      return {
        kind: 'metrics', title: 'Notices issued to management',
        metrics: [statedMetric('Notices of findings and recommendations', findCount(claim.claim, /([\d,]+)\s+notices/i), 'notices')!],
        note: 'Issued in 2025 during financial-statement audits; the notices are generally not publicly posted.',
      }
    case 'BL-CLM-5':
      return {
        kind: 'metrics', title: 'Financial system footprint',
        metrics: [statedMetric('Financial systems', findCount(claim.claim, /more than\s+([\d,]+)\s+financial systems/i), 'systems', 'more-than')!],
        note: 'The source states more than 426 systems. The bar marks that lower bound; it is not a total or an estimate of replaceable systems.',
      }
    case 'BL-CLM-11':
      return {
        kind: 'metrics', title: 'Study scale and reported patterns',
        metrics: [statedMetric('Tokens analyzed', findCount(claim.claim, /more than\s+([\d,.]+)\s+trillion tokens/i), 'trillion tokens', 'more-than', '', 'T')!],
        note: 'The study observed growing programming usage and agentic inference on OpenRouter. No time series is plotted because the supplied claim does not provide time-series values.',
      }
    case 'BL-CLM-6':
      return { kind: 'relationship', title: 'What the public API exposes', nodes: ['USAspending public API', 'Award-level spending', 'Account-level spending'], caption: 'The listed endpoints currently do not require authorization. Endpoint behavior and usage limits can change.' }
    case 'BL-CLM-7':
      return { kind: 'relationship', title: 'Datasets in the public API directory', nodes: ['GSA API directory', 'SAM.gov opportunities', 'Contract awards', 'Federal hierarchy', 'Related procurement APIs'], caption: 'The directory groups multiple APIs; authentication and rate limits vary by API.' }
    case 'BL-CLM-8':
      return { kind: 'relationship', title: 'Treasury Fiscal Data', nodes: ['Federal financial datasets', 'Machine-readable data', 'APIs', 'Data dictionaries', 'Historical and current data'], caption: 'Dataset update cadence varies; the platform should not be read as uniformly real-time.' }
    case 'BL-CLM-9':
      return { kind: 'relationship', title: 'Where SP 800-171 applies', nodes: ['Nonfederal system components', 'Process CUI', 'Store CUI', 'Transmit CUI'], caption: 'The publication describes security requirements for in-scope components; it is not an automatic certification.' }
    case 'BL-CLM-10':
      return { kind: 'relationship', title: 'NARA’s CUI program role', nodes: ['NARA', 'Government-wide CUI program', 'Marking guidance', 'Handling resources'], caption: 'Category-specific rules can depend on law, regulation, and agency policy.' }
    case 'BL-CLM-12':
      return { kind: 'relationship', title: 'NIST resources across the AI lifecycle', nodes: ['AI lifecycle', 'AI Risk Management Framework', 'Generative AI Profile'], caption: 'The AI RMF is voluntary and under revision; the Generative AI Profile is a companion resource.' }
    default:
      return { kind: 'relationship', title: 'Claim evidence map', nodes: [claim.sourceOrganization, claim.claim], caption: claim.scopeCaveat }
  }
}

export function getClaimVisualization(claim: ClaimRecord) {
  return visualFor(claim)
}

export function getClaimVisualizationForId(claimId: string) {
  const claim = getClaim(claimId)
  return claim ? visualFor(claim) : undefined
}

export function getAllClaimVisualizations() {
  return claims.map((claim) => ({ claimId: claim.claimId, visualization: visualFor(claim) }))
}
