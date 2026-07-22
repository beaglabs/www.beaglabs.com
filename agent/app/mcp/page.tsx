'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import type { McpServer, McpTool } from '@/lib/types'
import { Plug, Plus, Trash2, RefreshCw, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function McpPage() {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newHeaders, setNewHeaders] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/flue/admin/mcp')
      .then((r) => r.json())
      .then((data) => setServers(Array.isArray(data) ? data : []))
      .catch(() => setServers([]))
      .finally(() => setLoading(false))
  }, [])

  async function addServer() {
    if (!newName.trim() || !newUrl.trim()) {
      toast.error('Name and URL are required')
      return
    }

    setAdding(true)
    try {
      let headers: Record<string, string> | undefined
      if (newHeaders.trim()) {
        try {
          headers = JSON.parse(newHeaders)
        } catch {
          toast.error('Headers must be valid JSON')
          setAdding(false)
          return
        }
      }

      const res = await fetch('/api/flue/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, url: newUrl, headers }),
      })
      const data = await res.json()
      setServers((prev) => [...prev, data])
      setShowAdd(false)
      setNewName('')
      setNewUrl('')
      setNewHeaders('')
      toast.success(`MCP server "${newName}" added`)
    } catch {
      toast.error('Failed to add MCP server')
    } finally {
      setAdding(false)
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

  return (
    <>
      <PageHeader title="MCP Servers" description="Configure Model Context Protocol server connections">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </PageHeader>

      {/* Add Server Form */}
      {showAdd && (
        <div className="nb-card bg-white p-5 mb-6">
          <h3 className="font-bold text-lg mb-4">Add MCP Server</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., inventory"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                URL
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://mcp.example.com/sse"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Headers (JSON)
              </label>
              <input
                type="text"
                value={newHeaders}
                onChange={(e) => setNewHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer ..."}'
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={addServer}
              disabled={adding}
              className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? 'Adding...' : 'Add Server'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="nb-btn-outline px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
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
          description="MCP servers provide remotely implemented tools that agents can use. Add a server to get started."
        />
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div key={server.name} className="nb-card bg-white p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{server.name}</h3>
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
                        className="border-2 border-black p-2 text-xs"
                      >
                        <p className="font-mono font-bold">
                          mcp__{server.name}__{tool.name}
                        </p>
                        <p className="text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
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
