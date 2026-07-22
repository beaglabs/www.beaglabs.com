'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import type { Skill } from '@/lib/types'
import { ArrowLeft, Puzzle, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function SkillDetailPage() {
  const params = useParams()
  const skillName = params.id as string
  const [skill, setSkill] = useState<Skill | null>(null)
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/flue/admin/skills')
        .then((r) => r.json())
        .then((data) =>
          Array.isArray(data) ? data.find((s: Skill) => s.name === skillName) : null
        )
        .catch(() => null),
      fetch(`/api/flue/admin/skills/${skillName}/content`)
        .then((r) => r.text())
        .catch(() => ''),
    ]).then(([skillData, contentData]) => {
      setSkill(skillData)
      setContent(contentData)
      setLoading(false)
    })
  }, [skillName])

  return (
    <>
      <PageHeader title={skillName} description={skill?.description || 'Skill detail'}>
        <Link
          href="/skills"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </PageHeader>

      {loading ? (
        <div className="h-64 bg-gray-200 nb-card animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Skill Info */}
          <div className="nb-card bg-white p-5 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                <Puzzle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">{skillName}</h3>
                {skill?.license && (
                  <span className="nb-chip !py-0 !px-1.5 !text-[9px]">{skill.license}</span>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Status
                </p>
                <p className="font-medium mt-0.5">
                  {skill?.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Path
                </p>
                <p className="font-mono text-xs mt-0.5 break-all">
                  {skill?.path || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Assigned Agents
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skill?.assignedAgents?.length ? (
                    skill.assignedAgents.map((agent) => (
                      <Link
                        key={agent}
                        href={`/agents/${agent}`}
                        className="nb-chip !py-0.5 !px-2 !text-[10px] hover:bg-[var(--accent)] transition-colors"
                      >
                        {agent}
                      </Link>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Not assigned to any agent
                    </span>
                  )}
                </div>
              </div>
              {skill?.metadata && Object.keys(skill.metadata).length > 0 && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Metadata
                  </p>
                  <div className="space-y-1 mt-1">
                    {Object.entries(skill.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-[var(--muted-foreground)]">{key}</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SKILL.md Content */}
          <div className="lg:col-span-3 nb-card bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              <h3 className="font-bold text-lg">SKILL.md</h3>
            </div>
            {content ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Could not load SKILL.md content
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
