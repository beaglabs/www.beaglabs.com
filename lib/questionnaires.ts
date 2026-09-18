/**
 * Concrete questionnaires.
 *
 * One definition drives both ends of the wire: the page renders from it, and
 * `app/api/questionnaire/submit` validates against it. Add a questionnaire here and both
 * ends know about it; there is no second schema to keep in sync.
 *
 * There are three contact forms. They share the same core fields and differ only in what
 * they ask. Every submission opens one email thread: from sales@beaglabs.com to the
 * contact, with james@beaglabs.com cc'd.
 */

import type {
  EmailNotification,
  QuestionnaireDefinition,
  QuestionnaireField,
} from "@/lib/questionnaire"

/** Every form asks these. */
const CORE_FIELDS: QuestionnaireField[] = [
  {
    name: "fullName",
    kind: "text",
    label: "Your name",
    required: true,
    placeholder: "Jane Okafor",
  },
  {
    name: "email",
    kind: "email",
    label: "Work email",
    required: true,
    placeholder: "jane@company.com",
  },
  {
    name: "company",
    kind: "text",
    label: "Organization",
    required: true,
    placeholder: "Acme Health",
  },
  {
    name: "role",
    kind: "select",
    label: "Your role",
    required: true,
    placeholder: "Select a role",
    options: [
      { value: "founder-exec", label: "Founder / executive" },
      { value: "engineering-lead", label: "Engineering or platform lead" },
      { value: "data-lead", label: "Data / ML lead" },
      { value: "procurement", label: "Procurement / contracting" },
      { value: "partner", label: "Partner / reseller" },
      { value: "other", label: "Something else" },
    ],
  },
]

const MESSAGE_FIELD: QuestionnaireField = {
  name: "message",
  kind: "textarea",
  label: "What would you like to talk about?",
  description: "A paragraph is enough — what you are trying to do, and what you need from us.",
  required: true,
  placeholder: "Tell us what you are working on.",
}

function email(subject: string): EmailNotification {
  return {
    from: "sales@beaglabs.com",
    cc: ["james@beaglabs.com"],
    subject,
  }
}

/** Split the core fields into a two-column "about you" step. */
const STEPS = {
  you: { id: "you", title: "About you", fields: ["fullName", "email", "company", "role"], columns: 2 as const },
}

export const PARTNERSHIPS_FORM: QuestionnaireDefinition = {
  id: "partnerships",
  title: "Partner with Beag Labs",
  description:
    "Tell us who you are and what a partnership could look like. We will come back with partner pricing, the deployment runbook, and deal registration.",
  submitLabel: "Submit inquiry",
  successMessage:
    "Thanks — we will come back with partner pricing, the deployment runbook, and deal registration.",
  email: email("Partnership inquiry"),
  fields: [
    ...CORE_FIELDS,
    {
      name: "partnerType",
      kind: "single",
      label: "What kind of partnership?",
      required: true,
      options: [
        { value: "csp", label: "Cloud Solution Provider (CSP)" },
        { value: "technology", label: "Technology or integration partner" },
        { value: "research", label: "Research or pilot collaboration" },
        { value: "other", label: "Something else" },
      ],
    },
    MESSAGE_FIELD,
  ],
  steps: [
    STEPS.you,
    { id: "ask", title: "The partnership", fields: ["partnerType", "message"] },
  ],
}

export const HELLO_FORM: QuestionnaireDefinition = {
  id: "hello",
  title: "Talk to us",
  description:
    "General enquiries, press, or anything that does not fit one of the other forms. It lands in the same place.",
  submitLabel: "Send message",
  successMessage: "Thanks — we read everything and reply within two business days.",
  email: email("General inquiry"),
  fields: [...CORE_FIELDS, MESSAGE_FIELD],
  steps: [
    STEPS.you,
    { id: "ask", title: "Your message", fields: ["message"] },
  ],
}

export const SALES_FORM: QuestionnaireDefinition = {
  id: "sales",
  title: "Sales",
  description:
    "Tell us what you are evaluating. Budget and timeline are what let us answer yes or no instead of scheduling a discovery call.",
  submitLabel: "Send inquiry",
  successMessage: "Thanks — we will come back with pricing, a demo, or a scoping call.",
  email: email("Sales inquiry"),
  fields: [
    ...CORE_FIELDS,
    {
      name: "budget",
      kind: "single",
      label: "What budget range are you working with?",
      description: "A rough range is fine — it just changes which options we show you.",
      required: true,
      options: [
        { value: "under-50k", label: "Under $50K" },
        { value: "50k-100k", label: "$50K – $100K" },
        { value: "100k-250k", label: "$100K – $250K" },
        { value: "250k-500k", label: "$250K – $500K" },
        { value: "over-500k", label: "Over $500K" },
        { value: "unknown", label: "Not established yet" },
      ],
    },
    {
      name: "timeline",
      kind: "select",
      label: "When would you want to start?",
      required: true,
      placeholder: "Select a timeline",
      options: [
        { value: "now", label: "Ready now — funding is in place" },
        { value: "1-3-months", label: "Within 1–3 months" },
        { value: "3-6-months", label: "Within 3–6 months" },
        { value: "exploring", label: "Exploring, no date yet" },
      ],
    },
    MESSAGE_FIELD,
  ],
  steps: [
    STEPS.you,
    { id: "evaluating", title: "What you are evaluating", fields: ["budget", "timeline"] },
    { id: "message", title: "Your message", fields: ["message"] },
  ],
}

export const QUESTIONNAIRES: Record<string, QuestionnaireDefinition> = {
  [PARTNERSHIPS_FORM.id]: PARTNERSHIPS_FORM,
  [HELLO_FORM.id]: HELLO_FORM,
  [SALES_FORM.id]: SALES_FORM,
}

export function getQuestionnaire(id: string): QuestionnaireDefinition | undefined {
  return QUESTIONNAIRES[id]
}

export const QUESTIONNAIRE_IDS = Object.keys(QUESTIONNAIRES)
