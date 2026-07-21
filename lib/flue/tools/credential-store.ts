import { defineTool } from '@flue/runtime'
import * as v from 'valibot'

/**
 * In-memory credential store for the current process.
 * In production, replace with encrypted persistence (e.g., libSQL + encryption).
 */
const credentials = new Map<string, string>()

export const storeCredential = defineTool({
  name: 'store_credential',
  description: 'Store a named credential (API key, token, etc.) securely.',
  input: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    value: v.pipe(v.string(), v.minLength(1)),
  }),
  run({ input }): { stored: boolean; name: string } {
    credentials.set(input.name, input.value)
    return { stored: true, name: input.name }
  },
})

export const getCredential = defineTool({
  name: 'get_credential',
  description: 'Retrieve a stored credential by name.',
  input: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
  }),
  run({ input }): { found: boolean; value?: string } {
    const value = credentials.get(input.name)
    if (!value) return { found: false }
    return { found: true, value }
  },
})

export const listCredentials = defineTool({
  name: 'list_credentials',
  description: 'List all stored credential names (values are not exposed).',
  input: v.object({}),
  run(): { names: string[] } {
    return { names: Array.from(credentials.keys()) }
  },
})

export const deleteCredential = defineTool({
  name: 'delete_credential',
  description: 'Delete a stored credential by name.',
  input: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
  }),
  run({ input }): { deleted: boolean } {
    const existed = credentials.delete(input.name)
    return { deleted: existed }
  },
})
