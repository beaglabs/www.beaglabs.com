import { defineTool, connectMcpServer } from '@flue/runtime'
import * as v from 'valibot'

const mcpConnections = new Map<string, { close: () => Promise<void>; tools: Array<{ name: string; description: string }> }>()

export const connectMcp = defineTool({
  name: 'connect_mcp_server',
  description: 'Connect to an MCP server and discover its tools.',
  input: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    url: v.pipe(v.string(), v.url()),
    headers: v.optional(v.record(v.string(), v.string())),
  }),
  output: v.object({
    connected: v.boolean(),
    toolCount: v.number(),
    tools: v.array(v.object({
      name: v.string(),
      description: v.string(),
    })),
  }),
  async run({ input }) {
    // Close existing connection if any
    const existing = mcpConnections.get(input.name)
    if (existing) {
      await existing.close()
    }

    try {
      const connection = await connectMcpServer({
        name: input.name,
        url: input.url,
        headers: input.headers,
      })

      mcpConnections.set(input.name, connection)

      return {
        connected: true,
        toolCount: connection.tools.length,
        tools: connection.tools.map((t) => ({
          name: t.name,
          description: t.description || '',
        })),
      }
    } catch (err) {
      return {
        connected: false,
        toolCount: 0,
        tools: [],
      }
    }
  },
})

export const disconnectMcp = defineTool({
  name: 'disconnect_mcp_server',
  description: 'Disconnect from an MCP server.',
  input: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
  }),
  output: v.object({
    disconnected: v.boolean(),
  }),
  async run({ input }) {
    const connection = mcpConnections.get(input.name)
    if (!connection) {
      return { disconnected: false }
    }

    await connection.close()
    mcpConnections.delete(input.name)
    return { disconnected: true }
  },
})

export const listMcpConnections = defineTool({
  name: 'list_mcp_connections',
  description: 'List all active MCP server connections.',
  input: v.object({}),
  output: v.array(v.object({
    name: v.string(),
    toolCount: v.number(),
  })),
  async run() {
    return Array.from(mcpConnections.entries()).map(([name, conn]) => ({
      name,
      toolCount: conn.tools.length,
    }))
  },
})

export function getMcpTools() {
  const tools: ReturnType<typeof defineTool>[] = []
  for (const [, conn] of mcpConnections) {
    // MCP tools are auto-prefixed by Flue
  }
  return tools
}
