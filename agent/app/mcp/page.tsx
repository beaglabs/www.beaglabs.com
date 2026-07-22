'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import type { McpServer, McpTool } from '@/lib/types'
import {
  Plug,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  ExternalLink,
  AlertCircle,
  Key,
  Zap,
  X,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface McpServerExtended extends McpServer {
  oauth?: {
    configured: boolean
    authorized: boolean
    expiresAt?: string
    scopes?: string[]
  }
  lastHealthCheck?: string
}

export default function McpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <McpPageContent />
    </Suspense>
  )
}

function McpPageContent() {
  const searchParams = useSearchParams()
  const [servers, setServers] = useState<McpServerExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)

  // Check URL params for OAuth callback results
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected) {
      toast.success(`MCP server "${connected}" connected successfully`)
      // Clear URL params
      window.history.replaceState({}, '', '/mcp')
    }
    if (error) {
      toast.error(`Authorization failed: ${error}`)
      window.history.replaceState({}, '', '/mcp')
    }
  }, [searchParams])

  // Fetch servers
  async function fetchServers() {
    try {
      const res = await fetch('/api/flue/admin/mcp')
      const data = await res.json()
      setServers(Array.isArray(data) ? data : [])
    } catch {
      setServers([])
    }
  }

  useEffect(() => {
    fetchServers().finally(() => setLoading(false))
  }, [])

  async function addServer() {
    if (!newName.trim() || !newUrl.trim()) {
      toast.error('Name and URL are required')
      return
    }

    setAdding(true)
    try {
      // Step 1: Register the server (triggers discovery)
      const res = await fetch('/api/flue/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), url: newUrl.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to add server')
        return
      }

      // Refresh server list
      await fetchServers()

      // Step 2: If the server has an authorization server, start OAuth flow
      if (data.status === 'discovered') {
        toast.info('Authorization server discovered. Starting OAuth flow...')
        await startOAuthFlow(newName.trim())
      } else if (data.status === 'no-auth') {
        toast.success(`Server "${newName}" added (no authentication required)`)
        setShowAdd(false)
        resetForm()
        // Test connection directly
        await testConnection(newName.trim())
      }
    } catch {
      toast.error('Failed to add MCP server')
    } finally {
      setAdding(false)
    }
  }

  async function startOAuthFlow(serverName: string) {
    setConnecting(serverName)
    try {
      const res = await fetch(`/api/flue/admin/mcp/${encodeURIComponent(serverName)}/connect`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.needsManualRegistration) {
          toast.error('Server requires manual client registration. Please register your client with the authorization server first.')
        } else {
          toast.error(data.error || 'Failed to start OAuth flow')
        }
        return
      }

      if (data.authorizationUrl) {
        // Open authorization page in a popup
        const authWindow = window.open(
          data.authorizationUrl,
          'mcp-oauth',
          'width=600,height=700,scrollbars=yes'
        )

        // Poll for the window to close (user completed or cancelled)
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed)
            // Refresh to check if authorization completed
            fetchServers()
            setConnecting(null)
          }
        }, 1000)
      }
    } catch {
      toast.error('Failed to start OAuth flow')
      setConnecting(null)
    }
  }

  async function testConnection(name: string) {
    setTesting(name)
    try {
      const res = await fetch(`/api/flue/admin/mcp/${encodeURIComponent(name)}/test`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.status === 'ok') {
        toast.success(`Connected — ${data.tools?.length ?? 0} tools discovered`)
        // Update the server's tools in the local state
        setServers((prev) =>
          prev.map((s) =>
            s.name === name ? { ...s, tools: data.tools || [], status: 'connected' } : s
          )
        )
      } else {
        toast.error(`Connection failed: ${data.error}`)
      }
    } catch {
      toast.error('Test failed')
    } finally {
      setTesting(null)
    }
  }

  async function removeServer(name: string) {
    try {
      await fetch(`/api/flue/admin/mcp/${encodeURIComponent(name)}`, { method: 'DELETE' })
      setServers((prev) => prev.filter((s) => s.name !== name))
      toast.success(`Server "${name}" removed`)
    } catch {
      toast.error('Failed to remove server')
    }
  }

  function resetForm() {
    setNewName('')
    setNewUrl('')
  }

  const connectedCount = servers.filter((s) => s.status === 'connected').length

  return (
    <>
      <PageHeader
        title="MCP Servers"
        description={`Connect Model Context Protocol servers — ${connectedCount} connected`}
      >
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </PageHeader>

      {/* Info Banner */}
      <div className="nb-card bg-[var(--sidebar)] p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 border-2 border-black flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">MCP Authorization (OAuth 2.1)</h4>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Enter a server URL and the system will automatically discover the authorization server,
              register the client via Dynamic Client Registration (RFC 7591), and guide you through
              the OAuth 2.1 authorization flow with PKCE.{' '}
              <a
                href="https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Learn more →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Add Server Form */}
      {showAdd && (
        <div className="nb-card bg-white p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Add MCP Server</h3>
            <button
              onClick={() => { setShowAdd(false); resetForm() }}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Server Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., linear"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                MCP Server URL
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://mcp.example.com/sse"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 border-2 border-black">
            <p className="text-xs text-[var(--muted-foreground)]">
              <strong>How it works:</strong> The system will probe the server for OAuth 2.0 Protected Resource Metadata
              (RFC 9728), discover the authorization server, attempt Dynamic Client Registration, and
              guide you through the authorization flow. Just enter the URL and go.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={addServer}
              disabled={adding || !newName.trim() || !newUrl.trim()}
              className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {adding ? 'Discovering...' : 'Add & Authorize'}
            </button>
            <button
              onClick={() => { setShowAdd(false); resetForm() }}
              className="nb-btn-outline px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Server List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <EmptyState
          icon={<Plug className="w-7 h-7" />}
          title="No MCP servers connected"
          description="MCP servers provide tools that agents can use. Add a server URL and the system will handle discovery and authentication automatically."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Server
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div key={server.name} className="nb-card bg-white p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                    <Plug className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{server.name}</h3>
                    <p className="text-xs font-mono text-[var(--muted-foreground)]">
                      {server.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={server.status as 'connected' | 'disconnected' | 'error'} />
                  <button
                    onClick={() => testConnection(server.name)}
                    disabled={testing === server.name}
                    className="nb-btn-outline px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    {testing === server.name ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Test
                  </button>
                  <button
                    onClick={() => removeServer(server.name)}
                    className="nb-btn-outline px-3 py-1.5 text-xs flex items-center gap-1 text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* OAuth Status */}
              {server.oauth && (
                <div className="mb-4 p-3 bg-[var(--sidebar)] border-2 border-black">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--muted-foreground)]" />
                      <span className="text-xs font-bold uppercase tracking-wider">OAuth 2.1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {server.oauth.authorized ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authorized
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Not Authorized
                        </span>
                      )}
                    </div>
                  </div>
                  {server.oauth.scopes && server.oauth.scopes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {server.oauth.scopes.map((scope) => (
                        <span key={scope} className="nb-chip !py-0 !px-1.5 !text-[9px]">
                          {scope}
                        </span>
                      ))}
                    </div>
                  )}
                  {server.oauth.expiresAt && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--muted-foreground)]">
                      Expires: {new Date(server.oauth.expiresAt).toLocaleString()}
                    </div>
                  )}
                  {!server.oauth.authorized && (
                    <button
                      onClick={() => startOAuthFlow(server.name)}
                      disabled={connecting === server.name}
                      className="nb-btn-orange mt-3 px-4 py-1.5 text-xs flex items-center gap-2"
                    >
                      {connecting === server.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Key className="w-3 h-3" />
                      )}
                      Authorize Now
                    </button>
                  )}
                </div>
              )}

              {/* Discovered Tools */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
                  Discovered Tools ({server.tools.length})
                </p>
                {server.tools.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    No tools discovered. Click &quot;Test&quot; to connect and discover tools.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {server.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="border-2 border-black p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="w-3 h-3 text-[var(--accent)]" />
                          <p className="font-mono font-bold">
                            mcp__{server.name}__{tool.name}
                          </p>
                        </div>
                        <p className="text-[var(--muted-foreground)] line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {server.lastHealthCheck && (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-3">
                  Last checked: {new Date(server.lastHealthCheck).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
