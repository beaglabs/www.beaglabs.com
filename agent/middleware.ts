import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')
const COOKIE_NAME = 'agent-session'

// Public paths that don't require authentication
const publicPaths = ['/api/auth']

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public API paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  // If on login page
  if (pathname === '/login') {
    if (token) {
      try {
        // Verify the token - if valid, redirect to portal
        await jwtVerify(token, SECRET)
        return NextResponse.redirect(new URL('/', request.url))
      } catch {
        // Invalid token - clear it and show login
        const response = NextResponse.next()
        response.cookies.delete(COOKIE_NAME)
        return response
      }
    }
    // No token - show login page
    return NextResponse.next()
  }

  // For all other paths, require authentication
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify the JWT
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    // Invalid token - redirect to login
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
