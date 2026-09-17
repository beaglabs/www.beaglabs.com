/**
 * Questionnaire field model and validation.
 *
 * Deliberately framework-free: no React, no DOM, no imports from `components/`. That
 * lets the same definitions and the same checks run in three places — the browser
 * component, the API route that receives the POST, and any script that wants to inspect
 * a form — without three copies of the rules drifting apart.
 *
 * The rendered controls live in `components/ui/questionnaire.tsx`; the concrete
 * questionnaires live in `lib/questionnaires.ts`.
 */

/* -------------------------------------------------------------------------- */
/* Field model                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What the answer *is*. The kind selects a default control, sets the input type, and
 * drives validation. It does not dictate how the field is drawn — see `control`.
 */
export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "textarea"
  | "select"
  | "single"
  | "multi"
  | "switch"
  | "slider"

export interface QuestionnaireOption {
  value: string
  label: string
  description?: string
}

/** Controls shipped in `components/ui/questionnaire.tsx`. */
export type ControlId =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkboxes"
  | "switch"
  | "slider"

/** Props every control receives. A custom control is just a component with this shape. */
export interface ControlProps {
  field: QuestionnaireField
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  invalid?: boolean
}

/**
 * A caller-supplied control. Typed to return `unknown` so this module stays free of
 * React imports: a `React.FC<ControlProps>` satisfies it without dragging the framework
 * into code that also runs on the server.
 */
export type ControlComponent = (props: ControlProps) => unknown

/** Either the name of a built-in control or a component to render in its place. */
export type Control = ControlId | ControlComponent

export interface QuestionnaireField {
  /** Key in the submitted answer object. Unique across a questionnaire. */
  name: string
  kind: FieldKind
  label: string
  description?: string
  placeholder?: string
  /** Required for `select`, `single`, and `multi`. */
  options?: QuestionnaireOption[]
  required?: boolean
  /** Bounds for `slider`, and input attributes for `number`. */
  min?: number
  max?: number
  step?: number
  /**
   * Swap the control for this field alone. Beats the form-level `controls` map, which in
   * turn beats the default for this `kind`.
   */
  control?: Control
  /** Layout hint inside a step that uses two columns. */
  span?: 1 | 2
  defaultValue?: unknown
}

/**
 * A step is an *arrangement*: an ordered list of field names. The same `fields` array
 * presented as one page, three steps, or any other split is only a different `steps`
 * value — nothing about the fields themselves changes.
 */
export interface QuestionnaireStep {
  id: string
  title: string
  description?: string
  /** Field names, in this order. */
  fields: string[]
  columns?: 1 | 2
}

export type QuestionnaireAnswers = Record<string, unknown>

/**
 * A server-sent email. When a submission reaches a given answer (`equals`), the API route
 * sends the lead to `to` (with `cc` copied) rather than asking the visitor's mail client
 * to do it. This is how a questionnaire hands a lead directly to a human inbox.
 */
export interface EmailNotification {
  /** Field whose value gates the email. */
  when: string
  /** Value of that field that triggers it. */
  equals: unknown
  to: string
  cc?: string[]
  subject: string
}

export interface QuestionnaireDefinition {
  /** Id sent with the POST so the route knows which schema to enforce. */
  id: string
  title: string
  description?: string
  fields: QuestionnaireField[]
  steps?: QuestionnaireStep[]
  /** Form-level control overrides, by kind. */
  controls?: Partial<Record<FieldKind, Control>>
  submitLabel?: string
  successMessage?: string
  email?: EmailNotification
}

/** Default control per kind. */
export const DEFAULT_CONTROLS: Record<FieldKind, ControlId> = {
  text: "text",
  email: "text",
  tel: "text",
  url: "text",
  number: "text",
  textarea: "textarea",
  select: "select",
  single: "radio",
  multi: "checkboxes",
  switch: "switch",
  slider: "slider",
}

