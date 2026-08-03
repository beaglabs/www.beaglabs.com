export interface ModelFamily {
  slug: string
  name: string
  status: string
  statusColor: string
  target: string
  description: string
  capabilities: string[]
  bg: string
  borderColor: string
  longDescription: string[]
  useCases: { title: string; description: string }[]
  deploymentOptions: string[]
  faqs: { question: string; answer: string }[]
}

export const modelFamilies: ModelFamily[] = [
  {
    slug: "compliance-slm",
    name: "Compliance SLMs",
    status: "In Training",
    statusColor: "bg-[#ff5f1f]",
    target: "NIST 800-53",
    description:
      "Purpose-built small language models and LoRAs for classifying documents against NIST 800-53 controls. Maps policies, procedures, and evidence to control families with human-expert accuracy at a fraction of frontier API cost.",
    capabilities: [
      "NIST 800-53 control classification",
      "Policy-to-control mapping",
      "Evidence sufficiency scoring",
      "Gap analysis flagging",
    ],
    bg: "#FFF3E6",
    borderColor: "#ff5f1f",
    longDescription: [
      "Compliance SLMs are small language models — 1B to 8B parameters — fine-tuned specifically for NIST 800-53 control families. Unlike general-purpose LLMs that hallucinate control numbers or misclassify evidence, these models are trained on thousands of annotated policy documents, control mappings, and audit evidence packages. They understand the difference between AC-2 (Account Management) and AC-3 (Access Enforcement) without prompting tricks.",
      "Each model ships as a LoRA adapter on top of an open-weights base model, so you can run inference on a single GPU or even a laptop. The disagreement engine flags only the 2-5% of edge cases where model confidence is low or annotators disagree — everything else is auto-classified. That means your compliance team reviews exceptions, not the full document pile.",
      "The output is structured JSON keyed to control family identifiers (AC, AU, CM, IA, SC, etc.), ready to pipe directly into your GRC tool — whether that's Drata, Vanta, AWS Audit Manager, or a homegrown spreadsheet.",
    ],
    useCases: [
      {
        title: "Continuous control monitoring",
        description:
          "Ingest policy documents, system configurations, and cloud snapshots on a schedule. The model classifies each artifact against the relevant NIST 800-53 controls and flags coverage gaps before an auditor finds them.",
      },
      {
        title: "Evidence package assembly",
        description:
          "Point the model at your document repository and it pulls together evidence organized by control family, scoring each artifact for sufficiency — so you know which controls have strong evidence and which need more work.",
      },
      {
        title: "Gap analysis and remediation",
        description:
          "Run the model across your control implementation documentation and get a heatmap of which controls are under-documented, partially implemented, or missing entirely — prioritized by impact.",
      },
      {
        title: "Pre-audit readiness checks",
        description:
          "Before a SOC 2 or FedRAMP assessment, run the model against your evidence corpus to simulate an auditor's review. Catch weak evidence, misaligned mappings, and missing artifacts weeks before the engagement begins.",
      },
    ],
    deploymentOptions: [
      "On-premise GPU server (single L4 or A10G)",
      "Private cloud VPC (AWS, Azure, GCP)",
      "Air-gapped environment via ONNX export",
      "Containerized with Docker / Kubernetes",
      "Edge inference on CPU via quantized ONNX (INT8)",
    ],
    faqs: [
      {
        question: "What base models do the LoRA adapters sit on?",
        answer:
          "We support Mistral 7B, Llama 3 8B, and Phi-3 as base models. The LoRA adapters are base-model-specific, so you pick the base at fine-tune time. If you need a different base model, we can retrain the adapter — typically a 2-3 day job.",
      },
      {
        question: "How accurate is the NIST 800-53 control classification?",
        answer:
          "On our internal benchmark of 12,000 annotated documents, the compliance SLM achieves 94.2% exact-control-family accuracy and 97.8% top-3 accuracy. The disagreement engine routes the remaining 2-5% to human review, so effective accuracy on auto-classified items is higher.",
      },
      {
        question: "Can the model handle FedRAMP control overlays?",
        answer:
          "Yes. FedRAMP overlays inherit from NIST 800-53 baseline controls and add specific parameters. The model recognizes overlay-enhanced controls (denoted with a suffix) and maps them to the appropriate baseline family. We're expanding to cover CMMC and DoD SRG overlays in a future release.",
      },
      {
        question: "Does inference data leave our environment?",
        answer:
          "No. Once fine-tuned, the model weights are exported as ONNX and deployed on your infrastructure. All inference — document classification, evidence scoring, gap analysis — runs inside your environment. Your data never touches Beag Labs servers after the fine-tuning phase.",
      },
    ],
  },
  {
    slug: "security-slm",
    name: "Security SLMs",
    status: "On Deck",
    statusColor: "bg-[#4488FF]",
    target: "CVE, OWASP, MITRE ATT&CK",
    description:
      "Security-focused SLMs for vulnerability triage, threat report classification, and security advisory categorization. Maps findings to CVE, OWASP Top 10, and MITRE ATT&CK frameworks.",
    capabilities: [
      "Vulnerability severity triage",
      "CVE-to-OWASP mapping",
      "Threat report classification",
      "MITRE ATT&CK technique labeling",
    ],
    bg: "#E6F2FF",
    borderColor: "#4488FF",
    longDescription: [
      "Security SLMs are small language models trained to understand the language of vulnerability reports, threat intelligence feeds, and security advisories. They classify findings against the three dominant security taxonomies — CVE for specific vulnerabilities, OWASP Top 10 for web application weakness categories, and MITRE ATT&CK for adversary tactics and techniques — and cross-reference between them.",
      "The models are trained on tens of thousands of CVE entries, NVD descriptions, OWASP documentation, and ATT&CK technique write-ups. They can read a raw vulnerability scanner output and tell you not just the CVSS score but which OWASP category it falls under, which ATT&CK techniques an adversary would chain it with, and whether it's likely to be exploited in the wild based on historical patterns.",
      "Because the models are small and self-hosted, they can run inline in your CI/CD pipeline, your SOAR platform, or your SIEM enrichment layer — triaging findings at the speed they arrive rather than batching them for a frontier API call.",
    ],
    useCases: [
      {
        title: "Vulnerability triage at ingest",
        description:
          "When a scanner dumps 500 findings into your queue, the model pre-classifies each one by severity, OWASP category, and likely exploitation path — so your analysts start with a prioritized, categorized list instead of a flat CSV.",
      },
      {
        title: "Threat report enrichment",
        description:
          "Feed raw threat intelligence reports (PDFs, blog posts, vendor advisories) and the model extracts referenced CVEs, maps described behaviors to ATT&CK techniques, and outputs structured IOCs and TTPs for your threat intel platform.",
      },
      {
        title: "CI/CD security gating",
        description:
          "Run the model inline in your pipeline to classify SAST/DAST findings. Low-severity findings get auto-triaged; high-severity findings with known exploitation paths block the build. No more alert fatigue from generic SAST rules.",
      },
      {
        title: "Security advisory categorization",
        description:
          "Automatically categorize incoming vendor security advisories by affected product, vulnerability type, and severity — then route them to the right team based on your asset inventory and coverage scope.",
      },
    ],
    deploymentOptions: [
      "Inline in CI/CD pipeline (GitHub Actions, GitLab CI)",
      "SOAR platform integration (Splunk SOAR, Tines, Torq)",
      "Private cloud VPC with auto-scaling GPU pool",
      "On-premise GPU server for air-gapped environments",
      "Containerized sidecar alongside your SIEM",
    ],
    faqs: [
      {
        question: "How does the model handle zero-day or novel vulnerabilities?",
        answer:
          "The model is trained to recognize the language patterns of vulnerability classes even when a CVE ID doesn't exist yet. It will classify the finding by OWASP category and ATT&CK technique based on the description, flag it as 'no CVE assigned,' and estimate a provisional severity. This gives your team a head start on triage before NVD publishes.",
      },
      {
        question: "Can it integrate with our existing SIEM or SOAR?",
        answer:
          "Yes. The model exposes a simple REST API or can be called as a library. We provide reference integrations for Splunk, Elastic Security, Tines, and Torq. The structured JSON output (CVE IDs, OWASP categories, ATT&CK technique IDs, severity) maps directly to the fields these platforms expect.",
      },
      {
        question: "What's the difference between this and a general LLM with a security prompt?",
        answer:
          "General LLMs hallucinate CVE IDs, conflate OWASP categories (e.g., mixing up A01:2021 Broken Access Control with A05:2021 Security Misconfiguration), and invent ATT&CK technique IDs that don't exist. Our model is fine-tuned on the actual taxonomies and validated against ground-truth mappings — it outputs real IDs, not plausible-sounding ones.",
      },
      {
        question: "How fast is inference?",
        answer:
          "On a single L4 GPU, the model classifies a vulnerability finding in under 200ms. On CPU with INT8 quantization, it's around 1-2 seconds per finding. For batch triage of 500 findings, a single GPU processes the full batch in under 2 minutes.",
      },
    ],
  },
  {
    slug: "legal-slm",
    name: "Legal SLMs",
    status: "Planned",
    statusColor: "bg-[#8B7355]",
    target: "E-Discovery, Contract Review",
    description:
      "Legal document classification and extraction models for e-discovery relevance, privilege review, contract clause extraction, and regulatory filing categorization. Built for law firms and in-house legal teams.",
    capabilities: [
      "E-discovery relevance classification",
      "Privilege review triage",
      "Contract clause extraction",
      "Regulatory filing categorization",
    ],
    bg: "#FFF9E6",
    borderColor: "#8B7355",
    longDescription: [
      "Legal SLMs are small language models trained on the structured language of legal documents — contracts, filings, discovery productions, and regulatory correspondence. They understand the difference between a force majeure clause and an indemnification provision, between a privileged communication and a business record, and between a relevant discovery hit and a false positive.",
      "The models are fine-tuned on annotated document sets from real legal workflows: privilege logs with attorney-client designations, contract repositories with clause-level annotations, and regulatory filing libraries with category labels. This domain-specific training eliminates the prompt engineering and few-shot examples that general-purpose LLMs need — and eliminates the hallucinations they produce.",
      "Deployment is designed for the confidentiality requirements of legal practice. Models run entirely within your firm's infrastructure or a designated secure cloud tenancy. No document text, metadata, or inference results leave your environment. This makes the models suitable for matters under protective orders, attorney-client privilege, and work-product doctrine.",
    ],
    useCases: [
      {
        title: "E-discovery first-pass review",
        description:
          "Ingest a document production and the model classifies each document for relevance to the matter, flags potentially privileged material, and categorizes by document type — reducing the first-pass review burden by 80-90% before human attorneys touch the set.",
      },
      {
        title: "Contract clause extraction",
        description:
          "Upload a contract repository and the model extracts and categorizes every clause — termination, indemnification, limitation of liability, change of control, assignment — structured as JSON for import into your CLM or spreadsheet for portfolio analysis.",
      },
      {
        title: "Privilege review triage",
        description:
          "The model pre-screens documents for attorney-client privilege indicators — legal advice language, attorney recipients, work-product markers — and routes high-probability privileged documents to experienced reviewers first, reducing the risk of inadvertent waiver.",
      },
      {
        title: "Regulatory filing categorization",
        description:
          "Automatically categorize incoming regulatory filings by filing type, subject matter, and required action — then route them to the appropriate practice group or compliance team based on your firm's matter taxonomy.",
      },
    ],
    deploymentOptions: [
      "On-premise server in firm data center",
      "Dedicated secure cloud tenancy (AWS GovCloud, Azure Government)",
      "Air-gapped environment for highly sensitive matters",
      "Containerized deployment in existing legal tech stack",
      "Private VPC with end-to-end encryption and audit logging",
    ],
    faqs: [
      {
        question: "Is this a substitute for attorney review?",
        answer:
          "No. Legal SLMs are first-pass triage tools that reduce the volume of documents attorneys need to review manually. They handle the 80-90% of documents that are clearly relevant or clearly irrelevant, leaving the nuanced judgment calls to licensed attorneys. The models are designed to increase reviewer throughput, not replace professional judgment.",
      },
      {
        question: "How does the model handle attorney-client privilege?",
        answer:
          "The model flags documents that exhibit indicators of privilege — legal advice language, attorney sender/recipient patterns, work-product characteristics. These are triage flags, not privilege determinations. Every flagged document still receives full attorney review before a privilege designation is made. The model reduces the review set; it does not make privilege calls.",
      },
      {
        question: "Can it be trained on our firm's document taxonomy?",
        answer:
          "Yes. The base model understands standard legal document types and clause categories. For firm-specific taxonomies — custom matter codes, niche practice areas, or proprietary document classifications — we fine-tune on your annotated examples. This typically requires 500-2,000 annotated documents depending on taxonomy complexity.",
      },
      {
        question: "What about data security and confidentiality?",
        answer:
          "All models are deployed within your infrastructure. During fine-tuning, we work with your anonymized or synthetic data — or we can fine-tune on-premise so your documents never leave your environment. Post-deployment, all inference runs locally. We provide a data processing addendum and support SOC 2 and ISO 27001 compliance requirements.",
      },
    ],
  },
  {
    slug: "healthcare-slm",
    name: "Healthcare SLMs",
    status: "Planned",
    statusColor: "bg-[#00AA55]",
    target: "HIPAA, FDA, Clinical Trials",
    description:
      "Healthcare-specific models for clinical document triage, adverse event classification, prior authorization extraction, and FDA submission categorization. Deployable in HIPAA-compliant environments.",
    capabilities: [
      "Clinical document triage",
      "Adverse event classification",
      "Prior authorization extraction",
      "FDA submission categorization",
    ],
    bg: "#E6FFF2",
    borderColor: "#00AA55",
    longDescription: [
      "Healthcare SLMs are small language models trained on the structured vocabularies of clinical medicine and healthcare regulation — ICD-10 codes, SNOMED CT terms, MedDRA adverse event classifications, HIPAA Privacy Rule categories, and FDA submission types (510(k), PMA, De Novo, IND/NDA). They understand clinical shorthand, handle the abbreviations and jargon that dominate medical records, and map free-text documentation to standardized taxonomies.",
      "The models are designed for the specific workflows that bottleneck healthcare organizations: triaging clinical documents for review priority, flagging potential adverse events in patient narratives and literature monitoring, extracting structured data from prior authorization requests, and categorizing documents for FDA regulatory submissions. Each of these workflows today consumes thousands of hours of manual review by nurses, pharmacists, and regulatory affairs specialists.",
      "Deployment is built for HIPAA compliance from the ground up. Models run inside your HIPAA-compliant environment — on-premise, in a private cloud with a BAA in place, or in a dedicated VPC. No PHI leaves your environment. The models do not call external APIs, do not phone home, and do not log inference data. All audit trails stay within your infrastructure.",
    ],
    useCases: [
      {
        title: "Clinical document triage",
        description:
          "Ingest incoming clinical documents — referral letters, discharge summaries, lab narratives — and the model triages by document type, clinical priority, and relevant care team, routing each document to the right queue with a priority score.",
      },
      {
        title: "Adverse event detection",
        description:
          "Process patient narratives, literature articles, and safety reports to flag potential adverse events, classify them by MedDRA system organ class and preferred term, and route serious events to pharmacovigilance teams within required reporting timelines.",
      },
      {
        title: "Prior authorization extraction",
        description:
          "Parse prior authorization requests and supporting clinical documentation to extract relevant diagnoses, procedures, medications, and justification — pre-populating the review form and flagging incomplete submissions before they reach a clinical reviewer.",
      },
      {
        title: "FDA submission categorization",
        description:
          "Organize a regulatory document library by FDA submission type (510(k), PMA, IND, NDA), device or drug class, and review section — making submission assembly and gap-checking faster for regulatory affairs teams.",
      },
    ],
    deploymentOptions: [
      "On-premise in hospital data center (HIPAA-compliant)",
      "Private cloud VPC with signed BAA (AWS, Azure, GCP)",
      "Air-gapped environment for sensitive clinical research",
      "Containerized in existing healthcare IT infrastructure",
      "Edge inference on workstation CPU for clinical settings",
    ],
    faqs: [
      {
        question: "Is this HIPAA compliant?",
        answer:
          "The models are designed for deployment in HIPAA-compliant environments. They run entirely within your infrastructure — on-premise or in a cloud environment covered by a Business Associate Agreement. No PHI is transmitted to Beag Labs after the fine-tuning phase. We sign a BAA and provide documentation supporting your HIPAA security risk assessment.",
      },
      {
        question: "Can the model replace clinical judgment?",
        answer:
          "No. Healthcare SLMs are triage and extraction tools that reduce manual document processing. They pre-classify, pre-extract, and prioritize — but all clinical decisions remain with licensed clinicians, pharmacists, and regulatory affairs professionals. The models handle the document processing burden; humans make the clinical and regulatory decisions.",
      },
      {
        question: "What medical vocabularies does the model understand?",
        answer:
          "The base model is trained on ICD-10, SNOMED CT, MedDRA, LOINC, and RxNorm. It recognizes clinical abbreviations, normalizes free-text to coded values, and maps between vocabularies (e.g., MedDRA preferred term to ICD-10 code). For organization-specific terminologies or local code sets, we fine-tune on your mappings.",
      },
      {
        question: "How does adverse event classification work?",
        answer:
          "The model reads patient narratives, safety reports, and literature abstracts, identifies descriptions of adverse events, classifies them by MedDRA System Organ Class and Preferred Term, and assesses seriousness criteria (death, life-threatening, hospitalization, disability, congenital anomaly). Flagged events are routed to pharmacovigilance with a structured data package for review within FDA/EMA reporting timelines.",
      },
    ],
  },
]
