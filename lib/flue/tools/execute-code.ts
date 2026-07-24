import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import { Daytona } from '@daytona/sdk'

let daytonaClient: InstanceType<typeof Daytona> | null = null

function getDaytonaClient() {
  if (!daytonaClient) {
    daytonaClient = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      serverUrl: process.env.DAYTONA_SERVER_URL,
    })
  }
  return daytonaClient
}

export const executeCode = defineTool({
  name: 'execute_code',
  description: 'Execute code in a sandboxed Daytona environment. Supports Python, JavaScript/TypeScript, and shell scripts. The sandbox has common packages pre-installed.',
  input: v.object({
    language: v.union([
      v.literal('python'),
      v.literal('javascript'),
      v.literal('typescript'),
      v.literal('shell'),
    ]),
    code: v.pipe(v.string(), v.minLength(1), v.description('The code to execute')),
    timeout: v.optional(v.number(), 60),
  }),
  async run({ input, signal }) {
    const client = getDaytonaClient()

    // Create a sandbox
    const sandbox = await client.create({
      language: input.language === 'python' ? 'python' : 'javascript',
    })

    try {
      // Write code to a file
      const ext = input.language === 'python' ? 'py'
        : input.language === 'shell' ? 'sh'
        : 'ts'
      const filename = `/tmp/script.${ext}`

      await sandbox.fs.uploadFile(Buffer.from(input.code), filename)

      // Execute
      const cmd = input.language === 'python' ? `python3 ${filename}`
        : input.language === 'shell' ? `bash ${filename}`
        : input.language === 'typescript' ? `npx tsx ${filename}`
        : `node ${filename}`

      const result = await sandbox.process.executeCommand(
        cmd,
        '/tmp',
        {},
        input.timeout
      )

      return {
        exitCode: Number(result.exitCode ?? 0),
        stdout: String(result.result ?? ''),
        stderr: '',
      }
    } finally {
      // Clean up sandbox
      try { await sandbox.delete() } catch {}
    }
  },
})

export const executeCodePersistent = defineTool({
  name: 'execute_code_persistent',
  description: 'Execute code in a persistent Daytona sandbox that stays alive for follow-up commands. Returns the sandbox ID for reuse.',
  input: v.object({
    sandboxId: v.optional(v.string(), v.description('Existing sandbox ID to reuse. Omit to create new.')),
    language: v.optional(v.union([
      v.literal('python'),
      v.literal('javascript'),
      v.literal('typescript'),
      v.literal('shell'),
    ]), 'python'),
    code: v.pipe(v.string(), v.minLength(1)),
    timeout: v.optional(v.number(), 60),
  }),
  async run({ input }) {
    const client = getDaytonaClient()

    let sandbox
    if (input.sandboxId) {
      sandbox = await client.get(input.sandboxId)
    } else {
      sandbox = await client.create({
        language: input.language === 'python' ? 'python' : 'javascript',
      })
    }

    const ext = input.language === 'python' ? 'py'
      : input.language === 'shell' ? 'sh'
      : 'ts'
    const filename = `/tmp/script.${ext}`

    await sandbox.fs.uploadFile(Buffer.from(input.code), filename)

    const cmd = input.language === 'python' ? `python3 ${filename}`
      : input.language === 'shell' ? `bash ${filename}`
      : input.language === 'typescript' ? `npx tsx ${filename}`
      : `node ${filename}`

    const result = await sandbox.process.executeCommand(
      cmd,
      '/tmp',
      {},
      input.timeout
    )

    return {
      sandboxId: sandbox.id,
      exitCode: Number(result.exitCode ?? 0),
      stdout: String(result.result ?? ''),
      stderr: '',
    }
  },
})
