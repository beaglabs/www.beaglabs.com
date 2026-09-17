/**
 * Concrete questionnaires.
 *
 * One definition drives both ends of the wire: the page in `app/design-partnerships/apply`
 * renders from it, and `app/api/questionnaire/submit` validates against it. Add a
 * questionnaire here and both ends know about it; there is no second schema to keep in
 * sync, which is the usual way a form and its endpoint drift apart.
 */

import type { QuestionnaireDefinition } from "@/lib/questionnaire"

/**
 * Domain Intelligence Pilot intake. Three steps, eleven questions, and one field whose
 * control is swapped (`dataReadiness` renders as a slider instead of its `number` input
 * default) to show that a field's value type and its control are separate decisions.
 */
export const PILOT_APPLICATION: QuestionnaireDefinition = {
  id: "pilot-application",
  title: "Domain Intelligence Pilot application",
  description:
    "Twelve weeks, one domain, deployed in your environment. These questions are what we use to decide whether the pilot is a fit and what to scope it against.",
  submitLabel: "Submit application",
  successMessage:
    "Application received. We read every one and reply within two business days — if it looks like a fit we will send times for a scoping call.",

  fields: [
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
        { value: "domain-expert", label: "Domain expert or principal investigator" },
        { value: "program-office", label: "Program office / contracting" },
        { value: "other", label: "Something else" },
      ],
    },
    {
      name: "organizationSize",
      kind: "single",
      label: "How many people work in your organization?",
      required: true,
      options: [
        { value: "1-50", label: "1–50" },
        { value: "51-500", label: "51–500" },
        { value: "501-5000", label: "501–5,000" },
        { value: "5000-plus", label: "More than 5,000" },
      ],
    },
    {
      name: "domain",
      kind: "textarea",
      label: "What domain should the pilot model?",
      description:
        "The narrower the better. \"Prior authorization appeals for a regional payer\" beats \"healthcare\".",
      required: true,
      placeholder:
        "What kinds of questions do your experts answer today by hand, and where does the knowledge live?",
    },
    {
      name: "dataSources",
      kind: "multi",
      label: "Where does the data live?",
      description: "Select everything the pilot would need to read.",
      required: true,
      options: [
        { value: "postgres-mysql", label: "Postgres / MySQL / SQL Server" },
        { value: "warehouse", label: "Snowflake / BigQuery / Databricks / Synapse" },
        { value: "object-storage", label: "S3 / Blob Storage / GCS" },
        { value: "documents", label: "PDFs, scans, and office documents" },
        { value: "wiki", label: "SharePoint / Confluence / Notion" },
        { value: "apis", label: "Internal REST or GraphQL APIs" },
        { value: "mainframe", label: "Mainframe, COBOL, or flat files" },
      ],
    },
    {
      name: "dataReadiness",
      kind: "number",
      label: "How well documented is that data today?",
      description: "0 means nobody has written it down. 10 means there is a maintained schema and data dictionary.",
      required: true,
      min: 0,
      max: 10,
      step: 1,
      defaultValue: 5,
      // Value type is `number`; the control is a slider. Those are independent choices.
      control: "slider",
    },
    {
      name: "deploymentTarget",
      kind: "single",
      label: "Where would it run?",
      required: true,
      options: [
        { value: "azure-gov", label: "Azure Government" },
        { value: "azure-commercial", label: "Azure commercial" },
        { value: "aws-govcloud", label: "AWS GovCloud" },
        { value: "on-prem", label: "On-premises or air-gapped" },
        { value: "undecided", label: "Not decided yet" },
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
    {
      name: "budget",
      kind: "single",
      label: "What budget range is realistic for a 12-week pilot?",
      description: "We would rather hear \"no budget yet\" than a number you cannot commit to.",
      required: true,
      options: [
        { value: "under-100k", label: "Under $100K" },
        { value: "100k-250k", label: "$100K – $250K" },
        { value: "250k-500k", label: "$250K – $500K" },
        { value: "over-500k", label: "Over $500K" },
        { value: "unknown", label: "Not established yet" },
      ],
    },
    {
      name: "wantsCall",
      kind: "switch",
      label: "Scoping call",
      description: "Turn this on if you would like us to send times rather than trade email.",
      placeholder: "Yes, send me times",
      defaultValue: true,
    },
    {
      name: "notes",
      kind: "textarea",
      label: "Anything else we should know?",
      description: "Constraints, incumbent vendors, procurement quirks, past attempts that failed.",
      span: 2,
      placeholder: "Optional",
    },
  ],

  steps: [
    {
      id: "you",
      title: "Who you are",
      description: "So we know who we are replying to and how your organization is shaped.",
      fields: ["fullName", "email", "company", "role", "organizationSize"],
      columns: 2,
    },
    {
      id: "pilot",
      title: "What the pilot would cover",
      description: "The domain, the data behind it, and where the result has to run.",
      fields: ["domain", "dataSources", "dataReadiness", "deploymentTarget"],
      columns: 1,
    },
    {
      id: "commercials",
      title: "Timing and budget",
      description: "This is what lets us tell you yes or no instead of scheduling a discovery call.",
      fields: ["timeline", "budget", "wantsCall", "notes"],
      columns: 2,
    },
  ],

  /**
   * Form-level swaps, keyed by kind. Every `single` question renders as a select here
   * instead of the default radios — one line, every matching field, no field edits.
   */
  controls: {
    single: "select",
  },
}

export const QUESTIONNAIRES: Record<string, QuestionnaireDefinition> = {
  [PILOT_APPLICATION.id]: PILOT_APPLICATION,
}

export function getQuestionnaire(id: string): QuestionnaireDefinition | undefined {
  return QUESTIONNAIRES[id]
}

export const QUESTIONNAIRE_IDS = Object.keys(QUESTIONNAIRES)
