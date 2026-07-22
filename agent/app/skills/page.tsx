'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import type { Skill } from '@/lib/types'
import { Puzzle, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <>
      <PageHeader
        title="Skills"
        description="Reusable instructions and resources for agents"
      >
        <a
          href="https://docs.flueframework.com/guide/skills/"
          target="_blank"
          rel="noopener noreferrer"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Docs
        </a>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Puzzle className="w-7 h-7" />}
          title="No skills installed"
          description="Skills provide agents with reusable instructions and resources. Place SKILL.md files in .agents/skills/ or install from npm."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div key={skill.name} className="nb-card bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                    <Puzzle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{skill.name}</h3>
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
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 mb-3">
                {skill.description}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/skills/${skill.name}`}
                  className="nb-chip !py-1 !px-2 !text-[10px] hover:bg-[var(--accent)] transition-colors"
                >
                  View Details
                </Link>
                {skill.assignedAgents.length > 0 && (
                  <span className="text-[10px] text-[var(--muted-foreground)]">
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
