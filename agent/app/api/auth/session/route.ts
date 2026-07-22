import { NextResponse } from 'next/server'
import { getSession, deleteSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ user: null })
    }
    return NextResponse.json({ user: session })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE() {
  try {
    await deleteSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
