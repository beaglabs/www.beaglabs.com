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

export async function GET() {
  try {
    await ensureTable()
    const result = await client.execute('SELECT * FROM channel_configs')
    const channels = result.rows.map((row) => ({
      name: row.id as string,
      status: row.status as string,
    }))
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Failed to list channels:', error)
    return NextResponse.json([])
  }
}
