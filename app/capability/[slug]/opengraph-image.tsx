import { GET as renderOgImage } from '@/app/api/og/route'
import { capabilityBySlug } from '@/data/capabilities'
import { ogImageUrl } from '@/lib/seo'

export const runtime = 'nodejs'
export const alt = 'Beag Labs capability'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const capability = capabilityBySlug(slug)

  const url = ogImageUrl({
    title: capability?.title ?? 'Beag Labs Capability',
    description:
      capability?.metaDescription ??
      'Mission-ready AI systems for high-trust organizations.',
    label: capability?.eyebrow ?? 'Capability',
  })

  return renderOgImage(new Request(url))
}
