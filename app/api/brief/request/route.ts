import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestSolutionBrief } from '@/lib/customerio'

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  briefType: z.enum(['papyrus', 'services']),
  marketingOptIn: z.boolean(),
  ccOptIn: z.boolean().default(false),
  page: z.string().max(200).default('/'),
})

export async function POST(req: NextRequest) {
  let input: z.infer<typeof schema>
  try { input = schema.parse(await req.json()) } catch {
    return NextResponse.json({ error: 'Enter a valid work email.' }, { status: 400 })
  }
  try {
    await requestSolutionBrief(input.email, input)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('requestSolutionBrief failed:', err)
    return NextResponse.json({ error: 'The email service is unavailable. Please try again.' }, { status: 502 })
  }
}
