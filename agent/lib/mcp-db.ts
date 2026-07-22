import { client } from '@/lib/db'

export async function ensureMcpTables() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      name TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT DEFAULT 'discovering',
      resource_metadata_url TEXT,
      authorization_server_url TEXT,
      as_metadata TEXT,
      resource_metadata TEXT,
      scopes_supported TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS mcp_server_credentials (
      server_name TEXT PRIMARY KEY,
      client_id TEXT,
      client_secret TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TEXT,
      scopes TEXT,
      pkce_code_verifier TEXT,
      registration_endpoint TEXT,
      FOREIGN KEY (server_name) REFERENCES mcp_servers(name) ON DELETE CASCADE
    )
  `)
}

export async function getMcpServers() {
  await ensureMcpTables()
  const servers = await client.execute('SELECT * FROM mcp_servers')
  const creds = await client.execute('SELECT * FROM mcp_server_credentials')

  return servers.rows.map((row) => {
    const cred = creds.rows.find((c) => c.server_name === row.name)
    return {
      name: row.name as string,
      url: row.url as string,
      status: row.status as string,
      authorizationServerUrl: row.authorization_server_url as string | null,
      scopesSupported: row.scopes_supported ? JSON.parse(row.scopes_supported as string) : [],
      oauth: cred
        ? {
            configured: !!(cred.client_id),
            authorized: !!(cred.access_token),
            expiresAt: cred.token_expires_at as string | null,
            scopes: cred.scopes ? JSON.parse(cred.scopes as string) : [],
          }
        : undefined,
    }
  })
}

export async function getMcpServer(name: string) {
  await ensureMcpTables()
  const server = await client.execute({
    sql: 'SELECT * FROM mcp_servers WHERE name = ?',
    args: [name],
  })
  if (server.rows.length === 0) return null

  const row = server.rows[0]
  const cred = await client.execute({
    sql: 'SELECT * FROM mcp_server_credentials WHERE server_name = ?',
    args: [name],
  })

  return {
    name: row.name as string,
    url: row.url as string,
    status: row.status as string,
    resourceMetadataUrl: row.resource_metadata_url as string | null,
    authorizationServerUrl: row.authorization_server_url as string | null,
    asMetadata: row.as_metadata ? JSON.parse(row.as_metadata as string) : null,
    resourceMetadata: row.resource_metadata ? JSON.parse(row.resource_metadata as string) : null,
    scopesSupported: row.scopes_supported ? JSON.parse(row.scopes_supported as string) : [],
    credentials: cred.rows[0]
      ? {
          clientId: cred.rows[0].client_id as string | null,
          clientSecret: cred.rows[0].client_secret as string | null,
          accessToken: cred.rows[0].access_token as string | null,
          refreshToken: cred.rows[0].refresh_token as string | null,
          tokenExpiresAt: cred.rows[0].token_expires_at as string | null,
          scopes: cred.rows[0].scopes ? JSON.parse(cred.rows[0].scopes as string) : [],
          pkceCodeVerifier: cred.rows[0].pkce_code_verifier as string | null,
          registrationEndpoint: cred.rows[0].registration_endpoint as string | null,
        }
      : null,
  }
}

export async function saveMcpServer(data: {
  name: string
  url: string
  status?: string
  resourceMetadataUrl?: string
  authorizationServerUrl?: string
  asMetadata?: object
  resourceMetadata?: object
  scopesSupported?: string[]
}) {
  await ensureMcpTables()
  await client.execute({
    sql: `INSERT INTO mcp_servers (name, url, status, resource_metadata_url, authorization_server_url, as_metadata, resource_metadata, scopes_supported, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(name) DO UPDATE SET
            url = excluded.url,
            status = excluded.status,
            resource_metadata_url = excluded.resource_metadata_url,
            authorization_server_url = excluded.authorization_server_url,
            as_metadata = excluded.as_metadata,
            resource_metadata = excluded.resource_metadata,
            scopes_supported = excluded.scopes_supported,
            updated_at = datetime('now')`,
    args: [
      data.name,
      data.url,
      data.status || 'discovering',
      data.resourceMetadataUrl || null,
      data.authorizationServerUrl || null,
      data.asMetadata ? JSON.stringify(data.asMetadata) : null,
      data.resourceMetadata ? JSON.stringify(data.resourceMetadata) : null,
      data.scopesSupported ? JSON.stringify(data.scopesSupported) : null,
    ],
  })
}

export async function saveMcpCredentials(serverName: string, data: {
  clientId?: string | null
  clientSecret?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  tokenExpiresAt?: string | null
  scopes?: string[]
  pkceCodeVerifier?: string | null
  registrationEndpoint?: string | null
}) {
  await ensureMcpTables()
  await client.execute({
    sql: `INSERT INTO mcp_server_credentials (server_name, client_id, client_secret, access_token, refresh_token, token_expires_at, scopes, pkce_code_verifier, registration_endpoint)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(server_name) DO UPDATE SET
            client_id = COALESCE(excluded.client_id, mcp_server_credentials.client_id),
            client_secret = COALESCE(excluded.client_secret, mcp_server_credentials.client_secret),
            access_token = COALESCE(excluded.access_token, mcp_server_credentials.access_token),
            refresh_token = COALESCE(excluded.refresh_token, mcp_server_credentials.refresh_token),
            token_expires_at = COALESCE(excluded.token_expires_at, mcp_server_credentials.token_expires_at),
            scopes = COALESCE(excluded.scopes, mcp_server_credentials.scopes),
            pkce_code_verifier = COALESCE(excluded.pkce_code_verifier, mcp_server_credentials.pkce_code_verifier),
            registration_endpoint = COALESCE(excluded.registration_endpoint, mcp_server_credentials.registration_endpoint)`,
    args: [
      serverName,
      data.clientId ?? null,
      data.clientSecret ?? null,
      data.accessToken ?? null,
      data.refreshToken ?? null,
      data.tokenExpiresAt ?? null,
      data.scopes ? JSON.stringify(data.scopes) : null,
      data.pkceCodeVerifier ?? null,
      data.registrationEndpoint ?? null,
    ],
  })
}

export async function updateMcpServerStatus(name: string, status: string) {
  await client.execute({
    sql: "UPDATE mcp_servers SET status = ?, updated_at = datetime('now') WHERE name = ?",
    args: [status, name],
  })
}

export async function deleteMcpServer(name: string) {
  await client.execute({
    sql: 'DELETE FROM mcp_server_credentials WHERE server_name = ?',
    args: [name],
  })
  await client.execute({
    sql: 'DELETE FROM mcp_servers WHERE name = ?',
    args: [name],
  })
}
