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
    "title": "Agentic ERP for Finance Teams",
    "metaDescription": "Papyrus agents run accounts payable and receivable: invoices in, records matched, approvals routed, payments reconciled. People approve what matters.",
    "heroDescription": "Papyrus agents take invoices in, match them to vendors and customers, route approvals and keep payables and receivables moving. Your team approves what matters.",
    "useCases": [
      {
        "title": "Accounts payable",
        "description": "Agents read incoming invoices, match the vendor and create the bill with the source document attached."
      },
      {
        "title": "Accounts receivable",
        "description": "Agents prepare customer invoices, track what is owed and flag what is overdue."
      },
      {
        "title": "Approvals",
        "description": "Payments and exceptions go to the right person before anything moves."
      },
      {
        "title": "Reconciliation",
        "description": "Agents match payments to invoices and surface what doesn't line up."
      }
    ],
    "benefits": [
      "One data model for customers, vendors, invoices and payments",
      "Less rekeying between inbox, spreadsheet and ledger",
      "Agents handle the routine; people decide the exceptions"
    ],
    "compliance": [
      "Microsoft sign-in for your team",
      "Approval steps before payments and other consequential actions",
      "Documents become reviewed, structured records",
      "Runs at your own Papyrus address"
    ],
    "ctaText": "Put payables and receivables on Papyrus."
  },
  {
    "slug": "legal",
    "industry": "Legal",
    "title": "Agentic ERP for Legal Operations",
    "metaDescription": "Papyrus agents handle legal back-office work: contract and document intake, client invoicing, outside counsel bills and approvals, on one data model.",
    "heroDescription": "Papyrus agents turn contracts, engagement letters and invoices into records your team can act on, then route billing and approvals to the right people.",
    "useCases": [
      {
        "title": "Document intake",
        "description": "Agents read contracts and engagement letters and file the key terms against the right client or vendor."
      },
      {
        "title": "Client invoicing",
        "description": "Agents prepare invoices from the records you already keep and track what is outstanding."
      },
      {
        "title": "Outside counsel bills",
        "description": "Vendor invoices are matched to the matter and routed for approval before payment."
      },
      {
        "title": "Approvals",
        "description": "Consequential steps wait for a person, with the source document one click away."
      }
    ],
    "benefits": [
      "Clients, vendors, matters and invoices in one data model",
      "Less copying terms out of documents by hand",
      "Approvals where they matter, not everywhere"
    ],
    "compliance": [
      "Microsoft sign-in for your team",
      "Approval steps before payments and other consequential actions",
      "Documents become reviewed, structured records",
      "Runs at your own Papyrus address"
    ],
    "ctaText": "Run your legal back office on Papyrus."
  },
  {
    "slug": "government-defense",
    "industry": "Public sector",
    "title": "Agentic ERP for Public Sector Back Offices",
    "metaDescription": "Papyrus agents handle public sector back-office work: requests, vendor invoices, approvals and records, with people approving what matters.",
    "heroDescription": "Papyrus agents take requests and vendor invoices in, keep records in one data model and route each decision to the person who owns it.",
    "useCases": [
      {
        "title": "Request intake",
        "description": "Agents turn forms and emails into structured requests and route them to the right team."
      },
      {
        "title": "Vendor invoices",
        "description": "Agents match invoices to vendors and records and queue them for approval."
      },
      {
        "title": "Approvals",
        "description": "Consequential steps wait for an authorized person, with the source attached."
      },
      {
        "title": "Records and evidence",
        "description": "Documents stay attached to the records they created, ready for review."
      }
    ],
    "benefits": [
      "Requests, vendors, invoices and payments in one data model",
      "Less rekeying between forms, inboxes and systems of record",
      "People approve what matters; agents do the routine work"
    ],
    "compliance": [
      "Microsoft sign-in for your team",
      "Approval steps before payments and other consequential actions",
      "Documents become reviewed, structured records",
      "Review your handling requirements before go-live"
    ],
    "ctaText": "Run your back office on Papyrus."
  }
]
