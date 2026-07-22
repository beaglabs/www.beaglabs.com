import type {
  Agent,
  AgentInstance,
  Workflow,
  WorkflowRun,
  RunEvent,
  Skill,
  McpServer,
  Channel,
  Sandbox,
  Schedule,
  ObservabilityMetrics,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_FLUE_API_URL || '/api/flue'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error ${res.status}: ${error}`)
  }
  return res.json()
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export async function listAgents(): Promise<Agent[]> {
  return fetchApi<Agent[]>('/admin/agents')
}

export async function getAgent(name: string): Promise<Agent | null> {
  try {
    return await fetchApi<Agent>(`/agents/${name}`)
  } catch {
    return null
  }
}

export async function getAgentInstances(name: string): Promise<AgentInstance[]> {
  return fetchApi<AgentInstance[]>(`/admin/runs?workflow=${name}`)
}

export async function sendAgentMessage(
  name: string,
  id: string,
  message: string,
  images?: string[]
): Promise<{ message: string; runId?: string }> {
  return fetchApi(`/agents/${name}/${id}`, {
    method: 'POST',
    body: JSON.stringify({ message, images }),
  })
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function listWorkflows(): Promise<Workflow[]> {
  return fetchApi<Workflow[]>('/admin/workflows')
}

export async function getWorkflow(name: string): Promise<Workflow | null> {
  try {
    return await fetchApi<Workflow>(`/workflows/${name}`)
  } catch {
    return null
  }
}

export async function invokeWorkflow(
  name: string,
  input: Record<string, unknown>
): Promise<{ runId: string }> {
  return fetchApi(`/workflows/${name}`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export async function listRuns(params?: {
  limit?: number
  cursor?: string
  workflow?: string
  status?: 'active' | 'completed' | 'errored'
}): Promise<WorkflowRun[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.cursor) searchParams.set('cursor', params.cursor)
  if (params?.workflow) searchParams.set('workflow', params.workflow)
  if (params?.status) searchParams.set('status', params.status)
  const query = searchParams.toString()
  return fetchApi<WorkflowRun[]>(`/admin/runs${query ? `?${query}` : ''}`)
}

export async function getRun(runId: string): Promise<WorkflowRun | null> {
  try {
    return await fetchApi<WorkflowRun>(`/admin/runs/${runId}`)
  } catch {
    return null
  }
}

export async function getRunEvents(runId: string): Promise<RunEvent[]> {
  return fetchApi<RunEvent[]>(`/runs/${runId}/events`)
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function listSkills(): Promise<Skill[]> {
  return fetchApi<Skill[]>('/admin/skills')
}

export async function getSkill(name: string): Promise<Skill | null> {
  try {
    return await fetchApi<Skill>(`/admin/skills/${name}`)
  } catch {
    return null
  }
}

export async function toggleSkill(
  name: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  return fetchApi(`/admin/skills/${name}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}

export async function assignSkillToAgent(
  skillName: string,
  agentName: string
): Promise<{ success: boolean }> {
  return fetchApi(`/admin/skills/${skillName}/assign`, {
    method: 'POST',
    body: JSON.stringify({ agentName }),
  })
}

// ─── MCP Servers ──────────────────────────────────────────────────────────────

export async function listMcpServers(): Promise<McpServer[]> {
  return fetchApi<McpServer[]>('/admin/mcp')
}

export async function addMcpServer(config: {
  name: string
  url: string
  headers?: Record<string, string>
}): Promise<McpServer> {
  return fetchApi('/admin/mcp', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function removeMcpServer(name: string): Promise<{ success: boolean }> {
  return fetchApi(`/admin/mcp/${name}`, { method: 'DELETE' })
}

export async function testMcpConnection(
  name: string
): Promise<{ status: 'ok' | 'error'; tools?: string[]; error?: string }> {
  return fetchApi(`/admin/mcp/${name}/test`, { method: 'POST' })
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function listChannels(): Promise<Channel[]> {
  return fetchApi<Channel[]>('/admin/channels')
}

export async function getChannelStatus(
  name: string
): Promise<Channel> {
  return fetchApi<Channel>(`/admin/channels/${name}`)
}

// ─── Sandboxes ────────────────────────────────────────────────────────────────

export async function listSandboxes(): Promise<Sandbox[]> {
  return fetchApi<Sandbox[]>('/admin/sandboxes')
}

export async function createSandbox(config: {
  provider: 'daytona' | 'vercel'
  agentName?: string
}): Promise<Sandbox> {
  return fetchApi('/admin/sandboxes', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function terminateSandbox(
  id: string
): Promise<{ success: boolean }> {
  return fetchApi(`/admin/sandboxes/${id}`, { method: 'DELETE' })
}

export async function getSandboxTerminal(
  id: string
): Promise<{ url: string }> {
  return fetchApi(`/admin/sandboxes/${id}/terminal`)
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function listSchedules(): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/admin/schedules')
}

export async function createSchedule(config: Omit<Schedule, 'id'>): Promise<Schedule> {
  return fetchApi('/admin/schedules', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function updateSchedule(
  id: string,
  config: Partial<Schedule>
): Promise<Schedule> {
  return fetchApi(`/admin/schedules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  })
}

export async function deleteSchedule(id: string): Promise<{ success: boolean }> {
  return fetchApi(`/admin/schedules/${id}`, { method: 'DELETE' })
}

export async function triggerSchedule(id: string): Promise<{ runId: string }> {
  return fetchApi(`/admin/schedules/${id}/trigger`, { method: 'POST' })
}

// ─── Observability ────────────────────────────────────────────────────────────

export async function getObservabilityMetrics(params?: {
  from?: string
  to?: string
}): Promise<ObservabilityMetrics> {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  const query = searchParams.toString()
  return fetchApi(`/admin/observability/metrics${query ? `?${query}` : ''}`)
}
