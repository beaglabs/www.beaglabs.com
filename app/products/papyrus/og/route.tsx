import { HOME_OG, renderOgImage } from '@/lib/og-image'

// Satori image generation runs inside Cloudflare Workers.
// Do not use node:fs / process.cwd() to read fonts or images here:
// static public/ files are served as assets, not a runtime filesystem.
export const runtime = 'edge'

export async function GET() {
  return renderOgImage({
    title: HOME_OG.title,
    description: 'Papyrus: the agentic modernization factory. Document automation, internal apps and legacy modernization, customer-hosted.',
    label: 'PAPYRUS',
  })
}
