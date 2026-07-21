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
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">MCP Servers</h1>
          <p className="text-sm text-[#555] mt-1">Model Context Protocol connections</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="nb-btn-orange px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider"
        >
          Add Server
        </button>
      </div>

      {showAdd && (
        <div className="nb-card bg-white p-4 space-y-4">
          <h3 className="text-sm font-extrabold text-[#111]">Connect MCP Server</h3>
          <p className="text-xs text-[#555]">
            Only OAuth-authenticated MCP servers are supported. The server must be reachable from the Flue runtime.
          </p>
          <div className="grid gap-3">
            <div>
              <label className="nb-label text-[9px]">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="my-server"
                className="w-full mt-1 border-[3px] border-[#111] bg-white px-3 py-1.5 text-xs text-[#111] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF5F1F]"
              />
            </div>
            <div>
              <label className="nb-label text-[9px]">URL</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://mcp.example.com"
                className="w-full mt-1 border-[3px] border-[#111] bg-white px-3 py-1.5 text-xs text-[#111] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF5F1F]"
              />
            </div>
            <div>
              <label className="nb-label text-[9px]">Transport</label>
              <select
                value={newTransport}
                onChange={(e) => setNewTransport(e.target.value as 'streamable-http' | 'sse')}
                className="w-full mt-1 border-[3px] border-[#111] bg-white px-3 py-1.5 text-xs text-[#111] focus:outline-none focus:ring-2 focus:ring-[#FF5F1F]"
              >
                <option value="streamable-http">Streamable HTTP (modern)</option>
                <option value="sse">SSE (legacy)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addConnection}
              className="nb-btn-orange px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider"
            >
              Connect
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs text-[#555] hover:text-[#111] font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {connections.length === 0 ? (
        <div className="nb-card bg-white p-8 text-center">
          <p className="text-sm text-[#555]">No MCP servers connected.</p>
          <p className="text-xs text-[#999] mt-2">
            Connect OAuth MCP servers to give agents access to external tools.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.name} className="nb-card bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#111]">{conn.name}</h3>
                  <p className="text-xs text-[#555] mt-0.5 font-mono">{conn.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${conn.status === 'connected' ? 'bg-emerald-500' : conn.status === 'error' ? 'bg-red-500' : 'bg-[#999]'}`} />
                  <span className="text-[10px] font-bold text-[#555]">{conn.status}</span>
                </div>
              </div>
              {conn.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {conn.tools.map((tool) => (
                    <span key={tool} className="nb-chip text-[10px] py-1 px-2">
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
