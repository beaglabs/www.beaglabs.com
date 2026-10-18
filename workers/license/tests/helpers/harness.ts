/** Shared fakes: fetch router, env, deployment fixtures and the HTTP helper. */
import { vi } from 'vitest'
import type { Bindings } from '../../src/env'
import { sha256Hex } from '../../src/util'
import { getDb } from './fake-db'

export const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const PAPYRUS_CLIENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

// ---------------------------------------------------------------------------
// fetch router

export type FetchCall = { url: string; method: string; body: unknown }
export const fetchCalls: FetchCall[] = []

export function installFetch(extra?: (url: string, init?: RequestInit) => Response | undefined): void {
  fetchCalls.length = 0
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    let body: unknown = init?.body
    if (typeof body === 'string') { try { body = JSON.parse(body) } catch { /* keep text */ } }
    fetchCalls.push({ url, method: init?.method ?? 'GET', body })
    const custom = extra?.(url, init)
    if (custom) return custom
    return new Response(null, { status: 204 })
  })
}

export type TestEnv = Bindings

export function makeEnv(overrides: Partial<Bindings> = {}): TestEnv {
  return {
    BASE_URL: 'https://license.test',
    SENTRY_CLIENT_SECRET: 'sentry-secret',
    ...overrides,
  } as TestEnv
}

export function makeCtx() {
  const pending: Promise<unknown>[] = []
  return {
    waitUntil(promise: Promise<unknown>) { pending.push(promise) },
    passThroughOnException() {},
    settle: () => Promise.all(pending.splice(0)),
  }
}

// ---------------------------------------------------------------------------
// Fixtures

/** Inserts a registered deployment; returns its key. */
export async function seedDeployment(opts: { id?: string; tenantId?: string | null; entraClientId?: string | null; subscriptionId?: string } = {}): Promise<{ deploymentId: string; key: string }> {
  const deploymentId = opts.id ?? `dep_${crypto.randomUUID().slice(0, 8)}`
  const key = `pdk_${'k'.repeat(10)}${crypto.randomUUID().replace(/-/g, '')}`
  const t = new Date().toISOString()
  await getDb().execute({
    sql: `INSERT INTO papyrus_deployments (id, vm_id, papyrus_deployment_id, subscription_id, tenant_id, entra_client_id, key_sha256, key_issued_at, registered_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [deploymentId, crypto.randomUUID(), 'papyrus-1', opts.subscriptionId ?? 'sub-1', opts.tenantId ?? null, opts.entraClientId === undefined ? PAPYRUS_CLIENT : opts.entraClientId, await sha256Hex(key), t, t, t],
  })
  return { deploymentId, key }
}

// ---------------------------------------------------------------------------
// HTTP helper

import api from '../../src/api'

export async function call(env: TestEnv, method: string, path: string, opts: { token?: string; deploymentKey?: string; body?: unknown; raw?: BodyInit; headers?: Record<string, string> } = {}) {
  const headers = new Headers(opts.headers)
  if (opts.token) headers.set('authorization', `Bearer ${opts.token}`)
  if (opts.deploymentKey) headers.set('authorization', `Deployment ${opts.deploymentKey}`)
  let body: BodyInit | undefined = opts.raw
  if (opts.body !== undefined) { body = JSON.stringify(opts.body); headers.set('content-type', 'application/json') }
  if (typeof body === 'string' && !headers.has('content-length')) headers.set('content-length', String(new TextEncoder().encode(body).byteLength))
  const ctx = makeCtx()
  const response = await api.fetch(new Request(`https://license.test${path}`, { method, headers, body }), env, ctx as unknown as Parameters<typeof api.fetch>[2])
  await ctx.settle()
  const text = await response.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: response.status, json, headers: response.headers }
}
