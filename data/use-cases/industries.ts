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
    slug: "legal",
    industry: "Legal",
    title: "AI for Legal Document Classification & E-Discovery",
    metaDescription:
      "Custom SLMs for legal document classification, e-discovery relevance, privilege review triage, and contract clause extraction. Deploy on-prem — no data leaves your firm.",
    heroDescription:
      "Beag Labs builds custom small language models (500M-5B parameters) for legal document classification, e-discovery, and extraction. Trained on your matter data, deployed on-prem or air-gapped. No APIs, no data leakage, you own the model.",
    useCases: [
      {
        title: "E-discovery relevance classification",
        description:
          "Classify millions of documents by relevance to matter specifics, reducing first-pass review volume by up to 85%.",
      },
      {
        title: "Privilege review triage",
        description:
          "Flag potentially privileged documents for attorney review while deprioritizing clearly non-privileged material.",
      },
      {
        title: "Contract clause extraction",
        description:
          "Extract and categorize clauses across large contract portfolios — assignment, indemnification, termination, and more.",
      },
      {
        title: "Regulatory filing categorization",
        description:
          "Sort inbound regulatory filings by type, jurisdiction, and urgency for faster downstream processing.",
      },
    ],
    benefits: [
      "85% less manual effort",
      "Consistent classification across review teams",
      "Reduces outside counsel costs",
      "Deploy on-prem — no data leaves your firm",
    ],
    compliance: [
      "Attorney-client privilege protection",
      "Air-gapped deployment option",
      "No training on client data",
      "Audit trail for all classifications",
    ],
    ctaText: "Discuss your legal AI use case",
  },
  {
    slug: "healthcare",
    industry: "Healthcare",
    title: "AI for Clinical Document Triage & Healthcare Classification",
    metaDescription:
      "Custom SLMs for clinical document triage, adverse event classification, prior authorization extraction, and FDA submission categorization. HIPAA-compliant deployment.",
    heroDescription:
      "Beag Labs builds custom small language models (500M-5B parameters) for clinical document triage and healthcare classification. Trained on your data, deployed in HIPAA-compliant environments — on-prem, air-gapped, or in your VPC. No PHI sent to external APIs.",
    useCases: [
      {
        title: "Clinical document triage",
        description:
          "Route incoming clinical documents to the right review queue based on content, urgency, and document type.",
      },
      {
        title: "Adverse event classification",
        description:
          "Identify and classify adverse event reports from unstructured clinical narratives for pharmacovigilance teams.",
      },
      {
        title: "Prior authorization extraction",
        description:
          "Extract relevant clinical information from prior authorization requests to accelerate approval decisions.",
      },
      {
        title: "FDA submission categorization",
        description:
          "Categorize and organize FDA submission documents by module, section, and regulatory pathway.",
      },
    ],
    benefits: [
      "Faster clinical document processing",
      "Consistent triage decisions",
      "Reduced administrative overhead",
      "HIPAA-compliant deployment",
    ],
    compliance: [
      "HIPAA-compliant environments",
      "Air-gapped deployment option",
      "No PHI sent to external APIs",
      "BAA available",
    ],
    ctaText: "Discuss your healthcare AI use case",
  },
  {
    slug: "finance",
    industry: "Finance",
    title: "AI for Financial Document Classification & Regulatory Review",
    metaDescription:
      "Custom SLMs for research relevance filtering, KYC document review, regulatory filing classification, and transaction monitoring. SOC 2 Type II. No data leakage to third parties.",
    heroDescription:
      "Beag Labs builds custom small language models (500M-5B parameters) for financial document classification and regulatory review. Trained on your data, deployed on-prem or in your VPC. No APIs, no data leakage, you own the model.",
    useCases: [
      {
        title: "Research relevance filtering",
        description:
          "Filter research documents and analyst reports by relevance to specific sectors, instruments, or themes.",
      },
      {
        title: "KYC document review",
        description:
          "Classify and extract key fields from KYC documentation to streamline onboarding and remediation workflows.",
      },
      {
        title: "Regulatory filing classification",
        description:
          "Categorize regulatory filings by type, regulator, and reporting period for faster compliance review.",
      },
      {
        title: "Transaction monitoring classification",
        description:
          "Classify transaction alerts by risk tier and typology to prioritize investigator attention.",
      },
    ],
    benefits: [
      "Fraction of frontier API cost",
      "Real-time classification",
      "Consistent regulatory compliance",
      "No data leakage to third parties",
    ],
    compliance: [
      "SOC 2 Type II",
      "Air-gapped deployment option",
      "No training on client data",
      "Full audit trail",
    ],
    ctaText: "Discuss your financial AI use case",
  },
  {
    slug: "government-defense",
    industry: "Government & Defense",
    title: "AI for Intelligence Report Categorization & FOIA Triage",
    metaDescription:
      "Custom SLMs for intelligence report categorization, FOIA triage, classified document handling, and air-gapped deployment. IL5/IL6 ready. Full model weights export.",
    heroDescription:
      "Beag Labs builds custom small language models (500M-5B parameters) for intelligence report categorization and FOIA triage. Deployed air-gapped with no external network dependencies. Full model ownership — you export the weights. No cloud dependencies.",
    useCases: [
      {
        title: "Intelligence report categorization",
        description:
          "Classify incoming intelligence reports by topic, sensitivity, and actionability for faster analyst routing.",
      },
      {
        title: "FOIA triage",
        description:
          "Triage Freedom of Information Act requests by complexity, exemption applicability, and processing priority.",
      },
      {
        title: "Classified document handling",
        description:
          "Categorize and route classified documents according to handling protocols and classification levels.",
      },
      {
        title: "Air-gapped deployment",
        description:
          "Deploy models in fully air-gapped environments with no external network dependencies or cloud connectivity.",
      },
    ],
    benefits: [
      "Deploy where commercial APIs can't reach",
      "No external network dependencies",
      "Full model ownership",
      "Reduced analyst workload",
    ],
    compliance: [
      "Air-gapped infrastructure",
      "IL5/IL6 deployment ready",
      "No cloud dependencies",
      "Full model weights export",
    ],
    ctaText: "Discuss your government AI use case",
  },
]
