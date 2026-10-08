import { renderOgImage } from '@/lib/og-image'

// Satori image generation runs inside Cloudflare Workers.
// Do not use node:fs / process.cwd() to read fonts or images here:
// static public/ files are served as assets, not a runtime filesystem.
export const runtime = 'edge'

export async function GET() {
  return renderOgImage({
    title: 'The Agentic Modernization Factory',
    description: 'Document automation. Internal apps. Legacy modernization. Customer-hosted and governed by design.',
    label: 'PAPYRUS',
  })
}
