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
          <h1 className="text-lg font-medium text-[#e5e5e5]">Skills</h1>
          <p className="text-xs text-[#666] mt-1">Reusable instruction sets for agents</p>
        </div>
        <button
          onClick={() => setInstalling(true)}
          className="px-3 py-1.5 text-xs font-medium bg-[#C7661D] text-white rounded hover:bg-[#d87a3a] transition-colors"
        >
          Install Skill
        </button>
      </div>

      {installing && (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4 space-y-4">
          <p className="text-xs text-[#888]">
            Upload a <code className="text-[#C7661D]">SKILL.md</code> file and any supporting resources.
            Skills follow the <a href="https://agentskills.io/specification" target="_blank" className="text-[#C7661D] hover:underline" rel="noopener">Agent Skills specification</a>.
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs border border-[#333] rounded hover:bg-[#151515] transition-colors"
            >
              Upload SKILL.md
            </button>
            <button
              onClick={() => setInstalling(false)}
              className="px-3 py-1.5 text-xs text-[#666] hover:text-[#999] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {skills.length === 0 ? (
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-8 text-center">
          <p className="text-sm text-[#666]">No skills installed.</p>
          <p className="text-xs text-[#444] mt-2">
            Skills live in <code className="text-[#C7661D]">lib/flue/skills/</code> or are auto-discovered from <code className="text-[#C7661D]">.agents/skills/</code>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <div key={skill.name} className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[#e5e5e5]">{skill.name}</h3>
                  <p className="text-xs text-[#666] mt-1">{skill.description}</p>
                </div>
                <span className="text-[10px] font-mono text-[#444] px-2 py-0.5 border border-[#222] rounded">
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
