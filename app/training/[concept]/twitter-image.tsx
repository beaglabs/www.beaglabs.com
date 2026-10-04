import { trainingConcepts } from '@/data/training/concepts'
import { renderOgImage } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'Beag Labs training technique'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ concept: string }>
}) {
  const { concept } = await params
  const item = trainingConcepts.find((entry) => entry.slug === concept)

  return renderOgImage({
    title: item?.title ?? 'Training Techniques',
    description:
      item?.description.slice(0, 220) ??
      'Modern training techniques for production AI systems.',
    label: item?.part ?? 'Training',
  })
}
