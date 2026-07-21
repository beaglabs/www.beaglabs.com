import { REST } from '@discordjs/rest'
import { createDiscordChannel, type APIInteractionResponse } from '@flue/discord'
import { dispatch } from '@flue/runtime'
import { handleCommand } from '@/lib/discord/commands'
import assistant from '../agents/assistant'

const ASK_ALLOWED_USER_ID = '1387255717794152519'

let _channel: ReturnType<typeof createDiscordChannel> | null = null
let _client: REST | null = null

export function getClient() {
  if (!_client) {
    _client = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!)
  }
  return _client
}

export function getChannel() {
  if (!_channel) {
    _channel = createDiscordChannel({
      publicKey: process.env.DISCORD_PUBLIC_KEY!,

      async interactions({ interaction }): Promise<APIInteractionResponse> {
        // Handle slash commands
        if (interaction.type === 2) {
          const data = interaction.data as { name: string; options?: { name: string; value: string }[] }
          const name = data.name

          // /ask is handled by the Flue agent dispatch
          if (name === 'ask') {
            const userId = interaction.member?.user?.id
            if (userId !== ASK_ALLOWED_USER_ID) {
              return {
                type: 4,
                data: { content: 'You are not authorized to use this command.', flags: 64 },
              }
            }

            const option = data.options?.find((o) => o.name === 'prompt')
            const prompt = option?.value ?? ''

            if (!prompt) {
              return {
                type: 4,
                data: { content: 'Please provide a prompt.', flags: 64 },
              }
            }

            const guildId = interaction.guild_id
            const channelId = interaction.channel?.id

            if (!guildId || !channelId) {
              return {
                type: 4,
                data: { content: 'This command must be used in a server.', flags: 64 },
              }
            }

            const destination = {
              type: 'guild' as const,
              guildId,
              channelId,
            }

            await dispatch(assistant, {
              id: getChannel().conversationKey(destination),
              input: {
                type: 'discord.command.ask',
                interactionId: interaction.id,
                prompt,
                userId: interaction.member?.user?.id,
              },
            })

            return {
              type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
              data: { flags: 64 },
            }
          }

          // All other commands (ping, kick, ban, mute, unmute, purge, embed)
          return handleCommand(interaction as Record<string, unknown>) as APIInteractionResponse
        }

        return {
          type: 4,
          data: { content: 'Unsupported interaction.', flags: 64 },
        }
      },
    })
  }
  return _channel
}
