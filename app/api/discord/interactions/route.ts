import { verifyDiscordSignature } from '@/lib/discord/verify'
import { handleCommand } from '@/lib/discord/commands'

// Discord sends interactions as POST. We must respond within 3 seconds.
export async function POST(request: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!publicKey) {
    return new Response('Server misconfigured', { status: 500 })
  }

  // ── Verify signature ───────────────────────────────────────────────────
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')
  const body = await request.text()

  if (!signature || !timestamp) {
    return new Response('Missing signature headers', { status: 401 })
  }

  if (!verifyDiscordSignature(body, signature, timestamp, publicKey)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // ── Parse interaction ──────────────────────────────────────────────────
  const interaction = JSON.parse(body)

  // Discord PING — respond with PONG
  if (interaction.type === 1) {
    return Response.json({ type: 1 })
  }

  // Application command (slash command)
  if (interaction.type === 2) {
    const response = await handleCommand(interaction)
    return Response.json(response)
  }

  return Response.json({ type: 4, data: { content: 'Unhandled interaction type.' } })
}
