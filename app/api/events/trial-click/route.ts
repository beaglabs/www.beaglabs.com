import { NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

const destination = process.env.TRIAL_NOTIFICATIONS_EMAIL
const from = process.env.TRIAL_NOTIFICATIONS_FROM || "Beag Labs Marketplace <sales@mail.beaglabs.com>"
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beaglabs.com"
const permittedOrigins = new Set(["https://www.beaglabs.com", "https://beaglabs.com", origin])

/** Opportunistic in-process suppression; configure an edge WAF rate limit in production. */
const recent = new Map<string, number>()
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 1024) return new Response(null, { status: 413 })
  const requestOrigin = request.headers.get("origin")
  if (!requestOrigin || !permittedOrigins.has(requestOrigin)) return new Response(null, { status: 403 })
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite && fetchSite !== "same-origin") return new Response(null, { status: 403 })
  const data: unknown = await request.json().catch(() => null)
  if (!data || typeof data !== "object" || Array.isArray(data)) return new Response(null, { status: 400 })
  const input = data as Record<string, unknown>
  if (input.event !== "trial.cta.clicked" || !["hero", "final"].includes(String(input.placement)))
    return new Response(null, { status: 400 })
  // Never accept identity or routing fields supplied by anonymous browsers.
  if (!process.env.RESEND_API_KEY || !destination) return new Response(null, { status: 204 })
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"
  const key = ip + "|" + input.placement
  const time = Date.now()
  if (recent.size > 1500) for (const [k,at] of recent) if (time-at > 3600000) recent.delete(k)
  if (time - (recent.get(key) || 0) < 3600000) return new Response(null, { status: 204 })
  recent.set(key,time)
  const res = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from,
    to: [destination],
    subject: "Papyrus — homepage trial CTA clicked",
    text: `Someone clicked Start a one-month trial.\nPlacement: ${input.placement}\nTime: ${new Date().toISOString()}\nDestination: /provision/commercial\nThis is an anonymous click, not a confirmed Azure trial.`,
  })
  if (res.error) {
    recent.delete(key)
    console.error("Trial CTA notification delivery failed", res.error.message)
    return new Response(null, { status: 503 })
  }
  return new NextResponse(null, { status: 204 })
}
