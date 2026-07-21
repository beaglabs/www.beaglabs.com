import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/discord-oauth'

export async function GET() {
  return NextResponse.redirect(getAuthorizationUrl())
}
