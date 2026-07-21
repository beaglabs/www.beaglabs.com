import { NextRequest, NextResponse } from 'next/server'
import { decryptSession } from '@/lib/discord-session-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Gate /portal/* with Discord OAuth session
  if (pathname.startsWith('/portal')) {
    const sessionCookie = request.cookies.get('discord-session')

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/api/auth/discord', request.url))
    }

    const session = await decryptSession(sessionCookie.value)
    if (!session) {
      // Invalid or expired session — clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/api/auth/discord', request.url))
      response.cookies.delete('discord-session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*'],
}
