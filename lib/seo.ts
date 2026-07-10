export const BASE_URL = 'https://www.beaglabs.com'

export function canonical(path: string) {
  return {
    alternates: {
      canonical: `${BASE_URL}${path}`,
    },
  }
}

export function ogImageUrl(params: {
  title: string
  description?: string
  label?: string
}) {
  const searchParams = new URLSearchParams()
  searchParams.set('title', params.title)
  if (params.description) searchParams.set('description', params.description)
  if (params.label) searchParams.set('label', params.label)
  return `${BASE_URL}/api/og?${searchParams.toString()}`
}

export function pageMetadata(opts: {
  title: string
  description: string
  path: string
  label?: string
  ogTitle?: string
  ogDescription?: string
  type?: 'website' | 'article'
  publishedTime?: string
  images?: Array<{ url: string; width?: number; height?: number; alt?: string }>
}) {
  const ogTitle = opts.ogTitle || `${opts.title} — Beag Labs`
  const ogDescription = opts.ogDescription || opts.description
  const ogImage = opts.images?.length
    ? opts.images
    : [
        {
          url: ogImageUrl({
            title: opts.title,
            description: ogDescription,
            label: opts.label,
          }),
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ]

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: `${BASE_URL}${opts.path}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${BASE_URL}${opts.path}`,
      siteName: 'Beag Labs',
      locale: 'en_US',
      type: (opts.type || 'website') as 'website' | 'article',
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: ogTitle,
      description: ogDescription,
      images: ogImage.map((img) => img.url),
    },
  }
}
