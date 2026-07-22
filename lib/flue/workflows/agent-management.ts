import { defineWorkflow, defineAgent } from '@flue/runtime'
import * as v from 'valibot'

const agent = defineAgent(() => ({
  model: 'anthropic/claude-haiku-4-5',
  instructions: `You are an agent management assistant. Help users create, configure, and manage their Flue agents.
When asked to create an agent, gather the name, model, instructions, and sandbox type.
When asked to configure, help with tools, skills, and MCP server assignments.`,
}))

const CreateAgentInput = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  model: v.optional(v.string()),
  instructions: v.optional(v.string()),
  sandbox: v.optional(v.union([
    v.literal('virtual'),
    v.literal('local'),
    v.literal('daytona'),
    v.literal('vercel'),
  ])),
})

const CreateAgentOutput = v.object({
  success: v.boolean(),
  agentName: v.string(),
  message: v.string(),
})

export default defineWorkflow({
  agent,
  input: CreateAgentInput,
  output: CreateAgentOutput,
  async run({ input }) {
    const name = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    return {
      success: true,
      agentName: name,
      message: `Agent "${name}" configuration ready. Deploy by adding a file at lib/flue/agents/${name}.ts with defineAgent().`,
    }
  },
})

export const description = 'Create and configure Flue agents'
export const route = true
export const runs = true
