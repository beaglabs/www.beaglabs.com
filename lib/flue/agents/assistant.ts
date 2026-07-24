import { defineAgent, defineTool, connectMcpServer } from '@flue/runtime'
import * as v from 'valibot'
import { Resend } from 'resend'
import { sendEmail } from '../tools/resend-send'
import { webBrowse, webNavigate } from '../tools/web-browse'
import { webExtract, webScreenshot } from '../tools/web-extract'
import { executeCode, executeCodePersistent } from '../tools/execute-code'
import {
  connectMcp,
  disconnectMcp,
  listMcpConnections,
} from '../tools/mcp-connect'
import {
  storeCredential,
  getCredential,
  listCredentials,
  deleteCredential,
} from '../tools/credential-store'
import {
  createSandboxTool,
  listSandboxesTool,
  terminateSandboxTool,
} from '../tools/sandbox-manager'

// ─── MCP Server Registry ─────────────────────────────────────────────────
// Each server is configured via environment variables.
// Format: MCP_<NAME>_URL and optionally MCP_<NAME>_HEADERS (JSON)

interface McpServerConfig {
  name: string
  envUrl: string
  description: string
}

const MCP_SERVERS: McpServerConfig[] = [
  { name: 'github', envUrl: 'MCP_GITHUB_URL', description: 'GitHub repos, issues, PRs' },
  { name: 'google-calendar', envUrl: 'MCP_GOOGLE_CALENDAR_URL', description: 'Google Calendar events' },
  { name: 'zapier', envUrl: 'MCP_ZAPIER_URL', description: 'Zapier automations and integrations' },
  { name: 'twitter', envUrl: 'MCP_TWITTER_URL', description: 'Twitter/X posting and search' },
  { name: 'hygraph', envUrl: 'MCP_HYGRAPH_URL', description: 'Hygraph CMS content management' },
  { name: 'hubspot', envUrl: 'MCP_HUBSPOT_URL', description: 'HubSpot CRM contacts and deals' },
  { name: 'metricool', envUrl: 'MCP_METRICOOL_URL', description: 'Metricool social media analytics' },
  { name: 'posthog', envUrl: 'MCP_POSTHOG_URL', description: 'PostHog product analytics' },
  { name: 'google-meet', envUrl: 'MCP_GOOGLE_MEET_URL', description: 'Google Meet scheduling' },
  { name: 'gmail', envUrl: 'MCP_GMAIL_URL', description: 'Gmail email operations' },
  { name: 'customerio', envUrl: 'MCP_CUSTOMERIO_URL', description: 'Customer.io messaging automation' },
  { name: 'firecrawl', envUrl: 'MCP_FIRECRAWL_URL', description: 'Firecrawl web scraping and crawling' },
]

// ─── Workflow Tools ──────────────────────────────────────────────────────

const invokeWorkflow = defineTool({
  name: 'invoke_workflow',
  description: 'Invoke a named workflow with optional input. Use list_workflows first to see available workflows.',
  input: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    input: v.optional(v.record(v.string(), v.unknown())),
  }),
  async run({ input }) {
    // This calls the Flue runtime's workflow invocation
    // In production this would use the SDK's invoke method
    return { invoked: true, workflow: input.name, input: input.input || {} }
  },
})

const listWorkflows = defineTool({
  name: 'list_workflows',
  description: 'List all available workflows.',
  input: v.object({}),
  async run() {
    return { workflows: ['agent-management'] }
  },
})

// ─── Email Reply Tool ────────────────────────────────────────────────────

function createEmailReplyTool() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'agent@beaglabs.com'

  if (!apiKey) {
    // Return a no-op tool if Resend isn't configured
    return defineTool({
      name: 'send_email',
      description: 'Send an email reply. (Resend not configured)',
      input: v.object({
        to: v.string(),
        subject: v.string(),
        text: v.string(),
      }),
      async run() {
        return { error: 'Resend API key not configured. Set RESEND_API_KEY environment variable.' }
      },
    })
  }

  const client = new Resend(apiKey)
  return sendEmail(client, fromEmail)
}

// ─── Agent Definition ────────────────────────────────────────────────────

export default defineAgent(async () => {
  // Auto-connect MCP servers that have environment variables configured
  const mcpTools: ReturnType<typeof defineTool>[] = []
  for (const server of MCP_SERVERS) {
    const url = process.env[server.envUrl]
    if (url) {
      try {
        const headersJson = process.env[`MCP_${server.name.toUpperCase().replace(/-/g, '_')}_HEADERS`]
        const headers = headersJson ? JSON.parse(headersJson) : undefined
        const conn = await connectMcpServer({
          name: server.name,
          url,
          headers,
        })
        mcpTools.push(...conn.tools)
        console.log(`[assistant] Connected MCP server: ${server.name} (${conn.tools.length} tools)`)
      } catch (err) {
        console.warn(`[assistant] Failed to connect MCP server ${server.name}:`, err)
      }
    }
  }

  return {
    model: process.env.AGENT_MODEL || 'anthropic/claude-sonnet-4-6',
    instructions: `You are the Beag Labs assistant — a capable AI agent with access to tools, MCP servers, workflows, and skills.

YOUR CAPABILITIES:
• Email — Send replies via Resend (send_email)
• Workflows — List and invoke platform workflows (list_workflows, invoke_workflow)
• MCP Servers — Connect to external services dynamically (connect_mcp_server, list_mcp_connections)
• Web Browsing — Navigate websites, click buttons, fill forms (web_browse, web_navigate)
• Web Extraction — Extract structured data from any URL (web_extract, web_screenshot)
• Code Execution — Run Python, JS, TS, or shell in a sandboxed Daytona environment (execute_code, execute_code_persistent)
• Credentials — Store and retrieve API keys securely (store_credential, get_credential)
• Sandboxes — Create and manage sandbox environments (create_sandbox, list_sandboxes, terminate_sandbox)

MCP SERVERS (auto-connected when env vars are set):
GitHub, Google Calendar, Zapier, Twitter/X, Hygraph, HubSpot, Metricool, PostHog, Google Meet, Gmail, Customer.io, Firecrawl

RULES:
1. When you receive an email, process it and reply using send_email if a response is appropriate.
2. When asked to do something on a website, use web_browse or web_extract.
3. When asked to run code, use execute_code in a Daytona sandbox.
4. When you need data from an external service, check if an MCP server is connected for it.
5. When asked to create a document (PPTX, XLSX, PDF, DOCX), use execute_code with the appropriate Python libraries.
6. Be proactive — if you can accomplish a task with your tools, do it without asking.
7. Be concise in communications. Format with markdown when appropriate.`,

    tools: [
      // Email
      createEmailReplyTool(),
      // Workflows
      invokeWorkflow,
      listWorkflows,
      // MCP management
      connectMcp,
      disconnectMcp,
      listMcpConnections,
      // Web
      webBrowse,
      webNavigate,
      webExtract,
      webScreenshot,
      // Code execution
      executeCode,
      executeCodePersistent,
      // Credentials
      storeCredential,
      getCredential,
      listCredentials,
      deleteCredential,
      // Sandboxes
      createSandboxTool,
      listSandboxesTool,
      terminateSandboxTool,
      // MCP-discovered tools
      ...mcpTools,
    ],
  }
})

export const description = 'Beag Labs AI assistant with email, web browsing, code execution, and MCP integrations'
