'use client'

import { useState } from 'react'

interface McpConnection {
  name: string
  url: string
  transport: 'streamable-http' | 'sse'
  status: 'connected' | 'disconnected' | 'error'
  tools: string[]
}

export default function McpPage() {
  const [connections] = useState<McpConnection[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newTransport, setNewTransport] = useState<'streamable-http' | 'sse'>('streamable-http')

  const addConnection = async () => {
    // This would call the Flue runtime to connect
    setShowAdd(false)
    setNewName('')
    setNewUrl('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-[#e5e5e5]">MCP Servers</h1>
          <p className="text-xs text-[#666] mt-1">Model Context Protocol connections</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 text-xs font-medium bg-[#C7661D] text-white rounded hover:bg-[#d87a3a] transition-colors"
        >
          Add Server
        </button>
      </div>

      {showAdd && (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-[#e5e5e5]">Connect MCP Server</h3>
          <p className="text-xs text-[#666]">
            Only OAuth-authenticated MCP servers are supported. The server must be reachable from the Flue runtime.
          </p>
          <div className="grid gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="my-server"
                className="w-full mt-1 bg-[#111] border border-[#1a1a1a] rounded px-3 py-1.5 text-xs text-[#e5e5e5] placeholder-[#444] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#444]">URL</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://mcp.example.com"
                className="w-full mt-1 bg-[#111] border border-[#1a1a1a] rounded px-3 py-1.5 text-xs text-[#e5e5e5] placeholder-[#444] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Transport</label>
              <select
                value={newTransport}
                onChange={(e) => setNewTransport(e.target.value as 'streamable-http' | 'sse')}
                className="w-full mt-1 bg-[#111] border border-[#1a1a1a] rounded px-3 py-1.5 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#333]"
              >
                <option value="streamable-http">Streamable HTTP (modern)</option>
                <option value="sse">SSE (legacy)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addConnection}
              className="px-3 py-1.5 text-xs font-medium bg-[#C7661D] text-white rounded hover:bg-[#d87a3a] transition-colors"
            >
              Connect
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs text-[#666] hover:text-[#999] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {connections.length === 0 ? (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-8 text-center">
          <p className="text-sm text-[#666]">No MCP servers connected.</p>
          <p className="text-xs text-[#444] mt-2">
            Connect OAuth MCP servers to give agents access to external tools.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.name} className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[#e5e5e5]">{conn.name}</h3>
                  <p className="text-xs text-[#555] mt-0.5">{conn.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-emerald-400' : conn.status === 'error' ? 'bg-red-400' : 'bg-[#444]'}`} />
                  <span className="text-[10px] text-[#666]">{conn.status}</span>
                </div>
              </div>
              {conn.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {conn.tools.map((tool) => (
                    <span key={tool} className="text-[10px] font-mono text-[#555] bg-[#111] px-1.5 py-0.5 rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
