import { NextResponse } from "next/server"

import { Resend } from "resend"

import { coerceAnswers, orderedFields, validateAnswers } from "@/lib/questionnaire"
import { getQuestionnaire, QUESTIONNAIRE_IDS } from "@/lib/questionnaires"

const KEY = process.env.CUSTOMERIO_APP_API_KEY
const CUSTOMERIO_BASE = "https://api.customer.io/v1"
const ENVIRONMENT_ID = "224249"
const COMPANIES_OBJECT_TYPE_ID = 1

/**
 * Which answer fields map onto Customer.io person attributes, when present. Keeps a
 * questionnaire free to name its fields whatever reads best in the UI without the CRM
 * ending up with eleven differently-spelled `company` attributes.
 */
const PERSON_ATTRIBUTE_ALIASES: Record<string, string> = {
  email: "email",
  fullName: "name",
  name: "name",
  company: "company_name",
  role: "job_title",
}

async function cio(method: string, path: string, body?: unknown) {
  if (!KEY) {
    console.warn("CUSTOMERIO_APP_API_KEY not set — questionnaire submission not forwarded")
    return null
  }
  const res = await fetch(`${CUSTOMERIO_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    console.error(`Customer.io error (${res.status}): ${await res.text()}`)
  }
  return res
}

export async function POST(request: Request) {
  try {
    // Better to fail loudly than to tell an applicant their submission was received when
    // there is nowhere to put it.
    if (!KEY) {
      console.error("CUSTOMERIO_APP_API_KEY is not set — refusing questionnaire submissions")
      return NextResponse.json(
        {
          error:
            "We could not record that. Please email james@beaglabs.com and we will pick it up.",
        },
        { status: 503 },
      )
    }

    const raw = (await request.json().catch(() => null)) as
      | { questionnaire?: unknown; answers?: unknown }
      | null

    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 })
    }

    // Accept both the wrapped shape the component sends and a bare answers object, so the
    // endpoint is usable by a script or a curl without knowing the envelope.
    const questionnaireId =
      typeof raw.questionnaire === "string"
        ? raw.questionnaire
        : QUESTIONNAIRE_IDS.length === 1
          ? QUESTIONNAIRE_IDS[0]
          : undefined

    const definition = questionnaireId ? getQuestionnaire(questionnaireId) : undefined
    if (!definition) {
      return NextResponse.json(
        { error: `Unknown questionnaire. Expected one of: ${QUESTIONNAIRE_IDS.join(", ")}.` },
        { status: 404 },
      )
    }

    const submitted = (raw.answers ?? raw) as Record<string, unknown>
    if (typeof submitted !== "object" || submitted === null || Array.isArray(submitted)) {
      return NextResponse.json({ error: "`answers` must be an object." }, { status: 400 })
    }

    // Validate against the definition itself, so the server enforces exactly what the
    // browser accepted — including fields on steps the client might never have rendered.
    const fields = orderedFields(definition)
    const answers = coerceAnswers(fields, submitted)
    const errors = validateAnswers(fields, answers)
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Some answers need attention.", errors },
        { status: 400 },
      )
    }

    const submittedAt = new Date().toISOString()
    const email = typeof answers.email === "string" ? answers.email : undefined
    const company = typeof answers.company === "string" ? answers.company : undefined

    const calls: Promise<unknown>[] = []

    if (email) {
      const attributes: Record<string, unknown> = {
        last_questionnaire: definition.id,
        last_questionnaire_at: submittedAt,
      }
      for (const [field, attribute] of Object.entries(PERSON_ATTRIBUTE_ALIASES)) {
        const value = answers[field]
        if (typeof value === "string" && value !== "") attributes[attribute] = value
      }

      calls.push(
        cio("POST", `/environments/${ENVIRONMENT_ID}/customers`, {
          customer: { attributes },
        }),
      )
    }

    if (email) {
      // The full answer set rides on the event, which is what makes this useful without a
      // database: every submission is replayable and nothing is silently dropped.
      calls.push(
        cio("POST", `/environments/${ENVIRONMENT_ID}/events`, {
          event: {
            name: `${definition.id}_submitted`,
            data: { ...answers, questionnaire: definition.id, submitted_at: submittedAt },
            type: "person",
            identifiers: { email },
          },
        }),
      )
    } else {
      // A submission with no email cannot be attributed to a person in Customer.io, and a
      // fabricated anonymous id would be worse than useless. Log it so it is not lost.
      console.warn(
        `[questionnaire] ${definition.id} submitted without an email address; not forwarded`,
        JSON.stringify(answers),
      )
    }

    if (company) {
      calls.push(
        cio("PUT", `/environments/${ENVIRONMENT_ID}/object_types/${COMPANIES_OBJECT_TYPE_ID}/objects/${encodeURIComponent(company)}`, {
          object: {
            attributes: {
              name: company,
              last_contact_at: submittedAt,
              last_questionnaire: definition.id,
            },
          },
        }),
      )
    }

    await Promise.allSettled(calls)

    // Founder contact: send the email server-side instead of opening the visitor's mail
    // client. The record is already in Customer.io; this is the direct channel.
    const notify = definition.email
    if (notify && answers[notify.when] === notify.equals) {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        console.error("[questionnaire] RESEND_API_KEY not set — contact email not sent")
      } else {
        try {
          const resend = new Resend(apiKey)
          const body = [
            `${definition.title} — ${definition.id}`,
            "",
            fields
              .map((field) => {
                const value = answers[field.name]
                const text = Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "boolean"
                    ? (value ? "Yes" : "No")
                    : value == null
                      ? ""
                      : String(value)
                return text ? `${field.label}: ${text}` : null
              })
              .filter((line): line is string => line !== null)
              .join("\n"),
            "",
            `Submitted: ${submittedAt}`,
          ].join("\n")

          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "no-reply@beaglabs.com",
            to: notify.to,
            cc: notify.cc,
            reply_to: email,
            subject: notify.subject,
            text: body,
          })
          if (result.error) console.error("[questionnaire] Resend error:", result.error.message)
        } catch (err) {
          console.error("[questionnaire] Resend send failed:", err)
        }
      }
    }

    return NextResponse.json({ success: true, questionnaire: definition.id })
  } catch (err) {
    console.error("Questionnaire submission error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
