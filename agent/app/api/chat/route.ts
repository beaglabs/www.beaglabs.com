import { NextResponse } from 'next/server'

const XIAOMI_API_URL = 'https://token-plan-sgp.xiaomimimo.com/v1'
const XIAOMI_API_KEY = 'tp-sd6o6xlkkajs050t5jf8ytiflnhnzvz4g4o6bir3ryg7iwr8'

export async function POST(request: Request) {
  try {
    const { message, conversationId, model, history = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build messages array with history
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Be concise and accurate in your responses.',
      },
      ...history,
      { role: 'user', content: message },
    ]

    // Extract model name from the model specifier (e.g., "xiaomi/mimo-v2.5-pro" -> "mimo-v2.5-pro")
    const modelName = model?.split('/')[1] || 'mimo-v2.5-pro'

    // Create streaming response from Xiaomi API
    const response = await fetch(`${XIAOMI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XIAOMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Xiaomi API error:', error)
      return NextResponse.json({ error: 'Failed to get response from model' }, { status: 500 })
    }

    // Create a ReadableStream to forward the streaming response
    const stream = new ReadableStream({
      async start(controller) {
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
                    controller.enqueue(
                      `data: ${JSON.stringify({ content })}\n\n`
                    )
                  }

                  if (usage) {
                    controller.enqueue(
                      `data: ${JSON.stringify({
                        tokens: {
                          input: usage.prompt_tokens,
                          output: usage.completion_tokens,
                        },
                      })}\n\n`
                    )
                  }
                } catch {}
              }
            }
          }
        } catch (err) {
          console.error('Streaming error:', err)
        } finally {
          controller.close()
        }
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
