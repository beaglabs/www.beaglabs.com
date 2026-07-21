import { flue } from '@flue/runtime/routing'
import { listAgents, listRuns, getRun } from '@flue/runtime'
import { Hono } from 'hono'

const app = new Hono()

// Mount Flue's core runtime (agents, workflows, channels, runs)
app.route('/', flue())

// ─── Custom admin endpoints ────────────────────────────────────────────────

app.get('/admin/agents', async (c) => {
  const agents = await listAgents()
  return c.json(agents)
})

app.get('/admin/runs', async (c) => {
  const limit = Number(c.req.query('limit') ?? '50')
  const cursor = c.req.query('cursor') ?? undefined
  const workflowName = c.req.query('workflow') ?? undefined
  const status = c.req.query('status') as 'active' | 'completed' | 'errored' | undefined

  const runs = await listRuns({ limit, cursor, workflowName, status })
  return c.json(runs)
})

app.get('/admin/runs/:runId', async (c) => {
  const run = await getRun(c.req.param('runId'))
  if (!run) return c.json({ error: 'Run not found' }, 404)
  return c.json(run)
})

export default app
