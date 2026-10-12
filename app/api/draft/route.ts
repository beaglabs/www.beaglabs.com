import { isBackofficePost } from '@/lib/blog/backoffice-content'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const type = searchParams.get('type')

  if (secret !== process.env.DRAFT_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }

  if (!slug || !type) {
    return new Response('Missing slug or type parameter', { status: 400 })
  }

  if (type !== 'blog' || !isBackofficePost(slug)) {
    return new Response('Content is not published on this site', { status: 404 })
  }

  const draft = await draftMode()
  draft.enable()

  const basePath = '/blog'
  redirect(`${basePath}/${slug}`)
}
