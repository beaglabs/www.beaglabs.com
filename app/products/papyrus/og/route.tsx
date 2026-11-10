import { HOME_OG, renderOgImage } from '@/lib/og-image'

// Satori image generation runs inside Cloudflare Workers.
// Do not use node:fs / process.cwd() to read fonts or images here:
// static public/ files are served as assets, not a runtime filesystem.
export const runtime = 'edge'

export async function GET() {
  return renderOgImage({
    title: 'Keep your ERP. Automate what happens between systems.',
    description: 'Papyrus is the data-model-aware orchestration layer for complex, multi-entity workflows with heavy legacy dependencies.',
    label: 'Papyrus',
  })
}
