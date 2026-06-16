import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const secret =
    request.headers.get('x-hygraph-secret') ||
    new URL(request.url).searchParams.get('secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const model = body?.data?.__typename
  const slug = body?.data?.slug

  // Revalidate all listings
  revalidatePath('/blog', 'layout')
  revalidatePath('/research', 'layout')

  // Revalidate specific post if slug available
  if (slug) {
    if (model === 'BlogPost') {
      revalidatePath(`/blog/${slug}`)
    }
    if (model === 'ResearchPaper') {
      revalidatePath(`/research/${slug}`)
    }
  }

  return NextResponse.json({
    revalidated: true,
    model,
    slug,
    timestamp: Date.now(),
  })
}
