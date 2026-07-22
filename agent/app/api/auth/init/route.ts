import { NextResponse } from 'next/server'
import { initAuthDb } from '@/lib/db'

export async function POST() {
  try {
    await initAuthDb()
    return NextResponse.json({ success: true, message: 'Auth database initialized' })
  } catch (error) {
    console.error('Init auth db error:', error)
    return NextResponse.json({ error: 'Failed to initialize auth database' }, { status: 500 })
  }
}
