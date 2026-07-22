'use client'

import { useEffect, useState } from 'react'
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
  Copy,
  Check,
  AlertCircle,
  Key,
  Globe,
  Clock,
  ArrowRight,
  X,
  Settings,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

interface OAuthConfig {
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  redirectUri: string
  scopes: string[]
}

interface McpServerExtended extends McpServer {
  oauth?: {
    configured: boolean
    authorized: boolean
    expiresAt?: string
    scopes?: string[]
  }
}

const OAUTH_EXAMPLE_SERVERS = [
  {
    name: 'Linear',
    url: 'https://mcp.linear.app/sse',
    description: 'Issue tracking and project management',
    color: '#5E6AD2',
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://linear.app/oauth/token',
    scopes: ['read', 'write'],
  },
  {
    name: 'Notion',
    url: 'https://mcp.notion.com/sse',
    description: 'Pages, databases, and blocks',
    color: '#000000',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['read_content', 'update_content'],
  },
  {
    name: 'Slack',
    url: 'https://mcp.slack.com/sse',
    description: 'Messages, channels, and workflows',
    color: '#4A154B',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read'],
  },
  {
    name: 'GitHub',
    url: 'https://mcp.github.com/sse',
    description: 'Repositories, issues, and pull requests',
    color: '#24292F',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'read:org'],
  },
]

