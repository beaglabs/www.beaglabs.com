import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

interface SandboxInfo {
  id: string
  provider: 'daytona' | 'vercel'
  status: 'running' | 'stopped' | 'error' | 'creating'
  agentName?: string
  createdAt: string
  expiresAt?: string
}

const sandboxes = new Map<string, SandboxInfo>()

export const createSandboxTool = defineTool({
  name: 'create_sandbox',
  description: 'Create a new sandbox environment for an agent.',
  input: v.object({
    provider: v.union([v.literal('daytona'), v.literal('vercel')]),
    agentName: v.optional(v.string()),
    ttlMinutes: v.optional(v.number()),
  }),
  output: v.object({
    sandboxId: v.string(),
    provider: v.string(),
    status: v.string(),
  }),
  async run({ input }) {
    const id = `sbx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
    const expiresAt = input.ttlMinutes
      ? new Date(now.getTime() + input.ttlMinutes * 60 * 1000).toISOString()
      : undefined

    const sandbox: SandboxInfo = {
      id,
      provider: input.provider,
      status: 'creating',
      agentName: input.agentName,
      createdAt: now.toISOString(),
      expiresAt,
    }

    sandboxes.set(id, sandbox)

    // Simulate creation (in production, this would call Daytona/Vercel APIs)
    setTimeout(() => {
      const sb = sandboxes.get(id)
      if (sb) {
        sb.status = 'running'
      }
    }, 2000)

    return {
      sandboxId: id,
      provider: input.provider,
      status: 'creating',
    }
  },
})

export const listSandboxesTool = defineTool({
  name: 'list_sandboxes',
  description: 'List all active sandbox environments.',
  input: v.object({}),
  output: v.array(v.object({
    id: v.string(),
    provider: v.string(),
    status: v.string(),
    agentName: v.optional(v.string()),
    createdAt: v.string(),
  })),
  async run() {
    return Array.from(sandboxes.values()).map((s) => ({
      id: s.id,
      provider: s.provider,
      status: s.status,
      agentName: s.agentName,
      createdAt: s.createdAt,
    }))
  },
})

export const terminateSandboxTool = defineTool({
  name: 'terminate_sandbox',
  description: 'Terminate a sandbox environment.',
  input: v.object({
    sandboxId: v.pipe(v.string(), v.minLength(1)),
  }),
  output: v.object({
    terminated: v.boolean(),
  }),
  async run({ input }) {
    const existed = sandboxes.delete(input.sandboxId)
    return { terminated: existed }
  },
})
