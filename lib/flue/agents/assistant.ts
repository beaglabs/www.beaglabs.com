import { defineAgent, defineTool } from '@flue/runtime'
import * as v from 'valibot'

// Example tool — reads a URL and returns its content
const fetchUrl = defineTool({
  name: 'fetch_url',
  description: 'Fetch content from a URL and return the text response.',
  input: v.object({
    url: v.pipe(v.string(), v.url()),
  }),
  async run({ input, signal }) {
    const res = await fetch(input.url, { signal })
    const text = await res.text()
    return { status: res.status, body: text.slice(0, 8000) }
  },
})

export default defineAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `You are the Beag Labs assistant. You help with internal operations,
research, email triage, and Discord server management. Be concise and action-oriented.
When you don't know something, say so clearly.`,
  tools: [fetchUrl],
}))
