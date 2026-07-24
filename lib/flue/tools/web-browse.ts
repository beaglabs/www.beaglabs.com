import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

let stagehand: InstanceType<typeof import('@browserbasehq/stagehand').Stagehand> | null = null

async function getStagehand() {
  if (!stagehand) {
    const { Stagehand } = await import('@browserbasehq/stagehand')
    stagehand = new Stagehand({
      env: process.env.BROWSERBASE_API_KEY ? 'BROWSERBASE' : 'LOCAL',
      modelName: 'openai/gpt-4.1-mini',
      verbose: 0,
    })
    await stagehand.init()
  }
  return stagehand
}

export const webBrowse = defineTool({
  name: 'web_browse',
  description: 'Navigate to a URL in a real browser and perform an action (click, type, scroll, extract). Returns the result of the action.',
  input: v.object({
    url: v.pipe(v.string(), v.url()),
    action: v.pipe(v.string(), v.description('Natural language instruction, e.g. "click the sign in button", "scroll down", "extract the page title"')),
  }),
  async run({ input }) {
    const sh = await getStagehand()
    const page = sh.context.pages()[0] || await sh.context.newPage()

    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Observe first for reliability, then act
    try {
      const actions = await sh.observe(input.action)
      if (actions && actions.length > 0) {
        await sh.act(actions[0], { page })
      } else {
        await sh.act(input.action, { page })
      }
    } catch {
      // Fallback to direct act
      await sh.act(input.action, { page })
    }

    // Return page snapshot
    const title = await page.title()
    const url = page.url()

    return { title, url, status: 'action_completed' }
  },
})

export const webNavigate = defineTool({
  name: 'web_navigate',
  description: 'Navigate to a URL and return the page title and current URL.',
  input: v.object({
    url: v.pipe(v.string(), v.url()),
  }),
  async run({ input }) {
    const sh = await getStagehand()
    const page = sh.context.pages()[0] || await sh.context.newPage()
    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const title = await page.title()
    return { title, url: page.url() }
  },
})
