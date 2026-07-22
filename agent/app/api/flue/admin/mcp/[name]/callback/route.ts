import { NextResponse } from 'next/server'
import { getMcpServer, saveMcpCredentials, updateMcpServerStatus } from '@/lib/mcp-db'
import {
  exchangeAuthorization,
} from '@modelcontextprotocol/sdk/client/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    const server = await getMcpServer(name)
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (!server.credentials?.clientId) {
      return NextResponse.json({ error: 'No client credentials. Start the OAuth flow first.' }, { status: 400 })
    }

    if (!server.credentials?.pkceCodeVerifier) {
      return NextResponse.json({ error: 'No PKCE code verifier found. Start the OAuth flow again.' }, { status: 400 })
    }

    if (!server.authorizationServerUrl || !server.asMetadata) {
      return NextResponse.json({ error: 'Authorization server metadata not found.' }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const redirectUri = `${origin}/api/flue/admin/mcp/oauth/callback`

    const clientInfo = {
      client_id: server.credentials.clientId,
      client_secret: server.credentials.clientSecret || undefined,
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeAuthorization(server.authorizationServerUrl, {
      metadata: server.asMetadata,
      clientInformation: clientInfo,
      authorizationCode: code,
      codeVerifier: server.credentials.pkceCodeVerifier,
      redirectUri,
      resource: new URL(server.url),
    })

    // Calculate token expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    // Save tokens
    await saveMcpCredentials(name, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: expiresAt,
      scopes: tokens.scope?.split(' ') || server.scopesSupported,
      pkceCodeVerifier: null, // Clear PKCE verifier after use
    })

    await updateMcpServerStatus(name, 'connected')

    return NextResponse.json({
      success: true,
      status: 'connected',
      scopes: tokens.scope?.split(' ') || [],
      expiresAt,
    })
  } catch (error) {
    console.error('Failed to exchange authorization code:', error)
    return NextResponse.json({ error: 'Failed to complete authorization' }, { status: 500 })
  }
}
