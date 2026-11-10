import { HOME_OG, renderOgImage } from '@/lib/og-image'

// Satori image generation runs inside Cloudflare Workers.
// Do not use node:fs / process.cwd() to read fonts or images here:
// static public/ files are served as assets, not a runtime filesystem.
export const runtime = 'edge'

export async function GET() {
  return renderOgImage({
    title: 'Papyrus Agentic ERP',
    description: 'Data-model-aware orchestration, enterprise Classes, durable agents and governed workflows over existing systems of record.',
    label: 'PAPYRUS',
  })
}
