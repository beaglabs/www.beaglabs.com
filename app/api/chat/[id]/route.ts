import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const opencode = createOpenAICompatible({
  baseURL: process.env.OPENCODE_BASE_URL ?? 'https://opencode.ai/zen/v1',
  name: 'opencode-go',
  apiKey: process.env.OPENCODE_API_KEY,
})

const SYSTEM_PROMPT = `You are the Beag Labs AI concierge. Beag Labs builds Papyrus, customer-hosted software for back office automation and agentic modernization.

Help visitors identify a repetitive administrative workflow and explain how Papyrus could support it. Core areas are document intake and extraction, governed internal applications, legacy API and interface modernization, and human-reviewed operational workflows. Examples include assembling audit evidence, routing internal requests, and reviewing document classifications.

Ask about inputs, systems of record, exceptions, approvals, and deployment requirements. Describe examples as potential workflows, not completed customer deployments. Consequential actions need appropriate human review and validation.

Do not claim Beag Labs offers standalone model training, quantization, or SLM consulting. Never invent pricing, timelines, ROI, performance numbers, customer names, certifications, or supported integrations. Customer-hosted operation does not by itself establish compliance or authorization. Point visitors to /products/papyrus or /contact when useful. Keep answers brief and concrete; ask one clarifying question when needed.`

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: opencode.chatModel(process.env.OPENCODE_MODEL ?? 'minimax-m3'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
