'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { Bot, ArrowLeft, Save, Container } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { detectSandboxProvider, sandboxLabel, type SandboxProvider } from '@/lib/sandbox'

export default function NewAgentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('anthropic/claude-haiku-4-5')
  const [instructions, setInstructions] = useState('')
  const [creating, setCreating] = useState(false)
  const [sandboxProvider, setSandboxProvider] = useState<SandboxProvider>('virtual')

  useEffect(() => {
    setSandboxProvider(detectSandboxProvider())
  }, [])

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Agent name is required')
      return
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    setCreating(true)
    try {
      toast.success(`Agent "${slug}" created successfully`)
      router.push(`/agents/${slug}`)
    } catch {
      toast.error('Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <PageHeader title="Create Agent" description="Configure a new Flue AI agent">
        <Link
          href="/agents"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </PageHeader>

      <div className="max-w-2xl">
        <div className="nb-card bg-white p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bold text-lg">New Agent Configuration</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Define the agent&apos;s identity, model, and capabilities
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Agent Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., support-agent, code-reviewer"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              {name && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
                  Endpoint: /agents/{name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/{'<id>'}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this agent does"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Model */}
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="anthropic/claude-haiku-4-5">Claude Haiku 4.5 (Fast)</option>
                <option value="anthropic/claude-sonnet-4-6">Claude Sonnet 4 (Balanced)</option>
                <option value="anthropic/claude-opus-4-6">Claude Opus 4 (Capable)</option>
                <option value="openai/gpt-4o">GPT-4o</option>
                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>

            {/* Instructions */}
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                System Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="You are a helpful assistant that..."
              />
            </div>

            {/* Sandbox — auto-detected */}
            <div className="nb-chip !py-3 !px-4 !text-xs w-full">
              <Container className="w-4 h-4 mr-2" />
              <span className="font-bold mr-1">Sandbox:</span>
              {sandboxLabel(sandboxProvider)}
              {sandboxProvider === 'virtual' && (
                <span className="ml-2 text-[var(--muted-foreground)]">
                  — set DAYTONA_API_KEY or VERCEL_SANDBOX_TOKEN for remote execution
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t-3 border-black">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="nb-btn-orange px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Agent'}
            </button>
            <Link href="/agents" className="nb-btn-outline px-6 py-2.5 text-sm">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
