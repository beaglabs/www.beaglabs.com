export const agenticSources = [
  {
    "id": "nist",
    "name": "NIST",
    "title": "Generative AI Profile · AI 600-1",
    "url": "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
    "date": "2024-07-26",
    "type": "Government guidance",
    "locator": "Abstract and AI 600-1 introduction",
    "claim": "NIST AI 600-1 is a cross-sectoral generative AI profile supporting risk management throughout the AI lifecycle.",
    "caveat": "Voluntary risk-management guidance. It is not a certification or a finding about Papyrus.",
    "logo": "/source-logos/nist.ico",
    "claimId": "BL-CLM-13"
  },
  {
    "id": "tau",
    "name": "arXiv",
    "title": "τ-bench · Yao, Shinn, Razavi & Narasimhan",
    "url": "https://arxiv.org/abs/2406.12045v1",
    "date": "2024-06-17",
    "type": "Research benchmark",
    "locator": "v1 abstract; task evaluation and pass^k definition",
    "claim": "τ-bench evaluates tool-using agents against goal database states and tests consistency across repeated trials under domain policies.",
    "caveat": "The 2024 benchmark uses simulated users and domain environments. Its results are not Papyrus results or a measure of current models.",
    "logo": "/source-logos/arxiv.png",
    "claimId": "BL-CLM-14"
  },
  {
    "id": "anthropic",
    "name": "Anthropic",
    "title": "Building Effective Agents",
    "url": "https://www.anthropic.com/engineering/building-effective-agents",
    "date": "2024-12-19",
    "type": "Vendor engineering guidance",
    "locator": "What are agents?; When (and when not) to use agents",
    "claim": "Anthropic distinguishes workflows with predefined code paths from agents that dynamically direct their processes and tool use.",
    "caveat": "Engineering guidance published in 2024. The article notes that the tooling landscape has since changed.",
    "logo": "/source-logos/anthropic.png",
    "claimId": "BL-CLM-15"
  },
  {
    "id": "gao",
    "name": "GAO",
    "title": "Critical Legacy Systems · GAO-25-107795",
    "url": "https://www.gao.gov/products/gao-25-107795",
    "date": "2025-07-17",
    "type": "Government audit report",
    "locator": "What GAO Found; Table 2",
    "claim": "GAO identified 11 critical federal legacy systems in need of modernization; plans for eight did not fully document key elements.",
    "caveat": "These are GAO-selected federal systems, not all mainframes or all legacy applications. The report does not evaluate Papyrus.",
    "logo": "/source-logos/gao.ico",
    "claimId": "BL-CLM-16"
  },
  {
    "id": "microsoft",
    "name": "Microsoft",
    "title": "Designing Metadata Artifacts for 3270 Applications",
    "url": "https://learn.microsoft.com/en-us/host-integration-server/core/application-integration-la3270apps",
    "date": "2023-11-08",
    "type": "Vendor technical documentation",
    "locator": "Introduction; Capture; Navigation; Methods; Generate and upload HIDX file",
    "claim": "Microsoft documents capture, navigation and method definitions for mapping 3270 screens and fields into HIDX metadata used by its connector.",
    "caveat": "This describes Microsoft Host Integration Server and Azure Logic Apps tooling, not a verified Papyrus connector. Requires host access and applicable software.",
    "logo": "/source-logos/microsoft.ico",
    "claimId": "BL-CLM-17"
  }
] as const
