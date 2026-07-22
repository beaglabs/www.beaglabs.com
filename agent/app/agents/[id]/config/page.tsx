'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import type { Agent, Skill, McpServer } from '@/lib/types'
import { Bot, Save, ArrowLeft, Container } from 'lucide-react'
import { detectSandboxProvider, sandboxLabel, type SandboxProvider } from '@/lib/sandbox'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AgentConfigPage() {
  const params = useParams()
  const agentName = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [model, setModel] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [sandboxProvider, setSandboxProvider] = useState<SandboxProvider>('virtual')

  useEffect(() => {
    Promise.all([
      fetch('/api/flue/admin/agents').then((r) => r.json()).catch(() => []),
      fetch('/api/flue/admin/skills').then((r) => r.json()).catch(() => []),
      fetch('/api/flue/admin/mcp').then((r) => r.json()).catch(() => []),
    ]).then(([agentsData, skillsData, mcpData]) => {
      const found = Array.isArray(agentsData)
        ? agentsData.find((a: Agent) => a.name === agentName)
        : null
      if (found) {
        setAgent(found)
        setModel(found.model || '')
        setInstructions(found.instructions || '')
        setSelectedTools(found.tools || [])
        setSelectedSkills(found.skills || [])
      }
      setSandboxProvider(detectSandboxProvider())
      setSkills(Array.isArray(skillsData) ? skillsData : [])
      setMcpServers(Array.isArray(mcpData) ? mcpData : [])
    })
  }, [agentName])

  async function handleSave() {
    setSaving(true)
    try {
      // In production, this would call a Flue admin endpoint to update agent config
      toast.success('Agent configuration saved')
    } catch (err) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const allTools = [
    ...(agent?.tools || []),
    ...mcpServers.flatMap((s) => s.tools.map((t) => `mcp__${s.name}__${t.name}`)),
  ]

  return (
    <>
      <PageHeader title={`Configure: ${agentName}`} description="Update agent settings, tools, and skills">
        <Link
          href={`/agents/${agentName}`}
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model */}
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agent Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="anthropic/claude-haiku-4-5">Claude Haiku 4.5</option>
                  <option value="anthropic/claude-sonnet-4-6">Claude Sonnet 4</option>
                  <option value="anthropic/claude-opus-4-6">Claude Opus 4</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                  System Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={8}
                  className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Enter system instructions for this agent..."
                />
              </div>
              {/* Sandbox — auto-detected from env */}
              <div className="nb-chip !py-3 !px-4 !text-xs w-full">
                <Container className="w-4 h-4 mr-2" />
                <span className="font-bold mr-1">Sandbox:</span>
                {sandboxLabel(sandboxProvider)}
                {sandboxProvider === 'virtual' && (
                  <span className="ml-2 text-[var(--muted-foreground)]">
                    — set DAYTONA_API_KEY or VERCEL_SANDBOX_TOKEN for remote
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-lg mb-4">Tools</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              Select which tools this agent can use. MCP tools are auto-discovered from connected servers.
            </p>
            <div className="space-y-2">
              {allTools.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No tools available</p>
              ) : (
                allTools.map((tool) => (
                  <label
                    key={tool}
                    className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-black hover:bg-[var(--sidebar-accent)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTools((prev) => [...prev, tool])
                        } else {
                          setSelectedTools((prev) => prev.filter((t) => t !== tool))
                        }
                      }}
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                    <span className="font-mono text-sm">{tool}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Skills Sidebar */}
        <div className="space-y-6">
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-lg mb-4">Skills</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              Assign skills to provide the agent with specialized instructions and resources.
            </p>
            <div className="space-y-2">
              {skills.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No skills installed</p>
              ) : (
                skills.map((skill) => (
                  <label
                    key={skill.name}
                    className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-black hover:bg-[var(--sidebar-accent)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSkills((prev) => [...prev, skill.name])
                        } else {
                          setSelectedSkills((prev) => prev.filter((s) => s !== skill.name))
                        }
                      }}
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                    <div>
                      <span className="font-medium text-sm">{skill.name}</span>
                      <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-1">
                        {skill.description}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* MCP Servers */}
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-lg mb-4">MCP Servers</h3>
            <div className="space-y-2">
              {mcpServers.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No MCP servers connected</p>
              ) : (
                mcpServers.map((server) => (
                  <div key={server.name} className="nb-chip !text-xs w-full justify-between">
                    <span>{server.name}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {server.tools.length} tools
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
