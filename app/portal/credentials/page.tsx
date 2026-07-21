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
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Credentials</h1>
          <p className="text-sm text-[#555] mt-1">API keys and tokens for tools and integrations</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="nb-btn-orange px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider"
        >
          Add Credential
        </button>
      </div>

      <div className="nb-card bg-yellow-50 border-yellow-400 p-3">
        <p className="text-xs text-yellow-800 font-medium">
          ⚠ Credentials are stored in memory for this session only. For production, integrate with an encrypted persistent store.
        </p>
      </div>

      {showAdd && (
        <div className="nb-card bg-white p-4 space-y-4">
          <h3 className="text-sm font-extrabold text-[#111]">Add Credential</h3>
          <div className="grid gap-3">
            <div>
              <label className="nb-label text-[9px]">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="MY_API_KEY"
                className="w-full mt-1 border-[3px] border-[#111] bg-white px-3 py-1.5 text-xs text-[#111] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF5F1F]"
              />
            </div>
            <div>
              <label className="nb-label text-[9px]">Value</label>
              <input
                type="password"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="sk-..."
                className="w-full mt-1 border-[3px] border-[#111] bg-white px-3 py-1.5 text-xs text-[#111] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF5F1F]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCredential}
              className="nb-btn-orange px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider"
            >
              Store
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

      {credentials.length === 0 ? (
        <div className="nb-card bg-white p-8 text-center">
          <p className="text-sm text-[#555]">No credentials stored.</p>
        </div>
      ) : (
        <div className="nb-card bg-white overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-[3px] border-[#111]">
                <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Name</th>
                <th className="text-left px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Created</th>
                <th className="text-right px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#555]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred) => (
                <tr key={cred.name} className="border-b border-[#111] hover:bg-[#FF5F1F]/5 transition-colors">
                  <td className="px-4 py-2 font-mono font-bold text-[#111]">{cred.name}</td>
                  <td className="px-4 py-2 text-[#555]">{new Date(cred.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteCredential(cred.name)}
                      className="text-red-600 hover:text-red-800 font-bold transition-colors"
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
