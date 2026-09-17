"use client"

/**
 * Config-driven questionnaire.
 *
 * Modelled on the Neobrutalism questionnaire, but built on the primitives this repo
 * already has rather than on the `@shadcn/react/questionnaire` primitive. That package is
 * not a dependency here, and the registry component expects a set of theme tokens
 * (`rounded-base`, `bg-secondary-background`, `font-base`, `font-heading`) that
 * `globals.css` does not define. Layering a second token system onto a live site to gain
 * one component is a bad trade, so this gets the same result from tokens already present.
 *
 * Three properties the registry component does not have:
 *
 *   1. **Fields declare a value type.** A field says what it *is* — `single`, `multi`,
 *      `email`, `switch`, `slider` — and carries its own options, instead of the caller
 *      hand-writing markup per question.
 *   2. **Controls are exchangeable.** `kind` picks a default control; the form's
 *      `controls` map overrides it by kind; a field's own `control` overrides that. So
 *      every `single` question can become a select in one line, and a `number` field can
 *      render as a slider without its value type changing.
 *   3. **Layout is separate from content.** `steps` decides which fields appear where and
 *      in what order. The same field set is one page, three steps, or any other split —
 *      the fields themselves never change.
 *
 * The field model and the validation rules live in `lib/questionnaire.ts`, so the API
 * route that receives the POST enforces exactly what this component accepted.
 *
 * Usage:
 *
 *   const steps: QuestionnaireStep[] = [
 *     { id: "one", title: "About you", fields: ["email", "notes"], columns: 2 },
 *   ]
 *
 *   <Questionnaire
 *     fields={fields}
 *     steps={steps}
 *     action="/api/questionnaire/submit"
 *     questionnaireId="pilot-application"
 *   />
 *
 * With `action` set, answers are POSTed as JSON and `onSubmit` runs only on success.
 * Without it, `onSubmit` is called directly and the caller owns the transport.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
/* Built-in controls                                                           */
/* -------------------------------------------------------------------------- */

const TextControl: React.FC<ControlProps> = ({ field, value, onChange, disabled, invalid }) => (
  <Input
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
    className={cn("nb-input", invalid && "border-destructive")}
  />
)

const TextareaControl: React.FC<ControlProps> = ({ field, value, onChange, disabled, invalid }) => (
  <Textarea
    id={field.name}
    value={typeof value === "string" ? value : ""}
    placeholder={field.placeholder}
    rows={5}
    disabled={disabled}
    aria-invalid={invalid || undefined}
    onChange={(event) => onChange(event.target.value)}
    className={cn(invalid && "border-destructive")}
  />
)

const SelectControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => (
  <Select
    value={typeof value === "string" ? value : ""}
    onValueChange={onChange}
    disabled={disabled}
  >
    <SelectTrigger id={field.name} className="w-full">
      <SelectValue placeholder={field.placeholder ?? "Choose an answer"} />
    </SelectTrigger>
    <SelectContent>
      {(field.options ?? []).map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

function OptionLabel({
  htmlFor,
  label,
  description,
  children,
}: {
  htmlFor: string
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="nb-card flex cursor-pointer items-start gap-3 px-4 py-3 text-sm leading-snug font-normal"
    >
      {children}
      <span className="flex flex-col gap-0.5">
        <span>{label}</span>
        {description ? <span className="text-muted-foreground text-xs">{description}</span> : null}
      </span>
    </Label>
  )
}

const RadioControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => (
  <RadioGroup
    value={typeof value === "string" ? value : ""}
    onValueChange={onChange}
    disabled={disabled}
    className="grid gap-3"
  >
    {(field.options ?? []).map((option) => (
      <OptionLabel
        key={option.value}
        htmlFor={`${field.name}-${option.value}`}
        label={option.label}
        description={option.description}
      >
        <RadioGroupItem
          id={`${field.name}-${option.value}`}
          value={option.value}
          className="mt-0.5"
        />
      </OptionLabel>
    ))}
  </RadioGroup>
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
          label={option.label}
          description={option.description}
        >
          <Checkbox
            id={`${field.name}-${option.value}`}
            checked={selected.includes(option.value)}
            disabled={disabled}
            onCheckedChange={() => toggle(option.value)}
            className="mt-0.5"
          />
        </OptionLabel>
      ))}
    </div>
  )
}

const SwitchControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => (
  <div className="flex items-center gap-3">
    <Switch
      id={field.name}
      checked={value === true}
      disabled={disabled}
      onCheckedChange={(checked) => onChange(checked)}
    />
    <Label htmlFor={field.name} className="cursor-pointer text-sm font-normal">
      {field.placeholder ?? "Yes"}
    </Label>
  </div>
)

const SliderControl: React.FC<ControlProps> = ({ field, value, onChange, disabled }) => {
  const current = typeof value === "number" ? value : (field.min ?? 0)
  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[current]}
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        disabled={disabled}
        onValueChange={([next]) => onChange(next)}
        className="flex-1"
      />
      <span className="w-10 text-right text-sm tabular-nums">{current}</span>
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
    setStepIndex((index) => index + 1)
  }

  function ControlFor({ field }: { field: QuestionnaireField }) {
    const chosen: Control = field.control ?? controls?.[field.kind] ?? DEFAULT_CONTROLS[field.kind]
    // A caller-supplied control is typed as returning `unknown` to keep `lib/questionnaire`
    // React-free; as a function it is a component as far as JSX is concerned.
    const Resolved: React.ComponentType<ControlProps> =
      typeof chosen === "function"
        ? // A caller-supplied control returns `unknown` so `lib/questionnaire` needs no
          // React import; the props are identical, so the component signature applies.
          (chosen as unknown as React.ComponentType<ControlProps>)
        : BUILT_IN_CONTROLS[chosen]

    return (
      <Resolved
        field={field}
        value={answers[field.name]}
        onChange={(next) => setAnswer(field.name, next)}
        disabled={pending}
        invalid={Boolean(errors[field.name])}
      />
    )
  }

  if (done) {
    return (
      <div role="status" className={cn("nb-panel p-8 text-sm leading-relaxed", className)}>
        {successMessage}
      </div>
    )
  }

  return (
    <div data-slot="questionnaire" className={cn("flex w-full min-w-0 flex-col gap-6", className)}>
      {showProgress && resolvedSteps.length > 1 ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Question {stepIndex + 1} of {resolvedSteps.length}
          </p>
          <Progress value={((stepIndex + 1) / resolvedSteps.length) * 100} />
        </div>
      ) : null}

      <section
        aria-labelledby={`${current.id}-title`}
        className="nb-panel flex min-w-0 flex-col gap-5 p-6"
      >
        {current.title ? (
          <header className="flex flex-col gap-1">
            <h2 id={`${current.id}-title`} className="text-base leading-snug font-semibold text-balance">
              {current.title}
            </h2>
            {current.description ? (
              <p className="text-muted-foreground text-sm text-pretty">{current.description}</p>
            ) : null}
          </header>
        ) : null}

        <div
          data-slot="field-grid"
          className={cn("grid min-w-0 gap-5", current.columns === 2 && "sm:grid-cols-2")}
        >
          {current.fields.map((name) => {
            const field = fieldByName.get(name)
            if (!field) return null
            const errorId = `${field.name}-error`
            const hintId = field.description ? `${field.name}-hint` : undefined
            const describedBy =
              [hintId, errors[field.name] ? errorId : undefined].filter(Boolean).join(" ") || undefined

            return (
              <div
                key={field.name}
                data-slot="questionnaire-field"
                className={cn("flex min-w-0 flex-col gap-2", field.span === 2 && "sm:col-span-2")}
              >
                <Label htmlFor={field.name} className="text-sm leading-snug font-medium">
                  {field.label}
                  {field.required && field.kind !== "switch" ? (
                    <span aria-hidden="true" className="text-accent ml-1">
                      *
                    </span>
                  ) : null}
                </Label>
                {field.description ? (
                  <p id={hintId} className="text-muted-foreground text-xs text-pretty">
                    {field.description}
                  </p>
                ) : null}

                <div aria-describedby={describedBy}>
                  <ControlFor field={field} />
                </div>

                {errors[field.name] ? (
                  <p id={errorId} role="alert" className="text-destructive text-sm">
                    {errors[field.name]}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        {failure ? (
          <p role="alert" className="text-destructive text-sm">
            {failure}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex === 0 || pending}
            onClick={() => {
              setErrors({})
              setStepIndex((index) => Math.max(0, index - 1))
            }}
          >
            {previousLabel}
          </Button>
          <Button type="button" className="nb-btn-orange" disabled={pending} onClick={advance}>
            {pending ? "Sending…" : isLast ? submitLabel : nextLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}
