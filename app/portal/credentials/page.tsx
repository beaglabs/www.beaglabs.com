'use client'

import { useState } from 'react'

interface Credential {
  name: string
  createdAt: string
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')

  const addCredential = () => {
    if (!newName.trim() || !newValue.trim()) return
    setCredentials((prev) => [...prev, { name: newName, createdAt: new Date().toISOString() }])
    setNewName('')
    setNewValue('')
    setShowAdd(false)
  }

  const deleteCredential = (name: string) => {
    setCredentials((prev) => prev.filter((c) => c.name !== name))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-[#e5e5e5]">Credentials</h1>
          <p className="text-xs text-[#666] mt-1">API keys and tokens for tools and integrations</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 text-xs font-medium bg-[#C7661D] text-white rounded hover:bg-[#d87a3a] transition-colors"
        >
          Add Credential
        </button>
      </div>

      <div className="border border-yellow-400/20 bg-yellow-400/5 rounded-lg p-3">
        <p className="text-xs text-yellow-400">
          ⚠ Credentials are stored in memory for this session only. For production, integrate with an encrypted persistent store.
        </p>
      </div>

      {showAdd && (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-[#e5e5e5]">Add Credential</h3>
          <div className="grid gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="MY_API_KEY"
                className="w-full mt-1 bg-[#111] border border-[#1a1a1a] rounded px-3 py-1.5 text-xs text-[#e5e5e5] placeholder-[#444] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Value</label>
              <input
                type="password"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="sk-..."
                className="w-full mt-1 bg-[#111] border border-[#1a1a1a] rounded px-3 py-1.5 text-xs text-[#e5e5e5] placeholder-[#444] focus:outline-none focus:border-[#333]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCredential}
              className="px-3 py-1.5 text-xs font-medium bg-[#C7661D] text-white rounded hover:bg-[#d87a3a] transition-colors"
            >
              Store
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

      {credentials.length === 0 ? (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-8 text-center">
          <p className="text-sm text-[#666]">No credentials stored.</p>
        </div>
      ) : (
        <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-2 text-[#666] font-mono uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred) => (
                <tr key={cred.name} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                  <td className="px-4 py-2 font-mono text-[#e5e5e5]">{cred.name}</td>
                  <td className="px-4 py-2 text-[#555]">{new Date(cred.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteCredential(cred.name)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
