import { NextResponse } from 'next/server'
import { deleteMcpServer } from '@/lib/mcp-db'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    await deleteMcpServer(name)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete MCP server:', error)
    return NextResponse.json({ error: 'Failed to delete MCP server' }, { status: 500 })
  }
}
