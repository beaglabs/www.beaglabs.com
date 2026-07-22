import { NextResponse } from 'next/server'
import { getMcpServer, updateMcpServerStatus } from '@/lib/mcp-db'
import { Client } from '@modelcontextprotocol/sdk/client'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const server = await getMcpServer(name)
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    const accessToken = server.credentials?.accessToken
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    // Try connecting with StreamableHTTP first, fall back to SSE
    let client: Client | null = null
    let transport: StreamableHTTPClientTransport | SSEClientTransport | null = null

    try {
      client = new Client({ name: 'beaglabs-agent-portal', version: '1.0.0' })
      transport = new StreamableHTTPClientTransport(new URL(server.url), {
        requestInit: { headers },
      })
      await client.connect(transport)
    } catch {
      // Fall back to SSE transport
      if (transport) {
        try { await transport.close() } catch {}
      }
      client = new Client({ name: 'beaglabs-agent-portal', version: '1.0.0' })
      transport = new SSEClientTransport(new URL(server.url), {
        requestInit: { headers },
      })
      await client.connect(transport)
    }

    // List tools
    const toolsResult = await client.listTools()
    const tools = toolsResult.tools.map((t) => ({
      name: t.name,
      description: t.description || '',
      inputSchema: t.inputSchema,
    }))

    // Clean up
    await client.close()

    await updateMcpServerStatus(name, 'connected')

    return NextResponse.json({
      status: 'ok',
      tools,
    })
  } catch (error) {
    console.error('MCP connection test failed:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Connection failed',
      tools: [],
    })
  }
}
