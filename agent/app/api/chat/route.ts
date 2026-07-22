import { NextResponse } from 'next/server'

const XIAOMI_API_URL = 'https://token-plan-sgp.xiaomimimo.com/v1'
const XIAOMI_API_KEY = 'tp-sd6o6xlkkajs050t5jf8ytiflnhnzvz4g4o6bir3ryg7iwr8'

// Tool definitions for the model
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_schedule',
      description: 'Create a new recurring schedule that runs a workflow or dispatches an agent on a cron pattern.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'A short name for the schedule (e.g. "daily-summary")' },
          type: { type: 'string', enum: ['workflow', 'dispatch'], description: 'Whether to invoke a workflow or dispatch an agent' },
          target: { type: 'string', description: 'The name of the workflow or agent to target' },
          cron: { type: 'string', description: 'Cron expression (min hour day month weekday), e.g. "0 9 * * 1-5" for weekdays at 9am' },
          timezone: { type: 'string', description: 'IANA timezone, e.g. "UTC", "America/New_York"', default: 'UTC' },
          input: { type: 'object', description: 'JSON input to pass to the workflow or agent', additionalProperties: true },
        },
        required: ['name', 'type', 'target', 'cron'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_schedules',
      description: 'List all existing schedules with their status and cron patterns.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'invoke_workflow',
      description: 'Immediately run a workflow by name with optional input data.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The workflow name to invoke' },
          input: { type: 'object', description: 'Optional JSON input for the workflow', additionalProperties: true },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_workflows',
      description: 'List all available workflows.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
]

// Execute a tool call against the Flue admin API
async function executeTool(name: string, args: Record<string, unknown>, baseUrl: string): Promise<string> {
  try {
    switch (name) {
      case 'create_schedule': {
        const res = await fetch(`${baseUrl}/api/flue/admin/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: args.name,
            type: args.type,
            target: args.target,
            cron: args.cron,
            timezone: args.timezone || 'UTC',
            enabled: true,
            input: args.input || {},
          }),
        })
        const data = await res.json()
        return JSON.stringify({ success: true, schedule: data })
      }

      case 'list_schedules': {
        const res = await fetch(`${baseUrl}/api/flue/admin/schedules`)
        const data = await res.json()
        return JSON.stringify({ schedules: data })
      }

      case 'invoke_workflow': {
        const res = await fetch(`${baseUrl}/api/flue/workflows/${args.name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args.input || {}),
        })
        const data = await res.json()
        return JSON.stringify({ success: true, result: data })
      }

      case 'list_workflows': {
        const res = await fetch(`${baseUrl}/api/flue/admin/workflows`)
        const data = await res.json()
        return JSON.stringify({ workflows: data })
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err) {
    return JSON.stringify({ error: `Tool execution failed: ${err instanceof Error ? err.message : 'Unknown error'}` })
  }
}

// Call the Xiaomi API (non-streaming) for tool call handling
async function callModel(messages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }>, model: string) {
  const response = await fetch(`${XIAOMI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XIAOMI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Xiaomi API error: ${error}`)
  }

  return response.json()
}

// Stream a final text-only response (no tools) to the client
async function streamTextResponse(
  messages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }>,
  model: string,
  controller: ReadableStreamDefaultController,
) {
  const response = await fetch(`${XIAOMI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XIAOMI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  })

  if (!response.ok) {
    controller.enqueue(`data: ${JSON.stringify({ error: 'Model API error' })}\n\n`)
    controller.close()
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    controller.close()
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            controller.enqueue('data: [DONE]\n\n')
            continue
          }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            const usage = parsed.usage
            if (content) {
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
            }
            if (usage) {
              controller.enqueue(
                `data: ${JSON.stringify({ tokens: { input: usage.prompt_tokens, output: usage.completion_tokens } })}\n\n`
              )
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('Streaming error:', err)
  }
}

const SYSTEM_PROMPT = `You are the Beag Labs Agent Portal assistant. You have direct access to the platform's backend through function calling tools. ALWAYS use your tools when the user asks about workflows or schedules — never say you can't do something that a tool can do.

YOUR AVAILABLE TOOLS:
• create_schedule — Creates a recurring schedule. Use when the user wants to automate something on a cron pattern, run a task periodically, or set up recurring execution.
• list_schedules — Lists all existing schedules. Use when the user asks what schedules exist or wants to check schedule status.
• invoke_workflow — Runs a workflow immediately. Use when the user wants to trigger, run, or execute a workflow right now.
• list_workflows — Lists all available workflows. Use when the user asks what workflows exist or what they can run.

RULES:
1. When the user asks to "create a schedule", "set up a recurring task", "automate X daily/weekly/hourly", or similar — call create_schedule immediately. Do not ask for permission.
2. When the user asks to "run a workflow", "invoke X", "execute Y", or similar — call invoke_workflow immediately.
3. When the user asks "what workflows do I have" or "list my schedules" — call list_workflows or list_schedules.
4. If you need information (like which workflow to target), call list_workflows first to discover what's available, then proceed.
5. Never say "I can't create schedules" or "I can't run workflows" — you have tools for exactly this.
6. Be concise. Use markdown formatting for responses.
7. If the user's request is ambiguous, make a reasonable assumption and proceed rather than asking clarifying questions.`

export async function POST(request: Request) {
  try {
    const { message, conversationId, model, history = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const modelName = model?.split('/')[1] || 'mimo-v2.5-pro'
    const baseUrl = new URL(request.url).origin

    const messages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message },
    ]

    // Tool call loop — handle up to 5 rounds of tool calls
    const MAX_TOOL_ROUNDS = 5
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const result = await callModel(messages, modelName)
      const choice = result.choices?.[0]
      if (!choice) break

      const assistantMessage = choice.message

      // If no tool calls, we're done — stream the final text response
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        if (assistantMessage.content) {
          const stream = new ReadableStream({
            async start(controller) {
              const content = assistantMessage.content!
              const chunkSize = 20
              for (let i = 0; i < content.length; i += chunkSize) {
                controller.enqueue(`data: ${JSON.stringify({ content: content.slice(i, i + chunkSize) })}\n\n`)
                await new Promise(r => setTimeout(r, 10))
              }
              if (result.usage) {
                controller.enqueue(
                  `data: ${JSON.stringify({ tokens: { input: result.usage.prompt_tokens, output: result.usage.completion_tokens } })}\n\n`
                )
              }
              controller.enqueue('data: [DONE]\n\n')
              controller.close()
            },
          })
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        }
        break
      }

      // Add assistant message with tool calls to history
      messages.push({
        role: 'assistant',
        content: assistantMessage.content || null,
        tool_calls: assistantMessage.tool_calls,
      })

      // Execute each tool call and add results
      for (const toolCall of assistantMessage.tool_calls) {
        const fn = toolCall.function
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(fn.arguments || '{}')
        } catch {}

        const toolResult = await executeTool(fn.name, args, baseUrl)

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        })
      }
    }

    // If we exhausted tool rounds, make a final streaming call without tools
    const stream = new ReadableStream({
      start: (controller) => {
        streamTextResponse(messages, modelName, controller).finally(() => controller.close())
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
