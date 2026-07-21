import { REST } from '@discordjs/rest'
import { createDiscordChannel, type APIInteractionResponse } from '@flue/discord'
import { dispatch } from '@flue/runtime'
import assistant from '../agents/assistant'

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

          if (name === 'ask') {
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

          return {
            type: 4,
            data: { content: 'Unknown command.', flags: 64 },
          }
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
