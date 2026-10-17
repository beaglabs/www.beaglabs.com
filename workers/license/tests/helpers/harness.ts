/** Shared fakes: Entra signing keys + JWKS, fetch router, R2, Durable Object namespace, env. */
import { vi } from 'vitest'
import type { Bindings } from '../../src/env'
import type { R2BucketLike, R2ObjectBodyLike } from '../../src/cf-types'
import { resetJwksCache } from '../../src/jwt'
import { base64UrlEncode, sha256Hex, utf8 } from '../../src/util'
import { getDb } from './fake-db'

export const BEAG_TENANT = '11111111-1111-4111-8111-111111111111'
export const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
export const ADMIN_CLIENT = '76fd8c28-6c8d-4b41-ae10-a99da42880a1'
export const PAPYRUS_CLIENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const KID = 'test-kid'

let keyPair: CryptoKeyPair | null = null
let jwk: JsonWebKey | null = null

export async function signingKey(): Promise<CryptoKeyPair> {
  if (!keyPair) {
    keyPair = (await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true, ['sign', 'verify'],
    )) as CryptoKeyPair
    jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  }
  return keyPair
}

export async function signRs256(claims: Record<string, unknown>, kid = KID): Promise<string> {
  const { privateKey } = await signingKey()
  const header = base64UrlEncode(utf8(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid })))
  const payload = base64UrlEncode(utf8(JSON.stringify(claims)))
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, utf8(`${header}.${payload}`))
  return `${header}.${payload}.${base64UrlEncode(signature)}`
}

const nowS = () => Math.floor(Date.now() / 1000)

export function staffToken(overrides: Record<string, unknown> = {}): Promise<string> {
  return signRs256({
    iss: `https://login.microsoftonline.com/${BEAG_TENANT}/v2.0`,
    aud: `api://${ADMIN_CLIENT}`,
    tid: BEAG_TENANT,
    oid: 'owner-oid',
    name: 'Olivia Owner',
    preferred_username: 'olivia@beaglabs.com',
    roles: ['Papyrus.System.Owner'],
    iat: nowS(),
    exp: nowS() + 3600,
    ...overrides,
  })
}

export function managerToken(oid = 'manager-oid', name = 'Manny Manager'): Promise<string> {
  return staffToken({ oid, name, preferred_username: `${oid}@beaglabs.com`, roles: ['Papyrus.Account.Manager'] })
}

