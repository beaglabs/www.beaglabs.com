import { renderOgRequest } from '@/lib/og-image'

export const runtime = 'edge'

export function GET(request: Request) {
  return renderOgRequest(request)
}
