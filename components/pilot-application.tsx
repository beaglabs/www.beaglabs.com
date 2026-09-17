"use client"

/**
 * Pilot application, rendered by `components/ui/questionnaire`.
 *
 * This file is the demonstration of the two properties that matter: the field set is
 * declared once in `lib/questionnaires.ts`, and *presentation* is chosen here. The same
 * eleven fields are shown as a three-step guided form or as a single page, and the
 * `single` questions render as dropdowns in guided mode and as radio cards on one page —
 * by passing a different `controls` map, without touching a single field definition.
 */

import * as React from "react"

import { Questionnaire } from "@/components/ui/questionnaire"
import type { QuestionnaireStep } from "@/lib/questionnaire"
import { PILOT_APPLICATION } from "@/lib/questionnaires"

/** The same fields, collapsed to one page. Only the arrangement differs. */
const ONE_PAGE: QuestionnaireStep[] = [
  {
    id: "all",
    title: "Everything, on one page",
    description: "Same questions — no paging.",
    fields: PILOT_APPLICATION.fields.map((field) => field.name),
    columns: 2,
  },
]

type Mode = "guided" | "one-page"

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "guided", label: "Guided", hint: "Three steps, dropdowns" },
  { id: "one-page", label: "One page", hint: "All fields, radio cards" },
]

export function PilotApplication() {
  const [mode, setMode] = React.useState<Mode>("guided")

  return (
    <div className="flex flex-col gap-6">
      {/*
        The mode switch is not decoration: it shows the same field set rearranged and its
        controls swapped, which is what makes the component reusable across forms rather
        than tailored to this one.
      */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Form layout"
          className="inline-flex border-[3px] border-[#111] bg-white"
        >
          {MODES.map((option) => {
            const active = mode === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(option.id)}
                title={option.hint}
                className={
                  "px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.1em] transition-colors " +
                  (active ? "bg-[#ff5f1f] text-[#111]" : "bg-white text-[#111] hover:bg-[#f2f0ea]")
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <p className="text-[12px] leading-[1.5] text-[#7c7c7c]">
          {MODES.find((option) => option.id === mode)?.hint} — the questions are identical.
        </p>
      </div>

      <Questionnaire
        key={mode}
        fields={PILOT_APPLICATION.fields}
        steps={mode === "guided" ? PILOT_APPLICATION.steps : ONE_PAGE}
        controls={mode === "guided" ? PILOT_APPLICATION.controls : { single: "radio", select: "radio" }}
        action="/api/questionnaire/submit"
        questionnaireId={PILOT_APPLICATION.id}
        submitLabel={PILOT_APPLICATION.submitLabel}
        successMessage={PILOT_APPLICATION.successMessage}
      />

      <p className="text-[12px] leading-[1.6] text-[#7c7c7c]">
        Prefer to talk it through?{" "}
        <a
          href="https://cal.com/comradelemoncake/meet-the-founder"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#111] underline decoration-[#ff5f1f] decoration-2 underline-offset-2"
        >
          Book a slot directly
        </a>
        .
      </p>
    </div>
  )
}