export function customerIdToken(tid: string, oid: string, overrides: Record<string, unknown> = {}): Promise<string> {
  return signRs256({
    iss: `https://login.microsoftonline.com/${tid}/v2.0`,
    aud: PAPYRUS_CLIENT,
    tid,
    oid,
    name: `User ${oid}`,
    preferred_username: `${oid}@contoso.com`,
    iat: nowS(),
    exp: nowS() + 3600,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// fetch router

export type FetchCall = { url: string; method: string; body: unknown }
export const fetchCalls: FetchCall[] = []

export function installFetch(extra?: (url: string, init?: RequestInit) => Response | undefined): void {
  fetchCalls.length = 0
  resetJwksCache()
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    let body: unknown = init?.body
    if (typeof body === 'string') { try { body = JSON.parse(body) } catch { /* keep text */ } }
    fetchCalls.push({ url, method: init?.method ?? 'GET', body })
    const custom = extra?.(url, init)
    if (custom) return custom
    if (url.startsWith('https://login.microsoftonline.com/') && url.endsWith('/discovery/v2.0/keys')) {
      await signingKey()
      return Response.json({ keys: [{ ...jwk, kid: KID, use: 'sig', alg: 'RS256' }] })
    }
    if (url.includes('/realtime/kit/')) {
      if (url.endsWith('/meetings') && init?.method === 'POST') return Response.json({ success: true, data: { id: crypto.randomUUID() } })
      if (url.endsWith('/participants')) return Response.json({ success: true, data: { id: crypto.randomUUID(), token: `rtk-token-${fetchCalls.length}` } })
      return Response.json({ success: true, data: {} })
    }
    return new Response(null, { status: 204 })
  })
}

// ---------------------------------------------------------------------------
// Fakes for R2 + Durable Objects

export class FakeR2 implements R2BucketLike {
  objects = new Map<string, { bytes: Uint8Array; contentType?: string }>()
  async put(key: string, value: ReadableStream | ArrayBuffer | Uint8Array | string | null, options?: { httpMetadata?: { contentType?: string } }) {
    let bytes: Uint8Array
    if (value instanceof ReadableStream) bytes = new Uint8Array(await new Response(value).arrayBuffer())
    else if (typeof value === 'string') bytes = utf8(value)
    else if (value instanceof ArrayBuffer) bytes = new Uint8Array(value)
    else bytes = value ?? new Uint8Array()
    this.objects.set(key, { bytes, contentType: options?.httpMetadata?.contentType })
    return { key, size: bytes.length }
  }
  async get(key: string): Promise<R2ObjectBodyLike | null> {
    const object = this.objects.get(key)
    if (!object) return null
    return { key, size: object.bytes.length, httpMetadata: { contentType: object.contentType }, body: new Response(object.bytes as Uint8Array<ArrayBuffer>).body! }
  }
  async head(key: string) { const o = this.objects.get(key); return o ? { key, size: o.bytes.length } : null }
  async delete(key: string) { this.objects.delete(key) }
}

export class FakeRooms {
  broadcasts: { conversationId: string; frame: Record<string, unknown> }[] = []
  watched = new Set<string>()
  idFromName(name: string) { return { toString: () => name } }
  get(id: { toString(): string }) {
    const conversationId = id.toString()
    return {
      fetch: async (input: Request | string, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init)
        const path = new URL(request.url).pathname
        if (path === '/broadcast') this.broadcasts.push({ conversationId, frame: await request.json() as Record<string, unknown> })
        if (path === '/huddle-watch') this.watched.add(conversationId)
        return new Response(null, { status: 204 })
      },
    }
  }
}

export type TestEnv = Bindings & { CONVERSATION_ROOM: FakeRooms; CHAT_ATTACHMENTS: FakeR2 }

export function makeEnv(overrides: Partial<Bindings> = {}): TestEnv {
  return {
    BASE_URL: 'https://license.test',
    MICROSOFT_TENANT_ID: BEAG_TENANT,
    CHAT_SESSION_SECRET: 'test-chat-session-secret-0123456789',
    SENTRY_CLIENT_SECRET: 'sentry-secret',
    CF_ACCOUNT_ID: 'acct',
    REALTIMEKIT_APP_ID: 'app',
    REALTIMEKIT_API_TOKEN: 'rtk',
    CONVERSATION_ROOM: new FakeRooms(),
    CHAT_ATTACHMENTS: new FakeR2(),
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

export async function seedOrgWithTenant(tenantId: string, orgId = `org_${tenantId.slice(0, 4)}`): Promise<string> {
  const t = new Date().toISOString()
  await getDb().batch([
    { sql: "INSERT INTO organizations (id, organization_type, legal_name, status, created_at, updated_at) VALUES (?, 'commercial', ?, 'active', ?, ?)", args: [orgId, `Org ${tenantId.slice(0, 4)}`, t, t] },
    { sql: 'INSERT INTO tenants (tenant_id, organization_id, first_seen_at, last_seen_at) VALUES (?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET organization_id=excluded.organization_id', args: [tenantId, orgId, t, t] },
  ])
  return orgId
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

/** Binds (if needed) and returns a customer chat session token. */
export async function customerSession(env: TestEnv, deploymentKey: string, tid: string, oid: string): Promise<string> {
  const response = await call(env, 'POST', '/api/papyrus/session', { deploymentKey, body: { idToken: await customerIdToken(tid, oid) } })
  if (response.status !== 200) throw new Error(`session failed: ${response.status} ${JSON.stringify(response.json)}`)
  return response.json.token
}
