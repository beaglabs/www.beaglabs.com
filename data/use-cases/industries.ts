export interface UseCase {
  slug: string
  industry: string
  title: string
  metaDescription: string
  heroDescription: string
  useCases: { title: string; description: string }[]
  benefits: string[]
  compliance: string[]
  ctaText: string
}

export const industries: UseCase[] = [
  {
    "slug": "finance",
    "industry": "Finance",
    "title": "Back Office Finance Automation",
    "metaDescription": "Explore reviewable invoice intake and financial evidence assembly with customer-hosted back office automation.",
    "heroDescription": "Use Papyrus to connect invoice intake and financial evidence assembly to existing systems and human-reviewed workflows. These are example patterns, not claims of completed deployments.",
    "useCases": [
      {
        "title": "Document intake",
        "description": "Extract structured inputs while retaining source context for review."
      },
      {
        "title": "Requests and approvals",
        "description": "Route work to authorized staff, with explicit handling for exceptions."
      },
      {
        "title": "Evidence assembly",
        "description": "Collect source records and review decisions into a traceable work packet."
      }
    ],
    "benefits": [
      "Reduce repeated data entry where validated automation is appropriate",
      "Make exceptions and review responsibilities visible",
      "Connect existing systems through controlled interfaces"
    ],
    "compliance": [
      "Assess applicable handling requirements before deployment",
      "Customer-hosted operation does not establish compliance or authorization"
    ],
    "ctaText": "Discuss your back office workflow"
  },
  {
    "slug": "legal",
    "industry": "Legal",
    "title": "Legal Back Office Document Workflows",
    "metaDescription": "Explore reviewable document intake and contract review routing with customer-hosted back office automation.",
    "heroDescription": "Use Papyrus to connect document intake and contract review routing to existing systems and human-reviewed workflows. These are example patterns, not claims of completed deployments.",
    "useCases": [
      {
        "title": "Document intake",
        "description": "Extract structured inputs while retaining source context for review."
      },
      {
        "title": "Requests and approvals",
        "description": "Route work to authorized staff, with explicit handling for exceptions."
      },
      {
        "title": "Evidence assembly",
        "description": "Collect source records and review decisions into a traceable work packet."
      }
    ],
    "benefits": [
      "Reduce repeated data entry where validated automation is appropriate",
      "Make exceptions and review responsibilities visible",
      "Connect existing systems through controlled interfaces"
    ],
    "compliance": [
      "Assess applicable handling requirements before deployment",
      "Customer-hosted operation does not establish compliance or authorization"
    ],
    "ctaText": "Discuss your back office workflow"
  },
  {
    "slug": "government-defense",
    "industry": "Government",
    "title": "Government Back Office Automation",
    "metaDescription": "Explore reviewable administrative requests and audit remediation evidence with customer-hosted back office automation.",
    "heroDescription": "Use Papyrus to connect administrative requests and audit remediation evidence to existing systems and human-reviewed workflows. These are example patterns, not claims of completed deployments.",
    "useCases": [
      {
        "title": "Document intake",
        "description": "Extract structured inputs while retaining source context for review."
      },
      {
        "title": "Requests and approvals",
        "description": "Route work to authorized staff, with explicit handling for exceptions."
      },
      {
        "title": "Evidence assembly",
        "description": "Collect source records and review decisions into a traceable work packet."
      }
    ],
    "benefits": [
      "Reduce repeated data entry where validated automation is appropriate",
      "Make exceptions and review responsibilities visible",
      "Connect existing systems through controlled interfaces"
    ],
    "compliance": [
      "Assess applicable handling requirements before deployment",
      "Customer-hosted operation does not establish compliance or authorization"
    ],
    "ctaText": "Discuss your back office workflow"
  }
]
