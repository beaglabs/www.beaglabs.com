import { renderOgImage } from '@/lib/og-image'

// Satori image generation runs inside Cloudflare Workers.
// Do not use node:fs / process.cwd() to read fonts or images here:
// static public/ files are served as assets, not a runtime filesystem.
export const runtime = 'edge'

export async function GET() {
  return renderOgImage({
    title: 'Backoffice superintelligence harness.',
    before: 'Backoffice',
    slab: 'superintelligence',
    after: 'harness.',
    description: 'Automate complex back-office operations across existing systems of record with data models, durable agents, approvals and governed workflows.',
    label: 'Papyrus by Beag Labs',
  })
}
