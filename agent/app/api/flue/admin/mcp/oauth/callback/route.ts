import { NextResponse } from 'next/server'

/**
 * OAuth callback handler — receives the authorization code from the browser redirect,
 * exchanges it for tokens via the MCP callback API, then redirects back to /mcp.
 *
 * URL format: /api/flue/admin/mcp/oauth/callback?code=xxx&state=serverName:uuid
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const origin = url.origin

  if (error) {
    // Authorization server returned an error
    return NextResponse.redirect(
      new URL(`/mcp?error=${encodeURIComponent(error)}`, origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/mcp?error=Missing+authorization+code+or+state', origin)
    )
  }

  // Extract server name from state (format: "serverName:uuid")
  const serverName = state.split(':')[0]
  if (!serverName) {
    return NextResponse.redirect(
      new URL('/mcp?error=Invalid+state+parameter', origin)
    )
  }

  try {
    // Exchange the code for tokens
    const res = await fetch(`${origin}/api/flue/admin/mcp/${encodeURIComponent(serverName)}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Token exchange failed:', errBody)
      return NextResponse.redirect(
        new URL(`/mcp?error=${encodeURIComponent('Token exchange failed')}`, origin)
      )
    }

    // Success — redirect back to MCP page
    return NextResponse.redirect(
      new URL(`/mcp?connected=${encodeURIComponent(serverName)}`, origin)
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL(`/mcp?error=${encodeURIComponent('Authorization failed')}`, origin)
    )
  }
}
