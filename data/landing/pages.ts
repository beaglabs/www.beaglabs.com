export interface LandingPage {
  slug: string
  label: string
  title: string
  metaTitle: string
  metaDescription: string
  heroDescription: string
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
    label: "Public sector back office",
    title: "An Agentic ERP for State and Local Government",
    metaTitle: "Agentic ERP for State and Local Government Back Offices",
    metaDescription:
      "Papyrus is an agentic ERP: one data model of vendors, invoices, payments and records that agents operate, with staff approving what matters. Run it at your own address with Microsoft sign-in.",
    heroDescription:
      "Vendors, invoices, payments, permits and requests live in one data model that agents understand. Agents do the reading, matching and routing. Your staff approve what matters.",
    problem: [
      {
        title: "Paper in, rekeying out",
        description:
          "Invoices, applications and records requests still arrive as PDFs that staff read and type into other systems by hand.",
      },
      {
        title: "Records scattered across systems",
        description:
          "Vendors, payments and case files sit in different tools, so every answer starts with a search.",
      },
      {
        title: "Approvals without context",
        description:
          "Reviewers sign off on work without the source document, the matching record or a trail of what changed.",
      },
    ],
    capabilities: [
      {
        title: "Documents in, ledger out",
        description:
          "Agents read invoices, forms and attachments and turn them into structured records, with the source document attached.",
      },
      {
        title: "AP and AR, run by agents",
        description:
          "Agents match invoices to vendors, prepare payments, chase what is owed and reconcile, then route each step for approval.",
      },
      {
        title: "Intake and routing",
        description:
          "Requests and applications land as records, get triaged by an agent and go to the right person with a draft ready.",
      },
      {
        title: "Staff approve what matters",
        description:
          "Consequential actions wait for a person. Every record shows what the agent did and who approved it.",
      },
    ],
    deployment: [
      {
        title: "Your own address",
        description:
          "Sign up at papyrus.beaglabs.com and your Papyrus goes live at its own address.",
      },
      {
        title: "Microsoft sign-in",
        description:
          "Staff sign in with the Microsoft accounts your organization already manages.",
      },
      {
        title: "Customer-hosted",
        description:
          "Papyrus runs as your deployment, so documents and agent work stay with your organization.",
      },
    ],
    workflows: [
      "Vendor invoice intake and three-way matching",
      "Accounts receivable and payment follow-up",
      "Permit and license application intake",
      "Public records request triage",
      "Contract and procurement document review",
      "Month-end reconciliation with cited sources",
    ],
    guardrails: [
      "One data model for vendors, invoices, payments and records",
      "Human approval before consequential actions",
      "Every record keeps its source document and history",
      "Microsoft sign-in for staff",
    ],
    disclaimer:
      "Example workflows are patterns, not claims of completed deployments. Running Papyrus as your own deployment does not by itself establish compliance, authorization or certification; your organization decides which handling requirements and approvals apply.",
    ctaTitle: "Put agents on your back office.",
    ctaDescription:
      "Sign up at papyrus.beaglabs.com, bring your vendors, invoices and records, and let the agents take the first pass.",
    faqs: [
      {
        question: "What is an agentic ERP?",
        answer:
          "An ERP whose data model agents understand and operate. Papyrus keeps vendors, customers, invoices, payments and records in one place, and agents do the back-office work on top of it while people approve what matters.",
      },
      {
        question: "How do we get started?",
        answer:
          "Sign up at papyrus.beaglabs.com. Your Papyrus goes live at its own address, and staff sign in with Microsoft.",
      },
      {
        question: "Is Papyrus FedRAMP authorized or StateRAMP certified?",
        answer:
          "No. Beag Labs makes no authorization or certification claim for Papyrus. The Trust Center publishes component evidence you can use in your own assessment.",
      },
      {
        question: "Do staff stay in the loop?",
        answer:
          "Yes. Agents prepare extractions, matches, drafts and routing. Staff review the source and approve before anything moves downstream.",
      },
    ],
  },
]
