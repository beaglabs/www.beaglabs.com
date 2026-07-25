import { NextResponse } from "next/server"
import { z } from "zod"

const env = process.env.CUSTOMERIO_APP_API_KEY

const CUSTOMERIO_BASE = "https://api.customer.io/v1"
const ENVIRONMENT_ID = "224249"
const COMPANIES_OBJECT_TYPE_ID = 1
const APPOINTMENTS_OBJECT_TYPE_ID = 2

const bodySchema = z.object({
  topic: z.enum(["fine-tuning", "qat", "agentic-support"]),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().min(1),
  jobTitle: z.enum([
    "cto-vp-engineering", "ml-engineer", "engineering-manager",
    "product-manager", "founder-ceo", "head-of-ai", "researcher", "other",
  ]),
  projectDescription: z.string().min(10),
  timeline: z.enum(["asap", "1-2-months", "3-6-months", "just-exploring"]),
  budget: z.enum(["under-50k", "50k-200k", "200k-1m", "1m-plus"]),
  wantsMeeting: z.boolean(),
  referral: z.enum([
    "google", "linkedin", "twitter-x", "github",
    "referral", "newsletter", "blog-article", "conference-event", "other",
  ]),
})

async function cio(method: string, path: string, body?: unknown) {
  if (!env) {
    console.warn("CUSTOMERIO_APP_API_KEY not set — skipping API call")
    return null
  }
  const res = await fetch(`${CUSTOMERIO_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`Customer.io error (${res.status}): ${text}`)
  }
  return res
}

export async function POST(request: Request) {
  try {
    const raw = await request.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { topic, name, email, phone, company, jobTitle, projectDescription, timeline, budget, wantsMeeting, referral } = parsed.data

    const eventName = `${topic}_submitted`

    const cioPromises: Promise<unknown>[] = []

    cioPromises.push(
      cio("POST", `/environments/${ENVIRONMENT_ID}/customers`, {
        customer: {
          attributes: {
            email,
            name,
            phone,
            company_name: company,
            job_title: jobTitle,
            last_project_topic: topic,
            last_timeline: timeline,
            last_budget: budget,
            last_referral: referral,
            last_contact_at: new Date().toISOString(),
          },
        },
      }),
    )

    cioPromises.push(
      cio("POST", `/environments/${ENVIRONMENT_ID}/events`, {
        event: {
          name: eventName,
          data: {
            topic,
            project_description: projectDescription,
            timeline,
            budget,
            wants_meeting: wantsMeeting,
            referral,
            submitted_at: new Date().toISOString(),
          },
          type: "person",
          identifiers: { email },
        },
      }),
    )

    const isDisqualified =
      budget === "under-50k" ||
      (budget === "50k-200k" && (topic === "fine-tuning" || topic === "qat"))

    if (isDisqualified) {
      cioPromises.push(
        cio("POST", `/environments/${ENVIRONMENT_ID}/events`, {
          event: {
            name: "disqualified",
            data: {
              topic,
              budget,
              reason: budget === "under-50k"
                ? "Budget under $50K"
                : "Budget under $200K for fine-tuning / QAT",
              disqualified_at: new Date().toISOString(),
            },
            type: "person",
            identifiers: { email },
          },
        }),
      )
    }

    cioPromises.push(
      cio("PUT", `/environments/${ENVIRONMENT_ID}/object_types/${COMPANIES_OBJECT_TYPE_ID}/objects/${encodeURIComponent(company)}`, {
        object: {
          attributes: {
            name: company,
            industry: "AI / Machine Learning",
            last_contact_topic: topic,
            last_contact_at: new Date().toISOString(),
          },
        },
      }),
    )

    if (wantsMeeting) {
      cioPromises.push(
        cio("POST", `/environments/${ENVIRONMENT_ID}/events`, {
          event: {
            name: "meeting_scheduled",
            data: {
              topic,
              requested_at: new Date().toISOString(),
              company,
            },
            type: "person",
            identifiers: { email },
          },
        }),
      )

      cioPromises.push(
        cio("PUT", `/environments/${ENVIRONMENT_ID}/object_types/${APPOINTMENTS_OBJECT_TYPE_ID}/objects/${encodeURIComponent(`${name}-${Date.now()}`)}`, {
          object: {
            attributes: {
              name: `${name} — ${company}`,
              topic_requested: topic,
              status: "requested",
              requested_at: new Date().toISOString(),
              contact_email: email,
              contact_name: name,
              project_description: projectDescription,
            },
          },
        }),
      )
    }

    await Promise.allSettled(cioPromises)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Contact form error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
