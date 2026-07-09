import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { identifyCustomer, subscribeToNewsletter } from '@/lib/customerio'
import { getPostHogClient } from '@/lib/posthog-server'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

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
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
}
