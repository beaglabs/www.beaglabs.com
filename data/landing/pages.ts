export interface LandingHeroSlide {
  src: string
  alt: string
  label: string
  credit: string
  sourceName: string
  sourceUrl: string
}

export interface LandingPage {
  slug: string
  label: string
  title: string
  metaTitle: string
  metaDescription: string
  heroDescription: string
  heroSlides: LandingHeroSlide[]
  problem: { title: string; description: string }[]
  capabilities: { title: string; description: string }[]
  deployment: { title: string; description: string }[]
  workflows: string[]
  guardrails: string[]
  disclaimer: string
  ctaTitle: string
  ctaDescription: string
  faqs: { question: string; answer: string }[]
}

export const landingPages: LandingPage[] = [
  {
    slug: "self-hosted-ai-agents-for-sled",
    label: "State & Local Government",
    title: "Self-Hosted AI Agents for State and Local Government",
    metaTitle: "Self-Hosted AI Agents for State and Local Government",
    metaDescription:
      "Run reviewable AI agents inside your own Azure subscription, on-premises, or disconnected environment. Papyrus from Beag Labs helps state and local agencies automate document-heavy work without sending data to a vendor cloud.",
    heroDescription:
      "Papyrus runs inside your environment, so permits, benefits files, public records requests, and case documents stay where your agency already controls them. Agents do the repetitive reading and assembly. Your staff review and approve the results.",
    heroSlides: [
      {
        src: "/landing/sled/brixton-recreation-centre.jpg",
        alt: "Brixton Recreation Centre, a brutalist brick and concrete public building in London",
        label: "Public buildings",
        credit: "Photographer not credited",
        sourceName: "Future plc",
        sourceUrl: "https://cdn.mos.cms.futurecdn.net/K9RuazinPJVYjVwHm55FzN.jpg",
      },
      {
        src: "/landing/sled/chandigarh-capitol-complex.jpg",
        alt: "Concrete assembly building of the Chandigarh Capitol Complex reflected in a pool",
        label: "Civic institutions",
        credit: "Photographer not credited",
        sourceName: "Atlas Obscura",
        sourceUrl:
          "https://img.atlasobscura.com/KJ1fgtqPLZTkrqCJm5q41yRX1uZXb4hobg23pDTQ_hw/rs:fill:12000:12000/q:81/sm:1/scp:1/ar:1/aHR0cHM6Ly9hdGxh/cy1kZXYuczMuYW1h/em9uYXdzLmNvbS91/cGxvYWRzL2Fzc2V0/cy9kZGE5YjRmYWRl/NDA0NjUzZGZfMTIw/QXNzZW1ieV9SR0Iu/anBn.jpg",
      },
      {
        src: "/landing/sled/abbey-church.jpg",
        alt: "Marcel Breuer's Abbey Church of St John's Benedictine monastery, a large concrete building",
        label: "Counties & cities",
        credit: "Robert W Kelley/The LIFE Picture Collection/Shutterstock",
        sourceName: "The Guardian",
        sourceUrl:
          "https://www.theguardian.com/film/2025/jan/29/architecture-the-brutalist-marcel-breuer#img-3",
      },
      {
        src: "/landing/sled/unesco-hq.jpg",
        alt: "Unesco headquarters in Paris, a Y-shaped concrete building",
        label: "Public service",
        credit: "Michael Ochs Archives/Getty Images",
        sourceName: "The Guardian",
        sourceUrl:
          "https://www.theguardian.com/film/2025/jan/29/architecture-the-brutalist-marcel-breuer#img-5",
      },
    ],
    problem: [
      {
        title: "Document-heavy, understaffed",
        description:
          "Intake, eligibility review, permitting, and records requests still depend on staff reading PDFs and re-keying data into legacy systems.",
      },
      {
        title: "Hosted AI is hard to approve",
        description:
          "Sending resident, case, or employee data to a third-party AI service raises procurement, privacy, and records-retention questions that slow or stop pilots.",
      },
      {
        title: "Legacy systems stay put",
        description:
          "Most agencies cannot replace core systems. Automation has to work around them, with a clear trail of what was done and who approved it.",
      },
    ],
    capabilities: [
      {
        title: "Document intake and extraction",
        description:
          "Bring in PDFs, forms, spreadsheets, and office files. Extract fields and requirements into structured output with source evidence attached.",
      },
      {
        title: "Reviewable agent workflows",
        description:
          "Agents prepare work. Staff review source evidence and approve consequential actions before anything moves downstream.",
      },
      {
        title: "Internal app factory",
        description:
          "Create internal tools and service apps around a workflow, with a USWDS-style interface and Login.gov through OIDC, connected to your existing systems.",
      },
      {
        title: "Your identity, your models",
        description:
          "Use Microsoft Entra for access, and connect Azure OpenAI, OpenAI-compatible gateways, or customer-hosted inference inside your approved boundary.",
      },
    ],
    deployment: [
      {
        title: "Your Azure subscription",
        description:
          "Deploy the Papyrus VM into your own subscription, including Azure Government where supported, through an Azure Marketplace private offer.",
      },
      {
        title: "On-premises",
        description:
          "Run Papyrus on infrastructure your agency operates, with the same container image and onboarding.",
      },
      {
        title: "Restricted or disconnected",
        description:
          "For environments without outbound access, Beag Labs can issue a signed offline organization license tied to approved Entra tenants and optional hostnames.",
      },
    ],
    workflows: [
      "Permit and license application intake",
      "Public records and FOIA request triage",
      "Benefits and eligibility document review",
      "Procurement and contract document analysis",
      "Case file summarization with cited sources",
      "Front-door apps for legacy line-of-business systems",
    ],
    guardrails: [
      "Customer-hosted: agent execution and documents stay in your environment",
      "Human review before consequential actions",
      "Model endpoints you choose, inside the boundary you approve",
      "Beag Labs supplies Papyrus component evidence for your own assessment and authorization work",
    ],
    disclaimer:
      "Example workflows are patterns, not claims of completed deployments. Customer-hosted operation does not by itself establish compliance, authorization, or certification. Your agency determines applicable handling requirements and approvals.",
    ctaTitle: "Scope a pilot inside your boundary.",
    ctaDescription:
      "Tell us about one document-heavy workflow and the environment you operate in. We will walk through how Papyrus would fit, what review looks like, and which licensing path matches your procurement.",
    faqs: [
      {
        question: "Where does Papyrus run?",
        answer:
          "Papyrus is customer-hosted. It runs as a VM in your Azure subscription, on-premises, or in a restricted or disconnected environment. Beag Labs does not host your documents or agent execution.",
      },
      {
        question: "Which AI models can it use?",
        answer:
          "Papyrus connects to Azure OpenAI, OpenAI-compatible gateways, and customer-hosted inference. You decide which endpoints are allowed within your boundary.",
      },
      {
        question: "Is Papyrus FedRAMP authorized or StateRAMP certified?",
        answer:
          "No. Papyrus is software you host, and Beag Labs makes no authorization or certification claim for it. We provide component evidence and documentation that can contribute to your own assessment and authorization process.",
      },
      {
        question: "How is it purchased?",
        answer:
          "Through an Azure Marketplace private offer or a direct agreement. For disconnected environments we issue a signed offline organization license. There is no public price card, because terms follow the deployment you need.",
      },
      {
        question: "Do staff stay in the loop?",
        answer:
          "Yes. Agents prepare extractions, drafts, and routing. Staff review source evidence and approve results before downstream action.",
      },
    ],
  },
]