export default function McpPage() {
  const [servers, setServers] = useState<McpServerExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showOAuthFlow, setShowOAuthFlow] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Add form state (OAuth 2.1 only)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newClientId, setNewClientId] = useState('')
  const [newClientSecret, setNewClientSecret] = useState('')
  const [newAuthUrl, setNewAuthUrl] = useState('')
  const [newTokenUrl, setNewTokenUrl] = useState('')
  const [newScopes, setNewScopes] = useState('')
  const [adding, setAdding] = useState(false)
  const [authStep, setAuthStep] = useState<'config' | 'authorize' | 'callback'>('config')

  // OAuth callback state
  const [callbackCode, setCallbackCode] = useState('')
  const [processingCallback, setProcessingCallback] = useState(false)

  useEffect(() => {
    fetch('/api/flue/admin/mcp')
      .then((r) => r.json())
      .then((data) => setServers(Array.isArray(data) ? data : []))
      .catch(() => setServers([]))
      .finally(() => setLoading(false))
  }, [])

  async function addServer() {
    if (!newName.trim() || !newUrl.trim() || !newClientId.trim() || !newAuthUrl.trim() || !newTokenUrl.trim()) {
      toast.error('Name, URL, Client ID, Auth URL, and Token URL are required')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/flue/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          url: newUrl,
          oauth: {
            clientId: newClientId,
            clientSecret: newClientSecret,
            authorizationUrl: newAuthUrl,
            tokenUrl: newTokenUrl,
            redirectUri: `${window.location.origin}/api/flue/admin/mcp/oauth/callback`,
            scopes: newScopes.split(',').map(s => s.trim()).filter(Boolean),
          },
        }),
      })
      const data = await res.json()
      setServers((prev) => [...prev, data])
      setShowOAuthFlow(newName)
      setAuthStep('authorize')
      toast.success(`MCP server "${newName}" added — authorize to connect`)
    } catch {
      toast.error('Failed to add MCP server')
    } finally {
      setAdding(false)
    }
  }

  async function startOAuthFlow(serverName: string) {
    setConnecting(serverName)
    try {
      const res = await fetch(`/api/flue/admin/mcp/${serverName}/oauth/authorize`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.authorizationUrl) {
        // Open authorization URL in new window
        const authWindow = window.open(
          data.authorizationUrl,
          'oauth-authorize',
          'width=600,height=700,scrollbars=yes'
        )

        // Listen for the callback
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed)
            // Check if authorization completed
            checkAuthStatus(serverName)
          }
        }, 1000)
      }
    } catch {
      toast.error('Failed to start OAuth flow')
    } finally {
      setConnecting(null)
    }
  }

  async function checkAuthStatus(serverName: string) {
    try {
      const res = await fetch(`/api/flue/admin/mcp/${serverName}/oauth/status`)
      const data = await res.json()

      if (data.authorized) {
        toast.success(`Authorized successfully`)
        // Refresh server list
        const serversRes = await fetch('/api/flue/admin/mcp')
        const serversData = await serversRes.json()
        if (Array.isArray(serversData)) setServers(serversData)
      }
    } catch {
      // Silent fail - user may still be authorizing
    }
  }

  async function handleOAuthCallback() {
    if (!callbackCode.trim() || !showOAuthFlow) {
      toast.error('Please enter the authorization code')
      return
    }

    setProcessingCallback(true)
    try {
      const res = await fetch(`/api/flue/admin/mcp/${showOAuthFlow}/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: callbackCode }),
      })

      if (!res.ok) throw new Error('Failed to process callback')

      const data = await res.json()
      toast.success('OAuth authorization completed')
      setShowOAuthFlow(null)
      setCallbackCode('')
      resetForm()

      // Refresh server list
      const serversRes = await fetch('/api/flue/admin/mcp')
      const serversData = await serversRes.json()
      if (Array.isArray(serversData)) setServers(serversData)
    } catch {
      toast.error('Failed to process authorization code')
    } finally {
      setProcessingCallback(false)
    }
  }

  async function removeServer(name: string) {
    try {
      await fetch(`/api/flue/admin/mcp/${name}`, { method: 'DELETE' })
      setServers((prev) => prev.filter((s) => s.name !== name))
      toast.success(`MCP server "${name}" removed`)
    } catch {
      toast.error('Failed to remove MCP server')
    }
  }

  async function testConnection(name: string) {
    setTesting(name)
    try {
      const res = await fetch(`/api/flue/admin/mcp/${name}/test`, { method: 'POST' })
      const data = await res.json()
      if (data.status === 'ok') {
        toast.success(`Connection OK — ${data.tools?.length ?? 0} tools discovered`)
      } else {
        toast.error(`Connection failed: ${data.error}`)
      }
    } catch {
      toast.error('Test failed')
    } finally {
      setTesting(null)
    }
  }

  async function refreshToken(name: string) {
    try {
      await fetch(`/api/flue/admin/mcp/${name}/oauth/refresh`, { method: 'POST' })
      toast.success('Token refreshed')
      const serversRes = await fetch('/api/flue/admin/mcp')
      const serversData = await serversRes.json()
      if (Array.isArray(serversData)) setServers(serversData)
    } catch {
      toast.error('Failed to refresh token')
    }
  }

  function useExample(example: typeof OAUTH_EXAMPLE_SERVERS[0]) {
    setNewName(example.name)
    setNewUrl(example.url)
    setNewAuthUrl(example.authUrl)
    setNewTokenUrl(example.tokenUrl)
    setNewScopes(example.scopes.join(', '))
  }

  function resetForm() {
    setNewName('')
    setNewUrl('')
    setNewClientId('')
    setNewClientSecret('')
    setNewAuthUrl('')
    setNewTokenUrl('')
    setNewScopes('')
    setAuthStep('config')
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast.success('Copied to clipboard')
  }

  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/flue/admin/mcp/oauth/callback`
    : ''

  return (
    <>
      <PageHeader title="MCP Servers" description="Connect Model Context Protocol servers with OAuth 2.1 authentication">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </PageHeader>

      {/* OAuth 2.1 Info Banner */}
      <div className="nb-card bg-[var(--sidebar)] p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 border-2 border-black flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">OAuth 2.1 Authentication</h4>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              All MCP servers use OAuth 2.1 with PKCE for secure authentication. The authorization flow
              handles token exchange, refresh, and storage automatically.{' '}
              <a
                href="https://flueframework.com/docs/guide/tools/"
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
            <h3 className="font-bold text-lg">Add MCP Server (OAuth 2.1)</h3>
            <button
              onClick={() => { setShowAdd(false); resetForm() }}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Examples */}
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
              Quick Setup
            </p>
            <div className="flex flex-wrap gap-2">
              {OAUTH_EXAMPLE_SERVERS.map((example) => (
                <button
                  key={example.name}
                  onClick={() => useExample(example)}
                  className="nb-chip !py-1 !px-3 !text-xs hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: example.color }}
                  />
                  {example.name}
                </button>
              ))}
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex items-center gap-2 text-sm font-bold ${
              authStep === 'config' ? 'text-[var(--accent)]' : 'text-green-600'
            }`}>
              <div className={`w-6 h-6 border-2 border-black flex items-center justify-center text-xs ${
                authStep === 'config' ? 'bg-[var(--accent)]' : 'bg-green-600 text-white'
              }`}>
                {authStep === 'config' ? '1' : <Check className="w-3 h-3" />}
              </div>
              Configure
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div className={`flex items-center gap-2 text-sm font-bold ${
              authStep === 'authorize' ? 'text-[var(--accent)]' : authStep === 'callback' ? 'text-green-600' : 'text-[var(--muted-foreground)]'
            }`}>
              <div className={`w-6 h-6 border-2 border-black flex items-center justify-center text-xs ${
                authStep === 'authorize' ? 'bg-[var(--accent)]' : authStep === 'callback' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {authStep === 'callback' ? <Check className="w-3 h-3" /> : '2'}
              </div>
              Authorize
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div className={`flex items-center gap-2 text-sm font-bold ${
              authStep === 'callback' ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]'
            }`}>
              <div className={`w-6 h-6 border-2 border-black flex items-center justify-center text-xs ${
                authStep === 'callback' ? 'bg-[var(--accent)]' : 'bg-gray-200'
              }`}>
                3
              </div>
              Connect
            </div>
          </div>

          {/* Configuration Fields */}
          {authStep === 'config' && (
            <>
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

              <div className="mt-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" />
                  OAuth 2.1 Configuration
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs text-[var(--muted-foreground)] block mb-1.5">
                      Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                      placeholder="Your OAuth client ID"
                      className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-[var(--muted-foreground)] block mb-1.5">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={newClientSecret}
                      onChange={(e) => setNewClientSecret(e.target.value)}
                      placeholder="Your OAuth client secret (optional for public clients)"
                      className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-[var(--muted-foreground)] block mb-1.5">
                      Authorization URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={newAuthUrl}
                      onChange={(e) => setNewAuthUrl(e.target.value)}
                      placeholder="https://auth.example.com/authorize"
                      className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-[var(--muted-foreground)] block mb-1.5">
                      Token URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={newTokenUrl}
                      onChange={(e) => setNewTokenUrl(e.target.value)}
                      placeholder="https://auth.example.com/token"
                      className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="font-mono text-xs text-[var(--muted-foreground)] block mb-1.5">
                    Scopes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newScopes}
                    onChange={(e) => setNewScopes(e.target.value)}
                    placeholder="read, write, admin"
                    className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="mt-4 p-3 bg-gray-50 border-2 border-black">
                  <p className="font-mono text-xs text-[var(--muted-foreground)] mb-1">
                    Redirect URI (configure this in your OAuth provider):
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-white px-2 py-1 border border-gray-200 flex-1 truncate">
                      {redirectUri}
                    </code>
                    <button
                      onClick={() => copyToClipboard(redirectUri, 'redirectUri')}
                      className="p-1 hover:bg-gray-200 transition-colors"
                    >
                      {copiedField === 'redirectUri' ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={addServer}
                  disabled={adding || !newName.trim() || !newUrl.trim() || !newClientId.trim() || !newAuthUrl.trim() || !newTokenUrl.trim()}
                  className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {adding ? 'Adding...' : 'Continue to Authorization'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); resetForm() }}
                  className="nb-btn-outline px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Authorization Step */}
          {authStep === 'authorize' && showOAuthFlow && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[var(--accent)] border-3 border-black flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_#111]">
                <Shield className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg mb-2">Authorize {showOAuthFlow}</h4>
              <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Click the button below to open the authorization page. After authorizing, you&apos;ll receive a code to complete the connection.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => startOAuthFlow(showOAuthFlow)}
                  disabled={connecting === showOAuthFlow}
                  className="nb-btn-orange px-6 py-3 text-sm flex items-center gap-2"
                >
                  {connecting === showOAuthFlow ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Open Authorization Page
                </button>
                <button
                  onClick={() => setAuthStep('callback')}
                  className="nb-btn-outline px-4 py-3 text-sm"
                >
                  Enter Code Manually
                </button>
              </div>
            </div>
          )}

          {/* Callback Step */}
          {authStep === 'callback' && showOAuthFlow && (
            <div className="py-4">
              <div className="max-w-md mx-auto">
                <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                  Authorization Code
                </label>
                <input
                  type="text"
                  value={callbackCode}
                  onChange={(e) => setCallbackCode(e.target.value)}
                  placeholder="Paste the authorization code here"
                  className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] mb-4"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOAuthCallback}
                    disabled={processingCallback || !callbackCode.trim()}
                    className="nb-btn-orange flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingCallback ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {processingCallback ? 'Processing...' : 'Complete Connection'}
                  </button>
                  <button
                    onClick={() => setAuthStep('authorize')}
                    className="nb-btn-outline px-4 py-2 text-sm"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
          description="MCP servers provide remotely implemented tools that agents can use via OAuth 2.1 authentication. Add a server to get started."
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
                  <StatusBadge status={server.status} />
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
                      <Clock className="w-3 h-3" />
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
                  {server.oauth.authorized && (
                    <button
                      onClick={() => refreshToken(server.name)}
                      className="nb-btn-outline mt-3 px-3 py-1.5 text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh Token
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
                    No tools discovered. Click &quot;Test&quot; to refresh.
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
