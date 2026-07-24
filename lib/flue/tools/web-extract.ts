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

export const webExtract = defineTool({
  name: 'web_extract',
  description: 'Navigate to a URL and extract structured data from the page using natural language instructions.',
  input: v.object({
    url: v.pipe(v.string(), v.url()),
    instruction: v.pipe(v.string(), v.description('What to extract, e.g. "extract all product names and prices", "get the main article text", "extract all links with their text"')),
  }),
  async run({ input }) {
    const sh = await getStagehand()
    const page = sh.context.pages()[0] || await sh.context.newPage()
    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const { extraction } = await sh.extract(input.instruction, undefined, { page })
    return { url: page.url(), extraction }
  },
})

export const webScreenshot = defineTool({
  name: 'web_screenshot',
  description: 'Navigate to a URL and take a screenshot. Returns the screenshot as a base64 data URL.',
  input: v.object({
    url: v.pipe(v.string(), v.url()),
  }),
  async run({ input }) {
    const sh = await getStagehand()
    const page = sh.context.pages()[0] || await sh.context.newPage()
    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const buffer = await page.screenshot({ type: 'png' })
    const base64 = Buffer.from(buffer).toString('base64')
    return { url: page.url(), screenshot: `data:image/png;base64,${base64}` }
  },
})
