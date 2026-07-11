import { NextResponse } from 'next/server'
import { z } from 'zod'
import { identifyCustomer, sendCookbookEmail, trackCookbookDownloaded } from '@/lib/customerio'
import { getPostHogClient } from '@/lib/posthog-server'

const bodySchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      )
    }

    const { email } = parsed.data

    await Promise.all([
      identifyCustomer(email).catch((e) => console.error('identifyCustomer failed:', e)),
      sendCookbookEmail(email).catch((e) => console.error('sendCookbookEmail failed:', e)),
      trackCookbookDownloaded(email).catch((e) => console.error('trackCookbookDownloaded failed:', e)),
    ])

    getPostHogClient().capture({
      distinctId: email,
      event: 'cookbook_signup',
      properties: { source: 'beaglabs.com/cookbook' },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
