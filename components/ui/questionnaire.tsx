"use client"

/**
 * Config-driven questionnaire.
 *
 * Built on native controls and styled to match the site's neobrutalist look — thick black
 * borders, hard offset shadows, the orange accent, white cards, bold mono labels — rather
 * than on `@shadcn/react/questionnaire`, which is not a dependency and expects theme tokens
 * this stylesheet does not define.
 *
 * Three properties:
 *   1. Fields declare a value type (`single`, `multi`, `email`, `switch`, `slider`, …).
 *   2. Controls are exchangeable: `kind` picks a default, `controls` overrides by kind, and
 *      `field.control` overrides that.
 *   3. Layout is separate from content: `steps` decides which fields appear where.
 *
 * The field model and validation live in `lib/questionnaire.ts`, so the API route enforces
 * exactly what the browser accepted. When a definition declares an `email` notification and
 * the gating answer matches, the route sends it server-side to the right inbox.
 */

import * as React from "react"

import {
  DEFAULT_CONTROLS,
  fieldError,
  type Control,
  type ControlId,
  type ControlProps,
  type FieldKind,
  type QuestionnaireAnswers,
  type QuestionnaireField,
  type QuestionnaireStep,
} from "@/lib/questionnaire"
import { cn } from "@/lib/utils"

export type {
  Control,
  ControlId,
  ControlProps,
  FieldKind,
  QuestionnaireAnswers,
  QuestionnaireField,
  QuestionnaireOption,
  QuestionnaireStep,
} from "@/lib/questionnaire"

export { DEFAULT_CONTROLS } from "@/lib/questionnaire"

/* -------------------------------------------------------------------------- */
/* Shared styles                                                               */
/* -------------------------------------------------------------------------- */

const INPUT_CLASS =
  "w-full border-2 border-[#111] bg-white px-3 py-2 text-[14px] font-semibold text-[#111] outline-none transition-shadow placeholder:font-normal placeholder:text-[#b5b0a8] focus:shadow-[3px_3px_0px_0px_#111]"

const OPTION_BASE =
  "flex w-full cursor-pointer items-start gap-3 border-[3px] border-[#111] bg-white px-3 py-2.5 text-left shadow-[4px_4px_0px_0px_#111]"

const OPTION_SELECTED = "border-[#ff5f1f] bg-[#fff5ee]"

const PRIMARY_BUTTON =
  "border-[3px] border-[#111] bg-[#ff5f1f] px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#111] shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111] disabled:cursor-not-allowed disabled:opacity-50"

const SECONDARY_BUTTON =
  "border-[3px] border-[#111] bg-white px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#111] shadow-[4px_4px_0px_0px_#111] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111] disabled:cursor-not-allowed disabled:opacity-50"

const PANEL =
  "border-[3px] border-[#111] bg-white shadow-[4px_4px_0px_0px_#111]"

/* -------------------------------------------------------------------------- */
/* Built-in controls                                                           */
/* -------------------------------------------------------------------------- */

const TextControl: React.FC<ControlProps> = ({ field, value, onChange, disabled, invalid }) => (
  <input
    id={field.name}
    type={field.kind === "number" ? "number" : field.kind}
    inputMode={field.kind === "number" ? "numeric" : undefined}
    value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
    placeholder={field.placeholder}
    min={field.min}
    max={field.max}
    step={field.step}
    disabled={disabled}
    aria-invalid={invalid || undefined}
    onChange={(event) => onChange(event.target.value)}
    className={cn(INPUT_CLASS, invalid && "border-[#dc2626]")}
  />
)

const TextareaControl: React.FC<ControlProps> = ({ field, value, onChange, disabled, invalid }) => (
  <textarea
    id={field.name}
    value={typeof value === "string" ? value : ""}
    placeholder={field.placeholder}
    rows={5}
    disabled={disabled}
    aria-invalid={invalid || undefined}
    onChange={(event) => onChange(event.target.value)}
    className={cn(INPUT_CLASS, "min-h-[120px] resize-y", invalid && "border-[#dc2626]")}
  />
)

const SelectControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => (
  <select
    id={field.name}
    value={typeof value === "string" ? value : ""}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    className={cn(INPUT_CLASS, "appearance-none bg-white")}
  >
    {field.placeholder ? (
      <option value="" disabled>
        {field.placeholder}
      </option>
    ) : null}
    {(field.options ?? []).map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)

function OptionLabel({
  htmlFor,
  type,
  name,
  checked,
  label,
  description,
  disabled,
  onChange,
}: {
  htmlFor: string
  type: "radio" | "checkbox"
  name: string
  checked: boolean
  label: string
  description?: string
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <label htmlFor={htmlFor} className={cn(OPTION_BASE, checked && OPTION_SELECTED)}>
      <input
        id={htmlFor}
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 accent-[#ff5f1f]"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold text-[#111]">{label}</span>
        {description ? <span className="text-[13px] font-medium text-[#6b6b6b]">{description}</span> : null}
      </span>
    </label>
  )
}

const RadioControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => (
  <div className="grid gap-3">
    {(field.options ?? []).map((option) => (
      <OptionLabel
        key={option.value}
        htmlFor={`${field.name}-${option.value}`}
        type="radio"
        name={field.name}
        checked={value === option.value}
        label={option.label}
        description={option.description}
        disabled={disabled}
        onChange={() => onChange(option.value)}
      />
    ))}
  </div>
)

const CheckboxesControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => {
  const selected = Array.isArray(value) ? (value as string[]) : []
  const toggle = (option: string) =>
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    )

  return (
    <div className="grid gap-3">
      {(field.options ?? []).map((option) => (
        <OptionLabel
          key={option.value}
          htmlFor={`${field.name}-${option.value}`}
          type="checkbox"
          name={field.name}
          checked={selected.includes(option.value)}
          label={option.label}
          description={option.description}
          disabled={disabled}
          onChange={() => toggle(option.value)}
        />
      ))}
    </div>
  )
}

const SwitchControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => {
  const on = value === true
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={field.name}
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border-2 border-[#111] transition-colors",
          on ? "bg-[#ff5f1f]" : "bg-white",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-[#111] transition-transform",
            on && "translate-x-5",
          )}
        />
      </button>
      <label htmlFor={field.name} className="cursor-pointer text-[15px] font-bold text-[#111]">
        {field.placeholder ?? "Yes"}
      </label>
    </div>
  )
}

const SliderControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => {
  const current = typeof value === "number" ? value : (field.min ?? 0)
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        value={current}
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#ff5f1f]"
      />
      <span className="w-8 shrink-0 border-2 border-[#111] bg-white py-1 text-center font-mono text-[14px] font-bold text-[#111]">
        {current}
      </span>
    </div>
  )
}

