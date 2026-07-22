export interface Agent {
  name: string
  description?: string
  model: string
  instructions?: string
  tools?: string[]
  skills?: string[]
  actions?: string[]
  sandbox?: 'virtual' | 'local' | 'daytona' | 'vercel'
}

export interface AgentInstance {
  id: string
  agentName: string
  createdAt: string
  lastActive?: string
  messageCount: number
  status: 'active' | 'idle' | 'error'
}

export interface Workflow {
  name: string
  description?: string
  model?: string
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  hasRoute: boolean
  hasRuns: boolean
}

export interface WorkflowRun {
  runId: string
  workflowName: string
  status: 'active' | 'completed' | 'errored'
  startedAt: string
  completedAt?: string
  result?: unknown
  error?: string
  events?: RunEvent[]
}

export interface RunEvent {
  type: string
  timestamp: string
  data: Record<string, unknown>
}

export interface Skill {
  name: string
  description: string
  license?: string
  compatibility?: string
  metadata?: Record<string, string>
  path: string
  enabled: boolean
  assignedAgents: string[]
}

export interface McpServer {
  name: string
  url: string
  status: 'connected' | 'disconnected' | 'error'
  tools: McpTool[]
  headers?: Record<string, string>
  lastHealthCheck?: string
}

export interface McpTool {
  name: string
  description: string
  inputSchema?: Record<string, unknown>
}

export interface Channel {
  name: 'resend'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, unknown>
  lastActivity?: string
  messageCount: number
}

export interface Sandbox {
  id: string
  provider: 'daytona' | 'vercel'
  status: 'running' | 'stopped' | 'error' | 'creating'
  agentName?: string
  createdAt: string
  expiresAt?: string
  resources?: {
    cpu?: string
    memory?: string
    disk?: string
  }
}

export interface Schedule {
  id: string
  name: string
  type: 'workflow' | 'dispatch'
  target: string
  cron: string
  timezone: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  input?: Record<string, unknown>
}

export interface ObservabilityMetrics {
  totalRuns: number
  successRate: number
  avgLatencyMs: number
  totalCost: number
  totalTokens: number
  runsByStatus: Record<string, number>
  runsByDay: Array<{ date: string; count: number; success: number; error: number }>
  modelUsage: Array<{ model: string; tokens: number; cost: number; runs: number }>
  topErrors: Array<{ message: string; count: number; lastSeen: string }>
}

export interface WebAuthnCredential {
  id: string
  name: string
  createdAt: string
  lastUsed?: string
  aaguid?: string
  deviceType: 'platform' | 'cross-platform'
}

export interface UserProfile {
  id: string
  email: string
  name: string
  webauthnCredentials: WebAuthnCredential[]
  onboardingComplete: boolean
}
