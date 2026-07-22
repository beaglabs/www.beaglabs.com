'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import type { Skill } from '@/lib/types'
import {
  Puzzle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  Loader2,
  Search,
  Filter,
  Play,
  Copy,
  Check,
  FileText,
  Code,
  Zap,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface SkillTemplate {
  name: string
  description: string
  icon: React.ReactNode
  category: string
  content: string
}

const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    name: 'Web Search',
    description: 'Search the web for current information and return results',
    icon: <Search className="w-5 h-5" />,
    category: 'Research',
    content: `# Web Search Skill

## Description
Search the web for current information and return structured results.

## Instructions
When the user asks for current information, news, or facts that may have changed:
1. Use the web_search tool to find relevant results
2. Filter results by relevance and recency
3. Summarize key findings with source citations
4. Present results in a clear, organized format

## Tools Required
- web_search

## Example Usage
- "What's the latest news about AI?"
- "Find current stock prices for AAPL"
- "What are the best restaurants in NYC?"`,
  },
  {
    name: 'Code Interpreter',
    description: 'Execute code snippets and return results',
    icon: <Code className="w-5 h-5" />,
    category: 'Development',
    content: `# Code Interpreter Skill

## Description
Execute code in various languages and return results.

## Instructions
When the user provides code to run or asks for code execution:
1. Identify the programming language
2. Execute the code in a sandboxed environment
3. Capture stdout, stderr, and return values
4. Present results with proper formatting
5. Handle errors gracefully with explanations

## Supported Languages
- Python
- JavaScript/TypeScript
- Shell/Bash
- SQL

## Tools Required
- code_executor

## Example Usage
- "Run this Python script"
- "Calculate 100! using JavaScript"
- "What does this regex match?"`,
  },
  {
    name: 'Data Analysis',
    description: 'Analyze datasets and generate insights',
    icon: <Filter className="w-5 h-5" />,
    category: 'Analytics',
    content: `# Data Analysis Skill

## Description
Analyze datasets, generate statistics, and create visualizations.

## Instructions
When the user provides data or asks for analysis:
1. Parse and validate the data format
2. Calculate relevant statistics (mean, median, mode, etc.)
3. Identify patterns, trends, and outliers
4. Generate appropriate visualizations
5. Present findings with clear explanations

## Tools Required
- code_executor
- chart_generator

## Example Usage
- "Analyze this CSV data"
- "What are the trends in this sales data?"
- "Create a chart from these numbers"`,
  },
  {
    name: 'File Manager',
    description: 'Read, write, and manage files and documents',
    icon: <FileText className="w-5 h-5" />,
    category: 'Utility',
    content: `# File Manager Skill

## Description
Read, write, and manage files and documents.

## Instructions
When the user asks to work with files:
1. Use appropriate file operations (read, write, list, delete)
2. Handle different file formats (text, JSON, CSV, etc.)
3. Provide file metadata (size, type, last modified)
4. Respect file permissions and access controls

## Supported Operations
- Read file contents
- Write/create new files
- List directory contents
- Delete files
- Copy/move files

## Tools Required
- file_read
- file_write
- file_list

## Example Usage
- "Read the contents of config.json"
- "Create a new file called notes.txt"
- "List all files in the documents folder"`,
  },
  {
    name: 'API Caller',
    description: 'Make HTTP requests to external APIs',
    icon: <Zap className="w-5 h-5" />,
    category: 'Integration',
    content: `# API Caller Skill

## Description
Make HTTP requests to external APIs and process responses.

## Instructions
When the user asks to interact with an API:
1. Parse the API endpoint and method
2. Construct proper headers and authentication
3. Send the request with appropriate payload
4. Parse and validate the response
5. Handle errors and rate limits gracefully

## Supported Methods
- GET
- POST
- PUT
- PATCH
- DELETE

## Tools Required
- http_client

## Example Usage
- "Fetch data from https://api.example.com/data"
- "POST this JSON to the webhook"
- "Check if the API is responding"`,
  },
  {
    name: 'Team Collaborator',
    description: 'Collaborate with other agents and manage tasks',
    icon: <Users className="w-5 h-5" />,
    category: 'Collaboration',
    content: `# Team Collaborator Skill

## Description
Collaborate with other agents, delegate tasks, and manage workflows.

## Instructions
When the user asks for multi-agent collaboration:
1. Identify available agents and their capabilities
2. Break down complex tasks into subtasks
3. Delegate subtasks to appropriate agents
4. Coordinate results and handle dependencies
5. Synthesize final output from all contributions

## Capabilities
- Agent discovery and selection
- Task decomposition and delegation
- Result aggregation
- Error handling and fallback

## Tools Required
- agent_list
- agent_invoke

## Example Usage
- "Research and write a report about climate change"
- "Analyze this data and create visualizations"
- "Build a web application with frontend and backend"`,
  },
]

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [calling, setCalling] = useState<string | null>(null)
  const [copiedName, setCopiedName] = useState<string | null>(null)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('custom')

  useEffect(() => {
    fetch('/api/flue/admin/skills')
      .then((r) => r.json())
      .then((data) => setSkills(Array.isArray(data) ? data : []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false))
  }, [])

  async function toggleSkill(name: string, enabled: boolean) {
    try {
      await fetch(`/api/flue/admin/skills/${name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      setSkills((prev) =>
        prev.map((s) => (s.name === name ? { ...s, enabled } : s))
      )
      toast.success(`Skill ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update skill')
    }
  }

  async function createSkill() {
    if (!newName.trim() || !newContent.trim()) {
      toast.error('Name and content are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/flue/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
          content: newContent,
          category: newCategory,
        }),
      })

      if (!res.ok) throw new Error('Failed to create skill')

      const data = await res.json()
      setSkills(prev => [...prev, data])
      setShowCreate(false)
      resetForm()
      toast.success(`Skill "${newName}" created`)
    } catch {
      toast.error('Failed to create skill')
    } finally {
      setCreating(false)
    }
  }

  async function callSkill(name: string) {
    setCalling(name)
    try {
      const res = await fetch(`/api/flue/admin/skills/${name}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) throw new Error('Failed to call skill')

      const data = await res.json()
      toast.success(`Skill "${name}" executed successfully`)
    } catch {
      toast.error('Failed to call skill')
    } finally {
      setCalling(null)
    }
  }

  function useTemplate(template: SkillTemplate) {
    setNewName(template.name)
    setNewDescription(template.description)
    setNewContent(template.content)
    setNewCategory(template.category)
    setShowTemplates(false)
    setShowCreate(true)
  }

  function resetForm() {
    setNewName('')
    setNewDescription('')
    setNewContent('')
    setNewCategory('custom')
  }

  function copySkillName(name: string) {
    navigator.clipboard.writeText(name)
    setCopiedName(name)
    setTimeout(() => setCopiedName(null), 2000)
    toast.success('Skill name copied')
  }

  const filteredSkills = searchQuery
    ? skills.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skills

  return (
    <>
      <PageHeader
        title="Skills"
        description="Reusable instructions and resources for agents"
      >
        <button
          onClick={() => setShowTemplates(true)}
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Templates
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Skill
        </button>
        <a
          href="https://flueframework.com/docs/guide/skills/"
          target="_blank"
          rel="noopener noreferrer"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Docs
        </a>
      </PageHeader>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#111] max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b-[3px] border-black">
              <h3 className="font-bold text-lg">Skill Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SKILL_TEMPLATES.map((template) => (
                  <div
                    key={template.name}
                    className="nb-card bg-white p-4 cursor-pointer hover:bg-[var(--sidebar-accent)] transition-colors"
                    onClick={() => useTemplate(template)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                        {template.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{template.name}</h4>
                        <span className="nb-chip !py-0 !px-1.5 !text-[9px]">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Skill Form */}
      {showCreate && (
        <div className="nb-card bg-white p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Create New Skill</h3>
            <button
              onClick={() => { setShowCreate(false); resetForm() }}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., web-search"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="custom">Custom</option>
                <option value="Research">Research</option>
                <option value="Development">Development</option>
                <option value="Analytics">Analytics</option>
                <option value="Utility">Utility</option>
                <option value="Integration">Integration</option>
                <option value="Collaboration">Collaboration</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description of what this skill does"
              className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="mb-4">
            <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
              SKILL.md Content
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="# Skill Name&#10;&#10;## Description&#10;...&#10;&#10;## Instructions&#10;..."
              rows={12}
              className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
            />
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
              Write instructions in Markdown format. Include sections for Description, Instructions, Tools Required, and Example Usage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={createSkill}
              disabled={creating || !newName.trim() || !newContent.trim()}
              className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Skill'}
            </button>
            <button
              onClick={() => { setShowCreate(false); resetForm() }}
              className="nb-btn-outline px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="w-full border-3 border-black pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          icon={<Puzzle className="w-7 h-7" />}
          title={searchQuery ? 'No skills found' : 'No skills installed'}
          description={
            searchQuery
              ? 'Try a different search term'
              : 'Skills provide agents with reusable instructions and resources. Create a new skill or use a template to get started.'
          }
          action={
            !searchQuery && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreate(true)}
                  className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Skill
                </button>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Use Template
                </button>
              </div>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <div key={skill.name} className="nb-card bg-white p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                    <Puzzle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{skill.name}</h3>
                      <button
                        onClick={() => copySkillName(skill.name)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 transition-all"
                        title="Copy skill name"
                      >
                        {copiedName === skill.name ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {skill.license && (
                      <span className="nb-chip !py-0 !px-1.5 !text-[9px]">{skill.license}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleSkill(skill.name, !skill.enabled)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                  title={skill.enabled ? 'Disable skill' : 'Enable skill'}
                >
                  {skill.enabled ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 mb-4">
                {skill.description}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={`/skills/${skill.name}`}
                  className="nb-chip !py-1 !px-2 !text-[10px] hover:bg-[var(--accent)] transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={() => callSkill(skill.name)}
                  disabled={calling === skill.name || !skill.enabled}
                  className="nb-chip !py-1 !px-2 !text-[10px] hover:bg-[var(--accent)] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {calling === skill.name ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Run
                </button>
                {skill.assignedAgents.length > 0 && (
                  <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">
                    {skill.assignedAgents.length} agent{skill.assignedAgents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