export const BUILT_IN_CONTROLS: Record<ControlId, React.ComponentType<ControlProps>> = {
  text: TextControl,
  textarea: TextareaControl,
  select: SelectControl,
  radio: RadioControl,
  checkboxes: CheckboxesControl,
  switch: SwitchControl,
  slider: SliderControl,
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export interface QuestionnaireProps {
  fields: QuestionnaireField[]
  /** Steps and the fields in them. Omit to render every field on one page. */
  steps?: QuestionnaireStep[]
  /** Swap controls by kind across the whole form. */
  controls?: Partial<Record<FieldKind, Control>>
  /** Controlled answers. Leave unset to let the form hold its own state. */
  value?: QuestionnaireAnswers
  defaultValue?: QuestionnaireAnswers
  onChange?: (answers: QuestionnaireAnswers) => void
  /** POST target. When set, answers are posted as JSON and `onSubmit` runs on success. */
  action?: string
  /** Sent alongside the answers so the route knows which schema applies. */
  questionnaireId?: string
  headers?: Record<string, string>
  onSubmit?: (answers: QuestionnaireAnswers) => void | Promise<void>
  /** Rendered once the POST succeeds, replacing the form. */
  successMessage?: React.ReactNode
  submitLabel?: string
  nextLabel?: string
  previousLabel?: string
  className?: string
  showProgress?: boolean
}

export function Questionnaire({
  fields,
  steps,
  controls,
  value,
  defaultValue,
  onChange,
  action,
  questionnaireId,
  headers,
  onSubmit,
  successMessage = "Thanks — we have your answers.",
  submitLabel = "Submit",
  nextLabel = "Next",
  previousLabel = "Previous",
  className,
  showProgress = true,
}: QuestionnaireProps) {
  const fieldByName = React.useMemo(() => {
    const map = new Map<string, QuestionnaireField>()
    for (const field of fields) map.set(field.name, field)
    return map
  }, [fields])

  const resolvedSteps = React.useMemo<QuestionnaireStep[]>(() => {
    if (steps?.length) return steps
    return [{ id: "all", title: "", fields: fields.map((field) => field.name) }]
  }, [steps, fields])

  const [internal, setInternal] = React.useState<QuestionnaireAnswers>(() => {
    const seed: QuestionnaireAnswers = {}
    for (const field of fields) if (field.defaultValue !== undefined) seed[field.name] = field.defaultValue
    return { ...seed, ...defaultValue }
  })
  const answers = value ?? internal

  const setAnswer = React.useCallback(
    (name: string, next: unknown) => {
      const updated = { ...(value ?? internal), [name]: next }
      if (value === undefined) setInternal(updated)
      onChange?.(updated)
    },
    [value, internal, onChange],
  )

  const [stepIndex, setStepIndex] = React.useState(0)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [pending, setPending] = React.useState(false)
  const [failure, setFailure] = React.useState<string>()
  const [done, setDone] = React.useState(false)

  const current = resolvedSteps[Math.min(stepIndex, resolvedSteps.length - 1)]
  const isLast = stepIndex >= resolvedSteps.length - 1

  function validate(names: string[]): boolean {
    const next: Record<string, string> = {}
    for (const name of names) {
      const field = fieldByName.get(name)
      if (!field) continue
      const message = fieldError(field, answers[name])
      if (message) next[name] = message
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit() {
    setPending(true)
    setFailure(undefined)
    try {
      if (action) {
        const response = await fetch(action, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(
            questionnaireId ? { questionnaire: questionnaireId, answers } : answers,
          ),
        })
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string; errors?: Record<string, string> }
            | null
          if (body?.errors) setErrors(body.errors)
          throw new Error(body?.error ?? "Submission failed. Please try again.")
        }
      }
      await onSubmit?.(answers)
      setDone(true)
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "Submission failed.")
    } finally {
      setPending(false)
    }
  }

  function advance() {
    if (!validate(current.fields)) return
    if (isLast) {
      void submit()
      return
    }
    setErrors({})
    setStepIndex((index) => index + 1)
  }

  if (done) {
    return (
      <div role="status" className={cn(PANEL, "p-6 sm:p-8", className)}>
        <p className="text-[15px] font-bold text-[#111]">{successMessage}</p>
      </div>
    )
  }

  return (
    <div data-slot="questionnaire" className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      {showProgress && resolvedSteps.length > 1 ? (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
            Step {stepIndex + 1} of {resolvedSteps.length}
          </span>
          <div className="h-2 w-full border-[3px] border-[#111] bg-white">
            <div
              className="h-full bg-[#ff5f1f] transition-all"
              style={{ width: `${((stepIndex + 1) / resolvedSteps.length) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <section aria-labelledby={`${current.id}-title`} className={cn(PANEL, "p-5 sm:p-6")}>
        <div className="flex min-w-0 flex-col gap-4">
          {current.title ? (
            <header className="flex flex-col gap-2">
              <h2 id={`${current.id}-title`} className="text-lg font-extrabold tracking-[-0.02em] text-[#111]">
                {current.title}
              </h2>
              {current.description ? (
                <p className="text-[14px] font-medium leading-relaxed text-[#555]">{current.description}</p>
              ) : null}
            </header>
          ) : null}

          <div
            data-slot="field-grid"
            className={cn("grid min-w-0 gap-4", current.columns === 2 && "sm:grid-cols-2")}
          >
            {current.fields.map((name) => {
              const field = fieldByName.get(name)
              if (!field) return null
              const errorId = `${field.name}-error`
              const hintId = field.description ? `${field.name}-hint` : undefined
              const describedBy =
                [hintId, errors[field.name] ? errorId : undefined].filter(Boolean).join(" ") || undefined

              const chosen: Control = field.control ?? controls?.[field.kind] ?? DEFAULT_CONTROLS[field.kind]
              const Resolved: React.ComponentType<ControlProps> =
                typeof chosen === "function"
                  ? (chosen as unknown as React.ComponentType<ControlProps>)
                  : BUILT_IN_CONTROLS[chosen]

              return (
                <div
                  key={field.name}
                  data-slot="questionnaire-field"
                  className={cn("flex min-w-0 flex-col gap-1.5", field.span === 2 && "sm:col-span-2")}
                >
                  <label htmlFor={field.name} className="text-[14px] font-bold text-[#111]">
                    {field.label}
                    {field.required && field.kind !== "switch" && field.kind !== "single" ? (
                      <span aria-hidden="true" className="text-[#ff5f1f]"> *</span>
                    ) : null}
                  </label>
                  {field.description ? (
                    <p id={hintId} className="text-[13px] font-medium leading-relaxed text-[#6b6b6b]">
                      {field.description}
                    </p>
                  ) : null}

                  <div aria-describedby={describedBy}>
                    <Resolved
                      field={field}
                      value={answers[field.name]}
                      onChange={(next) => setAnswer(field.name, next)}
                      disabled={pending}
                      invalid={Boolean(errors[field.name])}
                    />
                  </div>

                  {errors[field.name] ? (
                    <p id={errorId} role="alert" className="text-[13px] font-bold text-[#dc2626]">
                      {errors[field.name]}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          {failure ? (
            <p role="alert" className="text-[13px] font-bold text-[#dc2626]">
              {failure}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 border-t-[3px] border-[#111] pt-4">
            <button
              type="button"
              disabled={stepIndex === 0 || pending}
              onClick={() => {
                setErrors({})
                setStepIndex((index) => Math.max(0, index - 1))
              }}
              className={SECONDARY_BUTTON}
            >
              {previousLabel}
            </button>
            <button type="button" disabled={pending} onClick={advance} className={PRIMARY_BUTTON}>
              {pending ? "Sending…" : isLast ? submitLabel : nextLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
