"use client"

/**
 * Renders a contact questionnaire from its definition, wired to the POST route and to the
 * founder-contact mailto configured on the definition itself.
 */

import { Questionnaire } from "@/components/ui/questionnaire"
import { getQuestionnaire } from "@/lib/questionnaires"

export function ContactForm({ id }: { id: string }) {
  const definition = getQuestionnaire(id)
  if (!definition) return null

  return (
    <Questionnaire
      fields={definition.fields}
      steps={definition.steps}
      controls={definition.controls}
      action="/api/questionnaire/submit"
      questionnaireId={definition.id}
      submitLabel={definition.submitLabel}
      successMessage={definition.successMessage}
      mailto={definition.mailto}
    />
  )
}
