'use client'

import { useState } from 'react'

interface Skill {
  name: string
  description: string
  source: 'imported' | 'workspace'
}

export default function SkillsPage() {
  const [skills] = useState<Skill[]>([])
  const [installing, setInstalling] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Skills</h1>
          <p className="text-sm text-[#555] mt-1">Reusable instruction sets for agents</p>
        </div>
        <button
          onClick={() => setInstalling(true)}
          className="nb-btn-orange px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider"
        >
          Install Skill
        </button>
      </div>

      {installing && (
        <div className="nb-card bg-white p-4 space-y-4">
          <p className="text-xs text-[#555]">
            Upload a <code className="font-mono text-[#FF5F1F]">SKILL.md</code> file and any supporting resources.
            Skills follow the <a href="https://agentskills.io/specification" target="_blank" className="text-[#FF5F1F] hover:underline font-bold" rel="noopener">Agent Skills specification</a>.
          </p>
          <div className="flex gap-2">
            <button className="nb-btn px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white">
              Upload SKILL.md
            </button>
            <button
              onClick={() => setInstalling(false)}
              className="px-3 py-1.5 text-xs text-[#555] hover:text-[#111] font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {skills.length === 0 ? (
        <div className="nb-card bg-white p-8 text-center">
          <p className="text-sm text-[#555]">No skills installed.</p>
          <p className="text-xs text-[#999] mt-2">
            Skills live in <code className="font-mono text-[#FF5F1F]">lib/flue/skills/</code> or are auto-discovered from <code className="font-mono text-[#FF5F1F]">.agents/skills/</code>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <div key={skill.name} className="nb-card bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#111]">{skill.name}</h3>
                  <p className="text-xs text-[#555] mt-1">{skill.description}</p>
                </div>
                <span className="nb-label text-[9px]">
                  {skill.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
