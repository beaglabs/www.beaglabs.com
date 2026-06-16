import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const type = searchParams.get('type') // 'blog' | 'research'

  if (secret !== process.env.DRAFT_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }

  if (!slug || !type) {
    return new Response('Missing slug or type parameter', { status: 400 })
  }

  const draft = await draftMode()
  draft.enable()

  const basePath = type === 'research' ? '/research' : '/blog'
  redirect(`${basePath}/${slug}`)
}
