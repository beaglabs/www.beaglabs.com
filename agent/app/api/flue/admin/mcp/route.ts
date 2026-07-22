import { NextResponse } from 'next/server'
import { getMcpServers, saveMcpServer, updateMcpServerStatus } from '@/lib/mcp-db'
import {
  discoverOAuthServerInfo,
} from '@modelcontextprotocol/sdk/client/auth'

export async function GET() {
  try {
    const servers = await getMcpServers()
    // Return servers with tools placeholder (tools are discovered on test/connect)
    const result = servers.map((s) => ({
      name: s.name,
      url: s.url,
      status: s.status,
      tools: [], // Tools populated when connection is tested
      oauth: s.oauth,
      lastHealthCheck: null,
    }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list MCP servers:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const { name, url } = await request.json()

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    // Start discovery in the background — fetch Protected Resource Metadata
    // and Authorization Server Metadata per the MCP spec
    let serverInfo
    try {
      serverInfo = await discoverOAuthServerInfo(url)
    } catch (err) {
      console.warn(`OAuth discovery failed for ${url}:`, err)
      // Still save the server, just without discovered metadata
    }

    await saveMcpServer({
      name: name.trim(),
      url: url.trim(),
      status: serverInfo?.authorizationServerMetadata ? 'discovered' : 'no-auth',
      authorizationServerUrl: serverInfo?.authorizationServerUrl,
      asMetadata: serverInfo?.authorizationServerMetadata,
      resourceMetadata: serverInfo?.resourceMetadata,
      scopesSupported: serverInfo?.resourceMetadata?.scopes_supported,
    })

    const servers = await getMcpServers()
    const saved = servers.find((s) => s.name === name.trim())

    return NextResponse.json({
      name: saved?.name || name.trim(),
      url: saved?.url || url.trim(),
      status: saved?.status || 'no-auth',
      tools: [],
      oauth: saved?.oauth,
      lastHealthCheck: null,
    })
  } catch (error) {
    console.error('Failed to add MCP server:', error)
    return NextResponse.json({ error: 'Failed to add MCP server' }, { status: 500 })
  }
}
