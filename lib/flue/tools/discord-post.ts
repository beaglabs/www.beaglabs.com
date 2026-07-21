import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import type { REST } from '@discordjs/rest'
import type { DiscordDestinationRef } from '@flue/discord'

/**
 * Creates a tool that posts messages to a bound Discord channel.
 * The destination is captured at agent instantiation — the model
 * controls only the message content.
 */
export function postDiscordMessage(client: REST, ref: DiscordDestinationRef) {
  return defineTool({
    name: 'post_discord_message',
    description: 'Post a message to the Discord channel bound to this agent.',
    input: v.object({
      content: v.pipe(v.string(), v.minLength(1), v.maxLength(2000)),
    }),
    async run({ input }) {
      const result = (await client.post(`/channels/${ref.channelId}/messages`, {
        body: { content: input.content },
      })) as { id?: string }
      return { messageId: result.id ?? null }
    },
  })
}
