import { defineWorkflow, defineAgent } from '@flue/runtime'
import * as v from 'valibot'

const agent = defineAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `You are a skill registry manager. Help users install, configure, and assign skills to agents.
Skills are SKILL.md files with frontmatter containing name, description, and metadata.
They can be placed in .agents/skills/ for workspace discovery or imported in agent configs.`,
}))

const InstallSkillInput = v.object({
  source: v.string(),
  name: v.optional(v.string()),
  assignTo: v.optional(v.array(v.string())),
})

const InstallSkillOutput = v.object({
  success: v.boolean(),
  skillName: v.string(),
  message: v.string(),
})

export default defineWorkflow({
  agent,
  input: InstallSkillInput,
  output: InstallSkillOutput,
  async run({ input }) {
    const skillName = input.name || input.source.split('/').pop()?.replace(/\.md$/i, '') || 'unknown'

    return {
      success: true,
      skillName,
      message: `Skill "${skillName}" from "${input.source}" ready for installation. Place SKILL.md in .agents/skills/${skillName}/ or install via npm.`,
    }
  },
})

export const description = 'Install and manage agent skills'
export const route = true
export const runs = true
