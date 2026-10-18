import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { identifyCustomer, subscribeToNewsletter, sendComputeCreditEmail } from '@/lib/customerio'
import { getPostHogClient } from '@/lib/posthog-server'

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  offer: z.literal('papyrus-compute-credit').optional(),
})

export async function POST(req: NextRequest) {
  let input: z.infer<typeof schema>
  try { input = schema.parse(await req.json()) } catch {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  const { email, offer } = input
  try {
    if (offer) {
      const response = await fetch('https://papyrus.beaglabs.com/api/credits/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }), cache: 'no-store' })
      if (!response.ok) return NextResponse.json({ error: 'Could not prepare your compute credit. Please try again.' }, { status: 502 })
      const credit = await response.json() as { redeemed: boolean; code: string | null; redeemUrl: string }
      if (credit.redeemed) return NextResponse.json({ error: 'Your compute credit has already been redeemed. Sign in to Papyrus to manage it.' }, { status: 409 })
      if (!credit.code) return NextResponse.json({ error: 'Could not prepare your compute credit.' }, { status: 502 })
      try { await sendComputeCreditEmail(email, credit.code) } catch { return NextResponse.json({ error: 'Could not send the credit email. Please try again.' }, { status: 502 }) }
      return NextResponse.json({ ok: true })
    }

    const ph = getPostHogClient()

    await Promise.allSettled([
      identifyCustomer(email, 'beaglabs.com/newsletter'),
      subscribeToNewsletter(email),
      ph.capture({
        distinctId: email,
        event: 'newsletter_signup',
        properties: { source: 'beaglabs.com/newsletter' },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'The email service is unavailable. Please try again.' }, { status: 502 })
  }
}
