import { renderOgRequest } from '@/lib/og-image'

// Backward-compatible endpoint for already-cached social metadata. New pages
// point at /og so preview crawlers do not hit the site's /api robots exclusion.
export const runtime = 'edge'

export function GET(request: Request) {
  return renderOgRequest(request)
}
