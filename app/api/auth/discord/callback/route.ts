import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCode,
  fetchUser,
  isAuthorized,
  encryptSession,
} from '@/lib/discord-oauth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/portal?error=missing_code', req.url))
  }

  try {
    const tokenData = await exchangeCode(code)
    const user = await fetchUser(tokenData.access_token)

    if (!isAuthorized(user.id)) {
      return NextResponse.redirect(new URL('/portal?error=unauthorized', req.url))
    }

    const session = encryptSession({
      userId: user.id,
      username: user.username,
      globalName: user.global_name,
      avatar: user.avatar,
      iat: Math.floor(Date.now() / 1000),
    })

    const response = NextResponse.redirect(new URL('/portal', req.url))
    response.cookies.set('discord-session', session, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (err) {
    console.error('Discord OAuth callback error:', err)
    return NextResponse.redirect(new URL('/portal?error=oauth_failed', req.url))
  }
}