/** Kinds whose answer must be one of `field.options`. */
const OPTION_KINDS: ReadonlySet<FieldKind> = new Set<FieldKind>(["select", "single", "multi"])

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** A switch is answered by being off, and a slider always sits somewhere. */
function alwaysAnswered(kind: FieldKind) {
  return kind === "switch" || kind === "slider"
}

export function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return value.trim() !== ""
  if (Array.isArray(value)) return value.length > 0
  return true
}

const REQUIRED_MESSAGE: Partial<Record<FieldKind, string>> = {
  select: "Choose an answer to continue.",
  single: "Choose an answer to continue.",
  multi: "Choose at least one option.",
}

/**
 * The message for a bad answer, or `undefined` if the answer is acceptable. Used by the
 * component per step and by the route over the whole submission, so the two can never
 * disagree about what counts as complete.
 */
export function fieldError(field: QuestionnaireField, value: unknown): string | undefined {
  if (field.required && !alwaysAnswered(field.kind) && !isAnswered(value)) {
    return REQUIRED_MESSAGE[field.kind] ?? "This field is required."
  }

  if (!isAnswered(value)) return undefined

  if (OPTION_KINDS.has(field.kind) && field.options?.length) {
    const allowed = new Set(field.options.map((option) => option.value))
    if (field.kind === "multi") {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !allowed.has(item))) {
        return "Pick one of the listed options."
      }
    } else if (typeof value !== "string" || !allowed.has(value)) {
      return "Pick one of the listed options."
    }
  }

  if (field.kind === "email" && typeof value === "string" && !EMAIL.test(value.trim())) {
    return "Enter a valid email address."
  }

  if (field.kind === "number") {
    const numeric = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(numeric)) return "Enter a number."
    if (field.min !== undefined && numeric < field.min) return `Must be at least ${field.min}.`
    if (field.max !== undefined && numeric > field.max) return `Must be at most ${field.max}.`
  }

  if (field.kind === "slider") {
    const numeric = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(numeric)) return "Choose a value."
    if (field.min !== undefined && numeric < field.min) return `Must be at least ${field.min}.`
    if (field.max !== undefined && numeric > field.max) return `Must be at most ${field.max}.`
  }

  if (field.kind === "url" && typeof value === "string" && !/^https?:\/\/\S+$/i.test(value.trim())) {
    return "Enter a full URL starting with http:// or https://."
  }

  return undefined
}

/** Every bad answer, keyed by field name. Empty object means the submission is good. */
export function validateAnswers(
  fields: QuestionnaireField[],
  answers: QuestionnaireAnswers,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const message = fieldError(field, answers[field.name])
    if (message) errors[field.name] = message
  }
  return errors
}

/**
 * Keep only known fields, trim strings, and drop blanks so a submitted payload carries
 * exactly the answers the questionnaire defines — no injected keys, no `""` noise.
 */
export function coerceAnswers(
  fields: QuestionnaireField[],
  answers: QuestionnaireAnswers,
): QuestionnaireAnswers {
  const clean: QuestionnaireAnswers = {}
  for (const field of fields) {
    const value = answers[field.name]
    if (value === undefined || value === null) continue
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed !== "") clean[field.name] = trimmed
      continue
    }
    if (Array.isArray(value)) {
      const items = value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
      if (items.length) clean[field.name] = items
      continue
    }
    clean[field.name] = value
  }
  return clean
}

/** Resolve the field list for a definition, whether or not it declares steps. */
export function orderedFields(definition: QuestionnaireDefinition): QuestionnaireField[] {
  if (!definition.steps?.length) return definition.fields
  const byName = new Map(definition.fields.map((field) => [field.name, field]))
  const seen = new Set<string>()
  const ordered: QuestionnaireField[] = []
  for (const step of definition.steps) {
    for (const name of step.fields) {
      const field = byName.get(name)
      if (field && !seen.has(name)) {
        seen.add(name)
        ordered.push(field)
      }
    }
  }
  // Anything not named by a step would be invisible yet validatable, so keep it in play.
  for (const field of definition.fields) if (!seen.has(field.name)) ordered.push(field)
  return ordered
}
