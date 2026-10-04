import { capabilityBySlug } from '@/data/capabilities'
import { renderOgImage } from '@/lib/og-image'

export const runtime = 'edge'
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

  return renderOgImage({
    title: capability?.title ?? 'Beag Labs Capability',
    description:
      capability?.metaDescription ??
      'Mission-ready AI systems for high-trust organizations.',
    label: capability?.eyebrow ?? 'Capability',
  })
}
