import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Gate /portal/* with Discord OAuth session
  if (pathname.startsWith('/portal')) {
    const sessionCookie = request.cookies.get('discord-session')

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/api/auth/discord', request.url))
    }

    // Cookie exists — let the request through.
    // Full session validation happens server-side in the portal layout.
    // This avoids decrypting on every navigation (Edge crypto can be flaky)
    // and prevents the "re-auth on every page load" loop.
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*'],
}
