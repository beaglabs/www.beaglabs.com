import { NextResponse } from 'next/server'
import { client } from '@/lib/db'

async function ensureTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS channel_configs (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      status TEXT DEFAULT 'connected',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

// Validate Resend API key by making a test API call
async function validateResend(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { valid: true }
    const body = await res.text()
    return { valid: false, error: `API returned ${res.status}: ${body}` }
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown'}` }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await request.json()

    // Validate based on channel type
    if (id === 'resend') {
      if (!config.apiKey) {
        return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
      }
      const validation = await validateResend(config.apiKey)
      if (!validation.valid) {
        return NextResponse.json({ error: `Invalid Resend API key: ${validation.error}` }, { status: 400 })
      }
    }

    await ensureTable()
    await client.execute({
      sql: `INSERT INTO channel_configs (id, config, status, updated_at)
            VALUES (?, ?, 'connected', datetime('now'))
            ON CONFLICT(id) DO UPDATE SET config = ?, status = 'connected', updated_at = datetime('now')`,
      args: [id, JSON.stringify(config), JSON.stringify(config)],
    })

    return NextResponse.json({ name: id, status: 'connected' })
  } catch (error) {
    console.error('Failed to connect channel:', error)
    return NextResponse.json({ error: 'Failed to connect channel' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await ensureTable()
    await client.execute({
      sql: 'DELETE FROM channel_configs WHERE id = ?',
      args: [id],
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect channel:', error)
    return NextResponse.json({ error: 'Failed to disconnect channel' }, { status: 500 })
  }
}
