/**
 * Discord slash command handlers.
 * Each handler receives the interaction data and returns a response payload.
 */

const DISCORD_API = 'https://discord.com/api/v10'

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function defaultReason(reason?: string): string {
  return reason || 'No reason provided.'
}

function parseHexColor(input: string): number {
  const normalized = input.trim().replace(/^#/, '')
  const value = parseInt(normalized, 16)
  if (isNaN(value)) throw new Error('Color must be a valid hex value like 5865F2')
  return value
}

// ─── Permission / role check ───────────────────────────────────────────────

const MODERATOR_ROLE_ID =
  process.env.DISCORD_MODERATOR_ROLE_ID || '1394049709890343118'

function hasModeratorRole(member: { roles: string[] }): boolean {
  return member.roles.includes(MODERATOR_ROLE_ID)
}

// ─── Interaction response helpers ──────────────────────────────────────────

export type InteractionResponse = {
  type: number
  data?: Record<string, unknown>
}

function messageResponse(content: string, flags?: number): InteractionResponse {
  return {
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: { content, ...(flags ? { flags } : {}) },
  }
}

function deferredMessage(): InteractionResponse {
  return { type: 5 } // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
}

function embedResponse(embed: Record<string, unknown>, content?: string): InteractionResponse {
  return {
    type: 4,
    data: {
      ...(content ? { content } : {}),
      embeds: [embed],
    },
  }
}

// ─── Command handlers ─────────────────────────────────────────────────────

async function handlePing(): Promise<InteractionResponse> {
  return messageResponse('pong')
}

async function handleKick(
  guildId: string,
  userId: string,
  reason?: string
): Promise<InteractionResponse> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
    {
      method: 'DELETE',
      headers: botHeaders(),
      body: JSON.stringify({ reason: defaultReason(reason) }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    return messageResponse(`Failed to kick: ${text}`)
  }
  return messageResponse(`Kicked <@${userId}>. Reason: ${defaultReason(reason)}`)
}

async function handleBan(
  guildId: string,
  userId: string,
  reason?: string
): Promise<InteractionResponse> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/bans/${userId}`,
    {
      method: 'PUT',
      headers: botHeaders(),
      body: JSON.stringify({
        delete_message_days: 0,
        reason: defaultReason(reason),
      }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    return messageResponse(`Failed to ban: ${text}`)
  }
  return messageResponse(`Banned <@${userId}>. Reason: ${defaultReason(reason)}`)
}

async function handleMute(
  guildId: string,
  userId: string,
  minutes: number,
  reason?: string
): Promise<InteractionResponse> {
  const until = new Date(Date.now() + minutes * 60_000).toISOString()
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
    {
      method: 'PATCH',
      headers: botHeaders(),
      body: JSON.stringify({
        communication_disabled_until: until,
        reason: defaultReason(reason),
      }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    return messageResponse(`Failed to mute: ${text}`)
  }
  return messageResponse(
    `Muted <@${userId}> for ${minutes} minute(s). Reason: ${defaultReason(reason)}`
  )
}

async function handleUnmute(
  guildId: string,
  userId: string
): Promise<InteractionResponse> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
    {
      method: 'PATCH',
      headers: botHeaders(),
      body: JSON.stringify({ communication_disabled_until: null }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    return messageResponse(`Failed to unmute: ${text}`)
  }
  return messageResponse(`Unmuted <@${userId}>.`)
}

async function handlePurge(
  channelId: string,
  count: number
): Promise<InteractionResponse> {
  // Fetch messages to delete
  const msgRes = await fetch(
    `${DISCORD_API}/channels/${channelId}/messages?limit=${count}`,
    { headers: botHeaders() }
  )
  if (!msgRes.ok) {
    return messageResponse('Failed to fetch messages.')
  }
  const messages: { id: string }[] = await msgRes.json()
  if (messages.length === 0) {
    return messageResponse('No messages found to delete.')
  }

  const ids = messages.map((m) => m.id)

  // Bulk delete (requires at least 2 messages; single delete for 1)
  if (ids.length === 1) {
    await fetch(`${DISCORD_API}/channels/${channelId}/messages/${ids[0]}`, {
      method: 'DELETE',
      headers: botHeaders(),
    })
  } else {
    await fetch(`${DISCORD_API}/channels/${channelId}/messages/bulk-delete`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({ messages: ids }),
    })
  }

  return messageResponse(`Deleted ${ids.length} message(s).`)
}

async function handleEmbed(
  channelId: string,
  title: string,
  description: string,
  color?: string
): Promise<InteractionResponse> {
  const embedColor = color ? parseHexColor(color) : 0x5865f2

  await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify({
      embeds: [{ title, description, color: embedColor }],
    }),
  })

  return messageResponse('Embed posted.')
}

// ─── Router ────────────────────────────────────────────────────────────────

export async function handleCommand(interaction: Record<string, unknown>): Promise<InteractionResponse> {
  const data = interaction.data as { name: string; options?: { name: string; value: string | number }[] }
  const guildId = interaction.guild_id as string
  const channelId = interaction.channel_id as string
  const member = interaction.member as { roles: string[]; user: { id: string } }
  const userId = member.user.id

  const getOption = (name: string): string | number | undefined =>
    data.options?.find((o) => o.name === name)?.value

  switch (data.name) {
    case 'ping':
      return handlePing()

    case 'kick': {
      if (!hasModeratorRole(member))
        return messageResponse('You need the moderator role.', 64)
      const targetId = getOption('member') as string
      const reason = getOption('reason') as string | undefined
      return handleKick(guildId, targetId, reason)
    }

    case 'ban': {
      if (!hasModeratorRole(member))
        return messageResponse('You need the moderator role.', 64)
      const targetId = getOption('member') as string
      const reason = getOption('reason') as string | undefined
      return handleBan(guildId, targetId, reason)
    }

    case 'mute': {
      if (!hasModeratorRole(member))
        return messageResponse('You need the moderator role.', 64)
      const targetId = getOption('member') as string
      const minutes = getOption('minutes') as number
      const reason = getOption('reason') as string | undefined
      return handleMute(guildId, targetId, minutes, reason)
    }

    case 'unmute': {
      if (!hasModeratorRole(member))
        return messageResponse('You need the moderator role.', 64)
      const targetId = getOption('member') as string
      return handleUnmute(guildId, targetId)
    }

    case 'purge': {
      if (!hasModeratorRole(member))
        return messageResponse('You need the moderator role.', 64)
      const count = getOption('count') as number
      return handlePurge(channelId, count)
    }

    case 'embed': {
      if (!hasModeratorRole(member))
        return messageResponse('You need the moderator role.', 64)
      const title = getOption('title') as string
      const description = getOption('description') as string
      const color = getOption('color') as string | undefined
      return handleEmbed(channelId, title, description, color)
    }

    default:
      return messageResponse('Unknown command.')
  }
}
