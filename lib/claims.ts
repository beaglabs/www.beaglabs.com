import ledger from '@/data/claims/ledger.json'

export interface ClaimRecord {
  claim: string
  allowedLanguage: string
  claimId: string
  lastVerified: string
  prohibitedInference: string
  scopeCaveat: string
  source: string
  sourceDate: string
  sourceOrganization: string
  status: string
}

export const claims: ClaimRecord[] = ledger

export function getClaim(claimId: string) {
  return claims.find((claim) => claim.claimId === claimId)
}
