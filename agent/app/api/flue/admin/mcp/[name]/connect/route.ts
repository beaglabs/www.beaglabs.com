import { NextResponse } from 'next/server'
import { getMcpServer, saveMcpServer, saveMcpCredentials, updateMcpServerStatus } from '@/lib/mcp-db'
import {
  discoverOAuthServerInfo,
  registerClient,
  startAuthorization,
} from '@modelcontextprotocol/sdk/client/auth'

const REDIRECT_URI = (origin: string) => `${origin}/api/flue/admin/mcp/oauth/callback`

const CLIENT_METADATA = {
  client_name: 'Beag Labs Agent Portal',
  redirect_uris: [], // Set dynamically
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  token_endpoint_auth_method: 'none', // Public client
  scope: '',
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const origin = new URL(request.url).origin

    let server = await getMcpServer(name)
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Re-discover if we don't have AS metadata yet
    let asMetadata = server.asMetadata
    let authorizationServerUrl = server.authorizationServerUrl
    let resourceMetadata = server.resourceMetadata
    let scopesSupported = server.scopesSupported

    if (!asMetadata) {
      try {
        const info = await discoverOAuthServerInfo(server.url)
        asMetadata = info.authorizationServerMetadata || null
        authorizationServerUrl = info.authorizationServerUrl
        resourceMetadata = info.resourceMetadata || null
        scopesSupported = info.resourceMetadata?.scopes_supported || []

        await saveMcpServer({
          name,
          url: server.url,
          status: asMetadata ? 'discovered' : 'no-auth',
          authorizationServerUrl,
          asMetadata: asMetadata || undefined,
          resourceMetadata: resourceMetadata || undefined,
          scopesSupported,
        })
      } catch (err) {
        console.error('Discovery failed:', err)
        return NextResponse.json({
          error: 'Could not discover authorization server. This MCP server may not require authentication.',
        }, { status: 400 })
      }
    }

    if (!authorizationServerUrl || !asMetadata) {
      return NextResponse.json({
        error: 'No authorization server found. This MCP server may not require authentication.',
      }, { status: 400 })
    }

    // Check if we already have client credentials
    let clientId = server.credentials?.clientId
    let clientSecret = server.credentials?.clientSecret

    // If no client credentials, try Dynamic Client Registration
    if (!clientId && asMetadata.registration_endpoint) {
      try {
        const redirectUri = REDIRECT_URI(origin)
        const metadata = {
          ...CLIENT_METADATA,
          redirect_uris: [redirectUri],
          scope: scopesSupported?.join(' ') || '',
        }

        const registration = await registerClient(authorizationServerUrl, {
          metadata: asMetadata,
          clientMetadata: metadata,
          scope: scopesSupported?.join(' '),
        })

        clientId = registration.client_id
        clientSecret = registration.client_secret || undefined

        await saveMcpCredentials(name, {
          clientId,
          clientSecret,
          registrationEndpoint: asMetadata.registration_endpoint,
        })
      } catch (err) {
        console.error('Dynamic Client Registration failed:', err)
        return NextResponse.json({
          error: 'Dynamic Client Registration failed. You may need to register this client manually.',
          needsManualRegistration: true,
          authorizationServerUrl,
          registrationEndpoint: asMetadata.registration_endpoint,
        }, { status: 400 })
      }
    }

    if (!clientId) {
      return NextResponse.json({
        error: 'No client credentials available and the authorization server does not support Dynamic Client Registration.',
        needsManualRegistration: true,
        authorizationServerUrl,
      }, { status: 400 })
    }

    // Generate PKCE challenge and authorization URL
    const redirectUri = REDIRECT_URI(origin)
    const clientInfo = {
      client_id: clientId,
      client_secret: clientSecret || undefined,
      redirect_uris: [redirectUri],
    }
    const state = `${name}:${crypto.randomUUID()}`
    const { authorizationUrl, codeVerifier } = await startAuthorization(authorizationServerUrl, {
      metadata: asMetadata,
      clientInformation: clientInfo,
      redirectUrl: redirectUri,
      scope: scopesSupported?.join(' '),
      resource: new URL(server.url),
    })

    // Add state parameter to the authorization URL
    authorizationUrl.searchParams.set('state', state)

    // Save PKCE code verifier for callback
    await saveMcpCredentials(name, {
      pkceCodeVerifier: codeVerifier,
    })

    await updateMcpServerStatus(name, 'authorizing')

    return NextResponse.json({
      authorizationUrl: authorizationUrl.toString(),
      codeVerifier, // For debugging only — in production, never expose this
    })
  } catch (error) {
    console.error('Failed to start OAuth flow:', error)
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 })
  }
}
